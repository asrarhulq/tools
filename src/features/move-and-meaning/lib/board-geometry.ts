import type { Square } from "chess.js";

/**
 * Pure square ↔ pixel conversion for an 8×8 board of a given pixel `size`.
 * No chess logic lives here — the board component composes this with
 * `chess-engine-adapter` for legality/promotion checks.
 */

export type Orientation = "white" | "black";

const FILES = "abcdefgh";

/** Fraction (0–1) of the board's top-left origin — for CSS percentage layout. */
export function squareToFraction(
  square: Square,
  orientation: Orientation,
): { xFrac: number; yFrac: number } {
  const file = FILES.indexOf(square[0]!);
  const rank = Number(square[1]) - 1;
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 7 - rank : rank;
  return { xFrac: col / 8, yFrac: row / 8 };
}

export function xyToSquare(
  x: number,
  y: number,
  orientation: Orientation,
  size: number,
): Square {
  const cell = size / 8;
  const col = Math.max(0, Math.min(7, Math.floor(x / cell)));
  const row = Math.max(0, Math.min(7, Math.floor(y / cell)));
  const file = orientation === "white" ? col : 7 - col;
  const rank = orientation === "white" ? 7 - row : row;
  return `${FILES[file]}${rank + 1}` as Square;
}
