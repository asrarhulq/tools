import type {
  BuildPlateContact,
  Force,
  GeometryResult,
  Material,
  StabilityResult,
  Vec3,
} from "../types";
import { add, length, scale } from "./vec";
import { convexHull2D } from "./orientation";

const GRAVITY = 9.80665; // m/s²

/**
 * ── Rigid-body stability / tipping analysis ─────────────────────────────────
 *
 * Proper support-polygon statics, the model a mechanics-of-materials course
 * uses for tip-over. The part rests on the build plate; its *support polygon* is
 * the convex hull of the contact footprint. Under gravity plus any applied
 * loads there is a net force whose line of action pierces the plate at an
 * effective "zero-moment point". If that point lies inside the support polygon
 * the part is stable; if it leaves the polygon the part rotates about the
 * nearest polygon edge (the pivot edge) in the direction of escape.
 *
 * Outputs the support polygon, the CoG projection, the pivot edge and tip
 * direction, a geometric stability margin (distance to the nearest edge), and a
 * torque-based factor of safety against tipping.
 * ────────────────────────────────────────────────────────────────────────────
 */
export function analyzeStability(
  geometry: GeometryResult,
  material: Material,
  forces: readonly Force[],
  contact?: BuildPlateContact | null,
): StabilityResult {
  const massGrams = (geometry.volume / 1000) * material.density;
  const massKg = massGrams / 1000;
  const weightN = massKg * GRAVITY;
  const cog = geometry.centerOfMass;
  const { min, max } = geometry.boundingBox;
  const baseZ = min[2];

  // Support polygon: prefer the real contact footprint; otherwise fall back to
  // the base bounding rectangle (still a valid, if generous, support region).
  const polygon = supportPolygon(contact, min, max);

  // Net applied force (gravity acts separately at the CoG).
  let netApplied: Vec3 = [0, 0, 0];
  let weightedPoint: Vec3 = [0, 0, 0];
  let totalMag = 0;
  for (const f of forces) {
    const dir = normalizeSafe(f.direction);
    netApplied = add(netApplied, scale(dir, f.magnitude));
    weightedPoint = add(weightedPoint, scale(f.point, f.magnitude));
    totalMag += f.magnitude;
  }
  const applyPoint: Vec3 =
    totalMag > 0 ? scale(weightedPoint, 1 / totalMag) : cog;

  // Effective ground-projection ("zero-moment point"): gravity pulls the CoG
  // straight down; a horizontal load shifts the effective projection by its
  // moment about the plate (horizontal force × height / total vertical force).
  const horiz: [number, number] = [netApplied[0], netApplied[1]];
  const horizMag = Math.hypot(horiz[0], horiz[1]);
  const verticalDown = weightN - netApplied[2]; // +load up reduces ground reaction
  const leverHeight = Math.max(0, applyPoint[2] - baseZ);

  const cogProjection: [number, number] = [cog[0], cog[1]];
  let zmp: [number, number] = [...cogProjection];
  if (verticalDown > 1e-6 && horizMag > 1e-9) {
    // Shift the projection downstream of the push by moment / vertical reaction.
    const shift = (horizMag * leverHeight) / verticalDown; // mm
    zmp = [
      cog[0] + (horiz[0] / horizMag) * shift,
      cog[1] + (horiz[1] / horizMag) * shift,
    ];
  }

  const inside = pointInPolygon(zmp, polygon);
  const nearest = nearestEdge(zmp, polygon);

  // Torque balance about the nearest (pivot) edge.
  const overturningTorque = (horizMag * leverHeight) / 1000; // N·m
  const restoreArm = nearest ? nearest.distance / 1000 : 0; // mm → m
  const restoringTorque = weightN * restoreArm;

  // Factor of safety: inside → restoring/overturning (∞ with no horizontal load);
  // outside → the load has already pushed the ZMP past the edge (< 1).
  let tippingThreshold: number;
  if (!inside) {
    tippingThreshold = 0.5; // ZMP outside polygon → actively tipping
  } else if (overturningTorque > 1e-6) {
    tippingThreshold = restoringTorque / overturningTorque;
  } else {
    tippingThreshold = 999;
  }
  const willTip = !inside || tippingThreshold < 1;

  const tipDirection: [number, number] | null = nearest
    ? unit2(nearest.outward)
    : null;
  const pivotEdge = nearest ? nearest.edge : null;
  const pivot: Vec3 = nearest
    ? [
        (nearest.edge[0][0] + nearest.edge[1][0]) / 2,
        (nearest.edge[0][1] + nearest.edge[1][1]) / 2,
        baseZ,
      ]
    : [cog[0], cog[1], baseZ];

  // Geometric stability margin: signed distance to nearest edge (inside +).
  const stabilityMargin =
    nearest != null ? (inside ? nearest.distance : -nearest.distance) : 0;

  const footprint = Math.hypot(max[0] - min[0], max[1] - min[1]);
  const height = max[2] - min[2];
  const recommendation = buildRecommendation(
    willTip,
    tippingThreshold,
    inside,
    footprint,
    height,
    forces.length,
  );

  return {
    massGrams,
    centerOfGravity: cog,
    supportPolygon: polygon,
    cogProjection,
    cogInsidePolygon: pointInPolygon(cogProjection, polygon),
    pivotEdge,
    pivot: forces.length || !inside ? pivot : null,
    tipDirection,
    stabilityMargin,
    overturningTorque,
    restoringTorque,
    tippingThreshold: Number.isFinite(tippingThreshold)
      ? tippingThreshold
      : 999,
    willTip,
    recommendation,
  };
}

