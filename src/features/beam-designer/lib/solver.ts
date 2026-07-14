/**
 * ── 2-node Euler–Bernoulli beam finite-element solver ─────────────────────────
 *
 * Framework-free, deterministic, pure. Solves a planar (2-D) beam in bending for
 * deflection, slope, bending moment, shear, reactions and derived quantities.
 * All I/O is strict SI base units (m, N, N·m, Pa, m², m⁴) — the caller/UI does
 * any display-unit conversion.
 *
 * ── FE FORMULATION ────────────────────────────────────────────────────────────
 * The beam [0, L] is discretised into 2-node line elements. Each node carries
 * two DOFs: transverse deflection v (m) and rotation θ (rad). The transverse
 * displacement field inside an element is the cubic Hermite interpolation
 *
 *     v(x) = N1(ξ)·v1 + N2(ξ)·θ1 + N3(ξ)·v2 + N4(ξ)·θ2 ,   ξ = local coord ∈ [0,Le]
 *
 * which makes the element the *exact* solution of the Euler–Bernoulli equation
 * EI·v'''' = 0 between loaded points — so for the classic textbook load cases
 * (point loads / linearly-varying distributed loads applied at element ends) the
 * FE answer is analytically exact regardless of mesh density.
 *
 * Element stiffness (EI = E·I constant per element):
 *
 *   Ke = EI/Le³ · ⎡ 12    6Le   -12    6Le ⎤
 *                ⎢ 6Le   4Le²  -6Le   2Le² ⎥
 *                ⎢-12   -6Le    12   -6Le  ⎥
 *                ⎣ 6Le   2Le²  -6Le   4Le² ⎦
 *
 * Consistent (work-equivalent) nodal load vector for a distributed load whose
 * intensity varies linearly from w1 at the element's left node to w2 at the
 * right node, integrated against the Hermite shape functions:
 *
 *   Fv1 = Le·(7·w1 + 3·w2)/20
 *   Fθ1 = Le²·(3·w1 + 2·w2)/60
 *   Fv2 = Le·(3·w1 + 7·w2)/20
 *   Fθ2 = −Le²·(2·w1 + 3·w2)/60
 *
 * (w uniform ⇒ {wLe/2, wLe²/12, wLe/2, −wLe²/12}, the standard fixed-end vector.)
 * Point loads add straight onto a node's v-DOF; applied moments onto its θ-DOF.
 *
 * ── SIGN CONVENTIONS ──────────────────────────────────────────────────────────
 *  • Transverse axis v is positive UP. A downward force is therefore NEGATIVE
 *    (matches `Load.magnitude` for point/udl where down = −).
 *  • Rotation θ positive counter-clockwise (θ = dv/dx).
 *  • Reactions: Fy positive UP, M positive counter-clockwise.
 *  • BENDING MOMENT is reported in the **structural (sagging-positive)**
 *    convention: M(x) = +EI·v''(x). With v positive up, a simply-supported beam
 *    under downward load sags (v''>0 ⇒ v curves upward as a smile) giving a
 *    POSITIVE moment — i.e. the familiar textbook parabolic BMD sitting above
 *    the axis. This is the sign every validation case below is checked against.
 *  • SHEAR is V(x) = dM/dx = +EI·v'''(x); constant within a cubic element and
 *    jumping at concentrated loads. On a simply-supported beam with a central
 *    downward load this gives +P/2 on the left half, −P/2 on the right — the
 *    conventional SFD.
 *
 * ── SUPPORTS / RELEASES ───────────────────────────────────────────────────────
 *  • pin & roller → v = 0 at the node (both restrain vertical translation; the
 *    horizontal DOF is not modelled in this 1-D bending formulation).
 *  • fixed        → v = 0 AND θ = 0.
 *  • spring       → springK added to the node's v-DOF diagonal (elastic support,
 *    NOT constrained); its reaction is −springK·v.
 *  • hinge        → moment release. The hinge node is given TWO independent θ
 *    DOFs — one shared by all elements to its left, one by all elements to its
 *    right — so bending moment is transmitted continuously on each side but the
 *    two sides rotate independently, i.e. M = 0 across the hinge. The v DOF stays
 *    shared (deflection continuous). This is the exact, textbook internal hinge.
 *
 * ── SOLVE ─────────────────────────────────────────────────────────────────────
 * Global K (dense) and F are assembled, constrained DOFs removed, and the
 * reduced system solved by Gauss elimination with partial pivoting (own impl).
 * A singular/under-restrained system ⇒ stable = false + diagnostic, safe zeroed
 * diagrams. The routine NEVER throws.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type {
  Beam,
  BeamResult,
  Diagram,
  Diagnostic,
  Load,
  Support,
  SupportReaction,
} from "../types";
import { sectionProps } from "./sections";

// ── tuning constants ──────────────────────────────────────────────────────────
const MAX_NODES = 400;
const TARGET_SAMPLES = 200; // reference sample density over the span
const EPS = 1e-12;

// ── small numeric helpers ─────────────────────────────────────────────────────
function safeDiv(a: number, b: number, fallback = 0): number {
  return Math.abs(b) < EPS ? fallback : a / b;
}
function finiteOr(v: number, fallback = 0): number {
  return Number.isFinite(v) ? v : fallback;
}

/** Empty diagram of a given length (all zeros). */
function zeroDiagram(x: number[]): Diagram {
  return {
    x: [...x],
    y: x.map(() => 0),
    maxIndex: 0,
    maxValue: 0,
    minValue: 0,
  };
}

