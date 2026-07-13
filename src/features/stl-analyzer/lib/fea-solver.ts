/**
 * ── Voxel-hexahedral linear-elastic finite-element solver ───────────────────
 *
 * A genuine (if compact) FEM, written in pure TypeScript with no dependencies,
 * no DOM and no Three.js, so it runs inside the analysis Web Worker and can be
 * ported to WASM later without touching the UI contract. It replaces the old
 * beam/decay approximation with a real stiffness solve.
 *
 * Method
 * ------
 * 1.  Fit an axis-aligned voxel grid to the part's bounding box. The longest
 *     axis gets `res` voxels (8 ≤ res ≤ maxResolution); the other axes scale by
 *     extent so voxels stay roughly cubic. Total filled elements are capped so
 *     the degree-of-freedom count stays tractable in a browser tab.
 * 2.  Solidify: a voxel is "solid" when its centre lies inside the mesh, tested
 *     by casting a ray along +X and counting robust Möller–Trumbore triangle
 *     intersections (odd ⇒ inside). Triangle AABBs prune the Y/Z sweep.
 * 3.  Nodes sit at voxel corners. Only nodes touching a solid element are
 *     active; each active node owns three displacement DOFs (x, y, z).
 * 4.  Each solid voxel is an 8-node trilinear hexahedron (H8). Its 24×24 element
 *     stiffness is integrated with 2×2×2 Gauss quadrature against an *isotropic*
 *     linear-elastic constitutive matrix D built from an effective modulus
 *     E = (2·modulusXY + modulusZ)/3 and ν = 0.35 — an "orthotropic-lite"
 *     compromise that keeps the system SPD and cheap while still respecting the
 *     weaker build (Z) direction on average.
 * 5.  The global stiffness is assembled sparsely (row → col → value maps); no
 *     dense (3N)² matrix is ever allocated.
 * 6.  Point loads are lumped onto the nearest active node. Constraints pin DOFs
 *     to zero via the penalty method (a large diagonal spike), which is robust
 *     and never reorders the system.
 * 7.  K·u = f is solved with a Jacobi-preconditioned Conjugate Gradient
 *     iteration (the matrix is symmetric positive-definite).
 * 8.  Element von Mises stress is recovered at each voxel centre (σ = D·B·u),
 *     then results are sampled back onto the render mesh's triangle-soup
 *     vertices *by 3D position* (the key fix over index-modulo sampling).
 *
 * This is an in-browser approximation — coarse voxelisation, lumped loads and a
 * simplified constitutive model — intended for comparative engineering
 * assessment (spotting concentration regions, ranking designs), not certified
 * structural analysis.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type {
  Constraint,
  EffectiveMaterial,
  FeaResult,
  Force,
  Vec3,
} from "../types";

// ── Tunables ────────────────────────────────────────────────────────────────

/** Isotropic Poisson ratio used for the constitutive matrix. */
const POISSON = 0.35;
/** Ceiling on filled voxel elements; drives the auto resolution back-off. */
const MAX_ELEMENTS = 4000;
/** Default longest-axis voxel count when the caller passes no `maxResolution`. */
const DEFAULT_RESOLUTION = 20;
/** Hard cap on the longest-axis voxel count regardless of request. */
const RESOLUTION_CAP = 24;
/** Minimum longest-axis voxel count. */
const MIN_RESOLUTION = 8;

/** Conjugate-gradient relative-residual tolerance. */
const CG_TOL = 1e-6;
/** Absolute cap on CG iterations. */
const CG_MAX_ITERS = 5000;

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Solve one linear-elastic load case on a voxelised copy of the part.
 *
 * @param positions Flat triangle-soup vertex positions, length = 9·triangles,
 *   in oriented model space (mm), part already dropped so min-z ≈ 0.
 * @param eff       Effective (as-printed) material properties.
 * @param yieldStrength Effective yield strength (MPa) for the safety factor.
 * @param forces    Point loads (N) applied at model-space points.
 * @param constraint How the part is held (which nodes are pinned).
 * @param opts      Optional longest-axis voxel count override (capped at ~24).
 */
