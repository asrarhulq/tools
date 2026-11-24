/**
 * Shapes for the precomputed dataset (written by tornado-analysis/scripts/export_web.py)
 * and for the page's selection state. The JSON is aggregated — no raw tornado
 * records reach the browser — so every series is a flat integer array.
 */

export const SEASONS = ["DJF", "MAM", "JJA", "SON"] as const;
export type Season = (typeof SEASONS)[number];
export type SeasonFilter = "ALL" | Season;
export type Rating = "f1" | "f2";
/** c = tornado counts, d = tornado days. */
export type Measure = "c" | "d";
export type SeriesKey = `${Rating}${Measure}`;
export type YearRange = readonly [number, number];
export type BoxIdx = readonly [number, number];

/** One published number from Agee et al. (2016) next to our independent value. */
export interface ValidationRow {
  group: string;
  what: string;
  paper: number;
  ours: number;
  box: string;
  place: string;
  /** null for rows that are not a like-for-like count (field-significance %) */
  diff_pct: number | null;
}

export interface FieldSigSummary {
  N_pct: number;
  threshold_pct: number;
  field_significant: boolean;
  n_sig: number;
}

export interface EastWestRef {
  n: number;
  east: number;
  west: number;
  diff: number;
  ci95: number[];
  ci99: number[];
}

/** Same method applied after 2013 (replicate.py). */
export interface ExtensionRun {
  years: [number, number];
  n_years: number;
  east_west: Record<"I" | "II" | "III", EastWestRef>;
  busiest_III: { box: string; per_year: number };
  field_sig_III_vs_II: Record<"f1" | "f2", FieldSigSummary>;
  field_sig_III_vs_I: Record<"f1" | "f2", FieldSigSummary>;
}

export interface AlleyData {
  meta: {
    title: string;
    generated: string;
    source: string;
    sourceUrl: string;
    years: [number, number];
    grid: { lat0: number; lon0: number; d: number; ny: number; nx: number };
    center: { lat: number; lon: number; name: string };
    ringBinKm: number;
    ringBins: number;
    seasons: string[];
    /** our own boxes of greatest increase (east) / decrease (west), F1+ counts, II − I */
    GE: [number, number];
    GW: [number, number];
    tornadoesUsed: { f1: number; f2: number };
  };
  /** year-major, row-major: [(yearIdx * ny + iy) * nx + ix] */
  boxes: Record<SeriesKey, Record<Season, number[]>>;
  /** [yearIdx * ringBins + bin], 25-km distance bins from West Lafayette */
  ring: Record<SeriesKey, Record<Season, number[]>>;
  /** flat [lon, lat, lon, lat, …] polylines */
  outline: number[][];
  validation: ValidationRow[];
  fieldSig: Record<"f1_II_vs_I" | "f2_II_vs_I", FieldSigSummary>;
  extension: Record<"thru2024" | "thru2023", ExtensionRun>;
}

export interface Selection {
  a: YearRange;
  b: YearRange;
  rating: Rating;
  measure: Measure;
  season: SeasonFilter;
  exclude2024: boolean;
  view: "a" | "b" | "diff";
  radiusKm: number;
  box: BoxIdx;
}
