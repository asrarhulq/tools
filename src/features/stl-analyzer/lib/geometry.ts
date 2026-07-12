import type {
  BoundingBox,
  Diagnostics,
  GeometryResult,
  MeshQuality,
  RawMesh,
  Vec3,
} from "../types";
import { cross, distance, dot, length, normalize, sub } from "./vec";

/**
 * Pure mesh-geometry analysis. Every export is a plain function over typed
 * arrays — no Three, no DOM — so this whole module runs in the worker today and
 * can be ported to WASM later. All lengths are in the mesh's own units (mm).
 */

const EPS = 1e-9;

function triAt(positions: Float32Array, i: number): [Vec3, Vec3, Vec3] {
  const o = i * 9;
  return [
    [positions[o]!, positions[o + 1]!, positions[o + 2]!],
    [positions[o + 3]!, positions[o + 4]!, positions[o + 5]!],
    [positions[o + 6]!, positions[o + 7]!, positions[o + 8]!],
  ];
}

export function computeBoundingBox(positions: Float32Array): BoundingBox {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!, y = positions[i + 1]!, z = positions[i + 2]!;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  const min: Vec3 = [minX, minY, minZ];
  const max: Vec3 = [maxX, maxY, maxZ];
  const size: Vec3 = [maxX - minX, maxY - minY, maxZ - minZ];
  const center: Vec3 = [
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2,
  ];
  return { min, max, size, center };
}

/** Signed volume via the divergence theorem (sum of signed tetrahedra). */
export function computeVolume(positions: Float32Array): number {
  let vol = 0;
  const triangles = positions.length / 9;
  for (let i = 0; i < triangles; i++) {
    const [a, b, c] = triAt(positions, i);
    vol += dot(a, cross(b, c)) / 6;
  }
  return Math.abs(vol);
}

export function computeSurfaceArea(positions: Float32Array): number {
  let area = 0;
  const triangles = positions.length / 9;
  for (let i = 0; i < triangles; i++) {
    const [a, b, c] = triAt(positions, i);
    area += length(cross(sub(b, a), sub(c, a))) / 2;
  }
  return area;
}

/** Center of mass of a solid, uniform-density body (tetrahedron decomposition). */
export function computeCenterOfMass(positions: Float32Array): Vec3 {
  let vol = 0;
  let cx = 0, cy = 0, cz = 0;
  const triangles = positions.length / 9;
  for (let i = 0; i < triangles; i++) {
    const [a, b, c] = triAt(positions, i);
    const v = dot(a, cross(b, c)) / 6;
    vol += v;
    // Centroid of the tetra (origin,a,b,c) is the mean of its 4 vertices.
    cx += ((a[0] + b[0] + c[0]) / 4) * v;
    cy += ((a[1] + b[1] + c[1]) / 4) * v;
    cz += ((a[2] + b[2] + c[2]) / 4) * v;
  }
  if (Math.abs(vol) < EPS) return computeBoundingBox(positions).center;
  return [cx / vol, cy / vol, cz / vol];
}

/**
 * Weld coincident vertices to a quantized grid and build an indexed edge map.
 * Returns unique vertex count and edge-usage histogram used for topology checks.
 */
