import type { BuildPlateContact, Orientation, Vec3 } from "../types";

/**
 * ── Orientation & build-plate geometry ──────────────────────────────────────
 *
 * Pure transforms over the raw triangle-soup positions. The analyzer keeps the
 * originally-parsed mesh immutable and derives an *oriented* positions array
 * through here whenever the user rotates the part or drops it to the plate.
 * All downstream analysis (mass properties, stability, FEA, printing) then runs
 * on the oriented mesh, so changing orientation correctly updates every result.
 *
 * Convention: +Z is up (build direction), the build plate is the z = 0 plane.
 * ────────────────────────────────────────────────────────────────────────────
 */

const DEG = Math.PI / 180;

/** Build a 3×3 rotation matrix (row-major) for XYZ Euler angles in degrees. */
export function rotationMatrix(o: Orientation): number[] {
  const cx = Math.cos(o.rx * DEG),
    sx = Math.sin(o.rx * DEG);
  const cy = Math.cos(o.ry * DEG),
    sy = Math.sin(o.ry * DEG);
  const cz = Math.cos(o.rz * DEG),
    sz = Math.sin(o.rz * DEG);

  // Rz · Ry · Rx (apply X, then Y, then Z).
  return [
    cz * cy,
    cz * sy * sx - sz * cx,
    cz * sy * cx + sz * sx,
    sz * cy,
    sz * sy * sx + cz * cx,
    sz * sy * cx - cz * sx,
    -sy,
    cy * sx,
    cy * cx,
  ];
}

/** Rotate a single point by a row-major 3×3 matrix. */
export function applyMatrix(m: number[], p: Vec3): Vec3 {
  return [
    m[0]! * p[0] + m[1]! * p[1] + m[2]! * p[2],
    m[3]! * p[0] + m[4]! * p[1] + m[5]! * p[2],
    m[6]! * p[0] + m[7]! * p[1] + m[8]! * p[2],
  ];
}

/**
 * Produce an oriented copy of the mesh positions: rotate about the mesh centre,
 * then (if `dropToPlate`) translate so the lowest point rests on z = 0. Rotating
 * about the centre keeps the part in view; the drop makes the plate meaningful.
 */
export function orientPositions(
  positions: Float32Array,
  orientation: Orientation,
  dropToPlate = true,
): Float32Array {
  const m = rotationMatrix(orientation);

  // Rotation centre = bounding-box centre of the source mesh.
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!,
      y = positions[i + 1]!,
      z = positions[i + 2]!;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  const cx = (minX + maxX) / 2,
    cy = (minY + maxY) / 2,
    cz = (minZ + maxZ) / 2;

  const out = new Float32Array(positions.length);
  let lowestZ = Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const r = applyMatrix(m, [
      positions[i]! - cx,
      positions[i + 1]! - cy,
      positions[i + 2]! - cz,
    ]);
    out[i] = r[0];
    out[i + 1] = r[1];
    out[i + 2] = r[2];
    if (r[2] < lowestZ) lowestZ = r[2];
  }

  if (dropToPlate && Number.isFinite(lowestZ)) {
    for (let i = 2; i < out.length; i += 3) out[i]! -= lowestZ;
  }
  return out;
}

/**
 * Find the orientation angles that lay the part's largest flat face on the
 * plate. We look at face normals, group near-parallel ones, and pick the group
 * with the greatest total area, then compute the rotation that maps that normal
 * to −Z (pointing into the plate).
 */
export function bestFlatOrientation(positions: Float32Array): Orientation {
  const triangles = positions.length / 9;
  // Accumulate area per quantized normal direction.
  const buckets = new Map<string, { n: Vec3; area: number }>();
  for (let i = 0; i < triangles; i++) {
    const o = i * 9;
    const ax = positions[o]!,
      ay = positions[o + 1]!,
      az = positions[o + 2]!;
    const bx = positions[o + 3]!,
      by = positions[o + 4]!,
      bz = positions[o + 5]!;
    const cx = positions[o + 6]!,
      cy = positions[o + 7]!,
      cz = positions[o + 8]!;
    const ux = bx - ax,
      uy = by - ay,
      uz = bz - az;
    const vx = cx - ax,
      vy = cy - ay,
      vz = cz - az;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    const area = len / 2;
    nx /= len;
    ny /= len;
    nz /= len;
    const key = `${Math.round(nx * 20)},${Math.round(ny * 20)},${Math.round(nz * 20)}`;
    const b = buckets.get(key);
    if (b) b.area += area;
    else buckets.set(key, { n: [nx, ny, nz], area });
  }
  let best: { n: Vec3; area: number } | null = null;
  for (const b of buckets.values()) if (!best || b.area > best.area) best = b;
  if (!best) return { rx: 0, ry: 0, rz: 0 };

  // Rotate so the winning normal points to −Z. Solve for rx, ry (rz irrelevant).
  const [nx, ny, nz] = best.n;
  // Desired: R·n = (0,0,-1). Use tilt about X and Y from the normal components.
  const ry = Math.atan2(nx, -nz) / DEG;
  const rx = Math.atan2(ny, Math.hypot(nx, nz)) / DEG;
  return { rx, ry, rz: 0 };
}

/**
 * Detect the contact region of an *already oriented* mesh (part sitting on the
 * plate at z = 0). Triangles whose vertices all lie within `tol` of the plate
 * count as contact; their projected area and convex-hull footprint drive the
 * default fixed constraint and the stability support polygon.
 */
export function detectContact(
  positions: Float32Array,
  tol?: number,
): BuildPlateContact {
  const triangles = positions.length / 9;
  // Tolerance scales with model size so it is robust to units/resolution.
  let maxDim = 0;
  for (let i = 0; i < positions.length; i += 3) {
    maxDim = Math.max(maxDim, Math.abs(positions[i + 2]!));
  }
  const t = tol ?? Math.max(0.05, maxDim * 0.005);

  let faceCount = 0;
  let area = 0;
  const pts: Vec3[] = [];
  const seen = new Set<string>();
  const flat: [number, number][] = [];

  for (let i = 0; i < triangles; i++) {
    const o = i * 9;
    const z0 = positions[o + 2]!,
      z1 = positions[o + 5]!,
      z2 = positions[o + 8]!;
    if (z0 <= t && z1 <= t && z2 <= t) {
      faceCount++;
      const ax = positions[o]!,
        ay = positions[o + 1]!;
      const bx = positions[o + 3]!,
        by = positions[o + 4]!;
      const cx = positions[o + 6]!,
        cy = positions[o + 7]!;
      // Projected (XY) triangle area.
      area += Math.abs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) / 2;
      for (const [x, y] of [
        [ax, ay],
        [bx, by],
        [cx, cy],
      ] as const) {
        const k = `${Math.round(x * 100)},${Math.round(y * 100)}`;
        if (!seen.has(k)) {
          seen.add(k);
          pts.push([x, y, 0]);
          flat.push([x, y]);
        }
      }
    }
  }

  return {
    faceCount,
    area,
    footprint: convexHull2D(flat),
    contactPoints: pts,
  };
}

/** Andrew's monotone-chain convex hull for 2D points. */
export function convexHull2D(
  points: readonly (readonly [number, number])[],
): (readonly [number, number])[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (
    o: readonly [number, number],
    a: readonly [number, number],
    b: readonly [number, number],
  ) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: (readonly [number, number])[] = [];
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0
    )
      lower.pop();
    lower.push(p);
  }
  const upper: (readonly [number, number])[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0
    )
      upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}
