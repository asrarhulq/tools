import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";

/**
 * A pseudo-legal attack map built directly off chess.js's raw `board()`
 * array — deliberately independent of chess.js's own legal-move generator.
 * `.moves({ square, verbose: true })` only returns legal moves (it already
 * filters out anything that would leave the mover's own king in check), so a
 * pinned piece just shows as having fewer/zero legal moves rather than
 * exposing *that it is pinned*. Detecting pins/skewers/forks needs the raw
 * "what does this piece attack, ignoring check" view instead.
 */

export type BoardCell = {
  square: Square;
  type: PieceSymbol;
  color: Color;
} | null;
export type Board = BoardCell[][];

export function boardFromFen(fen: string): Board {
  return new Chess(fen).board();
}

const FILES = "abcdefgh";

function fileOf(square: Square): number {
  return FILES.indexOf(square[0]!);
}

function rankOf(square: Square): number {
  return Number(square[1]);
}

function squareOf(file: number, rank: number): Square {
  return `${FILES[file]}${rank}` as Square;
}

function inBounds(file: number, rank: number): boolean {
  return file >= 0 && file <= 7 && rank >= 1 && rank <= 8;
}

export function pieceAt(board: Board, square: Square) {
  const file = fileOf(square);
  const rank = rankOf(square);
  return board[8 - rank]?.[file] ?? null;
}

export function occupiedSquares(board: Board): Square[] {
  const squares: Square[] = [];
  for (const row of board) {
    for (const cell of row) {
      if (cell) squares.push(cell.square);
    }
  }
  return squares;
}

export const ROOK_DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export const BISHOP_DIRS: [number, number][] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

export interface RayHit {
  square: Square;
  piece: { type: PieceSymbol; color: Color };
}

/** Walks a ray, returning up to the first two occupied squares along it. */
export function rayFrom(
  board: Board,
  from: Square,
  dx: number,
  dy: number,
): RayHit[] {
  const hits: RayHit[] = [];
  let file = fileOf(from) + dx;
  let rank = rankOf(from) + dy;
  while (inBounds(file, rank) && hits.length < 2) {
    const cell = board[8 - rank]?.[file];
    if (cell) hits.push({ square: squareOf(file, rank), piece: cell });
    file += dx;
    rank += dy;
  }
  return hits;
}

const KNIGHT_DELTAS: [number, number][] = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];

const KING_DELTAS: [number, number][] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

export function knightAttacksFrom(square: Square): Square[] {
  const f = fileOf(square);
  const r = rankOf(square);
  return KNIGHT_DELTAS.filter(([dx, dy]) => inBounds(f + dx, r + dy)).map(
    ([dx, dy]) => squareOf(f + dx, r + dy),
  );
}

export function kingAttacksFrom(square: Square): Square[] {
  const f = fileOf(square);
  const r = rankOf(square);
  return KING_DELTAS.filter(([dx, dy]) => inBounds(f + dx, r + dy)).map(
    ([dx, dy]) => squareOf(f + dx, r + dy),
  );
}

export function pawnAttacksFrom(square: Square, color: Color): Square[] {
  const f = fileOf(square);
  const r = rankOf(square);
  const dr = color === "w" ? 1 : -1;
  return [
    [f - 1, r + dr],
    [f + 1, r + dr],
  ]
    .filter(([df, nr]) => inBounds(df!, nr!))
    .map(([df, nr]) => squareOf(df!, nr!));
}

function slideAttacks(
  board: Board,
  square: Square,
  dirs: [number, number][],
): Square[] {
  const out: Square[] = [];
  for (const [dx, dy] of dirs) {
    const hits = rayFrom(board, square, dx, dy);
    if (hits[0]) out.push(hits[0].square);
  }
  return out;
}

/** Every square the piece on `square` attacks (own-piece-occupied squares included). */
export function attackSquaresOf(board: Board, square: Square): Square[] {
  const piece = pieceAt(board, square);
  if (!piece) return [];
  switch (piece.type) {
    case "n":
      return knightAttacksFrom(square);
    case "k":
      return kingAttacksFrom(square);
    case "p":
      return pawnAttacksFrom(square, piece.color);
    case "b":
      return slideAttacks(board, square, BISHOP_DIRS);
    case "r":
      return slideAttacks(board, square, ROOK_DIRS);
    case "q":
      return slideAttacks(board, square, [...BISHOP_DIRS, ...ROOK_DIRS]);
  }
}
