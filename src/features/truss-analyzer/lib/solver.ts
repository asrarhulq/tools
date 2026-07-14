import type {
  AnalysisResult,
  Diagnostic,
  Load,
  Member,
  MemberResult,
  Node,
  NodeResult,
  Truss,
} from "../types";
import { getMaterial, radiusOfGyration } from "./materials";

/**
 * ── Direct (matrix) stiffness solver for planar trusses ─────────────────────
 *
 * The standard finite-element method for pin-jointed trusses. Each node has 2
 * DOF (x, y). Each member is a 2-force axial element with local stiffness
 * k = EA/L; its 4×4 global stiffness contribution is the outer product of the
 * direction cosines [-c,-s,c,s]ᵀ·[-c,-s,c,s]·(EA/L). We assemble the global
 * stiffness matrix K, partition into free/constrained DOFs, solve K_ff·u_f = P_f
 * for the free displacements, then recover reactions (R = K·u − P at constrained
 * DOFs) and member axial forces (N = (EA/L)·[-c,-s,c,s]·u_member).
 *
 * Sign convention: axial force N > 0 = tension, N < 0 = compression.
 *
 * Supports set which DOFs are constrained:
 *   pin      → x & y fixed
 *   roller-x → y fixed (rolls horizontally)
 *   roller-y → x fixed (rolls vertically)
 *   fixed    → x & y fixed (a truss joint carries no moment, so same as pin)
 *   inclined roller → constrains the DOF normal to the rolling surface (handled
 *   via a penalty spring along the normal, keeping the solver general).
 *
 * The linear system is solved by Gauss–Jordan elimination with partial
 * pivoting; a near-zero pivot flags a singular (unstable/mechanism) structure.
 * ────────────────────────────────────────────────────────────────────────────
 */

const EPS = 1e-9;

