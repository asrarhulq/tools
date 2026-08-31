"use client";

import { create } from "zustand";
import type { Square } from "chess.js";
import { STARTING_FEN } from "./config";
import { fromPgn, makeMove } from "./lib/chess-engine-adapter";
import { detectMotifs } from "./lib/motifs";
import type { PersistedMmState } from "./lib/persist";
import type {
  AssistMode,
  EngineStatus,
  LensId,
  MoveRecord,
  UciInfo,
} from "./types";

/**
 * The single game store (Zustand). Chess history is linear (no branching):
 * `cursorPly` lets the student scrub back through the game to view/annotate
 * an earlier position WITHOUT truncating anything (`undoMove`/`redoMove` are
 * pure cursor navigation). Playing a NEW move while the cursor isn't at the
 * tip discards the old "future" from that point, like any PGN editor.
 *
 * Persistence is manual + debounced (wired from the top-level tool
 * component), not zustand middleware — mirrors argument-mapper's store,
 * since the persisted slice deliberately excludes transient engine state.
 */

export interface MmState {
  pgnHeaders: Record<string, string>;
  history: MoveRecord[];
  cursorPly: number;
  mode: AssistMode;
  unassistedGuesses: Record<number, string>;
  activeLensId: LensId;
  lensResponses: Record<string, string>;
  flags: number[];
  engineStatus: EngineStatus;
  engineInfo: (UciInfo & { fen: string }) | null;
  hydrated: boolean;

  newGame: (startFen?: string) => void;
  loadPgnGame: (pgn: string) => void;
  makeMoveAt: (
    from: Square,
    to: Square,
    promotion?: "q" | "r" | "b" | "n",
  ) => boolean;
  goToPly: (ply: number) => void;
  undoMove: () => void;
  redoMove: () => void;
  setMode: (mode: AssistMode) => void;
  setUnassistedGuess: (ply: number, text: string) => void;
  setLensResponse: (ply: number, lensId: LensId, text: string) => void;
  setActiveLens: (lensId: LensId) => void;
  toggleFlag: (ply: number) => void;
  setComment: (ply: number, comment: string) => void;
  setEngineStatus: (status: EngineStatus) => void;
  setEngineInfo: (fen: string, info: UciInfo) => void;
  hydrate: (persisted: PersistedMmState) => void;
  reset: () => void;
  snapshot: () => PersistedMmState;
}

export const currentFen = (state: Pick<MmState, "history" | "cursorPly">) =>
  state.cursorPly > 0
    ? state.history[state.cursorPly - 1]!.fenAfter
    : STARTING_FEN;

const initial = {
  pgnHeaders: {},
  history: [] as MoveRecord[],
  cursorPly: 0,
  mode: "assisted" as AssistMode,
  unassistedGuesses: {} as Record<number, string>,
  activeLensId: "ryle" as LensId,
  lensResponses: {} as Record<string, string>,
  flags: [] as number[],
  engineStatus: "idle" as EngineStatus,
  engineInfo: null as (UciInfo & { fen: string }) | null,
  hydrated: false,
};

export const useMmStore = create<MmState>((set, get) => ({
  ...initial,

  newGame: (startFen) => {
    void startFen; // reserved for a future "start from FEN" affordance
    set({
      pgnHeaders: {},
      history: [],
      cursorPly: 0,
      unassistedGuesses: {},
      lensResponses: {},
      flags: [],
      engineInfo: null,
    });
  },

  loadPgnGame: (pgn) => {
    try {
      const parsed = fromPgn(pgn);
      const history: MoveRecord[] = parsed.moves.map((move, i) => {
        const from = move.uci.slice(0, 2) as Square;
        const to = move.uci.slice(2, 4) as Square;
        return {
          ply: i + 1,
          san: move.san,
          uci: move.uci,
          fenBefore: move.fenBefore,
          fenAfter: move.fenAfter,
          color: move.color,
          isCapture: move.isCapture,
          isCheck: move.isCheck,
          comment: parsed.comments[i] ?? "",
          flagged: false,
          motifs: detectMotifs(move.fenBefore, move.fenAfter, {
            from,
            to,
            color: move.color,
          }),
        };
      });
      set({
        pgnHeaders: parsed.headers,
        history,
        cursorPly: history.length,
        unassistedGuesses: {},
        lensResponses: {},
        flags: [],
        engineInfo: null,
      });
    } catch {
      /* Invalid PGN — leave the current game untouched; the UI surfaces the error. */
    }
  },

  makeMoveAt: (from, to, promotion) => {
    const state = get();
    const fen = currentFen(state);
    const applied = makeMove(fen, from, to, promotion);
    if (!applied) return false;

    const truncated = state.history.slice(0, state.cursorPly);
    const record: MoveRecord = {
      ply: truncated.length + 1,
      san: applied.san,
      uci: applied.uci,
      fenBefore: applied.fenBefore,
      fenAfter: applied.fenAfter,
      color: applied.color,
      isCapture: applied.isCapture,
      isCheck: applied.isCheck,
      comment: "",
      flagged: false,
      motifs: detectMotifs(applied.fenBefore, applied.fenAfter, {
        from,
        to,
        color: applied.color,
      }),
    };
    const history = [...truncated, record];
    set({ history, cursorPly: history.length, engineInfo: null });
    return true;
  },

  goToPly: (ply) => {
    const clamped = Math.max(0, Math.min(get().history.length, ply));
    set({ cursorPly: clamped, engineInfo: null });
  },

  undoMove: () => get().goToPly(get().cursorPly - 1),
  redoMove: () => get().goToPly(get().cursorPly + 1),

  setMode: (mode) => set({ mode }),

  setUnassistedGuess: (ply, text) =>
    set((s) => ({
      unassistedGuesses: { ...s.unassistedGuesses, [ply]: text },
    })),

  setLensResponse: (ply, lensId, text) =>
    set((s) => ({
      lensResponses: { ...s.lensResponses, [`${ply}:${lensId}`]: text },
    })),

  setActiveLens: (activeLensId) => set({ activeLensId }),

  toggleFlag: (ply) =>
    set((s) => ({
      flags: s.flags.includes(ply)
        ? s.flags.filter((p) => p !== ply)
        : [...s.flags, ply],
      history: s.history.map((m) =>
        m.ply === ply ? { ...m, flagged: !m.flagged } : m,
      ),
    })),

  setComment: (ply, comment) =>
    set((s) => ({
      history: s.history.map((m) => (m.ply === ply ? { ...m, comment } : m)),
    })),

  setEngineStatus: (engineStatus) => set({ engineStatus }),
  setEngineInfo: (fen, info) => set({ engineInfo: { ...info, fen } }),

  hydrate: (persisted) =>
    set({
      pgnHeaders: persisted.pgnHeaders,
      history: persisted.history,
      cursorPly: persisted.cursorPly,
      mode: persisted.mode,
      unassistedGuesses: persisted.unassistedGuesses,
      activeLensId: persisted.activeLensId,
      lensResponses: persisted.lensResponses,
      flags: persisted.flags,
      hydrated: true,
    }),

  reset: () => set({ ...initial, hydrated: get().hydrated }),

  snapshot: () => {
    const s = get();
    return {
      pgnHeaders: s.pgnHeaders,
      history: s.history,
      cursorPly: s.cursorPly,
      mode: s.mode,
      unassistedGuesses: s.unassistedGuesses,
      activeLensId: s.activeLensId,
      lensResponses: s.lensResponses,
      flags: s.flags,
    };
  },
}));
