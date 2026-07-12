import type {
  Force,
  GeometryResult,
  Material,
  RawMesh,
  Support,
  Vec3,
  FeaResult,
} from "../types";
import { distance, length } from "./vec";

/**
 * Lightweight, honest stress approximation — NOT a true finite-element solver.
 *
 * Model: treat the part as a loaded member and estimate a von Mises-like stress
 * field that (a) peaks near load application points, (b) decays with distance,
 * (c) rises near fixed supports (reaction concentration), and (d) scales with
 * the global nominal stress σ = F / A_section from beam theory. The result is
 * indicative — useful for spotting concentration regions and comparing designs,
 * and clearly labeled as an approximation in the UI.
 *
 * Written as a pure function so it can later be replaced by a WASM FE kernel or
 * a backend solver without touching the viewer.
 */
export function analyzeFea(
  mesh: RawMesh,
  geometry: GeometryResult,
  material: Material,
  forces: readonly Force[],
  supports: readonly Support[],
): FeaResult {
  const uniqueVerts = dedupeVertices(mesh.positions);
  const n = uniqueVerts.length;
  const vertexStress = new Float32Array(n);

  const totalForce = forces.reduce((s, f) => s + f.magnitude, 0);
  const { size } = geometry.boundingBox;

  // Nominal cross-section normal to the smallest bbox dimension (mm²).
  const dims = [size[0], size[1], size[2]].sort((a, b) => a - b);
  const sectionArea = Math.max(1, dims[1]! * dims[2]!);
  // Section modulus for the bending term (rectangular): b·h²/6.
  const sectionModulus = Math.max(1, (dims[1]! * dims[2]! * dims[2]!) / 6);

  const diag = length(size) || 1;
  const decay = diag * 0.35; // influence radius of a load

  let maxStress = 0;

  for (let i = 0; i < n; i++) {
    const v = uniqueVerts[i]!;
    let stress = 0;

    for (const f of forces) {
      const d = distance(v, f.point);
      const falloff = Math.exp(-(d * d) / (2 * decay * decay));
      // Axial term + bending term (lever arm ≈ distance along model).
      const axial = f.magnitude / sectionArea;
      const bending = (f.magnitude * Math.min(d, diag)) / sectionModulus;
      stress += (axial + bending) * falloff;
    }

    // Reaction concentration near fixed supports.
    for (const s of supports) {
      const d = distance(v, s.point);
      const falloff = Math.exp(-(d * d) / (2 * (decay * 0.5) ** 2));
      stress += (totalForce / sectionArea) * 0.6 * falloff;
    }

    vertexStress[i] = stress;
    if (stress > maxStress) maxStress = stress;
  }

  // Displacement via δ ≈ σ·L / E (crude axial analogue), in mm.
  const maxDisplacement =
    material.youngsModulus > 0
      ? (maxStress * diag) / material.youngsModulus
      : 0;
  const estimatedStrain =
    material.youngsModulus > 0 ? maxStress / material.youngsModulus : 0;
  const safetyFactor =
    maxStress > 1e-6 ? material.yieldStrength / maxStress : 999;

  // Report the few highest-stress vertices as concentration markers.
  const stressConcentrations = topStressPoints(uniqueVerts, vertexStress, 3);

  return {
    vertexStress,
    maxStress,
    maxDisplacement,
    estimatedStrain,
    safetyFactor: Math.min(safetyFactor, 999),
    stressConcentrations,
    method: "linear-beam-approximation",
  };
}

/** Deduplicate to unique vertex positions (order-stable). */
function dedupeVertices(positions: Float32Array): Vec3[] {
  const seen = new Map<string, number>();
  const out: Vec3[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!, y = positions[i + 1]!, z = positions[i + 2]!;
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (!seen.has(key)) {
      seen.set(key, out.length);
      out.push([x, y, z]);
    }
  }
  return out;
}

function topStressPoints(
  verts: Vec3[],
  stress: Float32Array,
  count: number,
): Vec3[] {
  return verts
    .map((v, i) => ({ v, s: stress[i]! }))
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .filter((e) => e.s > 0)
    .map((e) => e.v);
}

/**
 * Map a stress value to an RGB heat color (blue → green → yellow → red).
 * Kept here so both the viewer and the report use the identical scale.
 */
export function stressToColor(
  stress: number,
  maxStress: number,
): [number, number, number] {
  const t = maxStress > 0 ? Math.min(1, stress / maxStress) : 0;
  // 0 → blue(240°), 1 → red(0°) through the hue wheel.
  const hue = (1 - t) * 240;
  return hslToRgb(hue / 360, 0.85, 0.5);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3)];
}
