/**
 * ── Additive Manufacturing Analyzer — domain model ─────────────────────────
 * All types are framework-free and serializable so the calculation modules can
 * run in a Web Worker today and move to WASM / a backend API later without any
 * change to the UI contract.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type Vec3 = readonly [number, number, number];

export type ModelFormat = "stl" | "obj" | "gltf" | "glb" | "step";

export const NATIVE_FORMATS: readonly ModelFormat[] = [
  "stl",
  "obj",
  "gltf",
  "glb",
];
export const CONVERSION_FORMATS: readonly ModelFormat[] = ["step"];

/** Raw mesh handed to the analysis worker — plain typed arrays only. */
export interface RawMesh {
  /** Flat triangle vertex positions, length = 9 * triangleCount. */
  positions: Float32Array;
  /** Optional flat per-vertex normals (same length as positions). */
  normals?: Float32Array;
}

export type Unit = "mm" | "cm" | "in";

// ── Orientation / build plate ────────────────────────────────────────────────

/**
 * Part orientation on the build plate. Euler angles are applied in X→Y→Z order
 * (degrees). `dropToPlate` translates the rotated part so its lowest point sits
 * on z = 0 (the build surface). Everything downstream — mass properties,
 * stability, FEA, printing — is computed on the mesh *after* this transform.
 */
export interface Orientation {
  /** Rotation about the X axis, degrees. */
  rx: number;
  /** Rotation about the Y axis, degrees. */
  ry: number;
  /** Rotation about the Z axis, degrees. */
  rz: number;
}

export const IDENTITY_ORIENTATION: Orientation = { rx: 0, ry: 0, rz: 0 };

/** Contact region where the oriented part meets the build plate (z ≈ 0). */
export interface BuildPlateContact {
  /** Number of triangles lying on/near the plate. */
  faceCount: number;
  /** Projected contact area on the plate, mm². */
  area: number;
  /** Convex-hull footprint of the contact, as XY points (mm). */
  footprint: readonly (readonly [number, number])[];
  /** Vertices (model space, oriented) touching the plate. */
  contactPoints: readonly Vec3[];
}

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

/**
 * As-printed ("effective") material properties, derived from a base filament
 * plus the current print settings. FDM parts are porous (infill) and
 * anisotropic (weak layer adhesion in the build/Z direction), so the numbers
 * that feed FEA and strength estimates differ from the solid datasheet values.
 */
export interface EffectiveMaterial {
  /** Volume fraction of solid polymer (walls + infill), 0–1. */
  solidFraction: number;
  /** Effective Young's modulus in the layer (XY) plane, MPa. */
  modulusXY: number;
  /** Effective Young's modulus in the build (Z) direction, MPa. */
  modulusZ: number;
  /** Effective yield strength in the layer (XY) plane, MPa. */
  strengthXY: number;
  /** Effective yield strength across layers (Z / interlayer), MPa. */
  strengthZ: number;
  /** Effective (as-printed, porous) density, g/cm³. */
  density: number;
  /** Z/XY strength ratio (1 = isotropic; lower = weaker between layers). */
  anisotropy: number;
}

// ── Physics / stability ─────────────────────────────────────────────────────

export interface Force {
  id: string;
  /** Human-readable label, e.g. "Load A". */
  name: string;
  /** Application point in oriented model space (mm). */
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

/**
 * Where the part is held during the FEA load case. The build-plate and
 * bottom-face modes are resolved automatically from the oriented geometry; the
 * face modes fix nodes near a chosen point/height.
 */
export type ConstraintMode =
  | "build-plate" // everything touching the plate (z ≈ 0) is fixed
  | "bottom-face" // the lowest flat face is fixed
  | "selected-face" // nodes near a user-picked point are fixed
  | "custom"; // an explicit set of fixed points

export interface Constraint {
  mode: ConstraintMode;
  /** For selected/custom modes: the anchor point(s) in oriented model space. */
  points?: readonly Vec3[];
  /** Capture radius (mm) around each point for selected-face mode. */
  radius?: number;
}

export interface StabilityResult {
  /** Mass in grams (from volume × density). */
  massGrams: number;
  centerOfGravity: Vec3;
  /** Convex-hull support polygon on the plate (XY footprint, mm). */
  supportPolygon: readonly (readonly [number, number])[];
  /** Vertical projection of the CoG onto the plate (XY, mm). */
  cogProjection: readonly [number, number];
  /** Whether the CoG projection lies inside the support polygon. */
  cogInsidePolygon: boolean;
  /** The two endpoints of the edge the part would tip over, if any. */
  pivotEdge: readonly [Vec3, Vec3] | null;
  /** Midpoint of the pivot edge (for the viewer marker). */
  pivot: Vec3 | null;
  /** Unit XY direction the part tips toward. */
  tipDirection: readonly [number, number] | null;
  /** Perpendicular distance (mm) from the CoG projection to the nearest edge. */
  stabilityMargin: number;
  overturningTorque: number;
  restoringTorque: number;
  /** Factor of safety against tipping (restoring / overturning); <1 ⇒ tips. */
  tippingThreshold: number;
  willTip: boolean;
  /** Human-readable orientation/support recommendation. */
  recommendation: string;
}

// ── FEA (voxel-hex linear elastic FEM) ──────────────────────────────────────

/**
 * A structured voxel (hexahedral) FE grid fitted to the part's bounding box.
 * The solver fills only voxels whose centre lies inside the solid, assembles a
 * linear-elastic stiffness matrix over the shared node grid, applies the load
 * case, and solves K·u = f. Results are sampled back onto the render mesh's
 * triangle-soup vertices for the heat map (mapped by 3D position, not by index).
 */
export interface FeaResult {
  /**
   * Per-render-vertex von Mises stress (MPa), one entry per triangle-soup
   * vertex position, so the viewer can set a color attribute directly.
   */
  vertexStress: Float32Array;
  /** Per-render-vertex displacement magnitude (mm), aligned with vertexStress. */
  vertexDisplacement: Float32Array;
  /** Peak von Mises stress in the field (MPa). */
  maxStress: number;
  /** Peak nodal displacement magnitude (mm). */
  maxDisplacement: number;
  /** Peak strain (dimensionless). */
  estimatedStrain: number;
  /** Yield strength ÷ peak stress, capped. */
  safetyFactor: number;
  /** World-space locations of the highest-stress regions. */
  stressConcentrations: readonly Vec3[];
  /** Solver mesh resolution actually used (voxels along the longest axis). */
  resolution: number;
  /** Number of filled (solid) voxel elements solved. */
  elementCount: number;
  /** Whether the conjugate-gradient solve reached its tolerance. */
  converged: boolean;
  method: "voxel-hex-fem";
}

// ── 3D printing ─────────────────────────────────────────────────────────────

export type InfillPattern =
  "grid" | "gyroid" | "honeycomb" | "triangles" | "cubic";

export interface PrintSettings {
  infillPercent: number;
  infillPattern: InfillPattern;
  layerHeight: number;
  nozzleDiameter: number;
  wallCount: number;
  /** Solid top layers. */
  topLayers: number;
  /** Solid bottom layers. */
  bottomLayers: number;
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
