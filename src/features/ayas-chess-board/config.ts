/**
 * Tuning constants + palettes for Aya's Chess Board. Kept separate from
 * `move-and-meaning`'s config on purpose — same chess.js engine underneath,
 * but this tool's whole visual identity (pastel, warm, personal) and voice
 * are its own, not a reskin.
 */

export const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Named like nail-polish shades, because the board theme picker is one. */
export interface BoardPalette {
  label: string;
  light: string;
  dark: string;
  lastMoveLight: string;
  lastMoveDark: string;
  checkGlow: string;
  border: string;
}

export const BOARD_PALETTES: readonly BoardPalette[] = [
  {
    label: "Rose Quartz",
    light: "#fdf1ee",
    dark: "#d98fa0",
    lastMoveLight: "#ffe9a8",
    lastMoveDark: "#e8b86b",
    checkGlow: "#e8616f",
    border: "#b9607a",
  },
  {
    label: "Lavender Fields",
    light: "#f6f1fb",
    dark: "#b6a0d6",
    lastMoveLight: "#ffe9a8",
    lastMoveDark: "#e8b86b",
    checkGlow: "#e8616f",
    border: "#8d73b8",
  },
  {
    label: "Mint Tea",
    light: "#f2faf4",
    dark: "#8fc7a8",
    lastMoveLight: "#ffe9a8",
    lastMoveDark: "#e8b86b",
    checkGlow: "#e8616f",
    border: "#5a9b76",
  },
  {
    label: "Habibi Gold",
    light: "#fff8ec",
    dark: "#d9ae5c",
    lastMoveLight: "#ffe0ec",
    lastMoveDark: "#e89bb5",
    checkGlow: "#e8616f",
    border: "#a87c2e",
  },
] as const;

/** The chrome palette around the board — deliberately fixed regardless of
 * the site's own light/dark toggle, the same way `move-and-meaning`'s
 * "study room" stays its own room. This one's room is pink. */
export const SHELL_PALETTE = {
  background: "#fff7f8",
  panel: "#ffffff",
  panelAlt: "#fff0f3",
  border: "#f3d3dc",
  text: "#4a2c3a",
  muted: "#9c7684",
  accent: "#d9748f",
  accentDim: "#f3c6d3",
  gold: "#c9962f",
  danger: "#e8616f",
} as const;
