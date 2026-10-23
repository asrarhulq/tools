"use client";

import { Pencil } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { DAY_PALETTE, NIGHT_PALETTE, paletteToCssVars } from "../config";
import { timeGreeting } from "../lib/greeting";
import { STORAGE_KEYS } from "../lib/storage-keys";
import type { Profile, ThemeMode } from "../types";
import { AffirmationWidget } from "./affirmation-widget";
import { Mascot } from "./mascot";
import { MoodWidget } from "./mood-widget";
import { PlanWidget } from "./plan-widget";
import { ThemeToggle } from "./theme-toggle";

interface DashboardProps {
  profile: Profile;
  onEditPreferences: () => void;
}

export function Dashboard({ profile, onEditPreferences }: DashboardProps) {
  const [theme, setTheme] = useLocalStorage<ThemeMode>(
    STORAGE_KEYS.theme,
    "day",
  );
  const palette = theme === "day" ? DAY_PALETTE : NIGHT_PALETTE;
  const name = profile.nickname.trim() || "friend";

  return (
    <div
      className="rounded-[28px] border p-4 sm:p-6"
      style={{
        ...paletteToCssVars(palette),
        backgroundColor: "var(--bloomie-bg)",
        borderColor: "var(--bloomie-border)",
      }}
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--bloomie-text)" }}
          >
            {timeGreeting()}, {name} 🌷
          </h2>
          <p
            className="mt-0.5 text-sm"
            style={{ color: "var(--bloomie-muted)" }}
          >
            Let&apos;s take today one little step at a time.
          </p>
          <div className="mt-3">
            <Mascot />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle mode={theme} onChange={setTheme} />
          <button
            type="button"
            onClick={onEditPreferences}
            aria-label="Edit preferences"
            className="flex size-8 items-center justify-center rounded-full border"
            style={{
              borderColor: "var(--bloomie-border)",
              color: "var(--bloomie-accent)",
            }}
          >
            <Pencil className="size-3.5" />
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <PlanWidget />
        <div className="space-y-4">
          <MoodWidget />
          <AffirmationWidget nickname={name} />
        </div>
      </div>
    </div>
  );
}