export function solveFea(
  positions: Float32Array,
  eff: EffectiveMaterial,
  yieldStrength: number,
  forces: readonly Force[],
  constraint: Constraint,
  opts?: { maxResolution?: number },
): FeaResult {
  const vertexCount = Math.floor(positions.length / 3);

  // Degenerate / empty input → honest zeroed result, never throw.
  if (positions.length < 9 || forces.length === 0) {
    return zeroedResult(vertexCount);
  }

  // Effective isotropic modulus (MPa). Guard against zero.
  const E = Math.max(1e-6, (2 * eff.modulusXY + eff.modulusZ) / 3);

  // ── 1. Bounding box + voxel grid ──────────────────────────────────────────
  const bb = boundingBox(positions);
  const extent: Vec3 = [
    Math.max(bb.max[0] - bb.min[0], 1e-6),
    Math.max(bb.max[1] - bb.min[1], 1e-6),
    Math.max(bb.max[2] - bb.min[2], 1e-6),
  ];
  const longest = Math.max(extent[0], extent[1], extent[2]);

  const requested = clampInt(
    opts?.maxResolution ?? DEFAULT_RESOLUTION,
    MIN_RESOLUTION,
    RESOLUTION_CAP,
  );

  // Resolution back-off: shrink until the estimated filled-element count fits.
  // We do not know the fill fraction up front, so we bound by the *total* voxel
  // count and let the actual solid count come in under MAX_ELEMENTS naturally.
  let grid = makeGrid(bb.min, extent, longest, requested);
  while (
    grid.nx * grid.ny * grid.nz > MAX_ELEMENTS * 3 &&
    grid.res > MIN_RESOLUTION
  ) {
    grid = makeGrid(bb.min, extent, longest, grid.res - 1);
  }

  // Precompute triangle AABBs for ray-cast pruning.
  const tris = buildTriangles(positions);

  // ── 2. Solidify (voxel occupancy) ─────────────────────────────────────────
  const { nx, ny, nz, dx, dy, dz, origin } = grid;
  const elementCountTotal = nx * ny * nz;
  const solid = new Uint8Array(elementCountTotal);
  let filled = 0;

  const centre = (ix: number, iy: number, iz: number): Vec3 => [
    origin[0] + (ix + 0.5) * dx,
    origin[1] + (iy + 0.5) * dy,
    origin[2] + (iz + 0.5) * dz,
  ];

  for (let iz = 0; iz < nz; iz++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        if (insideByRaycast(tris, centre(ix, iy, iz))) {
          solid[elemIndex(ix, iy, iz, nx, ny)] = 1;
          filled++;
        }
      }
    }
  }

  // Fallback: not watertight / no centre inside → fill voxels overlapping tris.
  if (filled === 0) {
    for (const t of tris) {
      const lo0 = clampInt(Math.floor((t.minX - origin[0]) / dx), 0, nx - 1);
      const hi0 = clampInt(Math.floor((t.maxX - origin[0]) / dx), 0, nx - 1);
      const lo1 = clampInt(Math.floor((t.minY - origin[1]) / dy), 0, ny - 1);
      const hi1 = clampInt(Math.floor((t.maxY - origin[1]) / dy), 0, ny - 1);
      const lo2 = clampInt(Math.floor((t.minZ - origin[2]) / dz), 0, nz - 1);
      const hi2 = clampInt(Math.floor((t.maxZ - origin[2]) / dz), 0, nz - 1);
      for (let iz = lo2; iz <= hi2; iz++) {
        for (let iy = lo1; iy <= hi1; iy++) {
          for (let ix = lo0; ix <= hi0; ix++) {
            const e = elemIndex(ix, iy, iz, nx, ny);
            if (!solid[e]) {
              solid[e] = 1;
              filled++;
            }
          }
        }
      }
    }
  }

  // Still nothing (empty mesh in practice) → zeroed result.
  if (filled === 0) {
    return zeroedResult(vertexCount, grid.res);
  }

  // ── 3. Node grid + active-node DOF map ────────────────────────────────────
  const gnx = nx + 1;
  const gny = ny + 1;
  const gnz = nz + 1;
  const nodeCountTotal = gnx * gny * gnz;
  // nodeDof[nodeIndex] = first DOF of an active node, or -1 if inactive.
  const nodeDof = new Int32Array(nodeCountTotal).fill(-1);
  // Node positions retained for load lookup / interpolation.
  let ndof = 0;

  const markNode = (jx: number, jy: number, jz: number): void => {
    const n = nodeIndex(jx, jy, jz, gnx, gny);
    if (nodeDof[n]! === -1) {
      nodeDof[n] = ndof;
      ndof += 3;
    }
  };

  // Solid-element → its 8 corner node indices (local ordering below).
  for (let iz = 0; iz < nz; iz++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        if (!solid[elemIndex(ix, iy, iz, nx, ny)]) continue;
        for (let c = 0; c < 8; c++) {
          const off = HEX_CORNERS[c]!;
          markNode(ix + off[0], iy + off[1], iz + off[2]);
        }
      }
    }
  }

  // ── 4. Element stiffness (H8, isotropic D, 2×2×2 Gauss) ────────────────────
  const D = constitutiveMatrix(E, POISSON); // 6×6, row-major length 36
  const Ke = hexStiffness(dx, dy, dz, D); // 24×24, row-major length 576

  // ── 5. Assembly (sparse row → col → value) ────────────────────────────────
  const K: Array<Map<number, number>> = new Array(ndof);
  for (let i = 0; i < ndof; i++) K[i] = new Map<number, number>();
  const addK = (r: number, c: number, v: number): void => {
    const row = K[r]!;
    row.set(c, (row.get(c) ?? 0) + v);
  };

  // Local corner → global DOF scratch for one element.
  const edof = new Int32Array(24);
  for (let iz = 0; iz < nz; iz++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        if (!solid[elemIndex(ix, iy, iz, nx, ny)]) continue;
        for (let c = 0; c < 8; c++) {
          const off = HEX_CORNERS[c]!;
          const nIdx = nodeIndex(
            ix + off[0],
            iy + off[1],
            iz + off[2],
            gnx,
            gny,
          );
          const base = nodeDof[nIdx]!;
          edof[c * 3] = base;
          edof[c * 3 + 1] = base + 1;
          edof[c * 3 + 2] = base + 2;
        }
        for (let a = 0; a < 24; a++) {
          const ra = edof[a]!;
          for (let b = 0; b < 24; b++) {
            addK(ra, edof[b]!, Ke[a * 24 + b]!);
          }
        }
      }
    }
  }

  // Global RHS force vector.
  const f = new Float64Array(ndof);

  // ── 6. Loads (nearest active node) ────────────────────────────────────────
  const nodePos = (n: number): Vec3 => {
    const jx = n % gnx;
    const jy = Math.floor(n / gnx) % gny;
    const jz = Math.floor(n / (gnx * gny));
    return [origin[0] + jx * dx, origin[1] + jy * dy, origin[2] + jz * dz];
  };

  for (const force of forces) {
    const dir = normalize(force.direction);
    const nearest = nearestActiveNode(
      force.point,
      nodeDof,
      nodePos,
      nodeCountTotal,
    );
    if (nearest < 0) continue;
    const base = nodeDof[nearest]!;
    f[base]! += force.magnitude * dir[0];
    f[base + 1]! += force.magnitude * dir[1];
    f[base + 2]! += force.magnitude * dir[2];
  }

  // ── 7. Constraints (penalty method) ───────────────────────────────────────
  const fixed = resolveFixedNodes(
    constraint,
    nodeDof,
    nodePos,
    nodeCountTotal,
    origin[2],
    dz,
  );

  // Largest existing diagonal → penalty scale.
  let maxDiag = 0;
  for (let i = 0; i < ndof; i++) {
    const d = K[i]!.get(i) ?? 0;
    if (d > maxDiag) maxDiag = d;
  }
  const penalty = 1e12 * (maxDiag > 0 ? maxDiag : 1);

  // Ensure the system is not singular: if nothing got fixed, pin the lowest node.
  if (fixed.length === 0) {
    const lowest = lowestActiveNode(nodeDof, nodePos, nodeCountTotal);
    if (lowest >= 0)
      fixed.push(nodeDof[lowest]!, nodeDof[lowest]! + 1, nodeDof[lowest]! + 2);
  }
  for (const d of fixed) {
    addK(d, d, penalty);
    // RHS for pin-to-zero is penalty·0 = 0; explicit for clarity.
    f[d]! += 0;
  }

  // ── 8. Solve K·u = f (Jacobi-preconditioned CG) ───────────────────────────
  const { u, converged } = conjugateGradient(K, f, ndof);

  // ── 9. Recover element von Mises stresses ─────────────────────────────────
  // Strain-displacement B evaluated at the element centre (natural 0,0,0).
  const Bc = hexBAtCentre(dx, dy, dz); // 6×24, row-major length 144
  const elementStress: number[] = [];
  const elementCentres: Vec3[] = [];
  const ue = new Float64Array(24);
  let maxStress = 0;

  for (let iz = 0; iz < nz; iz++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        if (!solid[elemIndex(ix, iy, iz, nx, ny)]) continue;
        for (let c = 0; c < 8; c++) {
          const off = HEX_CORNERS[c]!;
          const nIdx = nodeIndex(
            ix + off[0],
            iy + off[1],
            iz + off[2],
            gnx,
            gny,
          );
          const base = nodeDof[nIdx]!;
          ue[c * 3] = u[base]!;
          ue[c * 3 + 1] = u[base + 1]!;
          ue[c * 3 + 2] = u[base + 2]!;
        }
        // strain = B·ue (length 6), stress = D·strain (length 6).
        const strain = matVec(Bc, ue, 6, 24);
        const stress = matVec(D, strain, 6, 6);
        const vm = vonMises(stress);
        elementStress.push(vm);
        elementCentres.push(centre(ix, iy, iz));
        if (vm > maxStress) maxStress = vm;
      }
    }
  }

  // ── Nodal displacement magnitudes for interpolation / max ─────────────────
  let maxDisplacement = 0;
  const nodeDisp = new Float64Array(nodeCountTotal);
  for (let n = 0; n < nodeCountTotal; n++) {
    const base = nodeDof[n]!;
    if (base < 0) continue;
    const mag = Math.hypot(u[base]!, u[base + 1]!, u[base + 2]!);
    nodeDisp[n] = mag;
    if (mag > maxDisplacement) maxDisplacement = mag;
  }

  const estimatedStrain = E > 0 ? maxStress / E : 0;
  const safetyFactor =
    maxStress > 1e-6 ? clampNum(yieldStrength / maxStress, 0, 999) : 999;

  // Top-3 highest-stress element centres.
  const stressConcentrations = topStressCentres(
    elementStress,
    elementCentres,
    3,
  );

  // ── 10. Sample back to render vertices (spatially) ────────────────────────
  const vertexStress = new Float32Array(vertexCount);
  const vertexDisplacement = new Float32Array(vertexCount);

  // Map every filled element to a dense array index for O(1) lookup.
  const elemStressGrid = new Float32Array(elementCountTotal);
  {
    let k = 0;
    for (let iz = 0; iz < nz; iz++) {
      for (let iy = 0; iy < ny; iy++) {
        for (let ix = 0; ix < nx; ix++) {
          const e = elemIndex(ix, iy, iz, nx, ny);
          if (solid[e]) elemStressGrid[e] = elementStress[k++]!;
        }
      }
    }
  }

  for (let v = 0; v < vertexCount; v++) {
    const px = positions[v * 3]!;
    const py = positions[v * 3 + 1]!;
    const pz = positions[v * 3 + 2]!;

    // Voxel index containing this point (clamped inside the grid).
    let vix = clampInt(Math.floor((px - origin[0]) / dx), 0, nx - 1);
    let viy = clampInt(Math.floor((py - origin[1]) / dy), 0, ny - 1);
    let viz = clampInt(Math.floor((pz - origin[2]) / dz), 0, nz - 1);

    // If that voxel is empty, snap to the nearest solid voxel.
    if (!solid[elemIndex(vix, viy, viz, nx, ny)]) {
      const near = nearestSolidVoxel(solid, nx, ny, nz, vix, viy, viz);
      if (near) {
        vix = near[0];
        viy = near[1];
        viz = near[2];
      }
    }
    vertexStress[v] = elemStressGrid[elemIndex(vix, viy, viz, nx, ny)]!;

    // Trilinear displacement interpolation over the 8 corner nodes.
    vertexDisplacement[v] = interpDisplacement(
      nodeDisp,
      gnx,
      gny,
      vix,
      viy,
      viz,
      origin,
      dx,
      dy,
      dz,
      px,
      py,
      pz,
    );
  }

  return {
    vertexStress,
    vertexDisplacement,
    maxStress,
    maxDisplacement,
    estimatedStrain,
    safetyFactor,
    stressConcentrations,
    resolution: grid.res,
    elementCount: filled,
    converged,
    method: "voxel-hex-fem",
  };
}

