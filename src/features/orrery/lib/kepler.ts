import type { HeliocentricPosition, OrbitalElements } from "../types";
import { daysSinceJ2000 } from "./julian-date";

/**
 * Two-body Keplerian orbit propagation. This is the same model every
 * "orrery" teaching instrument has used since the 18th century: each body
 * moves on a fixed ellipse governed only by its primary's gravity, ignoring
 * the pull of every other body. Real planetary motion has small
 * perturbations from mutual gravity that this doesn't capture (that needs a
 * full n-body integration or a published ephemeris like JPL's DE440) — but
 * the two-body solution is exact for the shape and phase of each orbit, and
 * is what makes the relative motion you see here (Mercury lapping the Sun
 * every 88 days, Neptune barely creeping) actually correct, not just
 * decorative circles at made-up speeds.
 */

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const KEPLER_TOLERANCE = 1e-8;
const KEPLER_MAX_ITERATIONS = 50;

/** Solves Kepler's equation M = E - e·sin(E) for the eccentric anomaly E, via Newton-Raphson. */
export function solveEccentricAnomaly(
  meanAnomalyRad: number,
  eccentricity: number,
): number {
  const m = ((meanAnomalyRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  let e = eccentricity < 0.8 ? m : Math.PI;
  for (let i = 0; i < KEPLER_MAX_ITERATIONS; i++) {
    const delta =
      (e - eccentricity * Math.sin(e) - m) / (1 - eccentricity * Math.cos(e));
    e -= delta;
    if (Math.abs(delta) < KEPLER_TOLERANCE) break;
  }
  return e;
}

/**
 * Position of a body on its orbit at Julian Date `jd`, relative to its
 * focus (the Sun, or a parent planet for a moon) in an ecliptic-aligned
 * frame: x toward the reference-plane origin direction, y 90° ahead in the
 * orbital sense before inclination is applied, z out of the reference plane.
 */
export function heliocentricPosition(
  elements: OrbitalElements,
  jd: number,
): HeliocentricPosition {
  const {
    semiMajorAxisAu: a,
    eccentricity: e,
    inclinationDeg,
    ascendingNodeDeg,
    argPeriapsisDeg,
    meanAnomalyAtEpochDeg,
    periodDays,
  } = elements;

  const meanMotionDegPerDay = 360 / periodDays;
  const meanAnomalyDeg =
    meanAnomalyAtEpochDeg + meanMotionDegPerDay * daysSinceJ2000(jd);
  const meanAnomalyRad =
    ((meanAnomalyDeg % 360) * DEG2RAD + 2 * Math.PI) % (2 * Math.PI);

  const E = solveEccentricAnomaly(meanAnomalyRad, e);

  // True anomaly from eccentric anomaly.
  const trueAnomalyRad =
    2 *
    Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2),
    );

  const radiusAu = a * (1 - e * Math.cos(E));

  // Position in the orbital plane (periapsis along +x').
  const xOrbit = radiusAu * Math.cos(trueAnomalyRad);
  const yOrbit = radiusAu * Math.sin(trueAnomalyRad);

  // Rotate by argument of periapsis, inclination, then ascending node to
  // land in the reference (ecliptic) frame.
  const w = argPeriapsisDeg * DEG2RAD;
  const i = inclinationDeg * DEG2RAD;
  const om = ascendingNodeDeg * DEG2RAD;

  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  const cosOm = Math.cos(om);
  const sinOm = Math.sin(om);

  // Standard orbital-elements-to-Cartesian rotation (perifocal -> ecliptic).
  const x1 = xOrbit * cosW - yOrbit * sinW;
  const y1 = xOrbit * sinW + yOrbit * cosW;

  const x2 = x1;
  const y2 = y1 * cosI;
  const z2 = y1 * sinI;

  const x = x2 * cosOm - y2 * sinOm;
  const y = x2 * sinOm + y2 * cosOm;
  const z = z2;

  return {
    x,
    y,
    z,
    trueAnomalyDeg: trueAnomalyRad * RAD2DEG,
    radiusAu,
  };
}

/** Samples a full orbit ellipse (in AU, same frame as `heliocentricPosition`) for drawing the orbit path. */
export function sampleOrbitPath(
  elements: OrbitalElements,
  segments = 256,
): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = [];
  // Sample uniformly in true anomaly (not time) so the drawn ellipse is
  // geometrically smooth regardless of eccentricity.
  const w = elements.argPeriapsisDeg * DEG2RAD;
  const i = elements.inclinationDeg * DEG2RAD;
  const om = elements.ascendingNodeDeg * DEG2RAD;
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  const cosOm = Math.cos(om);
  const sinOm = Math.sin(om);
  const a = elements.semiMajorAxisAu;
  const e = elements.eccentricity;

  for (let s = 0; s <= segments; s++) {
    const nu = (s / segments) * 2 * Math.PI;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
    const xOrbit = r * Math.cos(nu);
    const yOrbit = r * Math.sin(nu);

    const x1 = xOrbit * cosW - yOrbit * sinW;
    const y1 = xOrbit * sinW + yOrbit * cosW;
    const x2 = x1;
    const y2 = y1 * cosI;
    const z2 = y1 * sinI;
    const x = x2 * cosOm - y2 * sinOm;
    const y = x2 * sinOm + y2 * cosOm;

    points.push({ x, y, z: z2 });
  }
  return points;
}
