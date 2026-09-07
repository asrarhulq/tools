import type { CelestialBody } from "../types";
import { heliocentricPosition } from "./kepler";

const RAD2DEG = 180 / Math.PI;

export interface SkyTrackPoint {
  jd: number;
  /** Geocentric ecliptic longitude, degrees — unwrapped, so it can run past
   * 360° or below 0° instead of jumping when it wraps. */
  longitudeDeg: number;
}

/**
 * A planet's own orbit is always "forward" — mean anomaly only increases.
 * Retrograde motion isn't a property of the planet at all; it's what its
 * position looks like *projected onto Earth's sky* once Earth's own motion
 * is subtracted out. This is the exact observation (Mars periodically
 * reversing against the fixed stars) that the geocentric model needed
 * epicycles to explain and the heliocentric model explains for free — and
 * it falls straight out of the same two-body mechanics already driving the
 * 3D scene, just viewed from a different origin.
 */
export function computeSkyTrack(
  body: CelestialBody,
  earth: CelestialBody,
  centerJd: number,
  windowDays: number,
  samples: number,
): SkyTrackPoint[] {
  const points: SkyTrackPoint[] = [];
  let prevRaw: number | null = null;
  let unwrapped = 0;

  for (let i = 0; i <= samples; i++) {
    const jd = centerJd - windowDays / 2 + (i / samples) * windowDays;
    const earthPos = heliocentricPosition(earth.elements, jd);
    const bodyPos = heliocentricPosition(body.elements, jd);
    const dx = bodyPos.x - earthPos.x;
    const dy = bodyPos.y - earthPos.y;
    const raw = (Math.atan2(dy, dx) * RAD2DEG + 360) % 360;

    if (prevRaw === null) {
      unwrapped = raw;
    } else {
      let delta = raw - prevRaw;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      unwrapped += delta;
    }
    prevRaw = raw;
    points.push({ jd, longitudeDeg: unwrapped });
  }

  return points;
}

/** How long until Earth and `body` repeat their relative geometry — used to
 * size the sky-track window so it reliably spans one full retrograde loop
 * regardless of which planet is selected. */
export function synodicPeriodDays(
  bodyPeriodDays: number,
  earthPeriodDays: number,
): number {
  return Math.abs(1 / (1 / earthPeriodDays - 1 / bodyPeriodDays));
}
