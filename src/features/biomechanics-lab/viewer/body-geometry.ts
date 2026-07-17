import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Pose, Vec3 } from "../types";

/**
 * ── Continuous body-surface builder ─────────────────────────────────────────
 *
 * Rebuilds the human as ONE merged, seamless surface each pose — no visible
 * joint spheres and no cylinder seams. Each anatomical region is a "profiled
 * tube": a swept ring whose radius varies along its length to give real muscle
 * silhouettes (deltoid taper, biceps/calf bulge, thigh mass, tapered forearm).
 * Adjacent tubes overlap generously and share smoothed normals after merging,
 * so limbs flow into the torso as a single fleshy body rather than parts stuck
 * together. The result is bound to the same Pose the kinematics produce, so the
 * existing animation and analysis are unchanged.
 * ────────────────────────────────────────────────────────────────────────────
 */

const UP = new THREE.Vector3(0, 1, 0);
const V = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);

/** A radius profile sampled along a normalized segment length t∈[0,1]. */
type Profile = (t: number) => number;

const RADIAL = 20; // cross-section resolution (higher = smoother limbs)
const LENGTH_SEGS = 14;

/**
 * Build a profiled tube from world point a→b with a radius profile and slightly
 * bulged, overlapping ends (so it fuses with the next segment). Returns a
 * BufferGeometry already positioned in world space.
 */
function tube(
  a: THREE.Vector3,
  b: THREE.Vector3,
  profile: Profile,
): THREE.BufferGeometry {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length() || 1e-4;
  dir.normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir);

  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= LENGTH_SEGS; i++) {
    const t = i / LENGTH_SEGS;
    const r = Math.max(0.002, profile(t));
    const y = t * len;
    for (let j = 0; j < RADIAL; j++) {
      const ang = (j / RADIAL) * Math.PI * 2;
      // Gentle anteroposterior flattening so limbs read anatomically (not round).
      const local = new THREE.Vector3(
        Math.cos(ang) * r,
        y,
        Math.sin(ang) * r * 0.9,
      );
      local.applyQuaternion(quat).add(a);
      positions.push(local.x, local.y, local.z);
    }
  }
  for (let i = 0; i < LENGTH_SEGS; i++) {
    for (let j = 0; j < RADIAL; j++) {
      const jn = (j + 1) % RADIAL;
      const a0 = i * RADIAL + j;
      const a1 = i * RADIAL + jn;
      const b0 = (i + 1) * RADIAL + j;
      const b1 = (i + 1) * RADIAL + jn;
      indices.push(a0, b0, a1, a1, b0, b1);
    }
  }
  // Cap the ends so there are no holes (rounded via a small pole ring).
  capEnd(positions, indices, 0, profile(0));
  capEnd(positions, indices, LENGTH_SEGS, profile(1), a, b, quat, len);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  return g;
}

/** Add a dome cap at the given ring (start or end) to close the tube. */
function capEnd(
  positions: number[],
  indices: number[],
  ring: number,
  r: number,
  a?: THREE.Vector3,
  b?: THREE.Vector3,
  quat?: THREE.Quaternion,
  len?: number,
) {
  // Simple fan to a centre point pushed slightly beyond the ring for a dome.
  const ringStart = ring * RADIAL;
  const cx = positions[ringStart * 3]!;
  const cy = positions[ringStart * 3 + 1]!;
  const cz = positions[ringStart * 3 + 2]!;
  let centre: [number, number, number] = [cx, cy, cz];
  if (a && b && quat && len !== undefined) {
    const push = new THREE.Vector3(0, ring === 0 ? -r * 0.6 : len + r * 0.6, 0)
      .applyQuaternion(quat)
      .add(a);
    centre = [push.x, push.y, push.z];
  } else {
    // Average the ring for the near cap centre.
    let sx = 0,
      sy = 0,
      sz = 0;
    for (let j = 0; j < RADIAL; j++) {
      sx += positions[(ringStart + j) * 3]!;
      sy += positions[(ringStart + j) * 3 + 1]!;
      sz += positions[(ringStart + j) * 3 + 2]!;
    }
    centre = [sx / RADIAL - r * 0.4, sy / RADIAL, sz / RADIAL];
  }
  const ci = positions.length / 3;
  positions.push(centre[0], centre[1], centre[2]);
  for (let j = 0; j < RADIAL; j++) {
    const jn = (j + 1) % RADIAL;
    if (ring === 0) indices.push(ci, ringStart + jn, ringStart + j);
    else indices.push(ci, ringStart + j, ringStart + jn);
  }
}

