"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEFAULT_SPEED_INDEX, SPEED_PRESETS } from "../config";
import { dateToJulianDate } from "../lib/julian-date";
import type { CameraMode, ScaleMode } from "../types";

export type InspectorTab = "info" | "bodies" | "sky" | "settings" | "tour";

/**
 * Central store for Orrery: which bodies are shown, the camera/scale modes,
 * and the simulation clock. The clock is split in two, the same fix the
 * biomechanics lab's playback loop uses (see its `viewer/viewer.tsx`):
 * `jdRef` is a plain ref, mutated every animation frame by the in-Canvas
 * clock driver and read directly by each planet's own `useFrame` for smooth
 * 60fps motion — bypassing React entirely on the hot path. `displayJd` is
 * the same value committed to reactive state at a throttled rate, purely so
 * non-3D UI (the date readout, the date picker) can read it without forcing
 * a re-render on every frame.
 */
interface StoreValue {
  displayJd: number;
  playing: boolean;
  speedIndex: number;
  scaleMode: ScaleMode;
  cameraMode: CameraMode;
  selectedBodyId: string | null;
  showOrbits: boolean;
  showLabels: boolean;
  showBelt: boolean;
  showMoons: boolean;
  showHabitableZone: boolean;
  activeTab: InspectorTab;
  jdRef: React.RefObject<number>;
  screenshotRef: React.RefObject<(() => string | null) | null>;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeedIndex: (i: number) => void;
  setScaleMode: (m: ScaleMode) => void;
  setCameraMode: (m: CameraMode) => void;
  selectBody: (id: string | null) => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
  toggleBelt: () => void;
  toggleMoons: () => void;
  toggleHabitableZone: () => void;
  jumpToDate: (date: Date) => void;
  jumpToNow: () => void;
  setActiveTab: (t: InspectorTab) => void;
  commitDisplayJd: (jd: number) => void;
}

const Ctx = createContext<StoreValue | null>(null);

export function OrreryProvider({ children }: { children: React.ReactNode }) {
  const [displayJd, setDisplayJd] = useState(() =>
    dateToJulianDate(new Date()),
  );
  const jdRef = useRef(displayJd);
  const [playing, setPlaying] = useState(true);
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED_INDEX);
  const [scaleMode, setScaleMode] = useState<ScaleMode>("visual");
  const [cameraMode, setCameraMode] = useState<CameraMode>("overview");
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>("earth");
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showBelt, setShowBelt] = useState(true);
  const [showMoons, setShowMoons] = useState(true);
  const [showHabitableZone, setShowHabitableZone] = useState(false);
  const [activeTab, setActiveTab] = useState<InspectorTab>("info");
  const screenshotRef = useRef<(() => string | null) | null>(null);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const togglePlay = useCallback(() => setPlaying((p) => !p), []);

  const selectBody = useCallback((id: string | null) => {
    setSelectedBodyId(id);
    if (id) setCameraMode("follow");
  }, []);

  const toggleOrbits = useCallback(() => setShowOrbits((v) => !v), []);
  const toggleLabels = useCallback(() => setShowLabels((v) => !v), []);
  const toggleBelt = useCallback(() => setShowBelt((v) => !v), []);
  const toggleMoons = useCallback(() => setShowMoons((v) => !v), []);
  const toggleHabitableZone = useCallback(
    () => setShowHabitableZone((v) => !v),
    [],
  );

  const jumpToDate = useCallback((date: Date) => {
    const jd = dateToJulianDate(date);
    jdRef.current = jd;
    setDisplayJd(jd);
  }, []);

  const jumpToNow = useCallback(() => {
    jumpToDate(new Date());
  }, [jumpToDate]);

  const commitDisplayJd = useCallback((jd: number) => {
    setDisplayJd(jd);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      displayJd,
      playing,
      speedIndex,
      scaleMode,
      cameraMode,
      selectedBodyId,
      showOrbits,
      showLabels,
      showBelt,
      showMoons,
      showHabitableZone,
      activeTab,
      jdRef,
      screenshotRef,
      play,
      pause,
      togglePlay,
      setSpeedIndex,
      setScaleMode,
      setCameraMode,
      selectBody,
      toggleOrbits,
      toggleLabels,
      toggleBelt,
      toggleMoons,
      toggleHabitableZone,
      jumpToDate,
      jumpToNow,
      setActiveTab,
      commitDisplayJd,
    }),
    [
      displayJd,
      playing,
      speedIndex,
      scaleMode,
      cameraMode,
      selectedBodyId,
      showOrbits,
      showLabels,
      showBelt,
      showMoons,
      showHabitableZone,
      activeTab,
      play,
      pause,
      togglePlay,
      selectBody,
      toggleOrbits,
      toggleLabels,
      toggleBelt,
      toggleMoons,
      toggleHabitableZone,
      jumpToDate,
      jumpToNow,
      commitDisplayJd,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrrery(): StoreValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrrery must be used within OrreryProvider");
  return ctx;
}

export function currentSpeedDaysPerSecond(speedIndex: number): number {
  return (
    SPEED_PRESETS[speedIndex]?.daysPerSecond ??
    SPEED_PRESETS[DEFAULT_SPEED_INDEX]!.daysPerSecond
  );
}
