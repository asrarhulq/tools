/** Format remaining seconds as M:SS or MM:SS (optionally hiding seconds). */
export function formatTime(totalSec: number, hideSeconds = false): string {
  const s = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (hideSeconds) return `${m}`;
  return `${m}:${`${sec}`.padStart(2, "0")}`;
}

/** Compact hours label, e.g. "3.5h" or "42m". */
export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

/** "2:04 PM" style clock for the timeline. */
export function formatClock(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = `${d.getMinutes()}`.padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/** "Today", "Yesterday", or "Mon 14" for grouping the timeline. */
export function relativeDay(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const startOfDate = new Date(d).setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfToday - startOfDate) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}
