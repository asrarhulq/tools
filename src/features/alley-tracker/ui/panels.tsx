"use client";

import type { AlleyData, BoxIdx, Selection } from "../lib/types";
import type { FieldSigResult } from "../lib/stats";
import type { EastWestRow, SeasonRow, SeriesStats } from "../state/analysis";
import { NX, NY, boxShort, rangeLabel, seasonLabel } from "../lib/data";
import { SERIES } from "../lib/colors";
import { PAPER } from "../config";
import { Panel, Stat, Swatch, fmt, fmtCI, fmtP, signed } from "./primitives";
import { cn } from "@/lib/utils";

const isAgee = (s: Selection) =>
  s.a[0] === 1954 && s.a[1] === 1983 && s.b[0] === 1984 && s.b[1] === 2013;

// ───────────────────────────────────────────────────── field significance

export function SignificancePanel({
  sel,
  sig,
  status,
  ms,
}: {
  sel: Selection;
  sig: FieldSigResult | null;
  status: string;
  ms: number;
}) {
  const paper =
    isAgee(sel) && sel.season === "ALL" && sel.measure === "c"
      ? sel.rating === "f1"
        ? PAPER.fieldSigF1
        : PAPER.fieldSigF2
      : null;
  return (
    <Panel
      title="Field significance · B vs A"
      action={
        <span className="font-mono text-[11px] text-[var(--color-muted-foreground)]">
          {status === "running" || !sig
            ? "running 10 000 resamples…"
            : `${(ms / 1000).toFixed(2)} s`}
        </span>
      }
    >
      {sig ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label="Boxes significant (N)"
              value={`${fmt(sig.N, 1)}%`}
              sub={`${sig.nSig} of 80`}
            />
            <Stat
              label="Monte Carlo threshold"
              value={`${fmt(sig.threshold, 2)}%`}
              sub="95th pct, α = 0.05"
            />
            <Stat
              label="Verdict"
              value={
                <span
                  className={
                    sig.fieldSignificant
                      ? "text-[var(--color-ok)]"
                      : "text-[var(--color-warn)]"
                  }
                >
                  {sig.fieldSignificant ? "Significant" : "Not sig."}
                </span>
              }
              sub={sig.fieldSignificant ? "N > threshold" : "N ≤ threshold"}
            />
          </div>
          {paper ? (
            <p className="mt-3 rounded-md bg-[var(--color-surface-2)] px-2.5 py-1.5 text-[11px] text-[var(--color-muted-foreground)]">
              Paper (Agee et al. 2016): N = {paper.N}% vs threshold{" "}
              {paper.threshold}%. With 10 000 resamples N varies by about ±2
              points between random seeds (the offline run gives 27.5%); other
              gaps come from SPC database revisions since 2016.
            </p>
          ) : null}
        </>
      ) : (
        <div className="h-16 animate-pulse rounded-md bg-[var(--color-surface-2)]" />
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-muted-foreground)]">
        Moving-block bootstrap (block 5 yr) of each box&apos;s B − A change in
        annual mean; Monte Carlo threshold after Livezey &amp; Chen (1983), as
        in Elmore et al. (2006).
        {sel.season !== "ALL" ? ` Season: ${seasonLabel(sel.season)}.` : ""}
      </p>
    </Panel>
  );
}

// ───────────────────────────────────────────────────── A vs B summary block

