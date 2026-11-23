"use client";

import { useMemo } from "react";
import type { AlleyData, BoxIdx, Selection, SeasonFilter } from "../lib/types";
import { SEASONS } from "../lib/types";
import {
  boxSeries,
  cellOf,
  cellSeries,
  extremes,
  meanGrid,
  ringSeries,
  seriesKey,
  yearIdx,
  yearsOf,
} from "../lib/data";
import {
  bootstrapDiff,
  bootstrapMean,
  makeRng,
  theilSenMK,
  type DiffCI,
  type MeanCI,
  type Trend,
} from "../lib/stats";

/**
 * Everything the panels (and the PDF) show for the current selection, derived
 * in one place so the page and the report can never disagree. Bootstraps use
 * 10 000 resamples with fixed seeds.
 */

const NB = 10000;

export interface SeriesStats {
  years: number[];
  values: number[];
  idxA: number[];
  idxB: number[];
  a: MeanCI;
  b: MeanCI;
  diff: DiffCI;
  trend: Trend;
}

function seriesStats(
  years: number[],
  full: ArrayLike<number>,
  idxA: number[],
  idxB: number[],
  idxAll: number[],
  seed: number,
): SeriesStats {
  const pick = (idx: number[]) => idx.map((i) => full[i]!);
  const xa = pick(idxA),
    xb = pick(idxB);
  return {
    years,
    values: Array.from(full),
    idxA,
    idxB,
    a: bootstrapMean(xa, NB, makeRng(seed)),
    b: bootstrapMean(xb, NB, makeRng(seed + 1)),
    diff: bootstrapDiff(xa, xb, NB, makeRng(seed + 2)),
    trend: theilSenMK(
      idxAll.map((i) => years[i]!),
      pick(idxAll),
    ),
  };
}

export interface EastWestRow {
  period: "A" | "B";
  n: number;
  east: MeanCI;
  west: MeanCI;
  diff: DiffCI;
}

export interface SeasonRow {
  season: SeasonFilter;
  maxA: BoxIdx;
  maxAVal: number;
  maxB: BoxIdx;
  maxBVal: number;
  inc: BoxIdx;
  incVal: number;
  dec: BoxIdx;
  decVal: number;
}

export function useAnalysis(data: AlleyData | null, sel: Selection) {
  const years = useMemo(() => (data ? yearsOf(data) : []), [data]);
  const key = seriesKey(sel.rating, sel.measure);

  const idx = useMemo(() => {
    if (!data) return null;
    return {
      a: yearIdx(data, sel.a, sel.exclude2024),
      b: yearIdx(data, sel.b, sel.exclude2024),
      all: yearIdx(data, data.meta.years, sel.exclude2024),
    };
  }, [data, sel.a, sel.b, sel.exclude2024]);

  const grid = useMemo(() => {
    if (!data || !idx) return null;
    const s = boxSeries(data, key, sel.season);
    const gA = meanGrid(s, idx.a),
      gB = meanGrid(s, idx.b);
    const diff = gB.map((v, i) => v - gA[i]!);
    return { series: s, gA, gB, diff, ext: extremes(gA, gB) };
  }, [data, idx, key, sel.season]);

  const ring = useMemo(() => {
    if (!data || !idx) return null;
    const r = ringSeries(data, key, sel.season, sel.radiusKm);
    return seriesStats(years, r, idx.a, idx.b, idx.all, 11);
  }, [data, idx, key, sel.season, sel.radiusKm, years]);

  const box = useMemo(() => {
    if (!grid || !idx) return null;
    const c = cellOf(sel.box);
    const full = years.map((_, y) => grid.series[y * 80 + c]!);
    return seriesStats(years, full, idx.a, idx.b, idx.all, 21);
  }, [grid, idx, sel.box, years]);

  const eastWest = useMemo(() => {
    if (!data || !grid || !idx) return null;
    const ge = data.meta.paper.GE as unknown as BoxIdx;
    const gw = (sel.rating === "f1"
      ? data.meta.paper.GW_f1
      : data.meta.paper.GW_f2) as unknown as BoxIdx;
    const rows: EastWestRow[] = (["A", "B"] as const).map((p, k) => {
      const ii = p === "A" ? idx.a : idx.b;
      const e = cellSeries(grid.series, cellOf(ge), ii),
        w = cellSeries(grid.series, cellOf(gw), ii);
      return {
        period: p,
        n: ii.length,
        east: bootstrapMean(e, NB, makeRng(31 + k)),
        west: bootstrapMean(w, NB, makeRng(41 + k)),
        diff: bootstrapDiff(w, e, NB, makeRng(51 + k)),
      };
    });
    return { ge, gw, rows };
  }, [data, grid, idx, sel.rating]);

  const seasonal = useMemo((): SeasonRow[] | null => {
    if (!data || !idx) return null;
    return (["ALL", ...SEASONS] as SeasonFilter[]).map((s) => {
      const sr = boxSeries(data, key, s);
      const gA = meanGrid(sr, idx.a),
        gB = meanGrid(sr, idx.b);
      const e = extremes(gA, gB);
      const v = (g: Float64Array, b: BoxIdx) => g[cellOf(b)]!;
      return {
        season: s,
        maxA: e.maxA,
        maxAVal: v(gA, e.maxA),
        maxB: e.maxB,
        maxBVal: v(gB, e.maxB),
        inc: e.inc,
        incVal: v(gB, e.inc) - v(gA, e.inc),
        dec: e.dec,
        decVal: v(gB, e.dec) - v(gA, e.dec),
      };
    });
  }, [data, idx, key]);

  return { years, idx, grid, ring, box, eastWest, seasonal };
}

export type Analysis = ReturnType<typeof useAnalysis>;
