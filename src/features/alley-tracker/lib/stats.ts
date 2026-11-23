/**
 * Pure, dependency-free statistics for Alley Tracker. A direct TypeScript port
 * of tornado-analysis/scripts/stats3.py so the page can re-run the paper's
 * tests for ANY pair of periods / season / rating the user picks, not just the
 * fixed Period I/II/III published in the report.
 *
 * Everything is seeded (mulberry32) so a given selection always yields the same
 * numbers — on screen, in the worker, and in the PDF.
 */

export type Rng = () => number;

/** mulberry32: tiny, fast, good-enough PRNG for resampling. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rng: Rng): number {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

export function mean(x: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i]!;
  return x.length ? s / x.length : NaN;
}

/** Linear-interpolated percentile (numpy default) of a SORTED array. */
export function pctSorted(sorted: ArrayLike<number>, p: number): number {
  const n = sorted.length;
  if (!n) return NaN;
  const h = (n - 1) * (p / 100);
  const lo = Math.floor(h);
  const hi = Math.min(lo + 1, n - 1);
  return sorted[lo]! + (h - lo) * (sorted[hi]! - sorted[lo]!);
}

/** Two-sided Student-t critical value (Cornish–Fisher; < 0.1 % error for df ≥ 5). */
export function tCrit(alpha: number, df: number): number {
  const z = zQuantile(1 - alpha / 2);
  const z3 = z ** 3,
    z5 = z ** 5,
    z7 = z ** 7;
  return (
    z +
    (z3 + z) / (4 * df) +
    (5 * z5 + 16 * z3 + 3 * z) / (96 * df ** 2) +
    (3 * z7 + 19 * z5 + 17 * z3 - 15 * z) / (384 * df ** 3)
  );
}

/** Standard-normal quantile (Acklam's rational approximation). */
export function zQuantile(p: number): number {
  const a = [
    -39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269,
    -30.6647980661472, 2.50662827745924,
  ];
  const b = [
    -54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197,
    -13.2806815528857,
  ];
  const c = [
    -0.00778489400243029, -0.322396458041136, -2.40075827716184,
    -2.54973253934373, 4.37466414146497, 2.93816398269878,
  ];
  const d = [
    0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742,
  ];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q +
        c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  }
  if (p > 1 - pl) return -zQuantile(1 - p);
  const q = p - 0.5,
    r = q * q;
  return (
    ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r +
      a[5]!) *
      q) /
    (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
  );
}

/** Standard-normal CDF (Abramowitz–Stegun 7.1.26 via erf). */
export function normCdf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x / Math.SQRT2));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-(x * x) / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

// ───────────────────────────────────────────────────────── bootstrap of means

export interface MeanCI {
  n: number;
  mean: number;
  ci95: [number, number];
}

/** Classical (iid) bootstrap CI of an annual mean. */
export function bootstrapMean(
  x: ArrayLike<number>,
  nBoot: number,
  rng: Rng,
): MeanCI {
  const n = x.length;
  if (!n) return { n, mean: NaN, ci95: [NaN, NaN] };
  const m = new Float64Array(nBoot);
  for (let b = 0; b < nBoot; b++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += x[(rng() * n) | 0]!;
    m[b] = s / n;
  }
  m.sort();
  return { n, mean: mean(x), ci95: [pctSorted(m, 2.5), pctSorted(m, 97.5)] };
}

export interface DiffCI {
  diff: number;
  ci95: [number, number];
  ci99: [number, number];
  /** one-sided share of resampled differences on the "wrong" side of zero */
  pLE0: number;
  pGE0: number;
  /** 40-bin histogram of the bootstrap distribution, for the PDF plot */
  hist: { edges: number[]; counts: number[] };
}

/**
 * Bootstrap of (mean y) − (mean x) with x and y resampled independently.
 * With equal lengths this is exactly the paper's Fig. 12 procedure (draw one
 * east and one west year, difference, repeat n times, average; 10 000 times).
 */
