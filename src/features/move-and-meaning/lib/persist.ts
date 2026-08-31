import type { AssistMode, EngineOpponent, LensId, MoveRecord } from "../types";

/**
 * Tiny localStorage persistence for the working game — same shape as
 * argument-mapper's `lib/persist.ts`: SSR-safe, tolerant of corrupt data,
 * versioned for future migrations. Deliberately excludes transient store
 * fields (`engineStatus`, `engineInfo`) since those are re-derived, not saved.
 */

const KEY = "asrarul-tools:move-and-meaning:v1";

export interface PersistedMmState {
  pgnHeaders: Record<string, string>;
  history: MoveRecord[];
  cursorPly: number;
  mode: AssistMode;
  unassistedGuesses: Record<number, string>;
  activeLensId: LensId;
  lensResponses: Record<string, string>;
  flags: number[];
  /** Optional — absent on state saved before Play vs. Engine existed. */
  vsEngine?: EngineOpponent | null;
}

interface Stored {
  v: 1;
  state: PersistedMmState;
}

export function loadGame(): PersistedMmState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (parsed?.v !== 1 || !Array.isArray(parsed.state?.history)) return null;
    return parsed.state;
  } catch {
    return null;
  }
}

export function saveGame(state: PersistedMmState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, state } satisfies Stored));
  } catch {
    /* quota / private mode — non-fatal */
  }
}