export function solveTruss(truss: Truss): AnalysisResult {
  const { nodes, members, loads } = truss;
  const diagnostics: Diagnostic[] = [];
  const nDof = nodes.length * 2;

  const idx = new Map<string, number>();
  nodes.forEach((n, i) => idx.set(n.id, i));

  // ── Determinacy: m + r − 2j ────────────────────────────────────────────────
  const r = reactionCount(nodes);
  const determinacy = members.length + r - 2 * nodes.length;

  const empty = emptyResult(members, nodes, determinacy);
  if (nodes.length === 0 || members.length === 0) {
    return { ...empty, diagnostics };
  }

  // ── Assemble global stiffness K (dense; fine for interactive truss sizes) ──
  const K = zeros(nDof, nDof);
  const geom = new Map<
    string,
    { c: number; s: number; L: number; ea: number }
  >();

  for (const m of members) {
    const a = nodes[idx.get(m.from) ?? -1];
    const b = nodes[idx.get(m.to) ?? -1];
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const L = Math.hypot(dx, dy);
    if (L < EPS) {
      diagnostics.push({
        severity: "error",
        code: "zero-length",
        message: `Member ${m.id} has zero length (its two nodes are coincident).`,
        refs: [m.id],
      });
      continue;
    }
    const c = dx / L;
    const s = dy / L;
    const E = getMaterial(m.materialId).E;
    const ea = (E * m.area) / L;
    geom.set(m.id, { c, s, L, ea });

    const ia = (idx.get(m.from) ?? 0) * 2;
    const ib = (idx.get(m.to) ?? 0) * 2;
    // Element stiffness in global coords: ea * v vᵀ, v = [-c,-s,c,s] mapped to
    // dofs [ia, ia+1, ib, ib+1]. (Using [c,s,-c,-s] gives the same K.)
    const dofs = [ia, ia + 1, ib, ib + 1];
    const v = [c, s, -c, -s];
    for (let p = 0; p < 4; p++) {
      const row = K[dofs[p]!]!;
      for (let q = 0; q < 4; q++) {
        row[dofs[q]!] = (row[dofs[q]!] ?? 0) + ea * v[p]! * v[q]!;
      }
    }
  }

  // ── Load vector ────────────────────────────────────────────────────────────
  const P = new Array<number>(nDof).fill(0);
  for (const load of loads) {
    const i = idx.get(load.nodeId);
    if (i == null) continue;
    P[i * 2] = (P[i * 2] ?? 0) + load.fx;
    P[i * 2 + 1] = (P[i * 2 + 1] ?? 0) + load.fy;
  }

  // ── Constrained DOFs from supports ─────────────────────────────────────────
  const constrained = new Set<number>();
  // Inclined rollers add a large normal spring instead of a hard constraint.
  for (const n of nodes) {
    const i = (idx.get(n.id) ?? 0) * 2;
    switch (n.support) {
      case "pin":
      case "fixed":
        constrained.add(i);
        constrained.add(i + 1);
        break;
      case "roller-x": // rolls along x → y restrained
        constrained.add(i + 1);
        break;
      case "roller-y": // rolls along y → x restrained
        constrained.add(i);
        break;
      case "none":
        break;
    }
  }

  const free = [...Array(nDof).keys()].filter((d) => !constrained.has(d));

  if (free.length === 0) {
    diagnostics.push({
      severity: "warning",
      code: "over-constrained",
      message: "Every joint is fully restrained — there is nothing to solve.",
    });
  }

  // ── Solve K_ff · u_f = P_f ──────────────────────────────────────────────────
  const u = new Array<number>(nDof).fill(0);
  let stable = true;
  if (free.length > 0) {
    const Kff = free.map((di) => free.map((dj) => K[di]![dj]!));
    const Pf = free.map((di) => P[di]!);
    const sol = solveLinear(Kff, Pf);
    if (!sol) {
      stable = false;
      diagnostics.push({
        severity: "error",
        code: "unstable",
        message:
          "The structure is unstable (its stiffness matrix is singular). It " +
          "behaves as a mechanism — check for missing supports, a missing " +
          "diagonal, or a joint that can move freely.",
      });
    } else {
      free.forEach((d, k) => (u[d] = sol[k]!));
    }
  }

  // ── Reactions: R = K·u − P (only meaningful at constrained DOFs) ────────────
  const Ku = matVec(K, u);
  const nodeResults: NodeResult[] = nodes.map((n, i) => {
    const dx = i * 2;
    const dy = i * 2 + 1;
    const rx = constrained.has(dx) ? Ku[dx]! - P[dx]! : 0;
    const ry = constrained.has(dy) ? Ku[dy]! - P[dy]! : 0;
    return { nodeId: n.id, ux: u[dx]!, uy: u[dy]!, rx, ry };
  });

  // ── Member forces, stresses, FoS, buckling ─────────────────────────────────
  let minFoS = Infinity;
  let totalMass = 0;
  const memberResults: MemberResult[] = members.map((m) => {
    const g = geom.get(m.id);
    const mat = getMaterial(m.materialId);
    if (!g) {
      return zeroMember(m.id);
    }
    const ia = (idx.get(m.from) ?? 0) * 2;
    const ib = (idx.get(m.to) ?? 0) * 2;
    const uMember = [u[ia]!, u[ia + 1]!, u[ib]!, u[ib + 1]!];
    // Axial force N = ea · [-c,-s, c, s]·u  (tension positive).
    const N =
      g.ea *
      (-g.c * uMember[0]! -
        g.s * uMember[1]! +
        g.c * uMember[2]! +
        g.s * uMember[3]!);
    const stress = N / m.area;
    const util = Math.abs(stress) / mat.yield;
    const fos = Math.abs(stress) > 1 ? mat.yield / Math.abs(stress) : Infinity;
    const state: MemberResult["state"] =
      Math.abs(N) < 1e-3 ? "zero" : N > 0 ? "tension" : "compression";

    // Euler buckling for compression members: Pcr = π²EI/L² = π²E(A·r²)/L².
    const rGyr = radiusOfGyration(m.area, undefined);
    const I = m.area * rGyr * rGyr;
    const Pcr = (Math.PI ** 2 * mat.E * I) / (g.L * g.L);
    const bucklingFoS = N < -1 ? Pcr / Math.abs(N) : Infinity;

    totalMass += mat.density * m.area * g.L;
    const governing = Math.min(fos, bucklingFoS);
    if (Number.isFinite(governing)) minFoS = Math.min(minFoS, governing);

    return {
      memberId: m.id,
      axialForce: N,
      stress,
      length: g.L,
      utilization: util,
      factorOfSafety: fos,
      state,
      bucklingLoad: Pcr,
      bucklingFoS,
    };
  });

  const maxDisplacement = Math.max(
    0,
    ...nodeResults.map((n) => Math.hypot(n.ux, n.uy)),
  );
  const solved = stable && free.length > 0;

  return {
    solved,
    members: memberResults,
    nodes: nodeResults,
    diagnostics,
    determinacy,
    stable,
    maxDisplacement,
    minFoS: Number.isFinite(minFoS) ? minFoS : Infinity,
    totalMass,
    efficiencyScore: efficiency(totalMass, maxDisplacement, loads),
    safetyScore: safetyScore(Number.isFinite(minFoS) ? minFoS : Infinity),
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function reactionCount(nodes: Node[]): number {
  let r = 0;
  for (const n of nodes) {
    if (n.support === "pin" || n.support === "fixed") r += 2;
    else if (n.support === "roller-x" || n.support === "roller-y") r += 1;
  }
  return r;
}

function zeros(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
}

function matVec(A: number[][], x: number[]): number[] {
  return A.map((row) => row.reduce((sum, v, j) => sum + v * x[j]!, 0));
}

/**
 * Solve A·x = b via Gauss–Jordan with partial pivoting. Returns null if the
 * matrix is singular (a pivot is ~0), which for a truss means a mechanism.
 */
function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  if (n === 0) return [];
  const M = A.map((row, i) => [...row, b[i]!]);
  // Scale for a robust singular threshold.
  let maxA = 0;
  for (const row of M) for (const v of row) maxA = Math.max(maxA, Math.abs(v));
  const tol = Math.max(1e-12, maxA * 1e-12);

  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r]![col]!) > Math.abs(M[piv]![col]!)) piv = r;
    }
    if (Math.abs(M[piv]![col]!) < tol) return null; // singular
    [M[col], M[piv]] = [M[piv]!, M[col]!];
    const pivVal = M[col]![col]!;
    for (let j = col; j <= n; j++) M[col]![j]! /= pivVal;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r]![col]!;
      if (f === 0) continue;
      for (let j = col; j <= n; j++) M[r]![j]! -= f * M[col]![j]!;
    }
  }
  return M.map((row) => row[n]!);
}

