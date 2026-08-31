/**
 * Tuning constants shared across the feature. Centralized so the engine path,
 * default search budget, and "significant swing" threshold aren't magic
 * numbers scattered through the store/hook/UI.
 */

/** Same-origin static asset — a plain classic Worker, not a bundled module. */
export const ENGINE_WORKER_PATH = "/engine/stockfish-18-lite-single.js";

export const DEFAULT_ENGINE_DEPTH = 16;
export const DEFAULT_ENGINE_MOVETIME_MS = 1200;

/**
 * Worst-case time (added on top of the requested movetime) before Play vs.
 * Engine gives up waiting on a reply and restarts the engine worker. Async
 * postMessage communication can silently drop a response (a suspended
 * background tab, a crashed worker) with nothing in-app to catch — this is
 * the backstop so "Engine is thinking…" can never persist forever. Generous
 * on purpose: it must comfortably cover the engine's one-time ~7MB WASM
 * compile on a slow device, which happens inside this same window on a
 * game's first move.
 */
export const ENGINE_WATCHDOG_BUFFER_MS = 15000;

/** Centipawn swing between two evals that triggers the eval-bar glow pulse. */
export const SWING_THRESHOLD_CP = 150;

/**
 * Difficulty ladder for Play vs. Engine. `skillLevel` maps to Stockfish's
 * own `Skill Level` UCI option (0–20, its built-in strength handicap);
 * `movetimeMs` bounds how long the engine thinks per move so easy games stay
 * snappy. Only used while playing against the engine — free-analysis mode
 * always runs at full strength (`DEFAULT_ENGINE_DEPTH`, skill reset to 20).
 */
export interface DifficultyPreset {
  label: string;
  skillLevel: number;
  movetimeMs: number;
}

export const DIFFICULTY_PRESETS: readonly DifficultyPreset[] = [
  { label: "Beginner", skillLevel: 1, movetimeMs: 300 },
  { label: "Casual", skillLevel: 6, movetimeMs: 600 },
  { label: "Club", skillLevel: 12, movetimeMs: 1200 },
  { label: "Strong", skillLevel: 20, movetimeMs: 2500 },
] as const;

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

/** Deep forest green + warm ivory — a "library table" pairing that still
 * reads warm alongside the room's brass accents, without the literal
 * wood-brown of the first pass. */
export const BOARD_COLORS = {
  light: "#e8e1d0",
  dark: "#3f5d4a",
  lastMoveLight: "#d7c66f",
  lastMoveDark: "#7c9169",
  checkGlow: "#c1553f",
  border: "#2b3a30",
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
