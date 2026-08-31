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
  draggingSquare: Square | null;
  onPointerDownPiece: (
    square: Square,
    event: React.PointerEvent<HTMLDivElement>,
  ) => void;
}

/** Renders every piece on the board, animating slides via framer-motion `layout`. */
export function PieceLayer({
  fen,
  orientation,
  draggingSquare,
  onPointerDownPiece,
}: PieceLayerProps) {
  const board = new Chess(fen).board();
  const idBySquare = usePieceIdentities(fen);

  return (
    <AnimatePresence>
      {board.flatMap((row) =>
        row.map((cell) => {
          if (!cell || cell.square === draggingSquare) return null;
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
              className="absolute flex cursor-grab touch-none items-center justify-center active:cursor-grabbing"
              style={{
                left: `${xFrac * 100}%`,
                top: `${yFrac * 100}%`,
                width: "12.5%",
                height: "12.5%",
              }}
              onPointerDown={(event) => onPointerDownPiece(cell.square, event)}
            >
              <PieceIcon type={cell.type} color={cell.color} size="88%" />
            </motion.div>
          );
        }),
      )}
    </AnimatePresence>
  );
}
