"use client";

import { Heart } from "lucide-react";
import { useCallback, useState } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import type { ToolWithHref } from "@/types/tool";
import type { Square } from "chess.js";
import { AyaChessBoard } from "./board/aya-chess-board";
import { BOARD_PALETTES, STARTING_FEN, type BoardPalette } from "./config";
import { isGameOver, makeMove } from "./lib/chess-adapter";
import { generateMoveMessage, WELCOME_MESSAGE } from "./lib/messages";
import type { Orientation } from "./lib/board-geometry";
import type { FlavorMessage, MoveLogEntry, MoveKind } from "./types";
import { ControlsBar } from "./ui/controls-bar";
import { GlossaryCard } from "./ui/glossary-card";
import { MessageBanner } from "./ui/message-banner";
import { MoveList } from "./ui/move-list";

/**
 * A local pass-and-play chess board built for one specific person: a
 * complete beginner, Algerian, a nail artist, a lover of good food, and the
 * one teaching me Arabic. Same chess.js engine as `move-and-meaning`, but
 * its own visual identity and its own voice — see `lib/messages.ts` for the
 * part that actually makes this a gift rather than a reskin.
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

  const handleNewGame = useCallback(() => {
    setFen(STARTING_FEN);
    setLastMove(null);
    setMoves([]);
    setMessage({ text: WELCOME_MESSAGE });
  }, []);

  const handleFlip = useCallback(() => {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }, []);

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
