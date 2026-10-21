"use client";

import { Heart } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import type { ToolWithHref } from "@/types/tool";
import type { Square } from "chess.js";
import { AyaChessBoard } from "./board/aya-chess-board";
import { BOARD_PALETTES, STARTING_FEN, type BoardPalette } from "./config";
import { isGameOver, makeMove, turnOf } from "./lib/chess-adapter";
import { BOT_DIFFICULTIES, chooseBotMove } from "./lib/bot";
import { capturedPieces } from "./lib/captured";
import { GATE_STORAGE_KEY } from "./lib/gate";
import { generateMoveMessage, WELCOME_MESSAGE } from "./lib/messages";
import { RECORD_STORAGE_KEY, type RecordStore } from "./lib/record";
import type { Orientation } from "./lib/board-geometry";
import type {
  FlavorMessage,
  MoveLogEntry,
  MoveKind,
  OpponentMode,
} from "./types";
import { CapturedTray } from "./ui/captured-tray";
import { ControlsBar } from "./ui/controls-bar";
import { GlossaryCard } from "./ui/glossary-card";
import { MessageBanner } from "./ui/message-banner";
import { MoveList } from "./ui/move-list";
import { OpponentPanel } from "./ui/opponent-panel";
import { PasswordGate } from "./ui/password-gate";

/** How long the bot "thinks" before playing — purely a pacing choice so a
 * move doesn't snap back instantly; the search itself is already fast. */
const BOT_MOVE_DELAY_MS = 650;

interface Snapshot {
  fen: string;
  lastMove: { from: Square; to: Square } | null;
}

const INITIAL_SNAPSHOT: Snapshot = { fen: STARTING_FEN, lastMove: null };
const EMPTY_RECORD: RecordStore = {};

/**
 * A local chess board built for one specific friend: a complete beginner,
 * Algerian, a nail artist, a Barça/Messi fan, a lover of good food, and the
 * one teaching me Arabic. Same chess.js engine as `move-and-meaning`, but
 * its own visual identity and its own voice — see `lib/messages.ts` for the
 * part that actually makes this a gift rather than a reskin. Vs.-computer
 * mode (the default) uses a small local minimax (`lib/bot.ts`), not
 * Stockfish — a true beginner's opponent needs believable mistakes, not a
 * handicapped-but-still-sharp engine, and it keeps this tool free of a
 * second WASM worker.
 */
