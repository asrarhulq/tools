/**
 * Domain model for Orrery. Orbital elements are heliocentric (or
 * planet-centric, for moons), osculating at the J2000.0 epoch — a two-body
 * Keplerian approximation, not a full perturbation ephemeris (see
 * `lib/kepler.ts` for what that trade-off means in practice).
 */

export interface OrbitalElements {
  /** Semi-major axis, in AU (or planet-radii-independent km for moons). */
  semiMajorAxisAu: number;
  /** Orbital eccentricity (0 = circle, <1 = ellipse). */
  eccentricity: number;
  /** Inclination to the reference plane, degrees. */
  inclinationDeg: number;
  /** Longitude of the ascending node, degrees. */
  ascendingNodeDeg: number;
  /** Argument of periapsis, degrees. */
  argPeriapsisDeg: number;
  /** Mean anomaly at epoch (J2000.0), degrees. */
  meanAnomalyAtEpochDeg: number;
  /** Sidereal orbital period, in Earth days. */
  periodDays: number;
}

export type BodyKind = "star" | "planet" | "dwarf-planet" | "moon" | "belt";

export interface PhysicalData {
  radiusKm: number;
  massKg: number;
  /** Sidereal rotation period, hours. Negative = retrograde rotation. */
  rotationHours: number;
  axialTiltDeg: number;
  meanTempC: number;
  moonCount: number;
  gravityMs2: number;
  color: string;
  /** A few short, real facts shown in the info panel / tour mode. */
  facts: string[];
}

export interface CelestialBody {
  id: string;
  name: string;
  kind: BodyKind;
  /** `undefined` for bodies orbiting the Sun directly. */
  parentId?: string;
  elements: OrbitalElements;
  physical: PhysicalData;
  hasRings?: boolean;
}

export interface HeliocentricPosition {
  /** AU, ecliptic J2000 frame, Sun (or parent body) at origin. */
  x: number;
  y: number;
  z: number;
  /** True anomaly at this instant, degrees — useful for orbit-path drawing. */
  trueAnomalyDeg: number;
  /** Distance from the focus (Sun or parent), AU. */
  radiusAu: number;
}

export type ScaleMode = "visual" | "realistic";

export type CameraMode = "overview" | "free" | "follow" | "top-down";
