const NS = "asrarul-tools:bloomie";

export const STORAGE_KEYS = {
  gate: `${NS}:unlocked:v1`,
  profile: `${NS}:profile:v1`,
  tasks: `${NS}:tasks:v1`,
  moods: `${NS}:moods:v1`,
  affirmationState: `${NS}:affirmations:v1`,
  theme: `${NS}:theme:v1`,
} as const;
