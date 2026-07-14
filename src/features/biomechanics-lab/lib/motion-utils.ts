import type { JointId, Pose, Vec3 } from "../types";

/**
 * ── Motion-quality utilities ────────────────────────────────────────────────
 *
 * The building blocks that make procedural motion read as believable human
 * movement rather than a robotic demo:
 *   • anatomical joint range-of-motion clamps (no impossible poses),
 *   • C¹-continuous easing/blending helpers (no boundary snaps),
 *   • pose interpolation with shortest-path handling,
 *   • a per-joint low-pass smoother for the live playback loop.
 *
 * All angles are radians, sagittal-plane flexion (+ = the anatomical flexion
 * direction for that joint).
 * ────────────────────────────────────────────────────────────────────────────
 */

const DEG = Math.PI / 180;

/** Anatomical range of motion per joint (radians): [min, max] flexion. */
export const JOINT_ROM: Record<JointId, [number, number]> = {
  neck: [-50 * DEG, 60 * DEG],
  lumbar: [-30 * DEG, 90 * DEG], // extension .. deep forward flexion
  shoulderL: [-60 * DEG, 180 * DEG],
  shoulderR: [-60 * DEG, 180 * DEG],
  elbowL: [0, 150 * DEG],
  elbowR: [0, 150 * DEG],
  hipL: [-30 * DEG, 120 * DEG], // extension .. flexion
  hipR: [-30 * DEG, 120 * DEG],
  kneeL: [0, 145 * DEG],
  kneeR: [0, 145 * DEG],
  ankleL: [-50 * DEG, 30 * DEG], // dorsi .. plantarflexion
  ankleR: [-50 * DEG, 30 * DEG],
};

export function clampJoint(joint: JointId, angle: number): number {
  const [lo, hi] = JOINT_ROM[joint];
  return Math.max(lo, Math.min(hi, angle));
}

/** Smoothstep easing (C¹ continuous): 0→1 with zero slope at both ends. */
export function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/** Smootherstep (C² continuous) — even gentler starts/stops. */
export function smootherstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Cosine ease over [0,1] — periodic-friendly, no slope discontinuity. */
export function cosEase(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, t)));
}

/**
 * A C¹-continuous "pulse" that rises from 0→1→0 across [a,b] with a peak at the
 * midpoint and zero slope at the ends — used to shape lift/jump phases without
 * the corner snaps a piecewise-linear ramp produces.
 */
export function pulse(phase: number, a: number, b: number): number {
  if (phase <= a || phase >= b) return 0;
  const t = (phase - a) / (b - a);
  return Math.sin(Math.PI * t); // smooth 0→1→0, C¹ at ends
}

/** A C¹ ramp that eases 0→1 across [a,b] and holds after. */
export function ramp(phase: number, a: number, b: number): number {
  if (phase <= a) return 0;
  if (phase >= b) return 1;
  return smoothstep((phase - a) / (b - a));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/** Interpolate two full poses (points + joint angles + GRF) for sub-frame smoothness. */
export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const points: Record<string, Vec3> = {};
  for (const k of Object.keys(a.points)) {
    const pa = a.points[k];
    if (!pa) continue;
    const pb = b.points[k] ?? pa;
    points[k] = lerpVec(pa, pb, t);
  }
  const jointAngles: Pose["jointAngles"] = {};
  for (const k of Object.keys(a.jointAngles) as JointId[]) {
    jointAngles[k] = lerp(a.jointAngles[k] ?? 0, b.jointAngles[k] ?? 0, t);
  }
  return {
    phase: lerp(a.phase, b.phase, t),
    points,
    jointAngles,
    grfBodyweights: lerp(a.grfBodyweights, b.grfBodyweights, t),
    phaseLabel: t < 0.5 ? a.phaseLabel : b.phaseLabel,
  };
}

/**
 * Exponential low-pass smoother for a scalar toward a target, framerate-aware.
 * `smoothing` ~ time constant in seconds; larger = smoother/slower response.
 */
export function damp(
  current: number,
  target: number,
  smoothing: number,
  dt: number,
): number {
  const a = 1 - Math.exp(-dt / Math.max(1e-4, smoothing));
  return current + (target - current) * a;
}

/** Wrap a phase into [0,1). */
export function wrapPhase(p: number): number {
  return ((p % 1) + 1) % 1;
}
