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

export type MeasureName = "f1_counts" | "f2_counts" | "f1_days" | "f2_days";

export interface FieldSigRef {
  N_pct: number;
  threshold_pct: number;
  field_significant: boolean;
  local_sig_grid: number[][];
}

export interface EastWestPeriodRef {
  n_years: number;
  east_mean: number;
  east_ci95: number[];
  west_mean: number;
  west_ci95: number[];
  diff_mean: number;
  diff_ci95: number[];
  diff_ci99: number[];
}

export interface ReferenceRun {
  years: number[];
  exclude: number[];
  n_years: Record<"I" | "II" | "III", number>;
  /** analyze2 output: per measure, per period: [max, [iy, ix]] */
  max_box: Record<MeasureName, Record<"I" | "II" | "III", [number, number[]]>>;
  state: Record<"OK" | "TN", Record<"I" | "II", number>>;
  trend_diff: { slope_per_decade: number; lo: number; hi: number; p: number };
  field_sig: Record<string, Record<string, FieldSigRef>>;
  east_west: Record<
    MeasureName,
    {
      GE: { idx: number[]; bounds: number[] };
      GW: { idx: number[]; bounds: number[] };
      periods: Record<string, EastWestPeriodRef>;
    }
  >;
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
    paper: { GE: number[]; GW_f1: number[]; GW_f2: number[] };
    tornadoesUsed: { f1: number; f2: number };
  };
  /** year-major, row-major: [(yearIdx * ny + iy) * nx + ix] */
  boxes: Record<SeriesKey, Record<Season, number[]>>;
  /** [yearIdx * ringBins + bin], 25-km distance bins from West Lafayette */
  ring: Record<SeriesKey, Record<Season, number[]>>;
  /** flat [lon, lat, lon, lat, …] polylines */
  outline: number[][];
  reference: Record<"thru2024" | "thru2023_no2024", ReferenceRun>;
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
