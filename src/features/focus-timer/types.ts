/**
 * Domain model for the Pomodoro / focus timer. All durations are stored in
 * **seconds**; the timer engine works in milliseconds internally for accuracy.
 */

export type Mode = "focus" | "short" | "long";

export type AccentId = "blue" | "violet" | "green" | "amber" | "rose";

export interface Settings {
  /** Durations in minutes (UI-facing). */
  focusMin: number;
  shortMin: number;
  longMin: number;
  /** Focus sessions before a long break. */
  cycleLength: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  sound: boolean;
  volume: number; // 0..1
  notifications: boolean;
  animations: boolean;
  hideSeconds: boolean;
  accent: AccentId;
  /** Daily focus-session goal. */
  dailyGoal: number;
}

/** One completed (or interrupted) session, persisted for stats. */
export interface SessionRecord {
  /** ISO timestamp when it ended. */
  at: string;
  mode: Mode;
  /** Planned duration in seconds. */
  planned: number;
  /** Actual elapsed seconds. */
  elapsed: number;
  completed: boolean;
}

export interface Stats {
  sessions: SessionRecord[];
}

export interface Quote {
  text: string;
  author: string;
}
