import { Chess, type Square } from "chess.js";

/**
 * The only file that touches chess.js directly — everything else works
 * with plain data, so a chess.js version bump is reconciled in one place.
 * A trimmed subset of `move-and-meaning`'s adapter: this tool is local
 * pass-and-play, so it has no PGN import/export or motif detection to carry.
 */

export interface AppliedMove {
  san: string;
  color: "w" | "b";
  isCapture: boolean;
  isCheck: boolean;
  isCastle: boolean;
  isPromotion: boolean;
}

export interface GameOverInfo {
  over: boolean;
  reason?: "checkmate" | "stalemate" | "draw";
  winner?: "w" | "b";
}

export function makeMove(
  fen: string,
  from: Square,
  to: Square,
  promotion?: "q" | "r" | "b" | "n",
): { move: AppliedMove; fenAfter: string } | null {
  const chess = new Chess(fen);
  try {
    const move = chess.move({ from, to, promotion });
    return {
      fenAfter: chess.fen(),
      move: {
        san: move.san,
        color: move.color,
        isCapture: move.isCapture(),
        isCheck: chess.inCheck(),
        isCastle: move.isKingsideCastle() || move.isQueensideCastle(),
        isPromotion: !!move.promotion,
      },
    };
  } catch {
    return null;
  }
}

export function legalDestinations(fen: string, from: Square): Square[] {
  const chess = new Chess(fen);
  try {
    return chess
      .moves({ square: from, verbose: true })
      .map((m) => m.to as Square);
  } catch {
    return [];
  }
}

export function isPromotionMove(
  fen: string,
  from: Square,
  to: Square,
): boolean {
  const chess = new Chess(fen);
  const piece = chess.get(from);
  if (!piece || piece.type !== "p") return false;
  return to[1] === "8" || to[1] === "1";
}

export function isGameOver(fen: string): GameOverInfo {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) {
    // The side to move is checkmated, so the other color just won.
    return {
      over: true,
      reason: "checkmate",
      winner: chess.turn() === "w" ? "b" : "w",
    };
  }
  if (chess.isStalemate()) return { over: true, reason: "stalemate" };
  if (chess.isDraw()) return { over: true, reason: "draw" };
  return { over: false };
}

export function turnOf(fen: string): "w" | "b" {
  return new Chess(fen).turn();
}
