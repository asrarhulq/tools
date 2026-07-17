import type { SessionRecord } from "../types";

/**
 * Derived analytics over the persisted session log. All pure functions — the
 * component memoizes their results. Only focus sessions count toward focus
 * metrics; breaks are ignored for hours/goals but interruptions are tracked.
 *
 * These run client-side only (the tool is dynamically imported with ssr:false),
 * so `new Date()` is safe and won't cause hydration mismatches.
 */

export interface DerivedStats {
  todayCount: number;
  weekCount: number;
  totalFocusHours: number;
  currentStreak: number;
  longestStreak: number;
  avgSessionMin: number;
  completionPct: number;
  interrupted: number;
  focusScore: number;
  /** date key (YYYY-MM-DD) → focus-session count, for the heatmap. */
  byDay: Map<string, number>;
}

const DAY_MS = 86_400_000;

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function computeStats(sessions: readonly SessionRecord[]): DerivedStats {
  const now = new Date();
  const todayK = dayKey(now);
  const weekStart = new Date(now.getTime() - 6 * DAY_MS);
  weekStart.setHours(0, 0, 0, 0);

  const byDay = new Map<string, number>();
  let todayCount = 0;
  let weekCount = 0;
  let totalFocusSec = 0;
  let completedFocus = 0;
  let attemptedFocus = 0;
  let interrupted = 0;

  for (const s of sessions) {
    if (s.mode !== "focus") continue;
    const d = new Date(s.at);
    const k = dayKey(d);
    attemptedFocus += 1;
    if (s.completed) {
      completedFocus += 1;
      totalFocusSec += s.elapsed;
      byDay.set(k, (byDay.get(k) ?? 0) + 1);
      if (k === todayK) todayCount += 1;
      if (d >= weekStart) weekCount += 1;
    } else {
      interrupted += 1;
    }
  }

  const totalFocusHours = totalFocusSec / 3600;
  const avgSessionMin = completedFocus
    ? totalFocusSec / completedFocus / 60
    : 0;
  const completionPct = attemptedFocus
    ? (completedFocus / attemptedFocus) * 100
    : 0;

  // Streaks: consecutive days (ending today or yesterday) with ≥1 focus session.
  const { current, longest } = computeStreaks(byDay, now);

  // Focus Score (0–100): blends consistency (streak), completion, and today's
  // volume so it rewards showing up *and* finishing.
  const streakPart = Math.min(1, current / 7) * 40; // up to 40 for a 7-day streak
  const completionPart = (completionPct / 100) * 35; // up to 35 for finishing
  const volumePart = Math.min(1, todayCount / 4) * 25; // up to 25 for 4 today
  const focusScore = Math.round(streakPart + completionPart + volumePart);

  return {
    todayCount,
    weekCount,
    totalFocusHours,
    currentStreak: current,
    longestStreak: longest,
    avgSessionMin,
    completionPct,
    interrupted,
    focusScore,
    byDay,
  };
}

function computeStreaks(
  byDay: Map<string, number>,
  now: Date,
): { current: number; longest: number } {
  if (byDay.size === 0) return { current: 0, longest: 0 };

  // Longest run over the set of active days.
  const active = new Set(byDay.keys());
  let longest = 0;
  for (const key of active) {
    // count only from run-starts (previous day not active)
    const prev = dayKey(new Date(new Date(key).getTime() - DAY_MS));
    if (active.has(prev)) continue;
    let len = 0;
    let cur = key;
    while (active.has(cur)) {
      len += 1;
      cur = dayKey(new Date(new Date(cur).getTime() + DAY_MS));
    }
    if (len > longest) longest = len;
  }

  // Current: walk back from today (or yesterday if today's empty yet).
  let current = 0;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  let cursor = start;
  if (!active.has(dayKey(cursor))) cursor = new Date(cursor.getTime() - DAY_MS);
  while (active.has(dayKey(cursor))) {
    current += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  return { current, longest };
}

/** Build the last `days` day-cells (oldest→newest) for the heatmap. */
export function heatmapCells(
  byDay: Map<string, number>,
  days = 365,
): Array<{ key: string; date: Date; count: number }> {
  const cells: Array<{ key: string; date: Date; count: number }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const key = dayKey(d);
    cells.push({ key, date: d, count: byDay.get(key) ?? 0 });
  }
  return cells;
}
