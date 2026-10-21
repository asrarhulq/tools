import { Chess, type Color, type PieceSymbol } from "chess.js";

const STARTING_COUNTS: Record<PieceSymbol, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1,
};

/** Rough value order for sorting a captured-pieces tray (queen first, pawns last). */
const SORT_ORDER: PieceSymbol[] = ["q", "r", "b", "n", "p"];

/**
 * Pieces missing from each color relative to a fresh board — a simple
 * present-vs-starting count, not a move-by-move capture log. A promotion
 * can make this slightly approximate (a queen appearing from a pawn shows
 * up as one captured pawn, not an extra queen), which is a fine trade for a
 * casual board that isn't trying to be a full capture audit.
 */
export function capturedPieces(fen: string): Record<Color, PieceSymbol[]> {
  const counts: Record<Color, Record<PieceSymbol, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };
  for (const row of new Chess(fen).board()) {
    for (const cell of row) {
      if (cell) counts[cell.color][cell.type]++;
    }
  }

  const result: Record<Color, PieceSymbol[]> = { w: [], b: [] };
  for (const color of ["w", "b"] as const) {
    for (const type of SORT_ORDER) {
      const missing = Math.max(0, STARTING_COUNTS[type] - counts[color][type]);
      for (let i = 0; i < missing; i++) result[color].push(type);
    }
  }
  return result;
}
