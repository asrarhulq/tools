import type {
  Force,
  GeometryResult,
  Material,
  StabilityResult,
  Vec3,
} from "../types";
import { add, cross, length, scale, sub } from "./vec";

const GRAVITY = 9.80665; // m/s²

/**
 * Rigid-body tipping/stability analysis. Treats the part as a rigid body
 * resting on the print bed (min-Z plane) and asks whether applied forces
 * generate enough torque about the base edge to overturn it. Approximate but
 * physically grounded — the same model an intro statics course would use.
 */
export function analyzeStability(
  geometry: GeometryResult,
  material: Material,
  forces: readonly Force[],
): StabilityResult {
  // Mass: volume(mm³) → cm³ × density(g/cm³) = grams.
  const massGrams = (geometry.volume / 1000) * material.density;
  const massKg = massGrams / 1000;
  const cog = geometry.centerOfMass;

  // Base footprint: the bounding box corners on the min-Z plane define the
  // support polygon. The pivot is the base edge nearest the net horizontal push.
  const { min, max } = geometry.boundingBox;
  const baseZ = min[2];

  // Net force and its application point (magnitude-weighted average).
  let net: Vec3 = [0, 0, 0];
  let weightedPoint: Vec3 = [0, 0, 0];
  let totalMag = 0;
  for (const f of forces) {
    const dir = normalizeSafe(f.direction);
    const vec = scale(dir, f.magnitude);
    net = add(net, vec);
    weightedPoint = add(weightedPoint, scale(f.point, f.magnitude));
    totalMag += f.magnitude;
  }
  const applyPoint: Vec3 =
    totalMag > 0 ? scale(weightedPoint, 1 / totalMag) : cog;

  const horizontal: Vec3 = [net[0], net[1], 0];
  const horizMag = length(horizontal);

  // Weight vector (down) acts at the CoG.
  const weightN = massKg * GRAVITY;

  // Choose the pivot edge: the base-box edge on the side the push is heading.
  const pivot: Vec3 = pickPivot(min, max, baseZ, horizontal, cog);

  // Overturning torque = horizontal force × lever arm (height above base).
  const leverArm = Math.max(0, applyPoint[2] - baseZ) / 1000; // mm → m
  const overturningTorque = horizMag * leverArm;

  // Restoring torque = weight × horizontal distance from CoG to pivot edge.
  const restoreArm =
    Math.hypot(cog[0] - pivot[0], cog[1] - pivot[1]) / 1000; // mm → m
  const restoringTorque = weightN * restoreArm;

  const tippingThreshold =
    overturningTorque > 1e-6 ? restoringTorque / overturningTorque : Infinity;
  const willTip = tippingThreshold < 1;

  const footprint = Math.hypot(max[0] - min[0], max[1] - min[1]);
  const height = max[2] - min[2];
  const recommendation = buildRecommendation(
    willTip,
    tippingThreshold,
    footprint,
    height,
  );

  return {
    massGrams,
    centerOfGravity: cog,
    pivot: forces.length ? pivot : null,
    overturningTorque,
    restoringTorque,
    tippingThreshold: Number.isFinite(tippingThreshold)
      ? tippingThreshold
      : 999,
    willTip,
    recommendation,
  };
}

function normalizeSafe(v: Vec3): Vec3 {
  const len = length(v);
  return len > 1e-9 ? scale(v, 1 / len) : [0, 0, 0];
}

/** The base-rectangle edge midpoint the body would rotate over. */
function pickPivot(
  min: Vec3,
  max: Vec3,
  baseZ: number,
  horizontal: Vec3,
  cog: Vec3,
): Vec3 {
  // Push mostly along +X → pivot on the +X edge, etc. Default to nearest edge.
  const dirX = horizontal[0];
  const dirY = horizontal[1];
  const px = Math.abs(dirX) >= Math.abs(dirY) ? (dirX >= 0 ? max[0] : min[0]) : cog[0];
  const py = Math.abs(dirY) > Math.abs(dirX) ? (dirY >= 0 ? max[1] : min[1]) : cog[1];
  return [px, py, baseZ];
}

function buildRecommendation(
  willTip: boolean,
  threshold: number,
  footprint: number,
  height: number,
): string {
  if (!willTip && !Number.isFinite(threshold)) {
    return "Stable under gravity alone. Apply forces to test overturning.";
  }
  if (willTip) {
    return (
      "Unstable: the applied load overturns the part. Widen the base, lower " +
      "the center of gravity, or add supports/anchoring on the loaded side."
    );
  }
  if (threshold < 1.5) {
    return "Marginally stable — a small increase in load would tip it. Add a brim or anchor.";
  }
  const aspect = height / (footprint || 1);
  return aspect > 2
    ? "Stable, but tall relative to its base. Print with the long axis horizontal for robustness."
    : "Stable under the current load with a healthy safety margin.";
}

/** Torque vector r × F, for the viewer's torque arrow. */
export function torqueVector(point: Vec3, cog: Vec3, force: Vec3): Vec3 {
  return cross(sub(point, cog), force);
}