/** An ellipsoid (torso/pelvis/head/hand/foot mass), positioned + oriented. */
function ellipsoid(
  centre: THREE.Vector3,
  radii: [number, number, number],
  quat?: THREE.Quaternion,
): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 20, 16);
  g.scale(radii[0], radii[1], radii[2]);
  if (quat) g.applyQuaternion(quat);
  g.translate(centre.x, centre.y, centre.z);
  // Keep only position + index so every merged part shares identical attributes
  // (the tube parts carry no normal/uv; merge requires them to match).
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  return g;
}

// ── Muscle radius profiles (fractions tuned for a ~1.75 m body, scaled) ───────

const scale =
  (s: number, fn: Profile): Profile =>
  (t) =>
    fn(t) * s;

// Thigh: broad at hip, tapering to knee, with a quad/hamstring belly mid-length.
const thighProfile: Profile = (t) =>
  0.11 - 0.045 * t + 0.02 * Math.sin(t * Math.PI);
// Shank: calf belly high, tapering to a slim ankle.
const shankProfile: Profile = (t) =>
  0.075 - 0.05 * t + 0.028 * Math.sin(Math.min(1, t * 1.4) * Math.PI);
// Upper arm: deltoid + biceps belly, tapering to elbow.
const upperArmProfile: Profile = (t) =>
  0.055 - 0.018 * t + 0.016 * Math.sin(t * Math.PI);
// Forearm: full near elbow, tapering to wrist.
const forearmProfile: Profile = (t) =>
  0.05 - 0.024 * t + 0.008 * Math.sin(t * Math.PI);

export interface BodyBuildResult {
  geometry: THREE.BufferGeometry;
  dispose: () => void;
}

/** A body region key used to look up a heat colour per part. */
export type RegionKey =
  | "thighL"
  | "thighR"
  | "shankL"
  | "shankR"
  | "upperArmL"
  | "upperArmR"
  | "forearmL"
  | "forearmR"
  | "trunk"
  | "pelvis"
  | "head"
  | "footL"
  | "footR";

/** Optional per-region colour provider for heat-map rendering (RGB 0..1). */
export type RegionColor = (region: RegionKey) => [number, number, number];

/** Paint every vertex of a part with a flat RGB colour (adds a `color` attr). */
function paint(g: THREE.BufferGeometry, rgb: [number, number, number]) {
  const n = g.getAttribute("position").count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = rgb[0];
    arr[i * 3 + 1] = rgb[1];
    arr[i * 3 + 2] = rgb[2];
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(arr, 3));
}

/**
 * Build the full continuous body geometry for a pose. `girth` scales all soft
 * tissue (from the body "build" parameter). When `regionColor` is supplied,
 * each anatomical region is painted with vertex colours so the mesh renders as
 * a true per-region heat map (thigh, calf, trunk, arms… each tinted by its own
 * load/activation) rather than a single flat body tint. Returns one merged,
 * smooth-normal BufferGeometry.
 */
