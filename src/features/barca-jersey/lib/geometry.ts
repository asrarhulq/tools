import * as THREE from "three";

/**
 * Procedural jersey geometry. The torso is a single `LatheGeometry` revolved
 * around the Y axis — radially symmetric, so its built-in UVs already give
 * us exactly what a jersey texture needs: `u` sweeps around the body (ideal
 * for wrapping vertical stripes) and `v` runs hem→collar (ideal for stacking
 * trim bands, the crest, the sponsor, and the back print by height). No
 * external model, no manual UV unwrap.
 *
 * `phiStart = PI/2` rotates the seam (the texture's u=0/u=1 edge) to the
 * body's side, under the sleeve, so the front print and the back print each
 * sit mid-texture with room on both sides — see `lib/texture.ts` for the
 * matching FRONT_U/BACK_U constants.
 */

const TORSO_PROFILE: ReadonlyArray<readonly [radius: number, height: number]> =
  [
    [0.6, 0],
    [0.63, 0.08],
    [0.58, 0.45],
    [0.66, 0.85],
    [0.64, 1.15],
    [0.57, 1.35],
    [0.46, 1.5],
    [0.3, 1.6],
    [0.17, 1.68],
  ];

/** Vertical shift so the torso is centered near the scene origin. */
export const TORSO_CENTER_OFFSET = 0.84;

/**
 * `LatheGeometry` parametrizes v by *cumulative arc length* along the
 * profile, not by height — a steep taper (like the neck) covers a lot of v
 * for very little height. These are that same arc-length v for each profile
 * point, so `lib/texture.ts` can place the crest and the back print at the
 * body heights they're named for instead of guessing a canvas fraction.
 */
export const PROFILE_V: ReadonlyArray<number> = (() => {
  const lengths = TORSO_PROFILE.slice(1).map(([r, y], i) => {
    const [r0, y0] = TORSO_PROFILE[i]!;
    return Math.hypot(r - r0, y - y0);
  });
  const total = lengths.reduce((a, b) => a + b, 0);
  const cumulative: number[] = [0];
  let acc = 0;
  for (const len of lengths) {
    acc += len;
    cumulative.push(acc / total);
  }
  return cumulative;
})();

export const V_CHEST = PROFILE_V[3]!;
export const V_UPPER_CHEST = PROFILE_V[4]!;
export const V_SHOULDER = PROFILE_V[6]!;
export const V_NECK_BASE = PROFILE_V[7]!;

export function buildTorsoGeometry(): THREE.BufferGeometry {
  const points = TORSO_PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
  const geometry = new THREE.LatheGeometry(
    points,
    56,
    Math.PI / 2,
    Math.PI * 2,
  );
  geometry.translate(0, -TORSO_CENTER_OFFSET, 0);
  geometry.computeVertexNormals();
  return geometry;
}

const SLEEVE_HEIGHT = 0.62;
const SLEEVE_SHOULDER_RADIUS = 0.3;
const SLEEVE_CUFF_RADIUS = 0.19;
const SHOULDER_HEIGHT = 1.5 - TORSO_CENTER_OFFSET;
const SHOULDER_REACH = 0.4;

export function buildSleeveGeometry(): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(
    SLEEVE_SHOULDER_RADIUS,
    SLEEVE_CUFF_RADIUS,
    SLEEVE_HEIGHT,
    28,
    1,
    false,
  );
}

export function buildCuffGeometry(): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(
    SLEEVE_CUFF_RADIUS + 0.012,
    SLEEVE_CUFF_RADIUS + 0.012,
    0.06,
    28,
    1,
    true,
  );
}

export interface SleevePlacement {
  readonly position: THREE.Vector3;
  readonly cuffPosition: THREE.Vector3;
  readonly quaternion: THREE.Quaternion;
}

/** Positions and orients a sleeve so it reaches out from the shoulder at a
 * natural down-and-forward angle, overlapping the torso enough to hide the
 * seam between the two meshes. */
export function sleevePlacement(side: "left" | "right"): SleevePlacement {
  const sign = side === "right" ? 1 : -1;
  const dir = new THREE.Vector3(sign, -0.55, 0.18).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir,
  );
  const attach = new THREE.Vector3(
    sign * SHOULDER_REACH,
    SHOULDER_HEIGHT,
    0.05,
  );
  const position = attach.clone().addScaledVector(dir, SLEEVE_HEIGHT / 2 - 0.1);
  const cuffPosition = attach
    .clone()
    .addScaledVector(dir, SLEEVE_HEIGHT - 0.08);
  return { position, cuffPosition, quaternion };
}
