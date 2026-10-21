"use client";

import { Heart } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import type { ToolWithHref } from "@/types/tool";
import type { Square } from "chess.js";
import { AyaChessBoard } from "./board/aya-chess-board";
import { BOARD_PALETTES, STARTING_FEN, type BoardPalette } from "./config";
import { isGameOver, makeMove, turnOf } from "./lib/chess-adapter";
import { BOT_DIFFICULTIES, chooseBotMove } from "./lib/bot";
import { generateMoveMessage, WELCOME_MESSAGE } from "./lib/messages";
import type { Orientation } from "./lib/board-geometry";
import type {
  FlavorMessage,
  MoveLogEntry,
  MoveKind,
  OpponentMode,
} from "./types";
import { ControlsBar } from "./ui/controls-bar";
import { GlossaryCard } from "./ui/glossary-card";
import { MessageBanner } from "./ui/message-banner";
import { MoveList } from "./ui/move-list";
import { OpponentPanel } from "./ui/opponent-panel";

/** How long the bot "thinks" before playing — purely a pacing choice so a
 * move doesn't snap back instantly; the search itself is already fast. */
const BOT_MOVE_DELAY_MS = 650;

/**
 * A local chess board built for one specific person: a complete beginner,
 * Algerian, a nail artist, a lover of good food, and the one teaching me
 * Arabic. Same chess.js engine as `move-and-meaning`, but its own visual
 * identity and its own voice — see `lib/messages.ts` for the part that
 * actually makes this a gift rather than a reskin. Vs.-computer mode uses a
 * small local minimax (`lib/bot.ts`), not Stockfish — a true beginner's
 * opponent needs believable mistakes, not a handicapped-but-still-sharp
 * engine, and it keeps this tool free of a second WASM worker.
 */
export function AyaChessTool({ tool }: { tool: ToolWithHref }) {
  const [fen, setFen] = useState(STARTING_FEN);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [orientation, setOrientation] = useState<Orientation>("white");
  const [palette, setPalette] = useState<BoardPalette>(BOARD_PALETTES[0]!);
  const [moves, setMoves] = useState<MoveLogEntry[]>([]);
  const [message, setMessage] = useState<FlavorMessage>({
    text: WELCOME_MESSAGE,
  });

  const [opponentMode, setOpponentMode] =
    useState<OpponentMode>("pass-and-play");
  const [humanColor, setHumanColor] = useState<"w" | "b">("w");
  const [difficultyId, setDifficultyId] = useState(BOT_DIFFICULTIES[0]!.id);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      setFen(fenAfter);
      setLastMove({ from, to });
      setMoves((prev) => [
        ...prev,
        { ply: prev.length, san: move.san, color: move.color },
      ]);
      setMessage(generateMoveMessage(kind));
    },
    [fen],
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
    setFen(STARTING_FEN);
    setLastMove(null);
    setMoves([]);
    setMessage({ text: WELCOME_MESSAGE });
  }, []);

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
            <OpponentPanel
              mode={opponentMode}
              onModeChange={handleModeChange}
              humanColor={humanColor}
              onHumanColorChange={handleHumanColorChange}
              difficultyId={difficultyId}
              onDifficultyChange={setDifficultyId}
              botThinking={botThinking}
            />
            <ControlsBar
              onNewGame={handleNewGame}
              onFlip={handleFlip}
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
