"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Mode, SessionRecord, Settings } from "../types";
import { DEFAULT_SETTINGS, durationOf } from "../lib/config";
import { playComplete, playMilestone, playTick } from "../lib/sound";
import {
  addSession,
  buildBackup,
  clearSessions,
  loadSessions,
  loadSettings,
  migrateLegacy,
  parseBackup,
  replaceSessions,
  saveSettings,
} from "../lib/db";

/**
 * Central store for the focus timer: settings, statistics, and the rAF-driven
 * timer engine. Two update channels keep it smooth:
 *   • `progressRef` (0→1) + `remainingMsRef` are updated every animation frame
 *     with zero React re-renders — the ring reads them in its own rAF loop.
 *   • `remainingLabel` state ticks ~4×/sec, only enough for the digit readout.
 *
 * Durable history lives in **IndexedDB** (see `lib/db`), which survives storage
 * pressure and holds months of sessions comfortably. Settings are additionally
 * mirrored to localStorage for an instant first paint. Hydration is deferred
 * post-mount (async, from IDB) so SSR and the first client render match; a
 * one-time migration lifts any legacy localStorage history into IDB.
 */

export type Phase = "idle" | "running" | "paused";

interface StoreValue {
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;

  sessions: SessionRecord[];
  clearStats: () => void;

  /** Download the full history + settings as a JSON backup file. */
  exportBackup: () => void;
  /** Import a backup file; returns the number of sessions loaded (throws on bad file). */
  importBackup: (json: unknown) => Promise<number>;

  mode: Mode;
  phase: Phase;
  cycleCount: number; // completed focus sessions in the current cycle
  /** Live progress (0 start → 1 done); mutate-free ref, read per frame. */
  progressRef: React.MutableRefObject<number>;
  remainingMsRef: React.MutableRefObject<number>;
  /** Coarse remaining seconds for the text readout. */
  remainingLabel: number;
  totalMs: number;

  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  skip: () => void;
  switchMode: (m: Mode) => void;

  /** Milestone signal the UI can watch to celebrate. */
  celebration: number;
  hydrated: boolean;
}

const Ctx = createContext<StoreValue | null>(null);

