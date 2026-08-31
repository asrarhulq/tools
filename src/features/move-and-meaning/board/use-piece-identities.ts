"use client";

import { useState } from "react";
import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";

let counter = 0;
const genId = () => `pc-${counter++}`;

type PieceAt = { type: PieceSymbol; color: Color };

function flatten(fen: string): Map<Square, PieceAt> {
  const map = new Map<Square, PieceAt>();
  for (const row of new Chess(fen).board()) {
    for (const cell of row) {
      if (cell) map.set(cell.square, { type: cell.type, color: cell.color });
    }
  }
  return map;
}

function initialMap(fen: string): Map<Square, string> {
  const map = new Map<Square, string>();
  for (const square of flatten(fen).keys()) map.set(square, genId());
  return map;
}

/**
 * Diffs `before` → `after` and returns the next square→id map:
 *  - a square that had a piece and now doesn't is a "source"
 *  - a square that now has a piece it didn't (or a different one) is a
 *    "destination"
 *  - sources are matched to destinations by (color, type) — unambiguous for
 *    a normal move, a capture, en passant, and castling (king and rook each
 *    match their own type); a leftover pass matches by color alone, which is
 *    exactly what a pawn promotion needs (its type changes)
 *  - an unmatched source was captured (its id is simply dropped)
 */
function transitionMap(
  prevMap: Map<Square, string>,
  prevFen: string,
  fen: string,
): Map<Square, string> {
  const before = flatten(prevFen);
  const after = flatten(fen);
  const nextMap = new Map<Square, string>();
  const sources: Square[] = [];
  const destinations: Square[] = [];
  const allSquares = new Set<Square>([...before.keys(), ...after.keys()]);

  for (const square of allSquares) {
    const b = before.get(square);
    const a = after.get(square);
    if (b && a && b.type === a.type && b.color === a.color) {
      const id = prevMap.get(square);
      if (id) nextMap.set(square, id);
    } else if (b && !a) {
      sources.push(square);
    } else if (a) {
      destinations.push(square);
    }
  }

  const remaining = new Set(sources);
  const unmatched: Square[] = [];
  for (const dest of destinations) {
    const destPiece = after.get(dest)!;
    const match = [...remaining].find((src) => {
      const p = before.get(src)!;
      return p.type === destPiece.type && p.color === destPiece.color;
    });
    if (match) {
      nextMap.set(dest, prevMap.get(match) ?? genId());
      remaining.delete(match);
    } else {
      unmatched.push(dest);
    }
  }
  // Fallback: promotion changes type, so match what's left by color only.
  for (const dest of unmatched) {
    const destPiece = after.get(dest)!;
    const match = [...remaining].find(
      (src) => before.get(src)!.color === destPiece.color,
    );
    nextMap.set(dest, match ? (prevMap.get(match) ?? genId()) : genId());
    if (match) remaining.delete(match);
  }

  return nextMap;
}

/**
 * Tracks a stable id per on-board piece across moves so framer-motion can
 * `layout`-animate a piece sliding from square to square instead of
 * unmounting/remounting it. Uses React's "adjust state during render"
 * pattern (not a ref mutated during render, which `react-hooks/refs` now
 * flags) — comparing `fen` to the previously-seen value and computing the
 * next map right there so this render already sees the transition.
 */
export function usePieceIdentities(fen: string): ReadonlyMap<Square, string> {
  const [prevFen, setPrevFen] = useState<string | null>(null);
  const [idBySquare, setIdBySquare] = useState<Map<Square, string>>(new Map());

  if (fen !== prevFen) {
    const nextMap =
      prevFen === null
        ? initialMap(fen)
        : transitionMap(idBySquare, prevFen, fen);
    setIdBySquare(nextMap);
    setPrevFen(fen);
    return nextMap;
  }

  return idBySquare;
}