/** Support polygon from contact footprint, else the base bounding rectangle. */
function supportPolygon(
  contact: BuildPlateContact | null | undefined,
  min: Vec3,
  max: Vec3,
): (readonly [number, number])[] {
  if (contact && contact.footprint.length >= 3) {
    return contact.footprint.map((p) => [p[0], p[1]] as const);
  }
  return convexHull2D([
    [min[0], min[1]],
    [max[0], min[1]],
    [max[0], max[1]],
    [min[0], max[1]],
  ]);
}

function normalizeSafe(v: Vec3): Vec3 {
  const len = length(v);
  return len > 1e-9 ? scale(v, 1 / len) : [0, 0, 0];
}

function unit2(v: [number, number]): [number, number] {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
}

/** Ray-cast point-in-polygon (even-odd rule). */
function pointInPolygon(
  p: readonly [number, number],
  poly: readonly (readonly [number, number])[],
): boolean {
  if (poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i]![0],
      yi = poly[i]![1];
    const xj = poly[j]![0],
      yj = poly[j]![1];
    const intersect =
      yi > p[1] !== yj > p[1] &&
      p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

interface NearestEdge {
  edge: [Vec3, Vec3];
  distance: number;
  /** Outward normal (points from polygon toward the query point side). */
  outward: [number, number];
}

/** Nearest polygon edge to a point, with perpendicular distance + outward dir. */
function nearestEdge(
  p: readonly [number, number],
  poly: readonly (readonly [number, number])[],
): NearestEdge | null {
  if (poly.length < 2) return null;
  let best: NearestEdge | null = null;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const abx = b[0] - a[0],
      aby = b[1] - a[1];
    const len2 = abx * abx + aby * aby || 1;
    let t = ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = a[0] + t * abx,
      cy = a[1] + t * aby;
    const dx = p[0] - cx,
      dy = p[1] - cy;
    const distance = Math.hypot(dx, dy);
    if (!best || distance < best.distance) {
      best = {
        edge: [
          [a[0], a[1], 0],
          [b[0], b[1], 0],
        ],
        distance,
        outward: distance > 1e-9 ? [dx / distance, dy / distance] : [abx, aby],
      };
    }
  }
  return best;
}

function buildRecommendation(
  willTip: boolean,
  threshold: number,
  inside: boolean,
  footprint: number,
  height: number,
  forceCount: number,
): string {
  if (willTip) {
    if (!inside) {
      return (
        "Unstable: the resultant load pushes the effective weight line outside " +
        "the support footprint — the part tips over the pivot edge. Widen the " +
        "base, lower the center of gravity, reduce the load, or anchor the part."
      );
    }
    return (
      "Unstable: overturning moment exceeds the restoring moment. Reorient for a " +
      "wider footprint or add a brim/anchor on the loaded side."
    );
  }
  if (forceCount === 0) {
    const aspect = height / (footprint || 1);
    return aspect > 2
      ? "Stable under gravity, but tall relative to its base — reorient the long axis horizontal for robustness."
      : "Stable under gravity. Apply forces to test overturning resistance.";
  }
  if (threshold < 1.5) {
    return "Marginally stable — a modest increase in load would tip it. Add a brim or anchor.";
  }
  return "Stable under the current load with a healthy safety margin.";
}