export function FocusStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Settings start at the deterministic default so SSR and the first client
  // render agree; the persisted copy (mirror → IndexedDB) is applied in the
  // hydration effect below, before `hydrated` flips true and the UI reveals.
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [mode, setMode] = useState<Mode>("focus");
  const [phase, setPhase] = useState<Phase>("idle");
  const [cycleCount, setCycleCount] = useState(0);
  const [remainingLabel, setRemainingLabel] = useState(
    DEFAULT_SETTINGS.focusMin * 60,
  );
  const [totalMs, setTotalMs] = useState(DEFAULT_SETTINGS.focusMin * 60_000);
  const [celebration, setCelebration] = useState(0);

  const progressRef = useRef(0);
  const remainingMsRef = useRef(DEFAULT_SETTINGS.focusMin * 60_000);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const lastLabelRef = useRef(-1);
  const startedElapsedRef = useRef(0); // elapsed already banked before pause
  const totalMsRef = useRef(totalMs);

  // Mirror the latest reactive values into refs the rAF loop / callbacks read.
  // Synced post-commit (never during render) so the engine always sees fresh
  // settings/mode/cycle without re-subscribing the animation frame.
  const settingsRef = useRef(settings);
  const modeRef = useRef(mode);
  const cycleRef = useRef(cycleCount);
  const sessionsRef = useRef(sessions);
  useEffect(() => {
    settingsRef.current = settings;
    modeRef.current = mode;
    cycleRef.current = cycleCount;
    sessionsRef.current = sessions;
  });

  // ── Hydration (SSR-safe, async from IndexedDB) ──────────────────────────
  // After mount we migrate any legacy localStorage history into IDB, then load
  // the authoritative settings + full session log. `hydrated` gates the reveal
  // so the user never sees the default state flash over their real data. This
  // is external-store initialization — the intended use of setState in effects.
  useEffect(() => {
    let alive = true;
    (async () => {
      await migrateLegacy();
      const [loadedSettings, loadedSessions] = await Promise.all([
        loadSettings(),
        loadSessions(),
      ]);
      if (!alive) return;
      const s: Settings = { ...DEFAULT_SETTINGS, ...(loadedSettings ?? {}) };
      const dur = durationOf("focus", s) * 1000;
      remainingMsRef.current = dur;
      setSettingsState(s);
      setSessions(loadedSessions);
      setTotalMs(dur);
      setRemainingLabel(Math.round(dur / 1000));
      setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ── Persistence ─────────────────────────────────────────────────────────
  // Settings persist on every change (small; mirror + IDB). Sessions are NOT
  // saved by mirroring the whole array — instead each new session is appended
  // in `recordSession` (one small IDB put), and bulk operations (import/clear)
  // write directly. This keeps the hot path cheap even with years of history.
  useEffect(() => {
    if (!hydrated) return;
    void saveSettings(settings);
  }, [settings, hydrated]);

  const recordSession = useCallback(
    (m: Mode, planned: number, elapsed: number, completed: boolean) => {
      const rec: SessionRecord = {
        at: new Date().toISOString(),
        mode: m,
        planned,
        elapsed,
        completed,
      };
      setSessions((prev) => [...prev, rec]);
      void addSession(rec);
    },
    [],
  );

  const notify = useCallback((title: string, body: string) => {
    if (!settingsRef.current.notifications) return;
    try {
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        new Notification(title, { body, silent: true });
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ── The engine ──────────────────────────────────────────────────────────
  const stopRaf = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  // Forward declaration via ref so the loop can advance to the next mode.
  const onCompleteRef = useRef<() => void>(() => {});

  // The frame step reads mutable refs only (never props/state). It re-schedules
  // itself through `stepRef` rather than by its own name, which both avoids a
  // use-before-declare cycle and lets it stay perfectly stable across renders.
  const stepRef = useRef<(ts: number) => void>(() => {});
  useEffect(() => {
    const step = (ts: number) => {
      if (lastTsRef.current === 0) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      remainingMsRef.current = Math.max(0, remainingMsRef.current - dt);
      const rem = remainingMsRef.current;
      progressRef.current = 1 - rem / Math.max(1, totalMsRef.current);

      const secs = Math.ceil(rem / 1000);
      if (secs !== lastLabelRef.current) {
        lastLabelRef.current = secs;
        setRemainingLabel(secs);
      }

      if (rem <= 0) {
        onCompleteRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    stepRef.current = step;
  }, []);

  const beginRaf = useCallback(() => {
    lastTsRef.current = 0;
    stopRaf();
    rafRef.current = requestAnimationFrame((t) => stepRef.current(t));
  }, [stopRaf]);

  const start = useCallback(() => {
    if (phase === "running") return;
    startedElapsedRef.current = totalMs / 1000 - remainingMsRef.current / 1000;
    setPhase("running");
    if (settingsRef.current.sound) playTick(settingsRef.current.volume);
    beginRaf();
  }, [phase, totalMs, beginRaf]);

  const pause = useCallback(() => {
    if (phase !== "running") return;
    stopRaf();
    setPhase("paused");
  }, [phase, stopRaf]);

  const resume = useCallback(() => {
    if (phase !== "paused") return;
    setPhase("running");
    beginRaf();
  }, [phase, beginRaf]);

  const loadMode = useCallback(
    (m: Mode, autoStart: boolean) => {
      const dur = durationOf(m, settingsRef.current) * 1000;
      setMode(m);
      setTotalMs(dur);
      totalMsRef.current = dur;
      remainingMsRef.current = dur;
      progressRef.current = 0;
      lastLabelRef.current = -1;
      setRemainingLabel(Math.round(dur / 1000));
      if (autoStart) {
        startedElapsedRef.current = 0;
        setPhase("running");
        beginRaf();
      } else {
        stopRaf();
        setPhase("idle");
      }
    },
    [beginRaf, stopRaf],
  );

  // Advance to the next mode when the timer reaches zero.
  const advance = useCallback(
    (completed: boolean) => {
      stopRaf();
      const m = modeRef.current;
      const planned = durationOf(m, settingsRef.current);
      const elapsed = completed
        ? planned
        : Math.round(planned - remainingMsRef.current / 1000);
      recordSession(m, planned, elapsed, completed);

      const s = settingsRef.current;
      if (completed && s.sound) playComplete(s.volume);

      if (m === "focus") {
        const nextCount = cycleRef.current + 1;
        setCycleCount(nextCount);
        const isLong = nextCount % s.cycleLength === 0;
        const next: Mode = isLong ? "long" : "short";
        if (completed) {
          notify(
            isLong ? "Long break earned 🎉" : "Focus complete",
            isLong ? "Great work — take a proper rest." : "Nice. Take five.",
          );
          if (isLong) {
            setCelebration((c) => c + 1);
            if (s.sound) playMilestone(s.volume);
          }
        }
        loadMode(next, completed && s.autoStartBreaks);
      } else {
        if (completed) notify("Break over", "Ready for another focus session?");
        loadMode("focus", completed && s.autoStartFocus);
      }
    },
    [loadMode, notify, recordSession, stopRaf],
  );

  // Keep the completion handler current without touching the ref during render.
  useEffect(() => {
    onCompleteRef.current = () => advance(true);
  }, [advance]);

  const restart = useCallback(() => {
    const dur = durationOf(modeRef.current, settingsRef.current) * 1000;
    stopRaf();
    remainingMsRef.current = dur;
    totalMsRef.current = dur;
    setTotalMs(dur);
    progressRef.current = 0;
    lastLabelRef.current = -1;
    setRemainingLabel(Math.round(dur / 1000));
    setPhase("idle");
  }, [stopRaf]);

  const skip = useCallback(() => {
    if (settingsRef.current.sound) playTick(settingsRef.current.volume);
    advance(false);
  }, [advance]);

  const switchMode = useCallback(
    (m: Mode) => {
      if (m === modeRef.current && phase === "idle") return;
      loadMode(m, false);
    },
    [loadMode, phase],
  );

  // Recompute duration if the active (idle) mode's setting changes.
  useEffect(() => {
    if (phase !== "idle") return;
    const dur = durationOf(modeRef.current, settings) * 1000;
    remainingMsRef.current = dur;
    totalMsRef.current = dur;
    setTotalMs(dur);
    setRemainingLabel(Math.round(dur / 1000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.focusMin, settings.shortMin, settings.longMin]);

  useEffect(() => () => stopRaf(), [stopRaf]);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }));
  }, []);
  const resetSettings = useCallback(
    () => setSettingsState(DEFAULT_SETTINGS),
    [],
  );
  const clearStats = useCallback(() => {
    setSessions([]);
    void clearSessions();
  }, []);

  const exportBackup = useCallback(() => {
    try {
      const backup = buildBackup(
        settingsRef.current,
        sessionsRef.current,
        new Date().toISOString(),
      );
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `focus-timer-backup-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* non-fatal */
    }
  }, []);

  const importBackup = useCallback(async (json: unknown) => {
    const parsed = parseBackup(json); // throws on invalid shape
    // Merge with existing history, de-duplicating by timestamp, newest wins.
    const merged = new Map<string, SessionRecord>();
    for (const s of sessionsRef.current) merged.set(s.at, s);
    for (const s of parsed.sessions) merged.set(s.at, s);
    const next = [...merged.values()].sort((a, b) =>
      a.at < b.at ? -1 : a.at > b.at ? 1 : 0,
    );
    setSessions(next);
    await replaceSessions(next);
    if (parsed.settings) {
      setSettingsState((prev) => ({ ...prev, ...parsed.settings }));
    }
    return parsed.sessions.length;
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      settings,
      setSettings,
      resetSettings,
      sessions,
      clearStats,
      exportBackup,
      importBackup,
      mode,
      phase,
      cycleCount,
      progressRef,
      remainingMsRef,
      remainingLabel,
      totalMs,
      start,
      pause,
      resume,
      restart,
      skip,
      switchMode,
      celebration,
      hydrated,
    }),
    [
      settings,
      setSettings,
      resetSettings,
      sessions,
      clearStats,
      exportBackup,
      importBackup,
      mode,
      phase,
      cycleCount,
      remainingLabel,
      totalMs,
      start,
      pause,
      resume,
      restart,
      skip,
      switchMode,
      celebration,
      hydrated,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFocus(): StoreValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFocus must be used within FocusStoreProvider");
  return ctx;
}
