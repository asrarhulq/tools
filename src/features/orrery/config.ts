/**
 * Tuning constants. Distances inside the 3D scene are in "scene units" — one
 * scene unit is deliberately NOT one AU, because true-to-scale distances make
 * the inner planets invisibly close to the Sun next to the outer ones (see
 * `lib/scale.ts` for the two scale modes this trades off between).
 */

export const AU_KM = 149_597_870.7;
export const SUN_RADIUS_KM = 696_340;
export const EARTH_RADIUS_KM = 6_371;
export const SPEED_OF_LIGHT_KM_S = 299_792.458;

/** Presets for the time-speed control, in simulated days per real second. */
export const SPEED_PRESETS = [
  { label: "Real time", daysPerSecond: 1 / 86_400 },
  { label: "1 hour/s", daysPerSecond: 1 / 24 },
  { label: "1 day/s", daysPerSecond: 1 },
  { label: "1 week/s", daysPerSecond: 7 },
  { label: "1 month/s", daysPerSecond: 30 },
  { label: "1 year/s", daysPerSecond: 365.25 },
  { label: "10 years/s", daysPerSecond: 3652.5 },
] as const;

export const DEFAULT_SPEED_INDEX = 3;

/**
 * The Sun's conservative circumstellar habitable zone — the AU band where a
 * rocky planet could plausibly hold liquid surface water (Kopparapu et al.
 * 2013 conservative estimates). Earth (1 AU) sits well inside it; Venus and
 * Mars sit just outside either edge.
 */
export const HABITABLE_ZONE_AU = { inner: 0.95, outer: 1.67 } as const;

/** How often (Hz) the hot simulation clock commits to reactive UI state. */
export const CLOCK_UI_HZ = 6;

export const STUDY_PALETTE = {
  background: "#03040a",
  panel: "#0a0e1a",
  panelAlt: "#0f1526",
  border: "#1e2740",
  text: "#e6ecff",
  muted: "#8a95b8",
  accent: "#7dd3fc",
  accentDim: "#3a6b82",
  gold: "#f5c26b",
  danger: "#f47174",
} as const;