/** Build a Diagram from paired x/y, filling extreme metadata (max |y|). */
function makeDiagram(x: number[], y: number[]): Diagram {
  let maxIndex = 0;
  let maxAbs = -1;
  let maxValue = 0;
  let minValue = 0;
  for (let i = 0; i < y.length; i++) {
    const v = y[i]!;
    if (i === 0) {
      maxValue = v;
      minValue = v;
    } else {
      if (v > maxValue) maxValue = v;
      if (v < minValue) minValue = v;
    }
    const a = Math.abs(v);
    if (a > maxAbs) {
      maxAbs = a;
      maxIndex = i;
    }
  }
  return { x: [...x], y: [...y], maxIndex, maxValue, minValue };
}

/** Signed largest-magnitude value of an array (0 if empty). */
function signedPeak(y: number[]): number {
  let peak = 0;
  let maxAbs = -1;
  for (const v of y) {
    const a = Math.abs(v);
    if (a > maxAbs) {
      maxAbs = a;
      peak = v;
    }
  }
  return peak;
}

// ── node meshing ──────────────────────────────────────────────────────────────

/** Collect the mandatory node positions then subdivide, capped at MAX_NODES. */
function buildNodes(beam: Beam, loads: Load[]): number[] {
  const L = beam.length;
  const required = new Set<number>();
  const snap = (x: number) => Math.min(L, Math.max(0, x));
  const add = (x: number) =>
    required.add((Math.round((snap(x) / L) * 1e9) / 1e9) * L);

  add(0);
  add(L);
  for (const s of beam.supports) add(s.x);
  for (const h of beam.hinges) add(h.x);
  for (const ld of loads) {
    add(ld.x);
    if (
      ld.type === "udl" ||
      ld.type === "triangular" ||
      ld.type === "trapezoidal"
    ) {
      add(ld.x + Math.max(0, ld.length));
    }
  }

  // Sorted, de-duplicated required breakpoints.
  const breaks = [...required].sort((a, b) => a - b);
  const uniqueBreaks: number[] = [];
  for (const b of breaks) {
    const last = uniqueBreaks[uniqueBreaks.length - 1];
    if (last === undefined || Math.abs(b - last) > L * 1e-9)
      uniqueBreaks.push(b);
  }
  if (uniqueBreaks.length < 2) return [0, L]; // degenerate; caller guards L≤0

  // Subdivide each segment. Budget interior nodes across all segments ≤ cap.
  const refLen = safeDiv(L, TARGET_SAMPLES, L);
  const nodes: number[] = [uniqueBreaks[0]!];
  for (let i = 0; i < uniqueBreaks.length - 1; i++) {
    const a = uniqueBreaks[i]!;
    const b = uniqueBreaks[i + 1]!;
    const segLen = b - a;
    let interior = Math.max(2, Math.ceil(safeDiv(segLen, refLen, 2)));
    // Rough per-segment cap so the total cannot blow past MAX_NODES.
    const perSegCap = Math.max(
      2,
      Math.floor((MAX_NODES - uniqueBreaks.length) / (uniqueBreaks.length - 1)),
    );
    interior = Math.min(interior, perSegCap);
    for (let k = 1; k <= interior; k++)
      nodes.push(a + (segLen * k) / (interior + 1));
    nodes.push(b);
  }

  // Final tidy: sort + unique (subdivision keeps order, but be safe).
  nodes.sort((p, q) => p - q);
  const out: number[] = [];
  for (const n of nodes) {
    const last = out[out.length - 1];
    if (last === undefined || Math.abs(n - last) > L * 1e-12) out.push(n);
  }
  return out;
}