export function bootstrapDiff(
  x: ArrayLike<number>,
  y: ArrayLike<number>,
  nBoot: number,
  rng: Rng,
): DiffCI {
  const nx = x.length,
    ny = y.length;
  const d = new Float64Array(nBoot);
  for (let b = 0; b < nBoot; b++) {
    let sx = 0,
      sy = 0;
    for (let i = 0; i < nx; i++) sx += x[(rng() * nx) | 0]!;
    for (let i = 0; i < ny; i++) sy += y[(rng() * ny) | 0]!;
    d[b] = sy / ny - sx / nx;
  }
  let le = 0,
    ge = 0;
  for (const v of d) {
    if (v <= 0) le++;
    if (v >= 0) ge++;
  }
  d.sort();
  const lo = d[0]!,
    hi = d[nBoot - 1]!;
  const nb = 40,
    w = (hi - lo) / nb || 1;
  const counts = new Array(nb).fill(0);
  for (const v of d) counts[Math.min(nb - 1, Math.floor((v - lo) / w))]++;
  return {
    diff: mean(y) - mean(x),
    ci95: [pctSorted(d, 2.5), pctSorted(d, 97.5)],
    ci99: [pctSorted(d, 0.5), pctSorted(d, 99.5)],
    pLE0: le / nBoot,
    pGE0: ge / nBoot,
    hist: {
      edges: Array.from({ length: nb + 1 }, (_, i) => lo + i * w),
      counts,
    },
  };
}

// ───────────────────────────────────────────────────────── trend

export interface Trend {
  slopePerDecade: number;
  ci95: [number, number];
  tau: number;
  p: number;
}

/** Theil–Sen slope with Sen's 95 % CI, and the Mann–Kendall test (tie-corrected). */
export function theilSenMK(t: ArrayLike<number>, y: ArrayLike<number>): Trend {
  const n = y.length;
  const slopes: number[] = [];
  let S = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      if (t[j]! !== t[i]!) slopes.push((y[j]! - y[i]!) / (t[j]! - t[i]!));
      S += Math.sign(y[j]! - y[i]!);
    }
  slopes.sort((p, q) => p - q);
  const ties = new Map<number, number>();
  for (let i = 0; i < n; i++) ties.set(y[i]!, (ties.get(y[i]!) ?? 0) + 1);
  let tieTerm = 0;
  for (const c of ties.values()) tieTerm += c * (c - 1) * (2 * c + 5);
  const varS = (n * (n - 1) * (2 * n + 5) - tieTerm) / 18;
  const z = varS > 0 ? (S - Math.sign(S)) / Math.sqrt(varS) : 0;
  const p = 2 * (1 - normCdf(Math.abs(z)));
  const N = slopes.length;
  const Ca = 1.959964 * Math.sqrt(varS);
  const lo = Math.max(0, Math.round((N - Ca) / 2) - 1);
  const hi = Math.min(N - 1, Math.round((N + Ca) / 2));
  const med = N ? pctSorted(slopes, 50) : NaN;
  return {
    slopePerDecade: med * 10,
    ci95: [slopes[lo]! * 10, slopes[hi]! * 10],
    tau: n > 1 ? S / ((n * (n - 1)) / 2) : NaN,
    p,
  };
}

// ───────────────────────────────────────────────────────── field significance

export interface FieldSigInput {
  /** year-major grid series: values[(yearIdx * nCells) + cell] */
  values: Float64Array;
  nCells: number;
  idxA: number[];
  idxB: number[];
  nBoot: number;
  block: number;
  alpha: number;
  seed: number;
}

export interface FieldSigResult {
  /** fraction (%) of all cells locally significant */
  N: number;
  /** Monte Carlo (1 − alpha) threshold, % of cells */
  threshold: number;
  fieldSignificant: boolean;
  nSig: number;
  /** 1 = locally significant, sign carried by `diff` */
  local: Uint8Array;
  /** B − A difference of annual means per cell */
  diff: Float64Array;
}

function blockIdx(n: number, block: number, rng: Rng, out: Int32Array) {
  const L = Math.min(block, n);
  const span = n - L + 1;
  let k = 0;
  while (k < n) {
    const s = (rng() * span) | 0;
    for (let j = 0; j < L && k < n; j++) out[k++] = s + j;
  }
}