export function PeriodStats({
  s,
  sel,
  unit,
  dark,
  compact = false,
}: {
  s: SeriesStats;
  sel: Selection;
  unit: string;
  dark: boolean;
  /** two columns, for the narrow side panel */
  compact?: boolean;
}) {
  const col = dark ? SERIES.dark : SERIES.light;
  const sig99 = s.diff.ci99[0] > 0 || s.diff.ci99[1] < 0;
  const sig95 = s.diff.ci95[0] > 0 || s.diff.ci95[1] < 0;
  return (
    <div className={cn("grid grid-cols-2 gap-3", !compact && "sm:grid-cols-4")}>
      <Stat
        label={
          <span className="inline-flex items-center gap-1.5">
            <Swatch color={col.a} />A {rangeLabel(sel.a, sel.exclude2024)}
          </span>
        }
        value={fmt(s.a.mean)}
        sub={`95% ${fmtCI(s.a.ci95)} · n=${s.a.n}`}
      />
      <Stat
        label={
          <span className="inline-flex items-center gap-1.5">
            <Swatch color={col.b} />B {rangeLabel(sel.b, sel.exclude2024)}
          </span>
        }
        value={fmt(s.b.mean)}
        sub={`95% ${fmtCI(s.b.ci95)} · n=${s.b.n}`}
      />
      <Stat
        label="B − A"
        value={signed(s.diff.diff)}
        sub={`99% ${fmtCI(s.diff.ci99)} · ${sig99 ? "sig. 99%" : sig95 ? "sig. 95%" : "n.s."}`}
      />
      <Stat
        label="Trend (Theil–Sen)"
        value={`${signed(s.trend.slopePerDecade)}/dec`}
        sub={`MK p ${fmtP(s.trend.p)} · ${unit}`}
      />
    </div>
  );
}

// ───────────────────────────────────────────────────── east vs west

