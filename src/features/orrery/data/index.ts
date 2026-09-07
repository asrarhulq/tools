import type { CelestialBody } from "../types";
import { MOONS } from "./moons";
import { PLANETS, SUN } from "./planets";

/**
 * The Sun never actually needs orbital elements (it's the fixed heliocentric
 * origin, rendered by the dedicated `scene/sun.tsx`, never run through
 * `computeScenePosition`) — but giving it a well-formed, harmless dummy set
 * lets it live in one unified `CelestialBody[]` list alongside everything
 * else, so search, the info panel, and the camera rig all have one lookup
 * table instead of a special case at every call site.
 */
const SUN_BODY: CelestialBody = {
  ...SUN,
  elements: {
    semiMajorAxisAu: 0,
    eccentricity: 0,
    inclinationDeg: 0,
    ascendingNodeDeg: 0,
    argPeriapsisDeg: 0,
    meanAnomalyAtEpochDeg: 0,
    periodDays: 365.25,
  },
};

export const ALL_BODIES: readonly CelestialBody[] = [
  SUN_BODY,
  ...PLANETS,
  ...MOONS,
];
export const BODY_BY_ID: ReadonlyMap<string, CelestialBody> = new Map(
  ALL_BODIES.map((b) => [b.id, b]),
);
export const ORBITING_BODIES: readonly CelestialBody[] = ALL_BODIES.filter(
  (b) => b.kind !== "star",
);
