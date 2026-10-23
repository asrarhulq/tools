/**
 * Domain model for Bloomie. Everything is a plain, serializable shape —
 * persisted to localStorage, not a database, so there's nothing here that
 * isn't JSON-safe.
 */

export type Struggle =
  | "confidence"
  | "stress"
  | "procrastination"
  | "comparison"
  | "fear-of-failure"
  | "feeling-behind"
  | "loneliness"
  | "burnout"
  | "routine"
  | "a-bit-of-everything";

export type Goal =
  | "planning"
  | "confidence"
  | "consistency"
  | "self-care"
  | "stress"
  | "celebrating-wins";

export type Tone = "gentle" | "playful" | "firm" | "practical";

export interface Profile {
  nickname: string;
  year: string;
  subjects: string;
  struggle: Struggle | null;
  goal: Goal | null;
  tone: Tone;
  wakeTime: string;
  sleepTime: string;
  studyHoursGoal: number;
  onboardedAt: string;
}

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  subject: string;
  priority: Priority;
  estimatedMinutes: number | null;
  essential: boolean;
  done: boolean;
  /** YYYY-MM-DD — which day's plan this task belongs to. */
  date: string;
  order: number;
}

export type Mood =
  | "happy"
  | "calm"
  | "hopeful"
  | "okayish"
  | "anxious"
  | "overwhelmed"
  | "sad"
  | "exhausted"
  | "insecure";

export interface MoodEntry {
  date: string;
  mood: Mood;
  note: string;
}

export interface AffirmationState {
  /** Affirmation id currently shown — stable until "new affirmation" is pressed. */
  currentId: string;
  favoriteIds: string[];
  reflections: Record<string, string>;
}

export type ThemeMode = "day" | "night";
