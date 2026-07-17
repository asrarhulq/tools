import type { AccentId, Mode, Settings } from "../types";

export const DEFAULT_SETTINGS: Settings = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  cycleLength: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  sound: true,
  volume: 0.6,
  notifications: false,
  animations: true,
  hideSeconds: false,
  accent: "blue",
  dailyGoal: 8,
};

/** Accent options mapped to CSS colour values (theme-agnostic oklch). */
export const ACCENTS: Record<AccentId, { label: string; color: string }> = {
  blue: { label: "Blue", color: "oklch(0.62 0.17 240)" },
  violet: { label: "Violet", color: "oklch(0.62 0.19 300)" },
  green: { label: "Green", color: "oklch(0.66 0.17 150)" },
  amber: { label: "Amber", color: "oklch(0.7 0.16 60)" },
  rose: { label: "Rose", color: "oklch(0.64 0.2 15)" },
};

export const MODE_LABEL: Record<Mode, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

/** Duration in seconds for a mode, from settings. */
export function durationOf(mode: Mode, s: Settings): number {
  const min =
    mode === "focus" ? s.focusMin : mode === "short" ? s.shortMin : s.longMin;
  return Math.max(1, Math.round(min * 60));
}
