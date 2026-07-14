import type {
  ActivityId,
  BodyParams,
  SegmentId,
  SegmentParam,
  VisualizationMode,
} from "../types";

/**
 * Anthropometric constants. Segment mass fractions, lengths, and centre-of-mass
 * locations follow the widely-used Dempster (1955) / Winter cadaver-derived
 * tables — the standard basis for inverse-dynamics biomechanics. These let us
 * compute segment masses and CoM from just total body mass and height, which is
 * exactly how gait labs estimate loads without weighing each limb.
 *
 * All values are model estimates for education, not lab-measured data.
 */

export const SEGMENTS: readonly SegmentParam[] = [
  {
    id: "head",
    label: "Head & neck",
    massFraction: 0.081,
    lengthFraction: 0.13,
    comFraction: 0.5,
  },
  {
    id: "trunk",
    label: "Trunk",
    massFraction: 0.497,
    lengthFraction: 0.3,
    comFraction: 0.5,
  },
  {
    id: "upperArmL",
    label: "Upper arm (L)",
    massFraction: 0.028,
    lengthFraction: 0.186,
    comFraction: 0.436,
  },
  {
    id: "upperArmR",
    label: "Upper arm (R)",
    massFraction: 0.028,
    lengthFraction: 0.186,
    comFraction: 0.436,
  },
  {
    id: "forearmL",
    label: "Forearm (L)",
    massFraction: 0.016,
    lengthFraction: 0.146,
    comFraction: 0.43,
  },
  {
    id: "forearmR",
    label: "Forearm (R)",
    massFraction: 0.016,
    lengthFraction: 0.146,
    comFraction: 0.43,
  },
  {
    id: "handL",
    label: "Hand (L)",
    massFraction: 0.006,
    lengthFraction: 0.108,
    comFraction: 0.5,
  },
  {
    id: "handR",
    label: "Hand (R)",
    massFraction: 0.006,
    lengthFraction: 0.108,
    comFraction: 0.5,
  },
  {
    id: "thighL",
    label: "Thigh (L)",
    massFraction: 0.1,
    lengthFraction: 0.245,
    comFraction: 0.433,
  },
  {
    id: "thighR",
    label: "Thigh (R)",
    massFraction: 0.1,
    lengthFraction: 0.245,
    comFraction: 0.433,
  },
  {
    id: "shankL",
    label: "Shank (L)",
    massFraction: 0.0465,
    lengthFraction: 0.246,
    comFraction: 0.433,
  },
  {
    id: "shankR",
    label: "Shank (R)",
    massFraction: 0.0465,
    lengthFraction: 0.246,
    comFraction: 0.433,
  },
  {
    id: "footL",
    label: "Foot (L)",
    massFraction: 0.0145,
    lengthFraction: 0.152,
    comFraction: 0.5,
  },
  {
    id: "footR",
    label: "Foot (R)",
    massFraction: 0.0145,
    lengthFraction: 0.152,
    comFraction: 0.5,
  },
];

export const SEGMENT_MAP: Record<SegmentId, SegmentParam> = Object.fromEntries(
  SEGMENTS.map((s) => [s.id, s]),
) as Record<SegmentId, SegmentParam>;

export const GRAVITY = 9.80665; // m/s²

export const DEFAULT_BODY: BodyParams = {
  height: 1.75,
  mass: 75,
  sex: "male",
  build: 1,
  loadKg: 0,
  speed: 1,
};

/** Segment mass in kg for the given body. */
export function segmentMass(id: SegmentId, body: BodyParams): number {
  return SEGMENT_MAP[id].massFraction * body.mass;
}

/** Segment length in metres for the given body. */
export function segmentLength(id: SegmentId, body: BodyParams): number {
  return SEGMENT_MAP[id].lengthFraction * body.height;
}

/** Total bodyweight in newtons (incl. carried load). */
export function bodyWeightN(body: BodyParams): number {
  return (body.mass + body.loadKg) * GRAVITY;
}

// ── Muscle groups (for the muscle/heat-map modes) ────────────────────────────

export interface MuscleGroupDef {
  id: string;
  label: string;
  segment: SegmentId;
  /** Which activities primarily recruit this group (for activation heuristics). */
  primaryFor: ActivityId[];
}