// ── linear algebra: Gauss elimination with partial pivoting ────────────────────

/**
 * Solve A·x = b in place for a dense n×n system. Returns null if singular.
 * A is an array of row arrays (mutated); b is mutated too.
 */
function gaussSolve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    // Partial pivot: largest |value| in this column at/below the diagonal.
    let pivotRow = col;
    let pivotVal = Math.abs(A[col]![col]!);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(A[r]![col]!);
      if (v > pivotVal) {
        pivotVal = v;
        pivotRow = r;
      }
    }
    if (pivotVal < 1e-14) return null; // singular / rank-deficient

    if (pivotRow !== col) {
      const tmp = A[col]!;
      A[col] = A[pivotRow]!;
      A[pivotRow] = tmp;
      const tb = b[col]!;
      b[col] = b[pivotRow]!;
      b[pivotRow] = tb;
    }

    const pivot = A[col]![col]!;
    for (let r = col + 1; r < n; r++) {
      const factor = A[r]![col]! / pivot;
      if (factor === 0) continue;
      const rowR = A[r]!;
      const rowC = A[col]!;
      for (let c = col; c < n; c++) rowR[c] = rowR[c]! - factor * rowC[c]!;
      b[r] = b[r]! - factor * b[col]!;
    }
  }

  // Back-substitution.
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = b[r]!;
    const rowR = A[r]!;
    for (let c = r + 1; c < n; c++) sum -= rowR[c]! * x[c]!;
    const diag = rowR[r]!;
    if (Math.abs(diag) < 1e-14) return null;
    x[r] = sum / diag;
  }
  return x;
}

// ── Hermite shape functions & their derivatives (local ξ ∈ [0, Le]) ────────────
// v(ξ) = N·[v1 θ1 v2 θ2]ᵀ. We only ever need v'' (curvature) and v''' (shear),
// evaluated from the element's four nodal DOFs.

/** Second derivative of v at local ξ given element length Le and DOFs. */
function curvature(
  Le: number,
  dof: [number, number, number, number],
  xi: number,
): number {
  const [v1, t1, v2, t2] = dof;
  const L2 = Le * Le;
  const L3 = L2 * Le;
  // N1'' = -6/Le² + 12ξ/Le³ ; N2'' = -4/Le + 6ξ/Le²
  // N3'' =  6/Le² - 12ξ/Le³ ; N4'' = -2/Le + 6ξ/Le²
  const d2N1 = -6 / L2 + (12 * xi) / L3;
  const d2N2 = -4 / Le + (6 * xi) / L2;
  const d2N3 = 6 / L2 - (12 * xi) / L3;
  const d2N4 = -2 / Le + (6 * xi) / L2;
  return d2N1 * v1 + d2N2 * t1 + d2N3 * v2 + d2N4 * t2;
}

/** Third derivative of v (constant over the cubic element) given DOFs. */
function thirdDeriv(Le: number, dof: [number, number, number, number]): number {
  const [v1, t1, v2, t2] = dof;
  const L2 = Le * Le;
  const L3 = L2 * Le;
  // N1''' = 12/Le³ ; N2''' = 6/Le² ; N3''' = -12/Le³ ; N4''' = 6/Le²
  return (12 / L3) * v1 + (6 / L2) * t1 + (-12 / L3) * v2 + (6 / L2) * t2;
}