export function AyaChessTool({ tool }: { tool: ToolWithHref }) {
  const [unlocked, setUnlocked] = useLocalStorage(GATE_STORAGE_KEY, false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([INITIAL_SNAPSHOT]);
  const [orientation, setOrientation] = useState<Orientation>("white");
  const [palette, setPalette] = useState<BoardPalette>(BOARD_PALETTES[0]!);
  const [moves, setMoves] = useState<MoveLogEntry[]>([]);
  const [message, setMessage] = useState<FlavorMessage>({
    text: WELCOME_MESSAGE,
  });
  const [record, setRecord] = useLocalStorage<RecordStore>(
    RECORD_STORAGE_KEY,
    EMPTY_RECORD,
  );

  const [opponentMode, setOpponentMode] = useState<OpponentMode>("computer");
  const [humanColor, setHumanColor] = useState<"w" | "b">("w");
  const [difficultyId, setDifficultyId] = useState(BOT_DIFFICULTIES[0]!.id);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { fen, lastMove } = snapshots[snapshots.length - 1]!;

  // Derived, not stored: "the bot is thinking" is exactly "it's computer
  // mode, the game isn't over, and the current fen's turn isn't the
  // human's" — true until the bot's chosen move actually lands and changes
  // `fen`, so it needs no state of its own.
  const botThinking =
    opponentMode === "computer" &&
    turnOf(fen) !== humanColor &&
    !isGameOver(fen).over;

  const handleMove = useCallback(
    (from: Square, to: Square, promotion?: "q" | "r" | "b" | "n") => {
      const result = makeMove(fen, from, to, promotion);
      if (!result) return;
      const { move, fenAfter } = result;
      const over = isGameOver(fenAfter);

      let kind: MoveKind;
      if (over.over && over.reason === "checkmate") kind = "checkmate";
      else if (over.over && over.reason === "stalemate") kind = "stalemate";
      else if (over.over && over.reason === "draw") kind = "draw";
      else if (move.isCastle) kind = "castle";
      else if (move.isPromotion) kind = "promotion";
      else if (move.isCapture) kind = "capture";
      else if (move.isCheck) kind = "check";
      else kind = "normal";

      setSnapshots((prev) => [
        ...prev,
        { fen: fenAfter, lastMove: { from, to } },
      ]);
      setMoves((prev) => [
        ...prev,
        { ply: prev.length, san: move.san, color: move.color },
      ]);
      setMessage(generateMoveMessage(kind));

      if (over.over && opponentMode === "computer") {
        const outcome: "w" | "l" | "d" =
          over.reason === "draw" || over.reason === "stalemate"
            ? "d"
            : over.winner === humanColor
              ? "w"
              : "l";
        setRecord((prev) => {
          const current = prev[difficultyId] ?? { w: 0, l: 0, d: 0 };
          const next: RecordStore = {
            ...prev,
            [difficultyId]: { ...current, [outcome]: current[outcome] + 1 },
          };
          return next;
        });
      }
    },
    [fen, opponentMode, humanColor, difficultyId, setRecord],
  );

  // Whenever it becomes the bot's turn in computer mode, play its move after
  // a short delay. Depends on `fen` so the human's own move (or a fresh
  // game) naturally re-triggers it; bails immediately once it's the human's
  // turn again, so this can never loop.
  useEffect(() => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }
    if (!botThinking) return;

    const difficulty =
      BOT_DIFFICULTIES.find((d) => d.id === difficultyId) ??
      BOT_DIFFICULTIES[0]!;
    botTimeoutRef.current = setTimeout(() => {
      const botMove = chooseBotMove(fen, difficulty);
      if (botMove) handleMove(botMove.from, botMove.to, botMove.promotion);
    }, BOT_MOVE_DELAY_MS);

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [fen, botThinking, difficultyId, handleMove]);

  const handleNewGame = useCallback(() => {
    setSnapshots([INITIAL_SNAPSHOT]);
    setMoves([]);
    setMessage({ text: WELCOME_MESSAGE });
  }, []);

  // In computer mode, "undo" should always hand the move back to the
  // human: pop 2 plies (bot's reply + the human's move) if the bot has
  // already answered, or just 1 if it's still the human's move being taken
  // back before any reply exists. Pass-and-play always pops exactly 1.
  const handleUndo = useCallback(() => {
    const plies =
      opponentMode === "computer" ? (turnOf(fen) === humanColor ? 2 : 1) : 1;
    setSnapshots((prev) => prev.slice(0, Math.max(1, prev.length - plies)));
    setMoves((prev) => prev.slice(0, Math.max(0, prev.length - plies)));
    setMessage({ text: "Move taken back — happens to everyone. 🌸" });
  }, [opponentMode, humanColor, fen]);

  const handleFlip = useCallback(() => {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }, []);

  const handleModeChange = useCallback(
    (mode: OpponentMode) => {
      setOpponentMode(mode);
      if (mode === "computer") {
        setOrientation(humanColor === "w" ? "white" : "black");
      }
    },
    [humanColor],
  );

  const handleHumanColorChange = useCallback((color: "w" | "b") => {
    setHumanColor(color);
    setOrientation(color === "w" ? "white" : "black");
  }, []);

  const interactiveColor = opponentMode === "computer" ? humanColor : null;

  if (!unlocked) {
    return (
      <>
        <JsonLd data={softwareApplicationSchema(tool)} />
        <PasswordGate onUnlock={() => setUnlocked(true)} />
      </>
    );
  }

  return (
    <>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <div
        className="rounded-[var(--radius)] border p-4 sm:p-6"
        style={{
          backgroundColor: "#fff7f8",
          borderColor: "#f3d3dc",
        }}
      >
        <header className="mb-5 flex items-center gap-2">
          <Heart className="size-5 shrink-0 text-[#d9748f]" fill="#d9748f" />
          <div>
            <h2 className="text-lg font-semibold text-[#4a2c3a]">
              Aya&apos;s Chess Board
            </h2>
            <p className="text-xs text-[#9c7684]">
              Beginner-friendly, zero pressure — a board, a bit of Arabic, and
              the skydive is still happening either way. 🪂
            </p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3">
            <AyaChessBoard
              fen={fen}
              palette={palette}
              orientation={orientation}
              lastMove={lastMove}
              onMove={handleMove}
              interactiveColor={interactiveColor}
            />
            <CapturedTray captured={capturedPieces(fen)} />
            <OpponentPanel
              mode={opponentMode}
              onModeChange={handleModeChange}
              humanColor={humanColor}
              onHumanColorChange={handleHumanColorChange}
              difficultyId={difficultyId}
              onDifficultyChange={setDifficultyId}
              botThinking={botThinking}
              record={record[difficultyId]}
            />
            <ControlsBar
              onNewGame={handleNewGame}
              onFlip={handleFlip}
              onUndo={handleUndo}
              canUndo={snapshots.length > 1}
              palette={palette}
              onPaletteChange={setPalette}
            />
          </div>

          <div className="space-y-3">
            <MessageBanner message={message} />
            <div className="rounded-[var(--radius)] border border-[#f3d3dc] bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-[#4a2c3a]">
                Moves
              </h3>
              <MoveList moves={moves} />
            </div>
            <GlossaryCard />
          </div>
        </div>
      </div>
    </>
  );
}
