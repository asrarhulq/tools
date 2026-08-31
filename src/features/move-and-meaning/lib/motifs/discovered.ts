import type { Color, Square } from "chess.js";
import { PIECE_VALUES } from "../../config";
import { BISHOP_DIRS, ROOK_DIRS, boardFromFen, rayFrom } from "./attack-map";

export interface DiscoveredAttackResult {
  attackerSquare: Square;
  throughSquare: Square;
  targetSquare: Square;
}

/**
 * A discovered attack: a friendly slider's ray toward an enemy piece was
 * blocked by the piece on `fromSquare` before the move, and is open after it
 * — regardless of what type of piece moved off that square.
 */
export function detectDiscoveredAttacks(
  fenBefore: string,
  fenAfter: string,
  fromSquare: Square,
  movedColor: Color,
): DiscoveredAttackResult[] {
  const before = boardFromFen(fenBefore);
  const after = boardFromFen(fenAfter);
  const results: DiscoveredAttackResult[] = [];

  for (const row of after) {
    for (const cell of row) {
      if (!cell || cell.color !== movedColor) continue;
      if (cell.type !== "b" && cell.type !== "r" && cell.type !== "q") continue;
      const dirs =
        cell.type === "b"
          ? BISHOP_DIRS
          : cell.type === "r"
            ? ROOK_DIRS
            : [...BISHOP_DIRS, ...ROOK_DIRS];

      for (const [dx, dy] of dirs) {
        const hitsAfter = rayFrom(after, cell.square, dx, dy);
        const target = hitsAfter[0];
        if (!target || target.piece.color === movedColor) continue;
        const isNotable =
          target.piece.type === "k" ||
          (PIECE_VALUES[target.piece.type] ?? 0) >= PIECE_VALUES.n!;
        if (!isNotable) continue;

        const hitsBefore = rayFrom(before, cell.square, dx, dy);
        if (hitsBefore[0]?.square === fromSquare) {
          results.push({
            attackerSquare: cell.square,
            throughSquare: fromSquare,
            targetSquare: target.square,
          });
        }
      }
    }
  }
  return results;
}
