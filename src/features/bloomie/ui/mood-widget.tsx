"use client";

import {
  BatteryLow,
  CloudRain,
  Feather,
  Frown,
  HeartCrack,
  Meh,
  Smile,
  Sunrise,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { MOOD_OPTIONS } from "../config";
import { dateKey } from "../lib/mood";
import { STORAGE_KEYS } from "../lib/storage-keys";
import type { Mood, MoodEntry } from "../types";
import { MoodCalendar } from "./mood-calendar";

const EMPTY_ENTRIES: MoodEntry[] = [];

const MOOD_ICONS: Record<string, LucideIcon> = {
  Smile,
  Feather,
  Sunrise,
  Meh,
  Zap,
  CloudRain,
  Frown,
  BatteryLow,
  HeartCrack,
};

/**
 * No diagnosis, no judgment — just "how are you, really" and a private
 * place to notice patterns over time. The optional note and the calendar
 * are both for her eyes only (localStorage, never sent anywhere).
 */
export function MoodWidget() {
  const [entries, setEntries] = useLocalStorage<MoodEntry[]>(
    STORAGE_KEYS.moods,
    EMPTY_ENTRIES,
  );
  const [showCalendar, setShowCalendar] = useState(false);

  const today = dateKey();
  const todayEntry = entries.find((e) => e.date === today);

  function selectMood(mood: Mood) {
    setEntries((prev) => {
      const existingNote = prev.find((e) => e.date === today)?.note ?? "";
      const rest = prev.filter((e) => e.date !== today);
      return [...rest, { date: today, mood, note: existingNote }];
    });
  }

  function updateNote(value: string) {
    setEntries((prev) =>
      prev.map((e) => (e.date === today ? { ...e, note: value } : e)),
    );
  }

  return (
    <div
      className="rounded-[24px] border p-4"
      style={{
        borderColor: "var(--bloomie-border)",
        backgroundColor: "var(--bloomie-panel)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--bloomie-text)" }}
        >
          How are you, really?
        </h3>
        <button
          type="button"
          onClick={() => setShowCalendar((v) => !v)}
          className="text-xs font-medium"
          style={{ color: "var(--bloomie-accent)" }}
        >
          {showCalendar ? "Hide patterns" : "See patterns"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {MOOD_OPTIONS.map((m) => {
          const Icon = MOOD_ICONS[m.icon] ?? Smile;
          const selected = todayEntry?.mood === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => selectMood(m.id)}
              className="flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] transition-transform hover:scale-105"
              style={{
                borderColor: selected ? m.color : "var(--bloomie-border)",
                backgroundColor: selected ? `${m.color}26` : "transparent",
                color: "var(--bloomie-text)",
              }}
            >
              <Icon className="size-4" style={{ color: m.color }} />
              {m.label}
            </button>
          );
        })}
      </div>

      {todayEntry && (
        <div className="mt-3">
          <label
            className="mb-1 block text-xs"
            style={{ color: "var(--bloomie-muted)" }}
          >
            What&apos;s making you feel this way? (optional)
          </label>
          <textarea
            value={todayEntry.note}
            onChange={(e) => updateNote(e.target.value)}
            rows={2}
            placeholder="No pressure to explain — just a space if you want to."
            className="w-full resize-none rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none"
            style={{
              borderColor: "var(--bloomie-border)",
              color: "var(--bloomie-text)",
            }}
          />
        </div>
      )}

      {showCalendar && (
        <div
          className="mt-4 border-t pt-4"
          style={{ borderColor: "var(--bloomie-border)" }}
        >
          <MoodCalendar entries={entries} />
        </div>
      )}
    </div>
  );
}