/** v at local ξ via Hermite shapes (for interior deflection sampling). */
function deflectAt(
  Le: number,
  dof: [number, number, number, number],
  xi: number,
): number {
  const [v1, t1, v2, t2] = dof;
  const s = xi / Le; // normalised 0..1
  const s2 = s * s;
  const s3 = s2 * s;
  const N1 = 1 - 3 * s2 + 2 * s3;
  const N2 = Le * (s - 2 * s2 + s3);
  const N3 = 3 * s2 - 2 * s3;
  const N4 = Le * (-s2 + s3);
  return N1 * v1 + N2 * t1 + N3 * v2 + N4 * t2;
}

/** slope θ = dv/dx at local ξ. */
function slopeAt(
  Le: number,
  dof: [number, number, number, number],
  xi: number,
): number {
  const [v1, t1, v2, t2] = dof;
  const s = xi / Le;
  const s2 = s * s;
  // dN/dx = (dN/ds)/Le
  const dN1 = (-6 * s + 6 * s2) / Le;
  const dN2 = 1 - 4 * s + 3 * s2;
  const dN3 = (6 * s - 6 * s2) / Le;
  const dN4 = -2 * s + 3 * s2;
  return dN1 * v1 + dN2 * t1 + dN3 * v2 + dN4 * t2;
}

// ── distributed load intensity sampling ────────────────────────────────────────
/** Intensity w (N/m, signed) of a distributed load at absolute position x. */
function loadIntensityAt(ld: Load, x: number): number {
  const a = ld.x;
  const b = ld.x + Math.max(0, ld.length);
  if (x < a - EPS || x > b + EPS) return 0;
  const span = b - a;
  if (span < EPS) return 0;
  const t = Math.min(1, Math.max(0, (x - a) / span));
  if (ld.type === "udl") return ld.magnitude;
  if (ld.type === "triangular") {
    // 0 at start → magnitude2 (or magnitude if unset) at end.
    const wEnd = ld.magnitude2 ?? ld.magnitude;
    return wEnd * t;
  }
  // trapezoidal: w1 = magnitude at start → w2 = magnitude2 at end.
  const w1 = ld.magnitude;
  const w2 = ld.magnitude2 ?? ld.magnitude;
  return w1 + (w2 - w1) * t;
}

// ── the solver ─────────────────────────────────────────────────────────────────

