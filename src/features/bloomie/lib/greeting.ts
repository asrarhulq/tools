import { MASCOT_MESSAGES } from "../config";

/** Time-of-day greeting — no date-fns needed, just the hour. */
export function timeGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good evening";
}

/** Deterministic pick from the date — same reasoning as the daily
 * affirmation: no randomness needed on first render, so nothing here
 * risks `react-hooks/purity`. */
export function mascotMessageForDate(dateKey: string): string {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i) + 7) >>> 0;
  }
  return MASCOT_MESSAGES[hash % MASCOT_MESSAGES.length]!;
}
