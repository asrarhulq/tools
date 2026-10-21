import { Chess, type Move, type Square } from "chess.js";

/**
 * A small self-contained bot — not Stockfish. `move-and-meaning` already
 * has a real engine, but it's a true beginner's practice opponent this tool
 * needs, not a heavily-handicapped-but-still-sharp Stockfish (even its
 * lowest skill level still finds punishing tactics). A shallow minimax with
 * a material-only eval, scaled by depth, actually matches "beginner" and
 * "still learning" opponent behavior better, and it skips reintroducing a
 * second WASM worker (and the WebKit race that engine's hook had to be
 * rebuilt around) for what's meant to stay a light, local tool.
 */

export interface BotDifficulty {
  id: string;
  label: string;
  /** 0 = pick a uniformly random legal move, no evaluation at all. */
  depth: number;
  /** How many of the top-scoring moves to randomize among — 1 always plays
   * the engine's best move, higher values make it feel more human/fallible. */
  randomness: number;
}

export const BOT_DIFFICULTIES: readonly BotDifficulty[] = [
  { id: "beginner", label: "Beginner", depth: 0, randomness: 1 },
  { id: "learning", label: "Learning", depth: 1, randomness: 4 },
  { id: "confident", label: "Confident", depth: 2, randomness: 2 },
  { id: "strong", label: "Strong", depth: 3, randomness: 1 },
] as const;

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

/** White-positive material count, plus a tiny nudge toward central squares
 * so the bot doesn't shuffle rim pieces aimlessly at low depth. */
function evaluate(chess: Chess): number {
  let score = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r]![c];
      if (!cell) continue;
      const value = PIECE_VALUES[cell.type] ?? 0;
      const centerBonus =
        cell.type === "p" || cell.type === "n"
          ? 4 - Math.abs(3.5 - r) - Math.abs(3.5 - c)
          : 0;
      const total = value + centerBonus;
      score += cell.color === "w" ? total : -total;
    }
  }
  return score;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  if (chess.isCheckmate()) return maximizing ? -100000 - depth : 100000 + depth;
  if (depth === 0 || chess.isDraw()) return evaluate(chess);

  const moves = chess.moves({ verbose: true });
  let best = maximizing ? -Infinity : Infinity;
  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, alpha, beta, !maximizing);
    chess.undo();
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}

export interface BotMove {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
}

export function chooseBotMove(
  fen: string,
  difficulty: BotDifficulty,
): BotMove | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  if (difficulty.depth === 0) {
    const pick = moves[Math.floor(Math.random() * moves.length)]!;
    return toBotMove(pick);
  }

  const maximizing = chess.turn() === "w";
  const scored = moves.map((move) => {
    chess.move(move);
    const score = minimax(
      chess,
      difficulty.depth - 1,
      -Infinity,
      Infinity,
      !maximizing,
    );
    chess.undo();
    return { move, score };
  });
  scored.sort((a, b) => (maximizing ? b.score - a.score : a.score - b.score));
  const pool = scored.slice(0, Math.max(1, difficulty.randomness));
  const pick = pool[Math.floor(Math.random() * pool.length)]!;
  return toBotMove(pick.move);
}

function toBotMove(move: Move): BotMove {
  return {
    from: move.from,
    to: move.to,
    promotion: move.promotion as "q" | "r" | "b" | "n" | undefined,
  };
}
