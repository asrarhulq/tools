"use client";

import { MoonStar, Sun } from "lucide-react";
import type { ThemeMode } from "../types";

interface ThemeToggleProps {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

export function ThemeToggle({ mode, onChange }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(mode === "day" ? "night" : "day")}
      aria-label={
        mode === "day" ? "Switch to lavender night mode" : "Switch to day mode"
      }
      className="flex size-8 items-center justify-center rounded-full border"
      style={{
        borderColor: "var(--bloomie-border)",
        color: "var(--bloomie-accent)",
      }}
    >
      {mode === "day" ? (
        <MoonStar className="size-4" />
      ) : (
        <Sun className="size-4" />
      )}
    </button>
  );
}
