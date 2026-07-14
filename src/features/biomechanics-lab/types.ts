/**
 * ── Human Biomechanics Lab — domain model ───────────────────────────────────
 * Framework-free, serializable types shared by the kinematics generators, the
 * analysis engine, the 3D renderer, and the report. Units are SI internally
 * (metres, kilograms, seconds, newtons, radians); the UI converts for display.
 * ────────────────────────────────────────────────────────────────────────────
 */

/** A 3D vector in world space (metres). y = up, sagittal plane = x–y. */
export type Vec3 = readonly [number, number, number];

/** The rigid segments of the articulated body model. */
export type SegmentId =
  | "head"
  | "trunk" // pelvis→shoulders
  | "upperArmL"
  | "upperArmR"
  | "forearmL"
  | "forearmR"
  | "handL"
  | "handR"
  | "thighL"
  | "thighR"
  | "shankL"
  | "shankR"
  | "footL"
  | "footR";

/** The articulated joints we analyze. */
export type JointId =
  | "neck"
  | "lumbar" // L5/S1
  | "shoulderL"
  | "shoulderR"
  | "elbowL"
  | "elbowR"
  | "hipL"
  | "hipR"
  | "kneeL"
  | "kneeR"
  | "ankleL"
  | "ankleR";

export type VisualizationMode =
  "skeleton" | "muscle" | "joint" | "force" | "injury" | "heatmap";

export type ActivityId =
  "walk" | "run" | "sprint" | "squat" | "deadlift" | "jump" | "throw" | "cycle";

export type UnitSystem = "si" | "imperial";

/** User-tunable body + scenario parameters. */
export interface BodyParams {
  /** Standing height, metres. */
  height: number;
  /** Body mass, kilograms. */
  mass: number;
  /** Sex affects segment mass fractions & CoM (Dempster/deLeva). */
  sex: "male" | "female";
  /** Overall build multiplier on segment girth (visual + inertia), 0.8–1.3. */
  build: number;
  /** External load carried/lifted, kilograms. */
  loadKg: number;
  /** Movement speed multiplier / cadence factor. */
  speed: number;
}

/** Dempster-style segment inertial parameters (fractions of body values). */
export interface SegmentParam {
  id: SegmentId;
  label: string;
  /** Fraction of total body mass. */
  massFraction: number;
  /** Segment length as a fraction of standing height. */
  lengthFraction: number;
  /** CoM position from proximal joint, fraction of segment length. */
  comFraction: number;
}

// ── A single simulated pose (one animation frame) ────────────────────────────

/** Joint centre positions in world space for one frame. */
export interface Pose {
  /** Normalized phase 0..1 through the movement cycle. */
  phase: number;
  /** World position of every joint centre + segment endpoints. */
  points: Record<string, Vec3>;
  /** Sagittal-plane joint flexion angles (radians). */
  jointAngles: Partial<Record<JointId, number>>;
  /** Vertical ground reaction force for this frame, in bodyweights. */
  grfBodyweights: number;
  /** Label for the current movement phase, e.g. "Mid-stance". */
  phaseLabel: string;
}

// ── Analysis results for one frame ───────────────────────────────────────────

export interface JointLoad {
  joint: JointId;
  label: string;
  /** Reaction force magnitude, newtons. */
  forceN: number;
  /** Net moment / torque magnitude, newton-metres. */
  torqueNm: number;
  /** In multiples of bodyweight, for intuitive comparison. */
  bodyweights: number;
  /** 0..1 normalized loading for coloring. */
  loadFraction: number;
}

export interface MuscleActivation {
  id: string;
  label: string;
  /** 0..1 activation level. */
  activation: number;
  /** Segment this muscle group is drawn on. */
  segment: SegmentId;
}

export interface InjuryRisk {
  region: string;
  /** 0..1 risk. */
  risk: number;
  level: "low" | "moderate" | "high";
  note: string;
}

export interface FrameAnalysis {
  phase: number;
  phaseLabel: string;
  /** Whole-body centre of mass, world metres. */
  centerOfMass: Vec3;
  /** CoM height above ground, metres (balance proxy). */
  comHeight: number;
  jointLoads: JointLoad[];
  muscles: MuscleActivation[];
  injuries: InjuryRisk[];
  /** Vertical ground reaction force, newtons. */
  grfN: number;
  /** L5/S1 compressive load, newtons (lifting/posture). */
  spinalCompressionN: number;
  /** Estimated metabolic power, watts. */
  metabolicW: number;
  /** Notes from the "AI" analysis assistant for this phase. */
  notes: string[];
}

/** Aggregate metrics across a full cycle. */
export interface CycleSummary {
  activity: ActivityId;
  peakGrfN: number;
  peakGrfBodyweights: number;
  peakJoint: { label: string; forceN: number };
  peakSpinalN: number;
  avgMetabolicW: number;
  energyPerCycleJ: number;
  cadence: number;
  overallRisk: "low" | "moderate" | "high";
  symmetryPct: number;
}

export interface PostureAssessment {
  spinalAlignmentDeg: number;
  neckAngleDeg: number;
  shoulderSymmetryDeg: number;
  hipAlignmentDeg: number;
  score: number; // 0..100
  findings: string[];
  recommendations: string[];
}
