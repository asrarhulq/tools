/**
 * ── STL Engineering Analyzer — domain model ─────────────────────────────────
 * All types are framework-free and serializable so the calculation modules can
 * run in a Web Worker today and move to WASM / a backend API later without any
 * change to the UI contract.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type Vec3 = readonly [number, number, number];

export type ModelFormat = "stl" | "obj" | "gltf" | "glb" | "step";

export const NATIVE_FORMATS: readonly ModelFormat[] = ["stl", "obj", "gltf", "glb"];
export const CONVERSION_FORMATS: readonly ModelFormat[] = ["step"];

/** Raw mesh handed to the analysis worker — plain typed arrays only. */
export interface RawMesh {
  /** Flat triangle vertex positions, length = 9 * triangleCount. */
  positions: Float32Array;
  /** Optional flat per-vertex normals (same length as positions). */
  normals?: Float32Array;
}

export type Unit = "mm" | "cm" | "in";

// ── Geometry ────────────────────────────────────────────────────────────────

export interface BoundingBox {
  min: Vec3;
  max: Vec3;
  /** Dimensions (max - min) in model units (mm). */
  size: Vec3;
  center: Vec3;
}

export interface MeshQuality {
  triangleCount: number;
  vertexCount: number;
  /** Unique vertices after welding coincident positions. */
  uniqueVertexCount: number;
  degenerateTriangles: number;
  /** 0–100 heuristic combining manifoldness, degeneracy, and aspect ratios. */
  score: number;
}

export interface Diagnostics {
  watertight: boolean;
  /** Edges shared by !=2 triangles. */
  nonManifoldEdges: number;
  /** Boundary edges (shared by exactly 1 triangle) → holes. */
  boundaryEdges: number;
  holes: number;
  /** Estimated min wall thickness in mm (sampled). */
  minWallThickness: number;
  thinFeatureCount: number;
  sharpEdgeCount: number;
  /** Fraction (0–1) of downward-facing area beyond the overhang threshold. */
  overhangArea: number;
}

export interface GeometryResult {
  boundingBox: BoundingBox;
  /** Signed mesh volume in mm³ (absolute value). */
  volume: number;
  surfaceArea: number;
  centerOfMass: Vec3;
  /** Principal axes (columns) from the inertia tensor. */
  principalAxes: readonly [Vec3, Vec3, Vec3];
  quality: MeshQuality;
  diagnostics: Diagnostics;
  /** 0–100, higher = more complex. */
  complexityScore: number;
  /** 0–100, higher = easier/safer to print. */
  printabilityScore: number;
}

// ── Materials ─────────────────────────────────────────────────────────────

export interface Material {
  id: string;
  name: string;
  /** g/cm³ */
  density: number;
  /** Young's modulus, MPa */
  youngsModulus: number;
  /** Yield strength, MPa */
  yieldStrength: number;
  /** Ultimate tensile strength, MPa */
  ultimateStrength: number;
  poissonRatio: number;
  /** Thermal expansion, µm/m·°C */
  thermalExpansion: number;
  /** Cost, currency per kg */
  costPerKg: number;
  /** True for user-created/edited materials. */
  custom?: boolean;
}

// ── Physics / stability ─────────────────────────────────────────────────────

export interface Force {
  id: string;
  /** Application point in model space (mm). */
  point: Vec3;
  /** Direction (need not be normalized). */
  direction: Vec3;
  /** Magnitude in newtons. */
  magnitude: number;
}

export interface Support {
  id: string;
  point: Vec3;
}

export interface StabilityResult {
  /** Mass in grams (from volume × density). */
  massGrams: number;
  centerOfGravity: Vec3;
  /** Convex-hull footprint pivot the object tips about, if any. */
  pivot: Vec3 | null;
  overturningTorque: number;
  restoringTorque: number;
  /** Ratio restoring/overturning; <1 ⇒ tips. */
  tippingThreshold: number;
  willTip: boolean;
  /** Human-readable orientation/support recommendation. */
  recommendation: string;
}

// ── FEA (approximate) ─────────────────────────────────────────────────────

export interface FeaResult {
  /** Per-vertex von Mises stress estimate (MPa), indexed like unique vertices. */
  vertexStress: Float32Array;
  maxStress: number;
  maxDisplacement: number;
  estimatedStrain: number;
  safetyFactor: number;
  stressConcentrations: readonly Vec3[];
  /** Always approximate — surfaced in the UI. */
  method: "linear-beam-approximation";
}

// ── 3D printing ─────────────────────────────────────────────────────────────

export type InfillPattern = "grid" | "gyroid" | "honeycomb" | "triangles";

export interface PrintSettings {
  infillPercent: number;
  infillPattern: InfillPattern;
  layerHeight: number;
  nozzleDiameter: number;
  wallCount: number;
  topBottomLayers: number;
  printSpeed: number;
  supports: boolean;
  brimRaft: "none" | "brim" | "raft";
}

export interface PrintEstimate {
  printTimeHours: number;
  filamentLengthM: number;
  materialWeightGrams: number;
  materialCost: number;
  electricityCost: number;
  totalCost: number;
  co2Grams: number;
  difficulty: "easy" | "moderate" | "hard";
  failureRisk: number;
  warpRisk: number;
  supportRequired: boolean;
}

export interface PrintRecommendation {
  bestMaterialId: string;
  orientation: string;
  infillPercent: number;
  layerHeight: number;
  supportStrategy: string;
}

// ── Aggregate analysis ─────────────────────────────────────────────────────

export interface AnalysisResult {
  geometry: GeometryResult;
  /** Round-trip of the raw mesh for rendering overlays without re-parsing. */
  meshStats: { triangleCount: number; vertexCount: number };
}

export interface LoadedModel {
  name: string;
  format: ModelFormat;
  /** Object URL for the source file (revoked on replace). */
  url: string;
  sizeBytes: number;
}
