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
 * Diffs `before` → `after` and returns the next square→id map, so
 * framer-motion can `layout`-animate a piece sliding between squares
 * instead of unmounting/remounting it. Same algorithm as
 * `move-and-meaning`'s version: sources (vacated squares) are matched to
 * destinations by (color, type); an unmatched source was captured; a
 * leftover match-by-color-only handles promotion, where the type changes.
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

/** React's "adjust state during render" pattern — comparing `fen` to the
 * previous value and computing the next map right there — rather than
 * reading/writing a ref during render, which `react-hooks/refs` flags. */
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
