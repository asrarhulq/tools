import { format, subDays } from "date-fns";
import type { Mood, MoodEntry } from "../types";

export function dateKey(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

/** Last `n` day-keys, oldest first, ending today — the calendar grid's columns. */
export function lastNDayKeys(n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    dateKey(subDays(new Date(), n - 1 - i)),
  );
}

export function moodByDate(entries: MoodEntry[]): Map<string, MoodEntry> {
  return new Map(entries.map((e) => [e.date, e]));
}

/** Counts per mood over the last 7 days, for the weekly-pattern bars. */
export function weeklyMoodCounts(entries: MoodEntry[]): Map<Mood, number> {
  const week = new Set(lastNDayKeys(7));
  const counts = new Map<Mood, number>();
  for (const entry of entries) {
    if (!week.has(entry.date)) continue;
    counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
  }
  return counts;
}
