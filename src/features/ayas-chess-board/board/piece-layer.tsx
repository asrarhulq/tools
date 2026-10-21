"use client";

import { Chess, type Square } from "chess.js";
import { AnimatePresence, motion } from "framer-motion";
import type { Orientation } from "../lib/board-geometry";
import { squareToFraction } from "../lib/board-geometry";
import { PieceIcon } from "./piece-svg";
import { usePieceIdentities } from "./use-piece-identities";

interface PieceLayerProps {
  fen: string;
  orientation: Orientation;
  selectedSquare: Square | null;
  onSelectSquare: (square: Square) => void;
}

/** Renders every piece, animating slides via framer-motion `layout`. Click
 * (not drag) interaction — simpler to use correctly for a beginner board. */
export function PieceLayer({
  fen,
  orientation,
  selectedSquare,
  onSelectSquare,
}: PieceLayerProps) {
  const board = new Chess(fen).board();
  const idBySquare = usePieceIdentities(fen);

  return (
    <AnimatePresence>
      {board.flatMap((row) =>
        row.map((cell) => {
          if (!cell) return null;
          const { xFrac, yFrac } = squareToFraction(cell.square, orientation);
          const id = idBySquare.get(cell.square) ?? cell.square;
          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{
                layout: { type: "spring", stiffness: 700, damping: 45 },
                opacity: { duration: 0.15 },
              }}
              className="absolute flex cursor-pointer items-center justify-center"
              style={{
                left: `${xFrac * 100}%`,
                top: `${yFrac * 100}%`,
                width: "12.5%",
                height: "12.5%",
                filter:
                  selectedSquare === cell.square
                    ? "drop-shadow(0 0 6px #d9748f)"
                    : undefined,
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectSquare(cell.square);
              }}
            >
              <PieceIcon type={cell.type} color={cell.color} size="88%" />
            </motion.div>
          );
        }),
      )}
    </AnimatePresence>
  );
}
