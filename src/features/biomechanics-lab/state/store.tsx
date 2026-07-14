"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ActivityId,
  BodyParams,
  UnitSystem,
  VisualizationMode,
} from "../types";
import { DEFAULT_BODY } from "../lib/anthropometry";

/**
 * Central store for the Biomechanics Lab: body/scenario parameters, the selected
 * activity, playback state (phase 0..1, playing, speed), the visualization mode,
 * unit system, and comparison toggle. Kept UI-free so the analysis engine, the
 * 3D renderer, and the report all read the same state. A screenshot bridge lets
 * the report capture the current 3D view.
 */

interface StoreValue {
  body: BodyParams;
  activity: ActivityId;
  mode: VisualizationMode;
  units: UnitSystem;
  phase: number;
  playing: boolean;
  playbackSpeed: number;
  /** Whether playback loops at the end of the cycle. */
  loop: boolean;
  /** Comparison overlay: a second scenario (e.g. incorrect technique). */
  comparison: boolean;
  screenshotRef: React.RefObject<(() => string | null) | null>;

  setBody: (patch: Partial<BodyParams>) => void;
  setActivity: (a: ActivityId) => void;
  setMode: (m: VisualizationMode) => void;
  setUnits: (u: UnitSystem) => void;
  setPhase: (p: number) => void;
  /** Advance phase by dt seconds worth of playback (called by the loop). */
  advance: (deltaPhase: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  togglePlay: () => void;
  setPlaybackSpeed: (s: number) => void;
  toggleLoop: () => void;
  stepFrame: (dir: 1 | -1) => void;
  toggleComparison: () => void;
  reset: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

const FRAME_STEP = 1 / 60; // 60-frame cycle for frame-by-frame stepping

export function BiomechStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [body, setBodyState] = useState<BodyParams>(DEFAULT_BODY);
  const [activity, setActivityState] = useState<ActivityId>("run");
  const [mode, setMode] = useState<VisualizationMode>("skeleton");
  const [units, setUnits] = useState<UnitSystem>("si");
  const [phase, setPhaseState] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loop, setLoop] = useState(true);
  const [comparison, setComparison] = useState(false);
  const screenshotRef = useRef<(() => string | null) | null>(null);

  const setBody = useCallback((patch: Partial<BodyParams>) => {
    setBodyState((b) => ({ ...b, ...patch }));
  }, []);

  const setActivity = useCallback((a: ActivityId) => {
    setActivityState(a);
    setPhaseState(0);
  }, []);

  const setPhase = useCallback((p: number) => {
    setPhaseState(((p % 1) + 1) % 1);
  }, []);

  const stepFrame = useCallback((dir: 1 | -1) => {
    setPlaying(false);
    setPhaseState((p) => (((p + dir * FRAME_STEP) % 1) + 1) % 1);
  }, []);

  // Advance phase; if not looping, stop cleanly at the end of the cycle.
  const advance = useCallback(
    (deltaPhase: number) => {
      setPhaseState((p) => {
        const next = p + deltaPhase;
        if (next >= 1) {
          if (loop) return next % 1;
          setPlaying(false);
          return 1 - 1e-6;
        }
        return next;
      });
    },
    [loop],
  );

  const value = useMemo<StoreValue>(
    () => ({
      body,
      activity,
      mode,
      units,
      phase,
      playing,
      playbackSpeed,
      loop,
      comparison,
      screenshotRef,
      setBody,
      setActivity,
      setMode,
      setUnits,
      setPhase,
      advance,
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      stop: () => {
        setPlaying(false);
        setPhaseState(0);
      },
      togglePlay: () => setPlaying((p) => !p),
      setPlaybackSpeed,
      toggleLoop: () => setLoop((l) => !l),
      stepFrame,
      toggleComparison: () => setComparison((c) => !c),
      reset: () => {
        setBodyState(DEFAULT_BODY);
        setPhaseState(0);
      },
    }),
    [
      body,
      activity,
      mode,
      units,
      phase,
      playing,
      playbackSpeed,
      loop,
      comparison,
      setBody,
      setActivity,
      setPhase,
      advance,
      stepFrame,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBiomech(): StoreValue {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useBiomech must be used within BiomechStoreProvider");
  return ctx;
}
