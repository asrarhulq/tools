/**
 * ── Truss Analysis Studio — domain model ────────────────────────────────────
 * Framework-free, serializable types for a planar (2D) truss. Internal units
 * are strictly SI base for the solver: metres (m), newtons (N), pascals (Pa),
 * square metres (m²). The UI converts to/from the user's chosen display units
 * (SI: N/mm/MPa, or Imperial: lb/in/ksi). Keeping the solver in one consistent
 * unit system is what keeps the physics correct.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type SupportType = "none" | "pin" | "roller-x" | "roller-y" | "fixed";

/** A joint. Position in metres. */
export interface Node {
  id: string;
  x: number;
  y: number;
  support: SupportType;
  /** For a roller, the incline of its rolling surface (deg from horizontal). */
  rollerAngleDeg?: number;
}

/** A two-force member connecting two nodes. */
export interface Member {
  id: string;
  from: string; // node id
  to: string; // node id
  /** Cross-sectional area, m². */
  area: number;
  /** Material id (into MATERIALS). */
  materialId: string;
}

/** A concentrated load applied at a node, components in newtons. */
export interface Load {
  id: string;
  nodeId: string;
  fx: number;
  fy: number;
}

export interface Material {
  id: string;
  name: string;
  /** Young's modulus, Pa. */
  E: number;
  /** Yield strength, Pa. */
  yield: number;
  /** Density, kg/m³. */
  density: number;
}

export interface Truss {
  schemaVersion: number;
  name: string;
  nodes: Node[];
  members: Member[];
  loads: Load[];
  /** Default material applied to new members. */
  defaultMaterialId: string;
  /** Default cross-sectional area for new members, m². */
  defaultArea: number;
}

export type UnitSystem = "si" | "imperial";

// ── Analysis results ─────────────────────────────────────────────────────────

export interface MemberResult {
  memberId: string;
  /** Axial force, N. Positive = tension, negative = compression. */
  axialForce: number;
  /** Axial stress, Pa (signed). */
  stress: number;
  /** Member length, m. */
  length: number;
  /** |stress| / yield → utilization 0..1+. */
  utilization: number;
  /** yield / |stress|, capped; ∞ shown when unloaded. */
  factorOfSafety: number;
  state: "tension" | "compression" | "zero";
  /** Euler critical buckling load, N (compression members). */
  bucklingLoad: number;
  /** FoS against buckling (compression only), else ∞. */
  bucklingFoS: number;
}

export interface NodeResult {
  nodeId: string;
  /** Displacement, m. */
  ux: number;
  uy: number;
  /** Reaction force at a support, N (0 if free). */
  rx: number;
  ry: number;
}

export interface Diagnostic {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  /** Optional node/member ids the diagnostic refers to. */
  refs?: string[];
}

export interface AnalysisResult {
  solved: boolean;
  members: MemberResult[];
  nodes: NodeResult[];
  diagnostics: Diagnostic[];
  /** Degrees of static (in)determinacy: m + r − 2j. */
  determinacy: number;
  /** Global stiffness condition (stable if not singular). */
  stable: boolean;
  /** Max nodal displacement magnitude, m. */
  maxDisplacement: number;
  /** Governing (minimum) factor of safety across members. */
  minFoS: number;
  /** Total member mass, kg. */
  totalMass: number;
  /** 0–100 structural efficiency (stiffness-to-weight, normalized). */
  efficiencyScore: number;
  /** 0–100 safety score derived from minFoS. */
  safetyScore: number;
}