/**
 * Public inside-mesh test (ray cast along +X, odd parity ⇒ inside). Exposed so
 * callers can reuse the same watertight test the solidifier relies on.
 */
export function pointInsideMesh(positions: Float32Array, p: Vec3): boolean {
  return insideByRaycast(buildTriangles(positions), p);
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

interface Tri {
  ax: number;
  ay: number;
  az: number;
  bx: number;
  by: number;
  bz: number;
  cx: number;
  cy: number;
  cz: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

function buildTriangles(positions: Float32Array): Tri[] {
  const tris: Tri[] = [];
  for (let i = 0; i + 9 <= positions.length; i += 9) {
    const ax = positions[i]!,
      ay = positions[i + 1]!,
      az = positions[i + 2]!;
    const bx = positions[i + 3]!,
      by = positions[i + 4]!,
      bz = positions[i + 5]!;
    const cx = positions[i + 6]!,
      cy = positions[i + 7]!,
      cz = positions[i + 8]!;
    tris.push({
      ax,
      ay,
      az,
      bx,
      by,
      bz,
      cx,
      cy,
      cz,
      minX: Math.min(ax, bx, cx),
      maxX: Math.max(ax, bx, cx),
      minY: Math.min(ay, by, cy),
      maxY: Math.max(ay, by, cy),
      minZ: Math.min(az, bz, cz),
      maxZ: Math.max(az, bz, cz),
    });
  }
  return tris;
}

function boundingBox(positions: Float32Array): { min: Vec3; max: Vec3 } {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (let i = 0; i + 3 <= positions.length; i += 3) {
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
  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
}

/**
 * Count +X ray/triangle crossings from `p`; odd ⇒ inside. Y/Z bbox prune skips
 * triangles the ray cannot hit, and we require the hit to be ahead of the origin
 * (X ≥ p.x). Möller–Trumbore with an epsilon so grazing hits are ignored.
 */
function insideByRaycast(tris: readonly Tri[], p: Vec3): boolean {
  // Nudge the ray origin off any exact triangle edge/vertex in the Y/Z plane so
  // a ray that would otherwise graze a shared diagonal (a classic parity bug on
  // axis-aligned meshes) instead passes cleanly to one side. The offset is far
  // below any realistic voxel size, so the "inside" answer is unaffected.
  const EDGE_NUDGE = 1e-4;
  const px = p[0];
  const py = p[1] + EDGE_NUDGE;
  const pz = p[2] + EDGE_NUDGE * 0.5;
  let crossings = 0;
  for (const t of tris) {
    // Ray direction is +X, so the crossing must be within the triangle's Y/Z box.
    if (py < t.minY || py > t.maxY || pz < t.minZ || pz > t.maxZ) continue;
    if (t.maxX < px) continue; // whole triangle is behind the ray origin.
    if (rayXHitsTriangle(px, py, pz, t)) crossings++;
  }
  return (crossings & 1) === 1;
}

/** Möller–Trumbore for a ray from (px,py,pz) along +X against triangle t. */
function rayXHitsTriangle(px: number, py: number, pz: number, t: Tri): boolean {
  const EPS = 1e-9;
  // Edge vectors.
  const e1x = t.bx - t.ax,
    e1y = t.by - t.ay,
    e1z = t.bz - t.az;
  const e2x = t.cx - t.ax,
    e2y = t.cy - t.ay,
    e2z = t.cz - t.az;
  // dir = (1,0,0); h = dir × e2.
  const hx = 0 * e2z - 0 * e2y; // = 0
  const hy = 0 * e2x - 1 * e2z; // = -e2z
  const hz = 1 * e2y - 0 * e2x; // =  e2y
  const aDet = e1x * hx + e1y * hy + e1z * hz;
  if (aDet > -EPS && aDet < EPS) return false; // ray parallel to triangle.
  const invA = 1 / aDet;
  const sx = px - t.ax,
    sy = py - t.ay,
    sz = pz - t.az;
  const u = invA * (sx * hx + sy * hy + sz * hz);
  if (u < 0 || u > 1) return false;
  // q = s × e1.
  const qx = sy * e1z - sz * e1y;
  const qy = sz * e1x - sx * e1z;
  const qz = sx * e1y - sy * e1x;
  // v = invA * (dir · q) = invA * qx.
  const v = invA * qx;
  if (v < 0 || u + v > 1) return false;
  const dist = invA * (e2x * qx + e2y * qy + e2z * qz);
  return dist > EPS; // intersection strictly ahead of the origin.
}

// ── Grid helpers ──────────────────────────────────────────────────────────────

interface Grid {
  nx: number;
  ny: number;
  nz: number;
  dx: number;
  dy: number;
  dz: number;
  origin: Vec3;
  res: number;
}

function makeGrid(min: Vec3, extent: Vec3, longest: number, res: number): Grid {
  const scale = res / longest;
  const nx = Math.max(1, Math.round(extent[0] * scale));
  const ny = Math.max(1, Math.round(extent[1] * scale));
  const nz = Math.max(1, Math.round(extent[2] * scale));
  return {
    nx,
    ny,
    nz,
    dx: extent[0] / nx,
    dy: extent[1] / ny,
    dz: extent[2] / nz,
    origin: [min[0], min[1], min[2]],
    res,
  };
}

const elemIndex = (
  ix: number,
  iy: number,
  iz: number,
  nx: number,
  ny: number,
): number => ix + nx * (iy + ny * iz);

const nodeIndex = (
  jx: number,
  jy: number,
  jz: number,
  gnx: number,
  gny: number,
): number => jx + gnx * (jy + gny * jz);

/** Local corner offsets for an H8 element, in the standard node ordering. */
const HEX_CORNERS: readonly Vec3[] = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 1],
];

// ── Constitutive + element matrices ───────────────────────────────────────────

/** Isotropic linear-elastic 6×6 D matrix (Voigt), row-major length 36. */
function constitutiveMatrix(E: number, nu: number): Float64Array {
  const D = new Float64Array(36);
  const c = E / ((1 + nu) * (1 - 2 * nu));
  const d0 = c * (1 - nu);
  const d1 = c * nu;
  const g = E / (2 * (1 + nu)); // shear modulus.
  // Normal-normal block.
  D[0] = d0;
  D[1] = d1;
  D[2] = d1;
  D[6] = d1;
  D[7] = d0;
  D[8] = d1;
  D[12] = d1;
  D[13] = d1;
  D[14] = d0;
  // Shear diagonal.
  D[21] = g;
  D[28] = g;
  D[35] = g;
  return D;
}

/** 2-point Gauss abscissae and weights on [-1,1]. */
const GP = 1 / Math.sqrt(3);
const GAUSS: readonly number[] = [-GP, GP];

/**
 * 24×24 H8 element stiffness via 2×2×2 Gauss quadrature. The element is an
 * axis-aligned box dx×dy×dz, so the Jacobian is diagonal and constant:
 * J = diag(dx/2, dy/2, dz/2), detJ = (dx·dy·dz)/8, and the shape-function
 * gradients map to physical space by dividing each natural derivative by the
 * matching half-extent.
 */
function hexStiffness(
  dx: number,
  dy: number,
  dz: number,
  D: Float64Array,
): Float64Array {
  const Ke = new Float64Array(576);
  const jx = dx / 2,
    jy = dy / 2,
    jz = dz / 2;
  const detJ = jx * jy * jz;
  const B = new Float64Array(144); // 6×24
  for (const gx of GAUSS) {
    for (const gy of GAUSS) {
      for (const gz of GAUSS) {
        fillB(B, gx, gy, gz, jx, jy, jz);
        // Ke += Bᵀ·D·B · detJ · (w=1 each).
        // Compute DB = D·B (6×24) then Bᵀ·DB.
        const DB = new Float64Array(144);
        for (let r = 0; r < 6; r++) {
          for (let c = 0; c < 24; c++) {
            let s = 0;
            for (let k = 0; k < 6; k++) s += D[r * 6 + k]! * B[k * 24 + c]!;
            DB[r * 24 + c] = s;
          }
        }
        for (let a = 0; a < 24; a++) {
          for (let b = 0; b < 24; b++) {
            let s = 0;
            for (let k = 0; k < 6; k++) s += B[k * 24 + a]! * DB[k * 24 + b]!;
            Ke[a * 24 + b]! += s * detJ;
          }
        }
      }
    }
  }
  return Ke;
}

/** Strain-displacement B (6×24) at natural coords (gx,gy,gz) for a box element. */
function fillB(
  B: Float64Array,
  gx: number,
  gy: number,
  gz: number,
  jx: number,
  jy: number,
  jz: number,
): void {
  B.fill(0);
  // Trilinear shape-function natural derivatives at (gx,gy,gz), mapped to
  // physical space by dividing by the (constant) half-extents.
  const sign: readonly Vec3[] = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ];
  for (let n = 0; n < 8; n++) {
    const s = sign[n]!;
    const dNdx = (0.125 * s[0] * (1 + s[1] * gy) * (1 + s[2] * gz)) / jx;
    const dNdy = (0.125 * s[1] * (1 + s[0] * gx) * (1 + s[2] * gz)) / jy;
    const dNdz = (0.125 * s[2] * (1 + s[0] * gx) * (1 + s[1] * gy)) / jz;
    const cx = n * 3,
      cy = n * 3 + 1,
      cz = n * 3 + 2;
    // Row 0: εxx = dNdx·ux
    B[0 * 24 + cx] = dNdx;
    // Row 1: εyy = dNdy·uy
    B[1 * 24 + cy] = dNdy;
    // Row 2: εzz = dNdz·uz
    B[2 * 24 + cz] = dNdz;
    // Row 3: γxy = dNdy·ux + dNdx·uy
    B[3 * 24 + cx] = dNdy;
    B[3 * 24 + cy] = dNdx;
    // Row 4: γyz = dNdz·uy + dNdy·uz
    B[4 * 24 + cy] = dNdz;
    B[4 * 24 + cz] = dNdy;
    // Row 5: γzx = dNdz·ux + dNdx·uz
    B[5 * 24 + cx] = dNdz;
    B[5 * 24 + cz] = dNdx;
  }
}

