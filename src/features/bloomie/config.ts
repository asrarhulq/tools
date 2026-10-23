import type { CSSProperties } from "react";
import type { Goal, Mood, Priority, Struggle, Tone } from "./types";

/**
 * Bloomie's own visual identity — pink, cozy, deliberately not the site's
 * drafting-blue chrome. Two fixed palettes (day / lavender night) rather
 * than hooking into the site's own light/dark toggle, the same
 * self-contained-room approach `move-and-meaning` and `ayas-chess-board`
 * each take with their own look.
 */
export interface BloomiePalette {
  background: string;
  panel: string;
  panelAlt: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  gold: string;
  danger: string;
}

export const DAY_PALETTE: BloomiePalette = {
  background: "#fff9f2",
  panel: "#ffffff",
  panelAlt: "#ffe4ef",
  border: "#f6d9e6",
  text: "#554653",
  muted: "#8a7488",
  accent: "#e88ead",
  accentSoft: "#f8c8dc",
  gold: "#e0b84a",
  danger: "#d9748f",
};

export const NIGHT_PALETTE: BloomiePalette = {
  background: "#2a2438",
  panel: "#342c47",
  panelAlt: "#3d3350",
  border: "#4c4160",
  text: "#f1e9fb",
  muted: "#b4a4cc",
  accent: "#c9a8f5",
  accentSoft: "#4c4160",
  gold: "#e0c572",
  danger: "#e8929f",
};

/** Every component under the dashboard reads colors via these CSS custom
 * properties (`text-[color:var(--bloomie-muted)]` etc.) instead of
 * hardcoded hex, so the day/night toggle only has to update this one spot. */
export function paletteToCssVars(palette: BloomiePalette): CSSProperties {
  return {
    "--bloomie-bg": palette.background,
    "--bloomie-panel": palette.panel,
    "--bloomie-panel-alt": palette.panelAlt,
    "--bloomie-border": palette.border,
    "--bloomie-text": palette.text,
    "--bloomie-muted": palette.muted,
    "--bloomie-accent": palette.accent,
    "--bloomie-accent-soft": palette.accentSoft,
    "--bloomie-gold": palette.gold,
    "--bloomie-danger": palette.danger,
  } as CSSProperties;
}

export const STRUGGLE_OPTIONS: { id: Struggle; label: string }[] = [
  { id: "confidence", label: "Low confidence" },
  { id: "stress", label: "Academic stress" },
  { id: "procrastination", label: "Procrastination" },
  { id: "comparison", label: "Comparing myself to others" },
  { id: "fear-of-failure", label: "Fear of failure" },
  { id: "feeling-behind", label: "Feeling behind" },
  { id: "loneliness", label: "Loneliness" },
  { id: "burnout", label: "Burnout or exhaustion" },
  { id: "routine", label: "Trouble maintaining a routine" },
  { id: "a-bit-of-everything", label: "A little bit of everything" },
];

export const GOAL_OPTIONS: { id: Goal; label: string }[] = [
  { id: "planning", label: "Planning my day" },
  { id: "confidence", label: "Feeling more confident" },
  { id: "consistency", label: "Studying consistently" },
  { id: "self-care", label: "Taking care of myself" },
  { id: "stress", label: "Managing stress" },
  { id: "celebrating-wins", label: "Celebrating small wins" },
];

export const TONE_OPTIONS: { id: Tone; label: string }[] = [
  { id: "gentle", label: "Gentle and reassuring" },
  { id: "playful", label: "Cute and playful" },
  { id: "firm", label: "Firm but loving" },
  { id: "practical", label: "Calm and practical" },
];

/** `icon` is a lucide-react export name, mapped to a component in
 * `ui/mood-widget.tsx` — kept as a string here so this stays plain data. */
export const MOOD_OPTIONS: {
  id: Mood;
  label: string;
  color: string;
  icon: string;
}[] = [
  { id: "happy", label: "Happy", color: "#f3b35c", icon: "Smile" },
  { id: "calm", label: "Calm", color: "#8fc7a8", icon: "Feather" },
  { id: "hopeful", label: "Hopeful", color: "#e0b84a", icon: "Sunrise" },
  { id: "okayish", label: "Okay-ish", color: "#c9b8e0", icon: "Meh" },
  { id: "anxious", label: "Anxious", color: "#e89bb5", icon: "Zap" },
  {
    id: "overwhelmed",
    label: "Overwhelmed",
    color: "#d98fa0",
    icon: "CloudRain",
  },
  { id: "sad", label: "Sad", color: "#9aa8d9", icon: "Frown" },
  { id: "exhausted", label: "Exhausted", color: "#a89ab0", icon: "BatteryLow" },
  { id: "insecure", label: "Insecure", color: "#e8616f", icon: "HeartCrack" },
];

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** Rotates through Bibi the mascot's supportive one-liners — a shorter,
 * chattier register than the affirmation card below, and deliberately
 * written to not overlap it in wording (the two pools are independently
 * hashed from the same date, so a verbatim match would look like a glitch
 * on the days they happen to line up). */
export const MASCOT_MESSAGES: string[] = [
  "Hi. I'm just here for moral support today.",
  "Not every day has to be a big day.",
  "I timed my nap around your study block, very considerate of me.",
  "Tiny victories still count in my book.",
  "You looked at this app today. That's already something.",
  "I believe in you more than I believe in my own balance.",
  "No lectures from me today — just a little company.",
  "Water break? Just saying.",
];