export function EastWestPanel({
  data,
  ge,
  gw,
  rows,
  sel,
  unit,
}: {
  data: AlleyData;
  ge: BoxIdx;
  gw: BoxIdx;
  rows: EastWestRow[];
  sel: Selection;
  unit: string;
}) {
  return (
    <Panel title="East (GE) vs West (GW) · paper Fig. 12–14">
      <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">
        GE {boxShort(data, ge)} (greatest increase) vs GW {boxShort(data, gw)}{" "}
        (greatest decrease), {unit}/yr. Bootstrap: n years drawn independently
        from each box, mean of differences, 10 000×.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-xs tabular-nums">
          <thead className="text-left text-[var(--color-muted-foreground)]">
            <tr className="border-b border-[var(--color-border)]">
              <th className="py-1.5 pr-3 font-medium">Period</th>
              <th className="pr-3 font-medium">East (95% CI)</th>
              <th className="pr-3 font-medium">West (95% CI)</th>
              <th className="pr-3 font-medium">E − W</th>
              <th className="pr-3 font-medium">99% CI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s99 = r.diff.ci99[0] > 0 || r.diff.ci99[1] < 0;
              return (
                <tr
                  key={r.period}
                  className="border-b border-[var(--color-border)]/60 last:border-0"
                >
                  <td className="py-1.5 pr-3">
                    {r.period}{" "}
                    {rangeLabel(
                      r.period === "A" ? sel.a : sel.b,
                      sel.exclude2024,
                    )}
                  </td>
                  <td className="pr-3">
                    {fmt(r.east.mean)} {fmtCI(r.east.ci95)}
                  </td>
                  <td className="pr-3">
                    {fmt(r.west.mean)} {fmtCI(r.west.ci95)}
                  </td>
                  <td className="pr-3">{signed(r.diff.diff)}</td>
                  <td
                    className={cn(
                      "pr-3",
                      s99 && "font-semibold text-[var(--color-foreground)]",
                    )}
                  >
                    {fmtCI(r.diff.ci99)}
                    {s99 ? " *" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
        * interval excludes zero (99% confidence).
      </p>
    </Panel>
  );
}

// ───────────────────────────────────────────────────── seasonal

export function SeasonalPanel({
  data,
  rows,
  sigByTag,
  unit,
  active,
  onPick,
}: {
  data: AlleyData;
  rows: SeasonRow[];
  sigByTag: Record<string, FieldSigResult> | null;
  unit: string;
  active: string;
  onPick: (s: SeasonRow["season"]) => void;
}) {
  const short = (b: BoxIdx) => boxShort(data, b);
  return (
    <Panel title="Seasonal analysis (DJF · MAM · JJA · SON)">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <thead className="text-left text-[var(--color-muted-foreground)]">
            <tr className="border-b border-[var(--color-border)]">
              <th className="py-1.5 pr-3 font-medium">Season</th>
              <th className="pr-3 font-medium">Largest increase (B − A)</th>
              <th className="pr-3 font-medium">Largest decrease</th>
              <th className="pr-3 font-medium">Busiest A → B</th>
              <th className="pr-3 font-medium">Field sig. N / thr</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {rows.map((r) => {
              const fs = sigByTag?.[r.season];
              return (
                <tr
                  key={r.season}
                  onClick={() => onPick(r.season)}
                  className={cn(
                    "cursor-pointer border-b border-[var(--color-border)]/60 last:border-0 hover:bg-[var(--color-surface-2)]",
                    active === r.season && "bg-[var(--color-surface-2)]",
                  )}
                >
                  <td className="py-1.5 pr-3 font-sans font-medium">
                    {seasonLabel(r.season)}
                  </td>
                  <td className="pr-3">
                    {signed(r.incVal)}{" "}
                    <span className="text-[var(--color-muted-foreground)]">
                      {short(r.inc)}
                    </span>
                  </td>
                  <td className="pr-3">
                    {signed(r.decVal)}{" "}
                    <span className="text-[var(--color-muted-foreground)]">
                      {short(r.dec)}
                    </span>
                  </td>
                  <td className="pr-3">
                    {fmt(r.maxAVal, 1)} → {fmt(r.maxBVal, 1)}
                  </td>
                  <td className="pr-3">
                    {fs ? (
                      <span
                        className={
                          fs.fieldSignificant
                            ? "text-[var(--color-ok)]"
                            : "text-[var(--color-warn)]"
                        }
                      >
                        {fmt(fs.N, 1)}% / {fmt(fs.threshold, 1)}%{" "}
                        {fs.fieldSignificant ? "✓" : "✗"}
                      </span>
                    ) : (
                      "…"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
        Values are {unit}/yr per 2.5° box. Click a row to map that season.
        Seasons by calendar month (December stays in its own year).
      </p>
    </Panel>
  );
}

// ───────────────────────────────────────────────────── reference / validation

export function ReferencePanel({ data }: { data: AlleyData }) {
  const r24 = data.reference.thru2024,
    r23 = data.reference.thru2023_no2024;
  const mx = r24.max_box;
  const row = (
    label: string,
    ours: React.ReactNode,
    paper: React.ReactNode,
  ) => (
    <tr className="border-b border-[var(--color-border)]/60 last:border-0">
      <td className="py-1.5 pr-3 font-sans">{label}</td>
      <td className="pr-3">{ours}</td>
      <td className="pr-3 text-[var(--color-muted-foreground)]">{paper}</td>
    </tr>
  );
  const fs = (r: typeof r24, k: string, c: string) => {
    const v = r.field_sig[k]?.[c];
    return v ? `${fmt(v.N_pct, 1)} / ${fmt(v.threshold_pct, 1)}` : "–";
  };
  const ew = (r: typeof r24, p: string) => {
    const v = r.east_west.f1_counts.periods[p];
    return v ? `${fmt(v.east_mean)} / ${fmt(v.west_mean)}` : "–";
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Validation against the paper (1954–2013)">
        <table className="w-full font-mono text-xs tabular-nums">
          <thead className="text-left text-[var(--color-muted-foreground)]">
            <tr className="border-b border-[var(--color-border)]">
              <th className="py-1.5 pr-3 font-sans font-medium">Quantity</th>
              <th className="pr-3 font-sans font-medium">This study</th>
              <th className="pr-3 font-sans font-medium">Agee et al.</th>
            </tr>
          </thead>
          <tbody>
            {row(
              "Busiest box, (E)F1+, Period I",
              mx.f1_counts.I[0],
              PAPER.maxBoxI,
            )}
            {row(
              "Busiest box, (E)F1+, Period II",
              mx.f1_counts.II[0],
              PAPER.maxBoxII,
            )}
            {row(
              "Busiest box, (E)F2+, I / II",
              `${mx.f2_counts.I[0]} / ${mx.f2_counts.II[0]}`,
              `${PAPER.f2MaxI} / ${PAPER.f2MaxII}`,
            )}
            {row(
              "Tornado days max, I / II",
              `${mx.f1_days.I[0]} / ${mx.f1_days.II[0]}`,
              `${PAPER.daysMaxI} / ${PAPER.daysMaxII}`,
            )}
            {row(
              "Oklahoma (E)F1+, I / II",
              `${r24.state.OK.I} / ${r24.state.OK.II}`,
              PAPER.stateOK.join(" / "),
            )}
            {row(
              "Tennessee (E)F1+, I / II",
              `${r24.state.TN.I} / ${r24.state.TN.II}`,
              PAPER.stateTN.join(" / "),
            )}
            {row(
              "Field sig. (E)F1+ N / thr %",
              fs(r24, "f1_counts", "II_vs_I"),
              `${PAPER.fieldSigF1.N} / ${PAPER.fieldSigF1.threshold}`,
            )}
            {row(
              "Field sig. (E)F2+ N / thr %",
              fs(r24, "f2_counts", "II_vs_I"),
              `${PAPER.fieldSigF2.N} / ${PAPER.fieldSigF2.threshold}`,
            )}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
          Differences are documented, not tuned away: the SPC database has been
          revised since 2016 (re-ratings, added/merged tracks).
        </p>
      </Panel>
      <Panel title="Period III with and without 2024 (record year)">
        <table className="w-full font-mono text-xs tabular-nums">
          <thead className="text-left text-[var(--color-muted-foreground)]">
            <tr className="border-b border-[var(--color-border)]">
              <th className="py-1.5 pr-3 font-sans font-medium">Quantity</th>
              <th className="pr-3 font-sans font-medium">2014–2024</th>
              <th className="pr-3 font-sans font-medium">2014–2023</th>
            </tr>
          </thead>
          <tbody>
            {row("Years in Period III", r24.n_years.III, r23.n_years.III)}
            {row(
              "East / West (E)F1+ per yr, III",
              ew(r24, "III"),
              ew(r23, "III"),
            )}
            {row("East / West (E)F1+ per yr, II", ew(r24, "II"), ew(r23, "II"))}
            {row(
              "Field sig. III vs II, (E)F1+",
              fs(r24, "f1_counts", "III_vs_II"),
              fs(r23, "f1_counts", "III_vs_II"),
            )}
            {row(
              "Field sig. III vs II, (E)F2+",
              fs(r24, "f2_counts", "III_vs_II"),
              fs(r23, "f2_counts", "III_vs_II"),
            )}
            {row(
              "E − W trend /decade (MK p)",
              `${signed(r24.trend_diff.slope_per_decade)} (${fmtP(r24.trend_diff.p)})`,
              `${signed(r23.trend_diff.slope_per_decade)} (${fmtP(r23.trend_diff.p)})`,
            )}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
          The eastward shift holds into Period III but has not grown. Period III
          is 10–11 years — about two 5-year blocks — so its field-significance
          result is descriptive only.
        </p>
      </Panel>
    </div>
  );
}

// ───────────────────────────────────────────────────── accessible table view

export function GridTable({
  data,
  values,
  unit,
}: {
  data: AlleyData;
  values: Float64Array;
  unit: string;
}) {
  const { lat0, lon0, d } = data.meta.grid;
  return (
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-[11px] tabular-nums">
        <caption className="mb-2 text-left font-sans text-xs text-[var(--color-muted-foreground)]">
          {unit} per year by 2.5° box (rows: south edge latitude; columns: west
          edge longitude)
        </caption>
        <thead>
          <tr>
            <th />
            {Array.from({ length: NX }, (_, ix) => (
              <th
                key={ix}
                className="px-1 text-right font-medium text-[var(--color-muted-foreground)]"
              >
                {-(lon0 + d * ix)}°W
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: NY }, (_, k) => NY - 1 - k).map((iy) => (
            <tr key={iy} className="border-t border-[var(--color-border)]/60">
              <th className="pr-2 text-left font-medium text-[var(--color-muted-foreground)]">
                {lat0 + d * iy}°N
              </th>
              {Array.from({ length: NX }, (_, ix) => (
                <td key={ix} className="px-1 text-right">
                  {fmt(values[iy * NX + ix]!, 2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