export function solveBeam(beam: Beam, caseId?: string): BeamResult {
  const diagnostics: Diagnostic[] = [];

  // Section & material properties (guarded).
  const props = sectionProps(beam.section);
  const A = Math.max(props.area, 1e-12);
  const I = Math.max(props.I, 1e-15);
  const S = Math.max(props.S, 1e-12);
  const E = Math.max(beam.material.E, 1);
  const EI = E * I;
  const L = beam.length;
  const density = Math.max(beam.material.density, 0);
  const yieldStr = Math.max(beam.material.yield, 1);

  const mass = density * A * L;
  const cost = mass * Math.max(beam.material.cost, 0);

  // Loads for this case (or all).
  const loads = beam.loads.filter(
    (ld) => caseId === undefined || ld.caseId === caseId,
  );

  // Fallback (safe) empty result builder, used on early exits.
  const emptyX = L > 0 ? [0, L] : [0];
  const buildUnsolved = (stable: boolean): BeamResult => ({
    solved: false,
    stable,
    reactions: [],
    shear: zeroDiagram(emptyX),
    moment: zeroDiagram(emptyX),
    slope: zeroDiagram(emptyX),
    deflection: zeroDiagram(emptyX),
    bendingStress: zeroDiagram(emptyX),
    maxShear: 0,
    maxMoment: 0,
    maxDeflection: 0,
    maxSlope: 0,
    maxBendingStress: 0,
    maxShearStress: 0,
    maxVonMises: 0,
    factorOfSafety: 0,
    bucklingLoad: finiteOr(safeDiv(Math.PI ** 2 * EI, L * L), 0),
    naturalFrequency: 0,
    mass,
    cost,
    diagnostics,
  });

  if (!(L > 0)) {
    diagnostics.push({
      severity: "error",
      code: "bad-length",
      message: "Beam length must be positive.",
    });
    return buildUnsolved(false);
  }
  if (beam.supports.length === 0) {
    diagnostics.push({
      severity: "error",
      code: "no-support",
      message: "Beam has no supports — rigid-body unstable.",
    });
    return buildUnsolved(false);
  }

  // ── Build the node mesh ──────────────────────────────────────────────────────
  const nodeX = buildNodes(beam, loads);
  const nNodes = nodeX.length;

  /** Locate the mesh node index nearest to x (nodes were placed at every feature). */
  const nodeIndexAt = (x: number): number => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < nNodes; i++) {
      const d = Math.abs(nodeX[i]! - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  };

  // ── DOF layout with hinge rotation splitting ─────────────────────────────────
  // Each node has one v-DOF. Its θ can be split into a "left" and "right" copy at
  // an internal hinge. We assign DOF indices explicitly.
  //   vDof[i]      → global index of node i's deflection DOF
  //   thetaLeft[i] → global index of the rotation DOF used by the element ENDING at node i
  //   thetaRight[i]→ global index of the rotation DOF used by the element STARTING at node i
  // For a normal (non-hinge) node these two are the same index. At a hinge they differ.
  const hingeNodeSet = new Set<number>();
  for (const h of beam.hinges) {
    if (h.x > 1e-9 && h.x < L - 1e-9) hingeNodeSet.add(nodeIndexAt(h.x));
    else
      diagnostics.push({
        severity: "info",
        code: "hinge-at-support",
        message: "Hinge at a beam end has no effect.",
      });
  }

  const vDof = new Array<number>(nNodes).fill(-1);
  const thetaLeft = new Array<number>(nNodes).fill(-1);
  const thetaRight = new Array<number>(nNodes).fill(-1);
  let ndof = 0;
  for (let i = 0; i < nNodes; i++) {
    vDof[i] = ndof++;
    if (hingeNodeSet.has(i) && i > 0 && i < nNodes - 1) {
      // Two independent rotation DOFs → M = 0 transmitted across the hinge.
      thetaLeft[i] = ndof++;
      thetaRight[i] = ndof++;
    } else {
      const t = ndof++;
      thetaLeft[i] = t;
      thetaRight[i] = t;
    }
  }

  if (ndof > 2 * MAX_NODES + 8) {
    diagnostics.push({
      severity: "warning",
      code: "large-model",
      message: "Model truncated for performance.",
    });
  }

  // ── Assemble global K and F ──────────────────────────────────────────────────
  const K: number[][] = Array.from({ length: ndof }, () =>
    new Array<number>(ndof).fill(0),
  );
  const F = new Array<number>(ndof).fill(0);

  const nElem = nNodes - 1;
  for (let e = 0; e < nElem; e++) {
    const iA = e;
    const iB = e + 1;
    const xA = nodeX[iA]!;
    const xB = nodeX[iB]!;
    const Le = xB - xA;
    if (Le <= EPS) continue;

    // Element DOF map: [v1, θ1(right side of A), v2, θ2(left side of B)].
    // The element starts at node A → uses A's RIGHT rotation; ends at node B →
    // uses B's LEFT rotation. This is what makes the hinge split work.
    const map = [vDof[iA]!, thetaRight[iA]!, vDof[iB]!, thetaLeft[iB]!];

    // Element stiffness (EI/Le³ scaling).
    const c = EI / (Le * Le * Le);
    const Le2 = Le * Le;
    const ke = [
      [12 * c, 6 * Le * c, -12 * c, 6 * Le * c],
      [6 * Le * c, 4 * Le2 * c, -6 * Le * c, 2 * Le2 * c],
      [-12 * c, -6 * Le * c, 12 * c, -6 * Le * c],
      [6 * Le * c, 2 * Le2 * c, -6 * Le * c, 4 * Le2 * c],
    ];
    for (let a = 0; a < 4; a++) {
      const ga = map[a]!;
      const rowGa = K[ga]!;
      const keRow = ke[a]!;
      for (let bb = 0; bb < 4; bb++)
        rowGa[map[bb]!] = rowGa[map[bb]!]! + keRow[bb]!;
    }

    // ── Consistent load vector for distributed loads on this element ───────────
    // Because nodes sit at every distributed-load boundary, each element is fully
    // inside or fully outside any given load. Sum contributions from all loads.
    let w1 = 0;
    let w2 = 0;
    for (const ld of loads) {
      if (
        ld.type === "udl" ||
        ld.type === "triangular" ||
        ld.type === "trapezoidal"
      ) {
        const a0 = ld.x;
        const b0 = ld.x + Math.max(0, ld.length);
        const mid = (xA + xB) / 2;
        if (mid > a0 - EPS && mid < b0 + EPS) {
          w1 += loadIntensityAt(ld, xA);
          w2 += loadIntensityAt(ld, xB);
        }
      }
    }
    if (w1 !== 0 || w2 !== 0) {
      // Work-equivalent fixed-end forces for a linearly varying load w1→w2.
      const Fv1 = (Le * (7 * w1 + 3 * w2)) / 20;
      const Ft1 = (Le2 * (3 * w1 + 2 * w2)) / 60;
      const Fv2 = (Le * (3 * w1 + 7 * w2)) / 20;
      const Ft2 = -(Le2 * (2 * w1 + 3 * w2)) / 60;
      F[map[0]!] = F[map[0]!]! + Fv1;
      F[map[1]!] = F[map[1]!]! + Ft1;
      F[map[2]!] = F[map[2]!]! + Fv2;
      F[map[3]!] = F[map[3]!]! + Ft2;
    }
  }

  // ── Nodal (point / moment) loads ─────────────────────────────────────────────
  for (const ld of loads) {
    if (ld.type === "point") {
      const idx = nodeIndexAt(ld.x);
      F[vDof[idx]!] = F[vDof[idx]!]! + ld.magnitude; // signed (down = negative)
    } else if (ld.type === "moment") {
      const idx = nodeIndexAt(ld.x);
      // Apply to the node's rotation DOF; if split (hinge) put it on the right side.
      F[thetaRight[idx]!] = F[thetaRight[idx]!]! + ld.magnitude;
    }
  }

  // ── Boundary conditions ──────────────────────────────────────────────────────
  // fixedDofs: DOFs constrained to 0. springDofs: v-DOFs with an added stiffness.
  const fixedDofs = new Set<number>();
  // Track which support constrains which DOFs, for reaction recovery.
  interface SupCon {
    support: Support;
    node: number;
    vDofIdx: number;
    mDofIdx: number | null; // θ DOF constrained (fixed) — else null
    springK: number | null;
  }
  const supCons: SupCon[] = [];

  for (const s of beam.supports) {
    const node = nodeIndexAt(s.x);
    const vi = vDof[node]!;
    if (s.type === "spring") {
      const k = Math.max(0, s.springK ?? 0);
      K[vi]![vi]! += k;
      supCons.push({
        support: s,
        node,
        vDofIdx: vi,
        mDofIdx: null,
        springK: k,
      });
    } else if (s.type === "fixed") {
      fixedDofs.add(vi);
      // Constrain BOTH rotation copies if this node happens to be a hinge (odd but safe).
      const tL = thetaLeft[node]!;
      const tR = thetaRight[node]!;
      fixedDofs.add(tL);
      if (tR !== tL) fixedDofs.add(tR);
      supCons.push({
        support: s,
        node,
        vDofIdx: vi,
        mDofIdx: tL,
        springK: null,
      });
    } else {
      // pin / roller → vertical restraint only.
      fixedDofs.add(vi);
      supCons.push({
        support: s,
        node,
        vDofIdx: vi,
        mDofIdx: null,
        springK: null,
      });
    }
  }

  // ── Reduce to free DOFs and solve ────────────────────────────────────────────
  const freeDofs: number[] = [];
  const globalToFree = new Array<number>(ndof).fill(-1);
  for (let i = 0; i < ndof; i++) {
    if (!fixedDofs.has(i)) {
      globalToFree[i] = freeDofs.length;
      freeDofs.push(i);
    }
  }

  const u = new Array<number>(ndof).fill(0); // full DOF vector (fixed stay 0)

  if (freeDofs.length > 0) {
    const nf = freeDofs.length;
    const Kff: number[][] = Array.from({ length: nf }, () =>
      new Array<number>(nf).fill(0),
    );
    const Ff = new Array<number>(nf).fill(0);
    for (let a = 0; a < nf; a++) {
      const ga = freeDofs[a]!;
      const srcRow = K[ga]!;
      const dstRow = Kff[a]!;
      for (let b = 0; b < nf; b++) dstRow[b] = srcRow[freeDofs[b]!]!;
      Ff[a] = F[ga]!;
    }

    const sol = gaussSolve(Kff, Ff);
    if (sol === null) {
      diagnostics.push({
        severity: "error",
        code: "unstable",
        message:
          "Structure is a mechanism (singular stiffness) — insufficient / mis-placed supports.",
      });
      return buildUnsolved(false);
    }
    for (let a = 0; a < nf; a++) u[freeDofs[a]!] = sol[a]!;
  } else {
    diagnostics.push({
      severity: "warning",
      code: "fully-restrained",
      message: "All DOFs restrained; no deflection.",
    });
  }

  // Sanity: reject non-finite / absurd displacements (near-singular).
  let anyBad = false;
  for (const v of u) if (!Number.isFinite(v)) anyBad = true;
  if (anyBad) {
    diagnostics.push({
      severity: "error",
      code: "unstable",
      message: "Numerical instability in solve.",
    });
    return buildUnsolved(false);
  }

  // ── Reactions: R = K_full·u − F at constrained DOFs; spring = −k·v ────────────
  const reactions: SupportReaction[] = [];
  const dotKrow = (dofIdx: number): number => {
    const row = K[dofIdx]!;
    let sum = 0;
    for (let c = 0; c < ndof; c++) {
      const uc = u[c]!;
      if (uc !== 0) sum += row[c]! * uc;
    }
    return sum;
  };

  for (const sc of supCons) {
    let Fy = 0;
    let M = 0;
    if (sc.springK !== null) {
      // Elastic support reaction (opposes deflection). Note K already includes k,
      // so use direct constitutive relation for the spring force.
      Fy = -sc.springK * u[sc.vDofIdx]!;
    } else {
      Fy = dotKrow(sc.vDofIdx) - F[sc.vDofIdx]!;
      if (sc.mDofIdx !== null) M = dotKrow(sc.mDofIdx) - F[sc.mDofIdx]!;
    }
    reactions.push({
      supportId: sc.support.id,
      x: sc.support.x,
      Fy: finiteOr(Fy),
      M: finiteOr(M),
    });
  }

  // ── Recover diagrams by sampling each element ────────────────────────────────
  const xs: number[] = [];
  const vArr: number[] = [];
  const slopeArr: number[] = [];
  const momentArr: number[] = [];
  const shearArr: number[] = [];

  const pushSample = (
    x: number,
    v: number,
    th: number,
    mom: number,
    sh: number,
  ) => {
    xs.push(x);
    vArr.push(finiteOr(v));
    slopeArr.push(finiteOr(th));
    momentArr.push(finiteOr(mom));
    shearArr.push(finiteOr(sh));
  };

  // Interior sample count per element for smooth curves (small; nodes already dense).
  const INTERIOR = 4;
  for (let e = 0; e < nElem; e++) {
    const iA = e;
    const iB = e + 1;
    const xA = nodeX[iA]!;
    const xB = nodeX[iB]!;
    const Le = xB - xA;
    if (Le <= EPS) continue;

    const dof: [number, number, number, number] = [
      u[vDof[iA]!]!,
      u[thetaRight[iA]!]!,
      u[vDof[iB]!]!,
      u[thetaLeft[iB]!]!,
    ];

    // Shear is constant within the element (cubic v) → precompute.
    // M = +EI·v''  (sagging positive);  V = +EI·v'''.
    const shearElem = EI * thirdDeriv(Le, dof);

    // Distributed load intensity on this element (constant curvature slope only
    // via the cubic; but consistent loads already put the correct v''' — sampling
    // curvature at the two ends captures the linear moment variation exactly).
    const samplesPerElem = e === nElem - 1 ? INTERIOR + 1 : INTERIOR; // include final endpoint once
    for (let k = 0; k < samplesPerElem; k++) {
      const xi = (Le * k) / INTERIOR;
      const xAbs = xA + xi;
      const v = deflectAt(Le, dof, xi);
      const th = slopeAt(Le, dof, xi);
      const mom = EI * curvature(Le, dof, xi);
      pushSample(xAbs, v, th, mom, shearElem);
    }
  }
  // Ensure the very last node endpoint is present.
  if (xs.length === 0 || Math.abs(xs[xs.length - 1]! - L) > L * 1e-9) {
    const eLast = nElem - 1;
    if (eLast >= 0) {
      const iA = eLast;
      const iB = eLast + 1;
      const xA = nodeX[iA]!;
      const Le = nodeX[iB]! - xA;
      if (Le > EPS) {
        const dof: [number, number, number, number] = [
          u[vDof[iA]!]!,
          u[thetaRight[iA]!]!,
          u[vDof[iB]!]!,
          u[thetaLeft[iB]!]!,
        ];
        pushSample(
          nodeX[iB]!,
          deflectAt(Le, dof, Le),
          slopeAt(Le, dof, Le),
          EI * curvature(Le, dof, Le),
          EI * thirdDeriv(Le, dof),
        );
      }
    }
  }

  // ── Bending stress σ(x) = M(x)/S ─────────────────────────────────────────────
  const stressArr = momentArr.map((m) => m / S);

  const shearD = makeDiagram(xs, shearArr);
  const momentD = makeDiagram(xs, momentArr);
  const slopeD = makeDiagram(xs, slopeArr);
  const deflD = makeDiagram(xs, vArr);
  const stressD = makeDiagram(xs, stressArr);

  const maxShear = signedPeak(shearArr);
  const maxMoment = signedPeak(momentArr);
  const maxDeflection = signedPeak(vArr);
  const maxSlope = signedPeak(slopeArr);
  const maxBendingStress = Math.max(...stressArr.map(Math.abs), 0);

  // Shear stress (form factor 1.5, solid-section approximation).
  const maxShearStress = 1.5 * safeDiv(Math.abs(maxShear), A, 0);

  // von Mises at the worst point: combine peak σ and peak τ (conservative).
  const maxVonMises = Math.sqrt(
    maxBendingStress * maxBendingStress + 3 * maxShearStress * maxShearStress,
  );

  const factorOfSafety =
    maxVonMises < 1 ? 999 : Math.min(999, safeDiv(yieldStr, maxVonMises, 999));

  // ── Euler buckling: pinned column of length L ────────────────────────────────
  const bucklingLoad = finiteOr(safeDiv(Math.PI ** 2 * EI, L * L), 0);

  // ── First natural frequency estimate ─────────────────────────────────────────
  // Base SS coefficient: f1 = (π/2)·√(EI/(m'·L⁴)). Scale by a boundary factor.
  const mPrime = Math.max(density * A, 1e-9);
  const fSS =
    (Math.PI / 2) * Math.sqrt(Math.max(0, safeDiv(EI, mPrime * L ** 4, 0)));
  const nFixed = beam.supports.filter((s) => s.type === "fixed").length;
  const nVert = beam.supports.filter((s) => s.type !== "spring").length;
  let boundaryFactor = 1; // simply-supported baseline
  if (nFixed >= 2)
    boundaryFactor = 2.27; // fixed–fixed
  else if (nFixed === 1 && nVert <= 1) boundaryFactor = 0.36; // cantilever
  const naturalFrequency = finiteOr(fSS * boundaryFactor, 0);

  return {
    solved: true,
    stable: true,
    reactions,
    shear: shearD,
    moment: momentD,
    slope: slopeD,
    deflection: deflD,
    bendingStress: stressD,
    maxShear,
    maxMoment,
    maxDeflection,
    maxSlope,
    maxBendingStress,
    maxShearStress,
    maxVonMises,
    factorOfSafety,
    bucklingLoad,
    naturalFrequency,
    mass,
    cost,
    diagnostics,
  };
}

/**
 * Sample just the x / shear / moment arrays for envelope stacking across load
 * cases. Returns empty arrays on an unsolved/unstable beam (never throws).
 */
export function sampleDiagrams(
  beam: Beam,
  caseId?: string,
): { x: number[]; shear: number[]; moment: number[] } {
  const r = solveBeam(beam, caseId);
  return { x: r.shear.x, shear: r.shear.y, moment: r.moment.y };
}