/** B evaluated at the element centre (natural origin), 6×24 row-major. */
function hexBAtCentre(dx: number, dy: number, dz: number): Float64Array {
  const B = new Float64Array(144);
  fillB(B, 0, 0, 0, dx / 2, dy / 2, dz / 2);
  return B;
}

// ── Linear algebra ────────────────────────────────────────────────────────────

/** Dense row-major (rows×cols) matrix times a vector of length `cols`. */
function matVec(
  m: Float64Array,
  v: Float64Array,
  rows: number,
  cols: number,
): Float64Array {
  const out = new Float64Array(rows);
  for (let r = 0; r < rows; r++) {
    let s = 0;
    for (let c = 0; c < cols; c++) s += m[r * cols + c]! * v[c]!;
    out[r] = s;
  }
  return out;
}

/** von Mises stress from a Voigt stress vector [σxx,σyy,σzz,τxy,τyz,τzx]. */
function vonMises(s: Float64Array): number {
  const sx = s[0]!,
    sy = s[1]!,
    sz = s[2]!;
  const txy = s[3]!,
    tyz = s[4]!,
    tzx = s[5]!;
  const term =
    0.5 * ((sx - sy) ** 2 + (sy - sz) ** 2 + (sz - sx) ** 2) +
    3 * (txy ** 2 + tyz ** 2 + tzx ** 2);
  return Math.sqrt(Math.max(0, term));
}

