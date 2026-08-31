/**
 * Tuning constants shared across the feature. Centralized so the engine path,
 * default search budget, and "significant swing" threshold aren't magic
 * numbers scattered through the store/hook/UI.
 */

/** Same-origin static asset — a plain classic Worker, not a bundled module. */
export const ENGINE_WORKER_PATH = "/engine/stockfish-18-lite-single.js";

export const DEFAULT_ENGINE_DEPTH = 16;
export const DEFAULT_ENGINE_MOVETIME_MS = 1200;

/** Centipawn swing between two evals that triggers the eval-bar glow pulse. */
export const SWING_THRESHOLD_CP = 150;

export const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Approximate piece values (centipawns) used by the motif heuristics. */
export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

export const BOARD_COLORS = {
  light: "#e9dcc3",
  dark: "#8a6a4a",
  lastMoveLight: "#d9c98f",
  lastMoveDark: "#a3874f",
  checkGlow: "#c1553f",
} as const;

/**
 * The "study room" chrome palette — deliberately fixed regardless of the
 * site's own light/dark toggle. Warm wood/amber/brass, not the site's cool
 * drafting-blue identity; this tool is meant to feel like its own room.
 */
export const STUDY_PALETTE = {
  background: "#1a1108",
  panel: "#241708",
  panelAlt: "#2c1c0d",
  border: "#5b4630",
  text: "#f3e8d2",
  muted: "#c9b28c",
  brass: "#c9a24b",
  brassDim: "#8a713a",
  amberGlow: "#e0a94a",
  danger: "#c1553f",
} as const;