export function buildBody(
  pose: Pose,
  girth = 1,
  regionColor?: RegionColor,
): THREE.BufferGeometry {
  const p = pose.points;
  const parts: THREE.BufferGeometry[] = [];
  const g = girth;

  const seg = (
    aKey: string,
    bKey: string,
    profile: Profile,
    region?: RegionKey,
  ) => {
    const a = p[aKey];
    const b = p[bKey];
    if (a && b) {
      const t = tube(V(a), V(b), scale(g, profile));
      if (regionColor && region) paint(t, regionColor(region));
      parts.push(t);
    }
  };

  const blob = (geo: THREE.BufferGeometry, region?: RegionKey) => {
    if (regionColor && region) paint(geo, regionColor(region));
    parts.push(geo);
  };

  // Legs
  seg("hipL", "kneeL", thighProfile, "thighL");
  seg("kneeL", "ankleL", shankProfile, "shankL");
  seg("hipR", "kneeR", thighProfile, "thighR");
  seg("kneeR", "ankleR", shankProfile, "shankR");
  // Arms
  seg("shoulderL", "elbowL", upperArmProfile, "upperArmL");
  seg("elbowL", "handL", forearmProfile, "forearmL");
  seg("shoulderR", "elbowR", upperArmProfile, "upperArmR");
  seg("elbowR", "handR", forearmProfile, "forearmR");

  // Torso: a lofted tube from pelvis→trunkTop, broad at the chest.
  if (p.pelvis && p.trunkTop) {
    const torsoProfile: Profile = (t) =>
      (0.12 + 0.05 * Math.sin(t * Math.PI) + 0.03 * t) * g;
    const torso = tube(V(p.pelvis), V(p.trunkTop), torsoProfile);
    if (regionColor) paint(torso, regionColor("trunk"));
    parts.push(torso);
    // Chest breadth: a flattened ellipsoid across the shoulders.
    if (p.shoulderL && p.shoulderR) {
      const sMid = V(p.shoulderL).add(V(p.shoulderR)).multiplyScalar(0.5);
      const dir = new THREE.Vector3()
        .subVectors(V(p.trunkTop), V(p.pelvis))
        .normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(UP, dir);
      blob(ellipsoid(sMid, [0.19 * g, 0.11 * g, 0.13 * g], q), "trunk");
    }
  }

  // Pelvis mass
  if (p.pelvis)
    blob(ellipsoid(V(p.pelvis), [0.15 * g, 0.1 * g, 0.13 * g]), "pelvis");

  // Neck + head
  if (p.trunkTop && p.headTop) {
    seg("trunkTop", "headTop", () => 0.045 * g, "head");
    blob(ellipsoid(V(p.headTop), [0.088, 0.1, 0.088]), "head");
  }

  // Hands: a small tube from wrist→hand tip so they fuse with the forearm
  // instead of floating as separate blobs.
  for (const [wrist, hand, region] of [
    ["elbowL", "handL", "forearmL"],
    ["elbowR", "handR", "forearmR"],
  ] as const) {
    const w = p[wrist];
    const hnd = p[hand];
    if (w && hnd) {
      // Extend slightly past the hand point for a rounded fist.
      const wv = V(w),
        hv = V(hnd);
      const dir = new THREE.Vector3().subVectors(hv, wv).normalize();
      const tip = hv.clone().add(dir.multiplyScalar(0.05 * g));
      const h = tube(
        hv.clone().sub(dir.clone().multiplyScalar(0.04 * g)),
        tip,
        () => 0.035 * g,
      );
      if (regionColor) paint(h, regionColor(region));
      parts.push(h);
    }
  }
  for (const f of [
    ["ankleL", "toeL", "footL"],
    ["ankleR", "toeR", "footR"],
  ] as const) {
    const a = p[f[0]];
    const b = p[f[1]];
    if (a && b) {
      const mid = V(a).add(V(b)).multiplyScalar(0.5);
      blob(ellipsoid(mid, [0.04 * g, 0.035 * g, 0.11 * g]), f[2]);
    }
  }

  const merged = mergeGeometries(parts, false) ?? new THREE.BufferGeometry();
  parts.forEach((pt) => pt.dispose());
  merged.computeVertexNormals(); // smooth shading across the whole surface
  return merged;
}