/**
 * Jacobi-preconditioned Conjugate Gradient for the SPD sparse system K·u = f.
 * Returns the displacement vector and whether the relative residual tolerance
 * was met within the iteration cap.
 */
function conjugateGradient(
  K: ReadonlyArray<Map<number, number>>,
  f: Float64Array,
  ndof: number,
): { u: Float64Array; converged: boolean } {
  const u = new Float64Array(ndof);
  if (ndof === 0) return { u, converged: true };

  // Jacobi preconditioner: Minv = 1/diag.
  const invDiag = new Float64Array(ndof);
  for (let i = 0; i < ndof; i++) {
    const d = K[i]!.get(i) ?? 0;
    invDiag[i] = Math.abs(d) > 1e-30 ? 1 / d : 0;
  }

  const spMV = (x: Float64Array): Float64Array => {
    const y = new Float64Array(ndof);
    for (let r = 0; r < ndof; r++) {
      let s = 0;
      for (const [c, val] of K[r]!) s += val * x[c]!;
      y[r] = s;
    }
    return y;
  };

  // r = f - K·u (u starts at 0 → r = f).
  const r = new Float64Array(f);
  const z = new Float64Array(ndof);
  for (let i = 0; i < ndof; i++) z[i] = invDiag[i]! * r[i]!;
  const p = new Float64Array(z);

  let rzOld = 0;
  for (let i = 0; i < ndof; i++) rzOld += r[i]! * z[i]!;

  let fNorm = 0;
  for (let i = 0; i < ndof; i++) fNorm += f[i]! * f[i]!;
  fNorm = Math.sqrt(fNorm);
  if (fNorm < 1e-30) return { u, converged: true }; // zero load → zero solution.

  const maxIters = Math.min(3 * ndof, CG_MAX_ITERS);
  let converged = false;

  for (let it = 0; it < maxIters; it++) {
    const Kp = spMV(p);
    let pKp = 0;
    for (let i = 0; i < ndof; i++) pKp += p[i]! * Kp[i]!;
    if (Math.abs(pKp) < 1e-30) break; // breakdown guard.
    const alpha = rzOld / pKp;
    for (let i = 0; i < ndof; i++) {
      u[i]! += alpha * p[i]!;
      r[i]! -= alpha * Kp[i]!;
    }
    // Relative residual check.
    let rNorm = 0;
    for (let i = 0; i < ndof; i++) rNorm += r[i]! * r[i]!;
    rNorm = Math.sqrt(rNorm);
    if (rNorm / fNorm < CG_TOL) {
      converged = true;
      break;
    }
    for (let i = 0; i < ndof; i++) z[i] = invDiag[i]! * r[i]!;
    let rzNew = 0;
    for (let i = 0; i < ndof; i++) rzNew += r[i]! * z[i]!;
    const beta = rzOld > 1e-30 ? rzNew / rzOld : 0;
    for (let i = 0; i < ndof; i++) p[i] = z[i]! + beta * p[i]!;
    rzOld = rzNew;
  }

  return { u, converged };
}