function buildTopology(positions: Float32Array) {
  const triangles = positions.length / 9;
  // Quantize to ~1e-4 of the bbox diagonal to weld near-coincident points.
  const bbox = computeBoundingBox(positions);
  const diag = length(bbox.size) || 1;
  const q = diag * 1e-5;
  const keyOf = (x: number, y: number, z: number) =>
    `${Math.round(x / q)},${Math.round(y / q)},${Math.round(z / q)}`;

  const vertexIds = new Map<string, number>();
  const indices = new Int32Array(triangles * 3);

  for (let i = 0; i < triangles; i++) {
    const o = i * 9;
    for (let v = 0; v < 3; v++) {
      const p = o + v * 3;
      const key = keyOf(positions[p]!, positions[p + 1]!, positions[p + 2]!);
      let id = vertexIds.get(key);
      if (id === undefined) {
        id = vertexIds.size;
        vertexIds.set(key, id);
      }
      indices[i * 3 + v] = id;
    }
  }

  // Edge usage: how many triangles reference each undirected edge.
  const edgeUse = new Map<string, number>();
  const edgeKey = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`);
  for (let i = 0; i < triangles; i++) {
    const a = indices[i * 3]!, b = indices[i * 3 + 1]!, c = indices[i * 3 + 2]!;
    for (const [u, w] of [[a, b], [b, c], [c, a]] as const) {
      const k = edgeKey(u, w);
      edgeUse.set(k, (edgeUse.get(k) ?? 0) + 1);
    }
  }

  return { uniqueVertexCount: vertexIds.size, indices, edgeUse };
}

export function analyzeMeshQuality(positions: Float32Array): MeshQuality {
  const triangles = positions.length / 9;
  const { uniqueVertexCount } = buildTopology(positions);

  let degenerate = 0;
  let badAspect = 0;
  for (let i = 0; i < triangles; i++) {
    const [a, b, c] = triAt(positions, i);
    const area = length(cross(sub(b, a), sub(c, a))) / 2;
    if (area < EPS) {
      degenerate++;
      continue;
    }
    const e0 = distance(a, b), e1 = distance(b, c), e2 = distance(c, a);
    const longest = Math.max(e0, e1, e2);
    const shortest = Math.min(e0, e1, e2) || EPS;
    if (longest / shortest > 20) badAspect++;
  }

  const degenRatio = triangles ? degenerate / triangles : 0;
  const aspectRatio = triangles ? badAspect / triangles : 0;
  const score = Math.max(
    0,
    Math.round(100 - degenRatio * 100 - aspectRatio * 40),
  );

  return {
    triangleCount: triangles,
    vertexCount: triangles * 3,
    uniqueVertexCount,
    degenerateTriangles: degenerate,
    score,
  };
}

export function analyzeDiagnostics(positions: Float32Array): Diagnostics {
  const triangles = positions.length / 9;
  const { edgeUse } = buildTopology(positions);

  let nonManifold = 0;
  let boundary = 0;
  for (const count of edgeUse.values()) {
    if (count === 1) boundary++;
    else if (count > 2) nonManifold++;
  }
  const watertight = boundary === 0 && nonManifold === 0;
  // Boundary edges form loops; each loop is roughly one hole.
  const holes = Math.ceil(boundary / 3);

  // Overhang + sharp-edge sampling over face normals.
  let downwardArea = 0;
  let totalArea = 0;
  let sharpEdges = 0;
  const normalsByEdge = new Map<string, Vec3>();
  const overhangCos = Math.cos((45 * Math.PI) / 180); // 45° from vertical

  for (let i = 0; i < triangles; i++) {
    const [a, b, c] = triAt(positions, i);
    const n = normalize(cross(sub(b, a), sub(c, a)));
    const area = length(cross(sub(b, a), sub(c, a))) / 2;
    totalArea += area;
    // -Z is "down" (print bed normal); steep downward faces overhang.
    if (-n[2] > overhangCos) downwardArea += area;

    // Sharp-edge detection: adjacent faces whose normals differ > 50°.
    const key = `${Math.round(a[0])},${Math.round(a[1])}_${Math.round(b[0])}`;
    const prev = normalsByEdge.get(key);
    if (prev && dot(prev, n) < Math.cos((50 * Math.PI) / 180)) sharpEdges++;
    normalsByEdge.set(key, n);
  }

  const bbox = computeBoundingBox(positions);
  const diag = length(bbox.size) || 1;
  // Wall thickness proxy: smallest bbox dimension scaled by a solidity factor.
  const minDim = Math.min(...bbox.size);
  const minWallThickness = Math.max(0.2, minDim * 0.08);
  const thinFeatureCount = minWallThickness < 1 ? Math.round(diag / 20) : 0;

  return {
    watertight,
    nonManifoldEdges: nonManifold,
    boundaryEdges: boundary,
    holes,
    minWallThickness,
    thinFeatureCount,
    sharpEdgeCount: sharpEdges,
    overhangArea: totalArea ? downwardArea / totalArea : 0,
  };
}

/** Principal axes from the covariance of triangle centroids (area-weighted). */
export function computePrincipalAxes(
  positions: Float32Array,
  center: Vec3,
): readonly [Vec3, Vec3, Vec3] {
  // Build a symmetric 3×3 covariance matrix.
  let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
  const triangles = positions.length / 9;
  let wsum = 0;
  for (let i = 0; i < triangles; i++) {
    const [a, b, c] = triAt(positions, i);
    const w = length(cross(sub(b, a), sub(c, a))) / 2;
    const cx = (a[0] + b[0] + c[0]) / 3 - center[0];
    const cy = (a[1] + b[1] + c[1]) / 3 - center[1];
    const cz = (a[2] + b[2] + c[2]) / 3 - center[2];
    xx += w * cx * cx; xy += w * cx * cy; xz += w * cx * cz;
    yy += w * cy * cy; yz += w * cy * cz; zz += w * cz * cz;
    wsum += w;
  }
  if (wsum > 0) {
    xx /= wsum; xy /= wsum; xz /= wsum; yy /= wsum; yz /= wsum; zz /= wsum;
  }
  // Jacobi eigen-decomposition of the symmetric matrix.
  return jacobiEigenvectors([
    [xx, xy, xz],
    [xy, yy, yz],
    [xz, yz, zz],
  ]);
}

/** Classic Jacobi rotation for a symmetric 3×3; returns eigenvectors as rows. */
function jacobiEigenvectors(
  m: number[][],
): readonly [Vec3, Vec3, Vec3] {
  const a = m.map((r) => r.slice());
  const v = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  for (let sweep = 0; sweep < 24; sweep++) {
    let p = 0, q = 1;
    let max = Math.abs(a[0]![1]!);
    if (Math.abs(a[0]![2]!) > max) { max = Math.abs(a[0]![2]!); p = 0; q = 2; }
    if (Math.abs(a[1]![2]!) > max) { max = Math.abs(a[1]![2]!); p = 1; q = 2; }
    if (max < 1e-10) break;

    const app = a[p]![p]!, aqq = a[q]![q]!, apq = a[p]![q]!;
    const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
    const cos = Math.cos(phi), sin = Math.sin(phi);

    for (let i = 0; i < 3; i++) {
      const aip = a[i]![p]!, aiq = a[i]![q]!;
      a[i]![p] = cos * aip - sin * aiq;
      a[i]![q] = sin * aip + cos * aiq;
    }
    for (let i = 0; i < 3; i++) {
      const api = a[p]![i]!, aqi = a[q]![i]!;
      a[p]![i] = cos * api - sin * aqi;
      a[q]![i] = sin * api + cos * aqi;
    }
    for (let i = 0; i < 3; i++) {
      const vip = v[i]![p]!, viq = v[i]![q]!;
      v[i]![p] = cos * vip - sin * viq;
      v[i]![q] = sin * vip + cos * viq;
    }
  }
  return [
    [v[0]![0]!, v[1]![0]!, v[2]![0]!],
    [v[0]![1]!, v[1]![1]!, v[2]![1]!],
    [v[0]![2]!, v[1]![2]!, v[2]![2]!],
  ];
}

/** Run the full geometry pipeline. */
export function analyzeGeometry(mesh: RawMesh): GeometryResult {
  const { positions } = mesh;
  const boundingBox = computeBoundingBox(positions);
  const volume = computeVolume(positions);
  const surfaceArea = computeSurfaceArea(positions);
  const centerOfMass = computeCenterOfMass(positions);
  const principalAxes = computePrincipalAxes(positions, centerOfMass);
  const quality = analyzeMeshQuality(positions);
  const diagnostics = analyzeDiagnostics(positions);

  // Complexity: normalized triangle density + surface-to-volume ratio.
  const svRatio = volume > 0 ? surfaceArea / Math.cbrt(volume * volume) : 0;
  const complexityScore = clamp(
    Math.round(
      Math.min(60, quality.triangleCount / 2000) + Math.min(40, svRatio * 4),
    ),
  );

  // Printability: penalize overhangs, non-watertight, thin walls, holes.
  const printabilityScore = clamp(
    Math.round(
      100 -
        diagnostics.overhangArea * 45 -
        (diagnostics.watertight ? 0 : 25) -
        (diagnostics.minWallThickness < 0.8 ? 15 : 0) -
        Math.min(15, diagnostics.holes * 5),
    ),
  );

  return {
    boundingBox,
    volume,
    surfaceArea,
    centerOfMass,
    principalAxes,
    quality,
    diagnostics,
    complexityScore,
    printabilityScore,
  };
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}
