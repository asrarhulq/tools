import * as THREE from "three";

/**
 * Procedural jersey geometry — a hand-built parametric surface, not a
 * `LatheGeometry` revolve. The torso cross-section is an **ellipse**
 * (noticeably flatter front-to-back than side-to-side, like an actual
 * ribcage) rather than a circle, tapers through a smoothstepped waist/chest
 * contour, and the front of the neckline **dips** below the back the way a
 * real crew neck does — a plain radial revolve can't do any of that, it can
 * only produce a perfectly round tube.
 *
 * Because the cross-section is elliptical, equal angle steps around it do
 * NOT cover equal arc length (the curvature is tighter at the narrow
 * front/back than at the wide sides), so a naive angle-stepped UV would
 * stretch the stripe texture unevenly. `thetaAt` walks a precomputed
 * arc-length table instead, so `u` is arc-length-uniform all the way around.
 *
 * `u=0` sits at the body's side (under the sleeve) — the texture seam — so
 * the front print and the back print each land mid-texture with margin on
 * both sides. See `lib/texture.ts`'s `FRONT_U`/`BACK_U`.
 */

const HEM_TO_UNDERARM = 2.2;
const YOKE_HEIGHT = 0.38;
const COLLAR_HEIGHT = 0.1;
const TOTAL_HEIGHT = HEM_TO_UNDERARM + YOKE_HEIGHT + COLLAR_HEIGHT;

/** Ellipse semi-axes used only to build the arc-length table below — a
 * fixed reference shape close enough to every row's actual proportions
 * that the resulting `u` stays visually even all the way up the body. */
const REF_A = 1.0;
const REF_B = 0.52;

const NECK_A = 0.36;
const NECK_B = 0.3;
const NECK_FRONT_DIP = 0.15;

/** Vertical shift so the torso sits centered near the scene origin. */
export const CENTER_OFFSET = TOTAL_HEIGHT / 2;

function smoothstep(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

interface TorsoRow {
  readonly y: number;
  readonly a: number;
  readonly b: number;
  readonly dip: number;
}

function buildRows(): readonly TorsoRow[] {
  const rows: TorsoRow[] = [];
  const bodySteps = 36;
  for (let i = 0; i <= bodySteps; i++) {
    const y = (i / bodySteps) * HEM_TO_UNDERARM;
    const s = y / HEM_TO_UNDERARM;
    const a =
      0.93 + 0.07 * smoothstep(s * 1.3) + 0.04 * (1 - smoothstep(y / 0.35));
    rows.push({ y, a, b: a * 0.52, dip: 0 });
  }
  const rim = rows[rows.length - 1]!;

  const yokeSteps = 16;
  for (let k = 1; k <= yokeSteps; k++) {
    const t = k / yokeSteps;
    const e = smoothstep(t);
    rows.push({
      y: HEM_TO_UNDERARM + t * YOKE_HEIGHT,
      a: rim.a + (NECK_A - rim.a) * e,
      b: rim.b + (NECK_B - rim.b) * e,
      dip: NECK_FRONT_DIP * t * t * t,
    });
  }

  const collarSteps = 3;
  for (let c = 1; c <= collarSteps; c++) {
    rows.push({
      y: HEM_TO_UNDERARM + YOKE_HEIGHT + (COLLAR_HEIGHT * c) / collarSteps,
      a: NECK_A,
      b: NECK_B,
      dip: NECK_FRONT_DIP,
    });
  }
  return rows;
}

/** Arc-length-uniform angle for a point `u` (0..1) around the reference
 * ellipse — built once at module load, same table reused for every row. */
const thetaAt = (() => {
  const samples = 4000;
  const cumulative = new Float64Array(samples + 1);
  let prevX = REF_A * Math.cos(Math.PI);
  let prevZ = REF_B * Math.sin(Math.PI);
  for (let i = 1; i <= samples; i++) {
    const theta = Math.PI - (2 * Math.PI * i) / samples;
    const x = REF_A * Math.cos(theta);
    const z = REF_B * Math.sin(theta);
    cumulative[i] = cumulative[i - 1]! + Math.hypot(x - prevX, z - prevZ);
    prevX = x;
    prevZ = z;
  }
  const total = cumulative[samples]!;

  return (u: number): number => {
    const want = u * total;
    let lo = 0;
    let hi = samples;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid]! <= want) lo = mid;
      else hi = mid;
    }
    const span = cumulative[hi]! - cumulative[lo]!;
    const f = span > 0 ? (want - cumulative[lo]!) / span : 0;
    return Math.PI - (2 * Math.PI * (lo + f)) / samples;
  };
})();

