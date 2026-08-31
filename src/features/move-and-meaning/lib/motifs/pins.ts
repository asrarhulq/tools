import type { Square } from "chess.js";
import { PIECE_VALUES } from "../../config";
import { BISHOP_DIRS, ROOK_DIRS, boardFromFen, rayFrom } from "./attack-map";

export interface PinResult {
  attackerSquare: Square;
  pinnedSquare: Square;
  behindSquare: Square;
}

/**
 * A pin: a slider's ray hits an enemy piece, then a second enemy piece (of
 * higher value, or the king) directly behind it on the same line.
 */
export function detectPins(fen: string): PinResult[] {
  const board = boardFromFen(fen);
  const results: PinResult[] = [];

  for (const row of board) {
    for (const cell of row) {
      if (
        !cell ||
        (cell.type !== "b" && cell.type !== "r" && cell.type !== "q")
      )
        continue;
      const dirs =
        cell.type === "b"
          ? BISHOP_DIRS
          : cell.type === "r"
            ? ROOK_DIRS
            : [...BISHOP_DIRS, ...ROOK_DIRS];

      for (const [dx, dy] of dirs) {
        const hits = rayFrom(board, cell.square, dx, dy);
        if (hits.length < 2) continue;
        const [front, back] = hits as [(typeof hits)[0], (typeof hits)[0]];
        if (front.piece.color === cell.color) continue;
        if (back.piece.color !== front.piece.color) continue;
        const frontValue = PIECE_VALUES[front.piece.type] ?? 0;
        const backValue = PIECE_VALUES[back.piece.type] ?? 0;
        if (back.piece.type === "k" || backValue > frontValue) {
          results.push({
            attackerSquare: cell.square,
            pinnedSquare: front.square,
            behindSquare: back.square,
          });
        }
      }
    }
  }
  return results;
}
