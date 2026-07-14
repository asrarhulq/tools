/**
 * ── Beam Designer & Structural Analysis — domain model ──────────────────────
 * Framework-free, serializable types. Solver units are strict SI base:
 * metres (m), newtons (N), newton-metres (N·m), pascals (Pa), m², m⁴. The UI
 * converts to the display system (SI/metric/imperial). One consistent internal
 * unit system is what keeps the beam physics correct.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type SupportType = "pin" | "roller" | "fixed" | "spring";

/** A support at a position along the beam (x in metres from the left end). */
export interface Support {
  id: string;
  x: number;
  type: SupportType;
  /** Spring stiffness, N/m (vertical), when type = "spring". */
  springK?: number;
}

/** An internal hinge (moment release) at position x. */
export interface Hinge {
  id: string;
  x: number;
}

export type LoadType =
  | "point" // concentrated force, N (down negative)
  | "moment" // concentrated moment, N·m
  | "udl" // uniform distributed, N/m over [x, x+length]
  | "triangular" // linearly varying 0→w2 over the span
  | "trapezoidal"; // linearly varying w1→w2 over the span

export interface Load {
  id: string;
  type: LoadType;
  /** Start position, m. */
  x: number;
  /** Span length for distributed loads, m (ignored for point/moment). */
  length: number;
  /** Magnitude: N for point (signed, down = −), N·m for moment, N/m for w1. */
  magnitude: number;
  /** Second intensity (N/m) for trapezoidal/triangular end. */
  magnitude2?: number;
  /** Which load case this belongs to (index). */
  caseId: string;
}

export interface LoadCase {
  id: string;
  name: string;
}

export interface Material {
  id: string;
  name: string;
  /** Young's modulus, Pa. */
  E: number;
  /** Poisson ratio. */
  nu: number;
  /** Yield strength, Pa. */
  yield: number;
  /** Density, kg/m³. */
  density: number;
  /** Thermal expansion, 1/°C. */
  alpha: number;
  /** Cost per kg (display currency). */
  cost: number;
}

export type SectionType =
  "rectangle" | "circle" | "tube" | "i-beam" | "channel" | "angle" | "t-beam";

/** Cross-section defined by type + dimensions (m). Derived props computed. */
export interface Section {
  type: SectionType;
  /** Generic dimension bag (m); interpreted per type. */
  dims: Record<string, number>;
}

/** Derived section properties (SI). */
export interface SectionProps {
  area: number; // m²
  I: number; // second moment of area about bending axis, m⁴
  S: number; // section modulus, m³
  c: number; // distance to extreme fiber, m
  r: number; // radius of gyration, m
}

export interface Beam {
  schemaVersion: number;
  name: string;
  /** Total beam length, m. */
  length: number;
  supports: Support[];
  hinges: Hinge[];
  loads: Load[];
  loadCases: LoadCase[];
  material: Material;
  section: Section;
}

export type UnitSystem = "si" | "metric" | "imperial";

// ── Analysis results ─────────────────────────────────────────────────────────

/** Sampled diagram: x positions (m) with the field value at each. */
export interface Diagram {
  x: number[];
  y: number[];
  /** Index + value of the extreme (max |y|). */
  maxIndex: number;
  maxValue: number;
  minValue: number;
}

export interface SupportReaction {
  supportId: string;
  x: number;
  /** Vertical reaction, N (up positive). */
  Fy: number;
  /** Moment reaction, N·m (fixed supports). */
  M: number;
}

export interface BeamResult {
  solved: boolean;
  stable: boolean;
  reactions: SupportReaction[];
  shear: Diagram; // N
  moment: Diagram; // N·m
  slope: Diagram; // rad
  deflection: Diagram; // m
  bendingStress: Diagram; // Pa
  maxShear: number;
  maxMoment: number;
  maxDeflection: number; // signed peak (largest magnitude)
  maxSlope: number;
  maxBendingStress: number; // Pa
  maxShearStress: number; // Pa
  maxVonMises: number; // Pa
  factorOfSafety: number;
  /** Euler buckling critical load (if treated as a column), N. */
  bucklingLoad: number;
  /** First natural frequency estimate, Hz. */
  naturalFrequency: number;
  /** Total mass, kg. */
  mass: number;
  /** Material cost estimate. */
  cost: number;
  diagnostics: Diagnostic[];
}

export interface Diagnostic {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
}

/** Envelope across multiple load cases. */
export interface Envelope {
  x: number[];
  shearMax: number[];
  shearMin: number[];
  momentMax: number[];
  momentMin: number[];
}
