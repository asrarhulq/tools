import {
  SEASONS,
  type AlleyData,
  type BoxIdx,
  type Measure,
  type Rating,
  type SeasonFilter,
  type SeriesKey,
  type YearRange,
} from "./types";

/**
 * Selectors over the precomputed dataset. All functions are pure; the UI
 * memoises them on the selection. "ALL" seasons is the sum of the four
 * seasonal series (a calendar date is in exactly one season, so this is exact
 * for tornado days too).
 */

export const NY = 8;
export const NX = 10;
export const NCELLS = NY * NX;

export function seriesKey(rating: Rating, measure: Measure): SeriesKey {
  return `${rating}${measure}`;
}

export function yearsOf(data: AlleyData): number[] {
  const [y0, y1] = data.meta.years;
  return Array.from({ length: y1 - y0 + 1 }, (_, i) => y0 + i);
}

/** Year indices inside a range, honouring the "exclude 2024" switch. */
export function yearIdx(
  data: AlleyData,
  r: YearRange,
  exclude2024: boolean,
): number[] {
  const y0 = data.meta.years[0];
  const out: number[] = [];
  for (
    let y = Math.max(r[0], y0);
    y <= Math.min(r[1], data.meta.years[1]);
    y++
  ) {
    if (exclude2024 && y === 2024) continue;
    out.push(y - y0);
  }
  return out;
}

function sumSeasons(
  src: Record<string, number[]>,
  season: SeasonFilter,
  len: number,
): Float64Array {
  const out = new Float64Array(len);
  const list = season === "ALL" ? SEASONS : [season];
  for (const s of list) {
    const a = src[s]!;
    for (let i = 0; i < len; i++) out[i] = out[i]! + a[i]!;
  }
  return out;
}

/** Year-major grid series, length nYears × 80. */
export function boxSeries(
  data: AlleyData,
  key: SeriesKey,
  season: SeasonFilter,
): Float64Array {
  return sumSeasons(data.boxes[key], season, data.boxes[key].DJF.length);
}

/** Annual-mean grid over the given year indices. */
export function meanGrid(series: Float64Array, idx: number[]): Float64Array {
  const g = new Float64Array(NCELLS);
  if (!idx.length) return g;
  for (const y of idx)
    for (let c = 0; c < NCELLS; c++) g[c] = g[c]! + series[y * NCELLS + c]!;
  for (let c = 0; c < NCELLS; c++) g[c] = g[c]! / idx.length;
  return g;
}

export function cellOf(b: BoxIdx): number {
  return b[0] * NX + b[1];
}

export function cellSeries(
  series: Float64Array,
  cell: number,
  idx: number[],
): number[] {
  return idx.map((y) => series[y * NCELLS + cell]!);
}

/** Per-year tornadoes (or tornado days) whose path came within `radiusKm` of West Lafayette. */
export function ringSeries(
  data: AlleyData,
  key: SeriesKey,
  season: SeasonFilter,
  radiusKm: number,
): Float64Array {
  const { ringBinKm: w, ringBins: nb } = data.meta;
  const src = data.ring[key];
  const flat = sumSeasons(src, season, src.DJF.length);
  const nYears = flat.length / nb;
  const k = Math.min(nb, Math.round(radiusKm / w));
  const out = new Float64Array(nYears);
  for (let y = 0; y < nYears; y++) {
    let s = 0;
    for (let b = 0; b < k; b++) s += flat[y * nb + b]!;
    out[y] = s;
  }
  return out;
}

export function boxBounds(data: AlleyData, b: BoxIdx) {
  const { lat0, lon0, d } = data.meta.grid;
  return {
    s: lat0 + d * b[0],
    n: lat0 + d * (b[0] + 1),
    w: lon0 + d * b[1],
    e: lon0 + d * (b[1] + 1),
  };
}

export function fmtLat(v: number) {
  return `${Math.abs(v).toFixed(1)}°${v >= 0 ? "N" : "S"}`;
}
export function fmtLon(v: number) {
  return `${Math.abs(v).toFixed(1)}°${v < 0 ? "W" : "E"}`;
}
export function boxLabel(data: AlleyData, b: BoxIdx) {
  const r = boxBounds(data, b);
  return `${fmtLat(r.s)}–${fmtLat(r.n)}, ${fmtLon(r.w)}–${fmtLon(r.e)}`;
}

/** Compact label, e.g. "35–37.5°N, 87.5–85°W". */
export function boxShort(data: AlleyData, b: BoxIdx) {
  const r = boxBounds(data, b);
  return `${r.s}–${r.n}°N, ${-r.w}–${-r.e}°W`;
}

export function rangeLabel(r: YearRange, exclude2024: boolean) {
  const base = `${r[0]}–${r[1]}`;
  return exclude2024 && r[0] <= 2024 && r[1] >= 2024
    ? `${base} (excl. 2024)`
    : base;
}

export function measureLabel(rating: Rating, measure: Measure) {
  const r = rating === "f1" ? "(E)F1+" : "(E)F2+";
  return measure === "c" ? `${r} tornadoes` : `${r} tornado days`;
}

export function seasonLabel(s: SeasonFilter) {
  return {
    ALL: "All seasons",
    DJF: "Winter (DJF)",
    MAM: "Spring (MAM)",
    JJA: "Summer (JJA)",
    SON: "Autumn (SON)",
  }[s];
}

/** Largest increase / decrease cells of B − A and the busiest cell of each period. */
export function extremes(gA: Float64Array, gB: Float64Array) {
  let inc = 0,
    dec = 0,
    maxA = 0,
    maxB = 0;
  for (let c = 1; c < NCELLS; c++) {
    if (gB[c]! - gA[c]! > gB[inc]! - gA[inc]!) inc = c;
    if (gB[c]! - gA[c]! < gB[dec]! - gA[dec]!) dec = c;
    if (gA[c]! > gA[maxA]!) maxA = c;
    if (gB[c]! > gB[maxB]!) maxB = c;
  }
  const box = (c: number): BoxIdx => [Math.floor(c / NX), c % NX];
  return { inc: box(inc), dec: box(dec), maxA: box(maxA), maxB: box(maxB) };
}