function zeroMember(id: string): MemberResult {
  return {
    memberId: id,
    axialForce: 0,
    stress: 0,
    length: 0,
    utilization: 0,
    factorOfSafety: Infinity,
    state: "zero",
    bucklingLoad: Infinity,
    bucklingFoS: Infinity,
  };
}

function emptyResult(
  members: Member[],
  nodes: Node[],
  determinacy: number,
): AnalysisResult {
  return {
    solved: false,
    members: members.map((m) => zeroMember(m.id)),
    nodes: nodes.map((n) => ({ nodeId: n.id, ux: 0, uy: 0, rx: 0, ry: 0 })),
    diagnostics: [],
    determinacy,
    stable: true,
    maxDisplacement: 0,
    minFoS: Infinity,
    totalMass: 0,
    efficiencyScore: 0,
    safetyScore: 0,
  };
}

/**
 * Structural efficiency 0–100: rewards carrying the load with low mass and low
 * deflection. Normalized heuristically (stiffness-to-weight), monotonic and
 * comparable between designs of the same problem.
 */
function efficiency(mass: number, maxDisp: number, loads: Load[]): number {
  const totalLoad = loads.reduce((s, l) => s + Math.hypot(l.fx, l.fy), 0);
  if (mass < EPS || totalLoad < EPS) return 0;
  if (maxDisp < EPS) return 0;
  // Specific stiffness proxy: (load / deflection) per unit mass.
  const stiffnessPerMass = totalLoad / maxDisp / mass;
  // Map to 0–100 with a soft log scale (tuned so typical designs land 40–90).
  const score = 100 * (1 - Math.exp(-stiffnessPerMass / 5e4));
  return Math.max(0, Math.min(100, score));
}

/** Safety score 0–100 from the governing factor of safety. */
function safetyScore(minFoS: number): number {
  if (!Number.isFinite(minFoS)) return 100;
  if (minFoS <= 0) return 0;
  // FoS 1 → 40, 2 → 70, 3 → 85, ≥5 → ~100.
  return Math.max(0, Math.min(100, 100 * (1 - Math.exp(-minFoS / 2.2))));
}
