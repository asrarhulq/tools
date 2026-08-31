import { Chess, type Square } from "chess.js";
import { PIECE_VALUES } from "../config";

/**
 * The only file that touches chess.js directly. Everything else in the
 * feature works with plain data (FEN strings, `AppliedMove`), so a future
 * chess.js version bump only has to be reconciled here.
 *
 * chess.js quirks worth remembering (verified against the installed 1.4.0
 * source, not assumed):
 *  - `history({ verbose: true })` replays from scratch and reconstructs full
 *    `Move` objects (with `.before`/`.after` FEN) regardless of whether the
 *    moves were made via `.move()` or `.loadPgn()`'s internal fast path.
 *  - Comments are stored keyed by the FEN *after* the move (`_comments[fen]`),
 *    which is exactly `move.after` — so `getComments()` can be zipped
 *    positionally with `history({ verbose: true })`.
 *  - `.moves({ square, verbose: true })` only returns *legal* moves (it
 *    already filters out anything that would leave the mover's own king in
 *    check), so it cannot be used to detect that a piece is pinned — the
 *    motif detectors in `lib/motifs/` build their own pseudo-legal attack map
 *    instead.
 */

export interface AppliedMove {
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  color: "w" | "b";
  isCapture: boolean;
  isCheck: boolean;
}

export interface ParsedPgn {
  headers: Record<string, string>;
  moves: AppliedMove[];
  comments: (string | undefined)[];
}

export interface GameOverInfo {
  over: boolean;
  reason?: "checkmate" | "stalemate" | "draw";
}

export function makeMove(
  fen: string,
  from: Square,
  to: Square,
  promotion?: "q" | "r" | "b" | "n",
): AppliedMove | null {
  const chess = new Chess(fen);
  try {
    const move = chess.move({ from, to, promotion });
    return {
      san: move.san,
      uci: `${move.from}${move.to}${move.promotion ?? ""}`,
      fenBefore: move.before,
      fenAfter: move.after,
      color: move.color,
      isCapture: move.isCapture(),
      isCheck: chess.inCheck(),
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
  if (chess.isCheckmate()) return { over: true, reason: "checkmate" };
  if (chess.isStalemate()) return { over: true, reason: "stalemate" };
  if (chess.isDraw()) return { over: true, reason: "draw" };
  return { over: false };
}

/** White-positive material balance in centipawns. */
export function materialBalance(fen: string): number {
  const chess = new Chess(fen);
  let balance = 0;
  for (const row of chess.board()) {
    for (const square of row) {
      if (!square) continue;
      const value = PIECE_VALUES[square.type] ?? 0;
      balance += square.color === "w" ? value : -value;
    }
  }
  return balance;
}

/**
 * Serialize a played game (with per-ply comments keyed by ply index) as
 * standard PGN with `{...}` comments — chess.js embeds these automatically
 * once set via `setComment()` on the position they belong to.
 */
export function toPgnWithComments(
  moves: { uci: string; comment?: string }[],
  headers: Record<string, string>,
): string {
  const chess = new Chess();
  for (const [key, value] of Object.entries(headers)) {
    if (value) chess.setHeader(key, value);
  }
  for (const { uci, comment } of moves) {
    const from = uci.slice(0, 2) as Square;
    const to = uci.slice(2, 4) as Square;
    const promotion =
      uci.length > 4 ? (uci[4] as "q" | "r" | "b" | "n") : undefined;
    chess.move({ from, to, promotion });
    if (comment) chess.setComment(comment);
  }
  return chess.pgn();
}

export function fromPgn(pgn: string): ParsedPgn {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const headers = chess.getHeaders();
  const verboseHistory = chess.history({ verbose: true });
  const commentsByFen = new Map(
    chess.getComments().map((c) => [c.fen, c.comment]),
  );
  const moves: AppliedMove[] = verboseHistory.map((move) => ({
    san: move.san,
    uci: `${move.from}${move.to}${move.promotion ?? ""}`,
    fenBefore: move.before,
    fenAfter: move.after,
    color: move.color,
    isCapture: move.isCapture(),
    isCheck: new Chess(move.after).inCheck(),
  }));
  const comments = verboseHistory.map((move) => commentsByFen.get(move.after));
  return { headers, moves, comments };
}

export function inCheck(fen: string): boolean {
  return new Chess(fen).inCheck();
}
