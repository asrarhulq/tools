import { Chess } from "chess.js";

/** Translates a UCI move sequence (Stockfish's `pv`) into SAN from a given FEN. */
export function uciLineToSan(
  fen: string,
  uciMoves: string[],
  maxMoves = 6,
): string[] {
  const chess = new Chess(fen);
  const sans: string[] = [];
  for (const uci of uciMoves.slice(0, maxMoves)) {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    try {
      const move = chess.move({ from, to, promotion });
      sans.push(move.san);
    } catch {
      break;
    }
  }
  return sans;
}