export const MUSCLE_GROUPS: readonly MuscleGroupDef[] = [
  {
    id: "quads-l",
    label: "Quadriceps (L)",
    segment: "thighL",
    primaryFor: ["squat", "deadlift", "jump", "run", "sprint", "cycle"],
  },
  {
    id: "quads-r",
    label: "Quadriceps (R)",
    segment: "thighR",
    primaryFor: ["squat", "deadlift", "jump", "run", "sprint", "cycle"],
  },
  {
    id: "hams-l",
    label: "Hamstrings (L)",
    segment: "thighL",
    primaryFor: ["deadlift", "run", "sprint", "jump"],
  },
  {
    id: "hams-r",
    label: "Hamstrings (R)",
    segment: "thighR",
    primaryFor: ["deadlift", "run", "sprint", "jump"],
  },
  {
    id: "calf-l",
    label: "Gastrocnemius (L)",
    segment: "shankL",
    primaryFor: ["run", "sprint", "jump", "walk", "cycle"],
  },
  {
    id: "calf-r",
    label: "Gastrocnemius (R)",
    segment: "shankR",
    primaryFor: ["run", "sprint", "jump", "walk", "cycle"],
  },
  {
    id: "glute",
    label: "Gluteals",
    segment: "trunk",
    primaryFor: ["squat", "deadlift", "sprint", "jump"],
  },
  {
    id: "erector",
    label: "Erector spinae",
    segment: "trunk",
    primaryFor: ["deadlift", "squat", "throw"],
  },
  {
    id: "abs",
    label: "Abdominals",
    segment: "trunk",
    primaryFor: ["throw", "sprint", "jump"],
  },
  {
    id: "delt-l",
    label: "Deltoid (L)",
    segment: "upperArmL",
    primaryFor: ["throw"],
  },
  {
    id: "delt-r",
    label: "Deltoid (R)",
    segment: "upperArmR",
    primaryFor: ["throw"],
  },
  {
    id: "bic-r",
    label: "Biceps (R)",
    segment: "forearmR",
    primaryFor: ["throw", "deadlift"],
  },
];

// ── Activity catalog ─────────────────────────────────────────────────────────

export interface ActivityDef {
  id: ActivityId;
  label: string;
  category: "gait" | "lifting" | "sport";
  description: string;
  /** Base cycle duration in seconds at speed = 1. */
  cycleSeconds: number;
}

export const ACTIVITIES: readonly ActivityDef[] = [
  {
    id: "walk",
    label: "Walking",
    category: "gait",
    cycleSeconds: 1.1,
    description: "Normal gait cycle: heel-strike to heel-strike.",
  },
  {
    id: "run",
    label: "Running",
    category: "gait",
    cycleSeconds: 0.72,
    description: "Running gait with a flight phase and higher impact.",
  },
  {
    id: "sprint",
    label: "Sprinting",
    category: "gait",
    cycleSeconds: 0.46,
    description: "Maximal-effort sprint: large forces, high cadence.",
  },
  {
    id: "squat",
    label: "Squat",
    category: "lifting",
    cycleSeconds: 3.0,
    description: "Bodyweight/loaded squat: descent and drive.",
  },
  {
    id: "deadlift",
    label: "Deadlift",
    category: "lifting",
    cycleSeconds: 3.4,
    description: "Hip-hinge lift from the floor — high spinal demand.",
  },
  {
    id: "jump",
    label: "Vertical jump",
    category: "sport",
    cycleSeconds: 1.4,
    description: "Counter-movement jump: load, propulsion, flight, landing.",
  },
  {
    id: "throw",
    label: "Overhead throw",
    category: "sport",
    cycleSeconds: 1.2,
    description:
      "Throwing motion: wind-up, cocking, acceleration, follow-through.",
  },
  {
    id: "cycle",
    label: "Cycling",
    category: "sport",
    cycleSeconds: 0.9,
    description: "Pedal revolution: alternating leg drive.",
  },
];

export const ACTIVITY_MAP: Record<ActivityId, ActivityDef> = Object.fromEntries(
  ACTIVITIES.map((a) => [a.id, a]),
) as Record<ActivityId, ActivityDef>;

export const VISUALIZATION_MODES: Array<{
  id: VisualizationMode;
  label: string;
  hint: string;
}> = [
  { id: "skeleton", label: "Skeleton", hint: "Bones and joint centres" },
  { id: "muscle", label: "Muscle", hint: "Muscle groups and activation" },
  { id: "joint", label: "Joints", hint: "Joint reaction loading" },
  { id: "force", label: "Forces", hint: "Force vectors and GRF" },
  { id: "injury", label: "Injury risk", hint: "Region injury indices" },
  { id: "heatmap", label: "Heat map", hint: "Whole-body stress heat map" },
];
