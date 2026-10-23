import { format, parseISO } from "date-fns";
import { MOOD_OPTIONS } from "../config";
import { lastNDayKeys, moodByDate, weeklyMoodCounts } from "../lib/mood";
import type { MoodEntry } from "../types";

interface MoodCalendarProps {
  entries: MoodEntry[];
}

/** A private, non-judgmental grid of the last 28 days, each colored by that
 * day's logged mood — plus a simple weekly-pattern bar chart (plain divs,
 * no charting library needed for nine small counts). */
export function MoodCalendar({ entries }: MoodCalendarProps) {
  const days = lastNDayKeys(28);
  const byDate = moodByDate(entries);
  const weekly = weeklyMoodCounts(entries);
  const maxWeekly = Math.max(
    1,
    ...MOOD_OPTIONS.map((m) => weekly.get(m.id) ?? 0),
  );

  return (
    <div className="space-y-4">
      <div>
        <p
          className="mb-1.5 text-xs font-medium"
          style={{ color: "var(--bloomie-muted)" }}
        >
          Last 28 days
        </p>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const entry = byDate.get(day);
            const mood = entry
              ? MOOD_OPTIONS.find((m) => m.id === entry.mood)
              : undefined;
            return (
              <div
                key={day}
                title={`${format(parseISO(day), "MMM d")}${mood ? ` — ${mood.label}` : ""}`}
                className="aspect-square rounded-md"
                style={{
                  backgroundColor: mood
                    ? mood.color
                    : "var(--bloomie-panel-alt)",
                  opacity: mood ? 1 : 0.5,
                }}
              />
            );
          })}
        </div>
      </div>

      <div>
        <p
          className="mb-1.5 text-xs font-medium"
          style={{ color: "var(--bloomie-muted)" }}
        >
          This week
        </p>
        <div className="space-y-1">
          {MOOD_OPTIONS.map((m) => {
            const count = weekly.get(m.id) ?? 0;
            return (
              <div key={m.id} className="flex items-center gap-2 text-[11px]">
                <span
                  className="w-16 shrink-0"
                  style={{ color: "var(--bloomie-muted)" }}
                >
                  {m.label}
                </span>
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full"
                  style={{ backgroundColor: "var(--bloomie-panel-alt)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(count / maxWeekly) * 100}%`,
                      backgroundColor: m.color,
                    }}
                  />
                </div>
                <span
                  className="w-4 shrink-0 text-right"
                  style={{ color: "var(--bloomie-muted)" }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
