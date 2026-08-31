import type { Color, Square } from "chess.js";
import type { MotifTag } from "../../types";
import { detectDiscoveredAttacks } from "./discovered";
import { detectForks } from "./forks";
import { detectPins } from "./pins";
import { detectSkewers } from "./skewers";

/**
 * Best-effort tactical tagging for one move — NOT a full tactic solver.
 * Pins/skewers are attributed to this move only when the just-moved piece is
 * the one doing the pinning/skewering, so a long-standing pin elsewhere on
 * the board doesn't get re-tagged onto every subsequent move.
 */
export function detectMotifs(
  fenBefore: string,
  fenAfter: string,
  move: { from: Square; to: Square; color: Color },
): MotifTag[] {
  const tags = new Set<MotifTag>();

  if (detectPins(fenAfter).some((p) => p.attackerSquare === move.to)) {
    tags.add("pin");
  }
  if (detectSkewers(fenAfter).some((s) => s.attackerSquare === move.to)) {
    tags.add("skewer");
  }
  if (detectForks(fenAfter, move.to).length > 0) {
    tags.add("fork");
  }
  if (
    detectDiscoveredAttacks(fenBefore, fenAfter, move.from, move.color).length >
    0
  ) {
    tags.add("discovered-attack");
  }

  return [...tags];
}