export function buildTorsoGeometry(): THREE.BufferGeometry {
  const rows = buildRows();
  const columns = 200;
  const thetas: number[] = [];
  for (let j = 0; j <= columns; j++) thetas.push(thetaAt(j / columns));

  const rowCount = rows.length;
  const position = new Float32Array((columns + 1) * rowCount * 3);
  const uv = new Float32Array((columns + 1) * rowCount * 2);

  for (let ri = 0; ri < rowCount; ri++) {
    const row = rows[ri]!;
    for (let cj = 0; cj <= columns; cj++) {
      const theta = thetas[cj]!;
      const idx = ri * (columns + 1) + cj;
      const frontFade = Math.max(0, Math.sin(theta));
      position[idx * 3] = row.a * Math.cos(theta);
      position[idx * 3 + 1] = row.y - row.dip * frontFade * frontFade;
      position[idx * 3 + 2] = row.b * Math.sin(theta);
      uv[idx * 2] = cj / columns;
      uv[idx * 2 + 1] = row.y / TOTAL_HEIGHT;
    }
  }

  const index: number[] = [];
  for (let r = 0; r < rowCount - 1; r++) {
    for (let c = 0; c < columns; c++) {
      const a = r * (columns + 1) + c;
      const b = a + 1;
      const d = a + (columns + 1);
      const e = d + 1;
      index.push(a, b, d, b, e, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();

  // The u=0 and u=columns columns are the same physical seam line;
  // computeVertexNormals treats them as separate vertices with different
  // neighbors, which leaves a faint lighting crease. Average them.
  const normal = geometry.attributes.normal as THREE.BufferAttribute;
  for (let r = 0; r < rowCount; r++) {
    const i0 = r * (columns + 1);
    const i1 = i0 + columns;
    const nx = normal.getX(i0) + normal.getX(i1);
    const ny = normal.getY(i0) + normal.getY(i1);
    const nz = normal.getZ(i0) + normal.getZ(i1);
    const len = Math.hypot(nx, ny, nz) || 1;
    normal.setXYZ(i0, nx / len, ny / len, nz / len);
    normal.setXYZ(i1, nx / len, ny / len, nz / len);
  }

  geometry.translate(0, -CENTER_OFFSET, 0);
  return geometry;
}

const SLEEVE_LENGTH = 0.95;
const SLEEVE_SHOULDER_RADIUS = 0.4;
const SLEEVE_CUFF_RADIUS = 0.35;
const SLEEVE_ANGLE = (38 * Math.PI) / 180;
const SLEEVE_ATTACH_X = 0.78;
const SLEEVE_ATTACH_Y = HEM_TO_UNDERARM - 0.3 - CENTER_OFFSET;

export function buildSleeveGeometry(): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(
    SLEEVE_SHOULDER_RADIUS,
    SLEEVE_CUFF_RADIUS,
    SLEEVE_LENGTH,
    48,
    1,
    true,
  );
}

export interface SleevePlacement {
  readonly position: THREE.Vector3;
  readonly quaternion: THREE.Quaternion;
}

/** Positions and orients a sleeve so its wide (shoulder) end meets the
 * torso at the underarm and it reaches out and down at a natural angle —
 * the taper and the attach point are picked so the two surfaces meet
 * without a visible gap, no overlap hack required. */
export function sleevePlacement(side: "left" | "right"): SleevePlacement {
  const sign = side === "right" ? 1 : -1;
  const direction = new THREE.Vector3(
    sign * Math.cos(SLEEVE_ANGLE),
    -Math.sin(SLEEVE_ANGLE),
    0,
  );
  const attach = new THREE.Vector3(sign * SLEEVE_ATTACH_X, SLEEVE_ATTACH_Y, 0);
  const position = attach.clone().addScaledVector(direction, SLEEVE_LENGTH / 2);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().negate(),
  );
  return { position, quaternion };
}

/** Height fractions (0 = hem, 1 = collar) for where the crest and the back
 * print sit — plain height ratios now, since `uv.y` is linear in height for
 * this geometry (no arc-length skew to correct for, unlike a Lathe revolve). */
export const V_CHEST = (HEM_TO_UNDERARM * 0.62) / TOTAL_HEIGHT;
export const V_UPPER_CHEST = (HEM_TO_UNDERARM * 0.86) / TOTAL_HEIGHT;
export const V_SHOULDER = (HEM_TO_UNDERARM + YOKE_HEIGHT * 0.55) / TOTAL_HEIGHT;
