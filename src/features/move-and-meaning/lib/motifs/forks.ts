import type { Square } from "chess.js";
import { PIECE_VALUES } from "../../config";
import {
  attackSquaresOf,
  boardFromFen,
  occupiedSquares,
  pieceAt,
} from "./attack-map";

export interface ForkResult {
  square: Square;
  targets: Square[];
}

/**
 * A fork: one piece's attack set intersects ≥2 enemy pieces that are each
 * "worth capturing" (a minor piece or heavier, or the king). When
 * `fromSquare` is given, only that piece is checked (the just-moved piece —
 * the normal case when tagging a specific move); otherwise every piece on
 * the board is checked.
 */
export function detectForks(fen: string, fromSquare?: Square): ForkResult[] {
  const board = boardFromFen(fen);
  const results: ForkResult[] = [];
  const squares = fromSquare ? [fromSquare] : occupiedSquares(board);

  for (const square of squares) {
    const piece = pieceAt(board, square);
    if (!piece) continue;
    const targets = attackSquaresOf(board, square).filter((sq) => {
      const target = pieceAt(board, sq);
      if (!target || target.color === piece.color) return false;
      return (
        target.type === "k" ||
        (PIECE_VALUES[target.type] ?? 0) >= PIECE_VALUES.n!
      );
    });
    if (targets.length >= 2) results.push({ square, targets });
  }
  return results;
}