/**
 * Field significance after Elmore et al. (2006), as used by Agee et al. (2016):
 * moving-block bootstrap of the B − A difference of annual means in every cell
 * (the same resampled years for every cell, preserving spatial correlation);
 * N = share of cells whose two-sided (1 − alpha) interval excludes zero; the
 * threshold is the (1 − alpha) quantile, over Monte Carlo trials, of the share
 * of cells whose series correlates "significantly" with a random N(0,1) series
 * (Livezey & Chen 1983).
 */
export function fieldSignificance(inp: FieldSigInput): FieldSigResult {
  const { values, nCells: C, idxA, idxB, nBoot, block, alpha } = inp;
  const rng = makeRng(inp.seed);
  const nA = idxA.length,
    nB = idxB.length;
  const XA = new Float64Array(nA * C),
    XB = new Float64Array(nB * C);
  idxA.forEach((y, i) => XA.set(values.subarray(y * C, y * C + C), i * C));
  idxB.forEach((y, i) => XB.set(values.subarray(y * C, y * C + C), i * C));

  const diff = new Float64Array(C);
  for (let c = 0; c < C; c++) {
    let sa = 0,
      sb = 0;
    for (let i = 0; i < nA; i++) sa += XA[i * C + c]!;
    for (let i = 0; i < nB; i++) sb += XB[i * C + c]!;
    diff[c] = sb / nB - sa / nA;
  }

  // 1. local block-bootstrap tests
  const D = new Float64Array(nBoot * C);
  const bA = new Int32Array(nA),
    bB = new Int32Array(nB);
  const acc = new Float64Array(C);
  for (let b = 0; b < nBoot; b++) {
    blockIdx(nA, block, rng, bA);
    blockIdx(nB, block, rng, bB);
    acc.fill(0);
    for (let i = 0; i < nB; i++) {
      const o = bB[i]! * C;
      for (let c = 0; c < C; c++) acc[c] = acc[c]! + XB[o + c]! / nB;
    }
    for (let i = 0; i < nA; i++) {
      const o = bA[i]! * C;
      for (let c = 0; c < C; c++) acc[c] = acc[c]! - XA[o + c]! / nA;
    }
    D.set(acc, b * C);
  }
  const local = new Uint8Array(C);
  const col = new Float64Array(nBoot);
  let nSig = 0;
  for (let c = 0; c < C; c++) {
    for (let b = 0; b < nBoot; b++) col[b] = D[b * C + c]!;
    col.sort();
    const lo = pctSorted(col, (100 * alpha) / 2),
      hi = pctSorted(col, 100 * (1 - alpha / 2));
    if (lo > 0 || hi < 0) {
      local[c] = 1;
      nSig++;
    }
  }

  // 2. Monte Carlo threshold
  const n = nA + nB;
  const Z: number[][] = [];
  for (let c = 0; c < C; c++) {
    const s = new Float64Array(n);
    for (let i = 0; i < nA; i++) s[i] = XA[i * C + c]!;
    for (let i = 0; i < nB; i++) s[nA + i] = XB[i * C + c]!;
    const m = mean(s);
    let v = 0;
    for (const q of s) v += (q - m) ** 2;
    const sd = Math.sqrt(v / n);
    if (sd > 0) Z.push(Array.from(s, (q) => (q - m) / sd));
  }
  const tc = tCrit(alpha, n - 2);
  const rCrit = tc / Math.sqrt(n - 2 + tc * tc);
  const frac = new Float64Array(nBoot);
  const r = new Float64Array(n);
  for (let t = 0; t < nBoot; t++) {
    let m = 0;
    for (let i = 0; i < n; i++) {
      r[i] = normal(rng);
      m += r[i]!;
    }
    m /= n;
    let v = 0;
    for (let i = 0; i < n; i++) {
      r[i] = r[i]! - m;
      v += r[i]! * r[i]!;
    }
    const sd = Math.sqrt(v / n);
    let cnt = 0;
    for (const z of Z) {
      let dot = 0;
      for (let i = 0; i < n; i++) dot += z[i]! * r[i]!;
      if (Math.abs(dot / (n * sd)) > rCrit) cnt++;
    }
    frac[t] = cnt / C;
  }
  frac.sort();
  const thr = pctSorted(frac, 100 * (1 - alpha));
  const N = nSig / C;
  return {
    N: 100 * N,
    threshold: 100 * thr,
    fieldSignificant: N > thr,
    nSig,
    local,
    diff,
  };
}