// ── Node selection helpers ─────────────────────────────────────────────────────

function nearestActiveNode(
  p: Vec3,
  nodeDof: Int32Array,
  nodePos: (n: number) => Vec3,
  nodeCountTotal: number,
): number {
  let best = -1;
  let bestD = Infinity;
  for (let n = 0; n < nodeCountTotal; n++) {
    if (nodeDof[n]! < 0) continue;
    const q = nodePos(n);
    const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 + (q[2] - p[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

function lowestActiveNode(
  nodeDof: Int32Array,
  nodePos: (n: number) => Vec3,
  nodeCountTotal: number,
): number {
  let best = -1;
  let bestZ = Infinity;
  for (let n = 0; n < nodeCountTotal; n++) {
    if (nodeDof[n]! < 0) continue;
    const z = nodePos(n)[2];
    if (z < bestZ) {
      bestZ = z;
      best = n;
    }
  }
  return best;
}

/** Resolve fixed DOFs for the constraint mode. Returns a list of pinned DOFs. */
function resolveFixedNodes(
  constraint: Constraint,
  nodeDof: Int32Array,
  nodePos: (n: number) => Vec3,
  nodeCountTotal: number,
  originZ: number,
  dz: number,
): number[] {
  const fixed: number[] = [];
  const pinNode = (n: number): void => {
    const base = nodeDof[n]!;
    fixed.push(base, base + 1, base + 2);
  };

  const pinPlate = (): void => {
    // Lowest active-node z, then fix everything within one voxel height of it.
    let minZ = Infinity;
    for (let n = 0; n < nodeCountTotal; n++) {
      if (nodeDof[n]! < 0) continue;
      const z = nodePos(n)[2];
      if (z < minZ) minZ = z;
    }
    const threshold = minZ + dz * 1.001;
    for (let n = 0; n < nodeCountTotal; n++) {
      if (nodeDof[n]! < 0) continue;
      if (nodePos(n)[2] <= threshold) pinNode(n);
    }
  };

  if (constraint.mode === "build-plate" || constraint.mode === "bottom-face") {
    pinPlate();
    return fixed;
  }

  // selected-face / custom: pin nodes near any anchor point.
  const points = constraint.points ?? [];
  if (points.length === 0) {
    pinPlate();
    return fixed;
  }
  const radius = constraint.radius ?? dz * 1.5;
  const r2 = radius * radius;
  void originZ; // origin z not needed for point-radius mode; kept for signature parity.
  for (let n = 0; n < nodeCountTotal; n++) {
    if (nodeDof[n]! < 0) continue;
    const q = nodePos(n);
    for (const a of points) {
      const d = (q[0] - a[0]) ** 2 + (q[1] - a[1]) ** 2 + (q[2] - a[2]) ** 2;
      if (d <= r2) {
        pinNode(n);
        break;
      }
    }
  }
  // If the radius captured nothing, fall back so the system stays solvable.
  if (fixed.length === 0) pinPlate();
  return fixed;
}

// ── Sampling helpers ──────────────────────────────────────────────────────────

/** BFS-ish nearest solid voxel in expanding shells (bounded search). */
function nearestSolidVoxel(
  solid: Uint8Array,
  nx: number,
  ny: number,
  nz: number,
  cx: number,
  cy: number,
  cz: number,
): Vec3 | null {
  const maxR = Math.max(nx, ny, nz);
  for (let r = 1; r <= maxR; r++) {
    for (let iz = Math.max(0, cz - r); iz <= Math.min(nz - 1, cz + r); iz++) {
      for (let iy = Math.max(0, cy - r); iy <= Math.min(ny - 1, cy + r); iy++) {
        for (
          let ix = Math.max(0, cx - r);
          ix <= Math.min(nx - 1, cx + r);
          ix++
        ) {
          // Only the shell surface at radius r.
          if (
            Math.abs(ix - cx) !== r &&
            Math.abs(iy - cy) !== r &&
            Math.abs(iz - cz) !== r
          ) {
            continue;
          }
          if (solid[elemIndex(ix, iy, iz, nx, ny)]) return [ix, iy, iz];
        }
      }
    }
  }
  return null;
}

/** Trilinear interpolation of nodal displacement magnitude at a world point. */
function interpDisplacement(
  nodeDisp: Float64Array,
  gnx: number,
  gny: number,
  vix: number,
  viy: number,
  viz: number,
  origin: Vec3,
  dx: number,
  dy: number,
  dz: number,
  px: number,
  py: number,
  pz: number,
): number {
  // Local coordinates within the voxel [0,1].
  const lx = clampNum((px - (origin[0] + vix * dx)) / dx, 0, 1);
  const ly = clampNum((py - (origin[1] + viy * dy)) / dy, 0, 1);
  const lz = clampNum((pz - (origin[2] + viz * dz)) / dz, 0, 1);

  let sum = 0;
  let wSum = 0;
  for (let c = 0; c < 8; c++) {
    const off = HEX_CORNERS[c]!;
    const n = nodeIndex(vix + off[0], viy + off[1], viz + off[2], gnx, gny);
    const w =
      (off[0] ? lx : 1 - lx) * (off[1] ? ly : 1 - ly) * (off[2] ? lz : 1 - lz);
    sum += w * nodeDisp[n]!;
    wSum += w;
  }
  return wSum > 1e-9 ? sum / wSum : 0;
}

function topStressCentres(
  stresses: readonly number[],
  centres: readonly Vec3[],
  count: number,
): Vec3[] {
  return stresses
    .map((s, i) => ({ s, v: centres[i]! }))
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .filter((e) => e.s > 0)
    .map((e) => e.v);
}

// ── Small numeric utilities ────────────────────────────────────────────────────

function normalize(d: Vec3): Vec3 {
  const len = Math.hypot(d[0], d[1], d[2]);
  return len > 1e-12 ? [d[0] / len, d[1] / len, d[2] / len] : [0, 0, 0];
}

function clampNum(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function clampInt(v: number, lo: number, hi: number): number {
  const i = Math.round(v);
  return i < lo ? lo : i > hi ? hi : i;
}

/** Zeroed result for empty/degenerate input — correct array lengths, no throw. */
function zeroedResult(vertexCount: number, resolution = 0): FeaResult {
  return {
    vertexStress: new Float32Array(vertexCount),
    vertexDisplacement: new Float32Array(vertexCount),
    maxStress: 0,
    maxDisplacement: 0,
    estimatedStrain: 0,
    safetyFactor: 999,
    stressConcentrations: [],
    resolution,
    elementCount: 0,
    converged: true,
    method: "voxel-hex-fem",
  };
}
