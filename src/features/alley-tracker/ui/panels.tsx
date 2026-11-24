"use client";

import { useState } from "react";
import type { AlleyData, BoxIdx, Selection, ValidationRow } from "../lib/types";
import type { FieldSigResult } from "../lib/stats";
import type { EastWestRow, SeasonRow, SeriesStats } from "../state/analysis";
import { NX, NY, boxShort, rangeLabel, seasonLabel } from "../lib/data";
import { SERIES } from "../lib/colors";
import { PAPER_CREDIT } from "../config";
import { Panel, Stat, Swatch, fmt, fmtCI, signed } from "./primitives";
import { cn } from "@/lib/utils";

/**
 * Panels for the simplified page: one verdict line for field significance,
 * a short A-vs-B stat row, the paper check, and the post-2013 extension.
 * Detailed tables (east/west, seasons) live in a collapsed "More" section.
 */

// ───────────────────────────────────────────────────── verdict line

export function Verdict({
  sig,
  running,
}: {
  sig: FieldSigResult | null;
  running: boolean;
}) {
  if (!sig || running)
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Testing significance…
      </p>
    );
  return (
    <p className="text-sm text-[var(--color-foreground)]">
      <span
        className={cn(
          "mr-1.5 inline-block rounded px-1.5 py-0.5 text-xs font-semibold",
          sig.fieldSignificant
            ? "bg-[var(--color-ok)]/15 text-[var(--color-ok)]"
            : "bg-[var(--color-warn)]/15 text-[var(--color-warn)]",
        )}
      >
        {sig.fieldSignificant ? "Real shift" : "Could be chance"}
      </span>
      {fmt(sig.N, 0)}% of boxes changed significantly (chance alone: up to{" "}
      {fmt(sig.threshold, 0)}%).
    </p>
  );
}

// ───────────────────────────────────────────────────── A vs B stats

export function PeriodStats({
  s,
  sel,
  dark,
}: {
  s: SeriesStats;
  sel: Selection;
  dark: boolean;
}) {
  const col = dark ? SERIES.dark : SERIES.light;
  const sig = s.diff.ci95[0] > 0 || s.diff.ci95[1] < 0;
  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat
        label={
          <span className="inline-flex items-center gap-1.5">
            <Swatch color={col.a} />
            {rangeLabel(sel.a, sel.exclude2024)}
          </span>
        }
        value={fmt(s.a.mean, 1)}
        sub="per year"
      />
      <Stat
        label={
          <span className="inline-flex items-center gap-1.5">
            <Swatch color={col.b} />
            {rangeLabel(sel.b, sel.exclude2024)}
          </span>
        }
        value={fmt(s.b.mean, 1)}
        sub="per year"
      />
      <Stat
        label="Change"
        value={signed(s.diff.diff, 1)}
        sub={sig ? "significant (95%)" : "not significant"}
      />
    </div>
  );
}

// ───────────────────────────────────────────────────── check against the paper

function mark(r: ValidationRow) {
  if (r.diff_pct === null) return "·";
  const d = Math.abs(r.diff_pct);
  return d <= 10 ? "✓" : d <= 25 ? "≈" : "✗";
}

export function ValidationPanel({ data }: { data: AlleyData }) {
  const [all, setAll] = useState(false);
  const rows = data.validation;
  const comparable = rows.filter((r) => r.diff_pct !== null);
  const close = comparable.filter((r) => Math.abs(r.diff_pct!) <= 10).length;
  const key = rows.filter(
    (r) =>
      /Busiest box|Largest decrease \(II|share of boxes/.test(r.what) &&
      !/MAM|JJA|SON/.test(r.group),
  );
  const shown = all ? rows : key;
  return (
    <Panel title="Step 2 · Check against the paper (1954–2013)">
      <p className="mb-3 text-sm text-[var(--color-foreground)]">
        <strong className="font-semibold">
          {close} of {comparable.length}
        </strong>{" "}
        numbers published by {PAPER_CREDIT.short} are matched within 10%, and
        the field-significance test gives the same verdict.
      </p>
      <table className="w-full text-xs">
        <thead className="text-left text-[var(--color-muted-foreground)]">
          <tr className="border-b border-[var(--color-border)]">
            <th className="py-1.5 pr-2 font-medium">Published number</th>
            <th className="pr-2 text-right font-medium">Paper</th>
            <th className="pr-2 text-right font-medium">Ours</th>
            <th className="w-6 font-medium" />
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr
              key={r.group + r.what}
              className="border-b border-[var(--color-border)]/60 last:border-0"
              title={`${r.box} · ${r.place}`}
            >
              <td className="py-1.5 pr-2">
                <span className="text-[var(--color-muted-foreground)]">
                  {r.group} ·{" "}
                </span>
                {r.what}
              </td>
              <td className="pr-2 text-right font-mono tabular-nums">
                {r.paper}
              </td>
              <td className="pr-2 text-right font-mono tabular-nums">
                {r.ours}
              </td>
              <td className="text-center">{mark(r)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[var(--color-muted-foreground)]">
        <span>
          ✓ within 10% · ≈ within 25% · ✗ larger gap (database revised since
          2016)
        </span>
        <button
          type="button"
          onClick={() => setAll((a) => !a)}
          className="shrink-0 font-medium text-[var(--color-primary)] hover:underline"
        >
          {all ? "Show key rows" : `Show all ${rows.length}`}
        </button>
      </div>
    </Panel>
  );
}

// ───────────────────────────────────────────────────── after 2013

export function AfterPanel({ data }: { data: AlleyData }) {
  const a = data.extension.thru2024,
    b = data.extension.thru2023;
  const row = (label: string, x: React.ReactNode, y: React.ReactNode) => (
    <tr className="border-b border-[var(--color-border)]/60 last:border-0">
      <td className="py-1.5 pr-2">{label}</td>
      <td className="pr-2 text-right font-mono tabular-nums">{x}</td>
      <td className="text-right font-mono tabular-nums">{y}</td>
    </tr>
  );
  const ahead = (r: { ci99: number[] }) =>
    r.ci99[0]! > 0 ? "yes" : "not quite";
  return (
    <Panel title="Step 3 · Same method, after 2013">
      <p className="mb-3 text-sm text-[var(--color-foreground)]">
        The eastward shift is{" "}
        <strong className="font-semibold">
          still there in 2014–2024, but it has not grown.
        </strong>{" "}
        2024 was a record year, so it is shown both ways.
      </p>
      <table className="w-full text-xs">
        <thead className="text-left text-[var(--color-muted-foreground)]">
          <tr className="border-b border-[var(--color-border)]">
            <th className="py-1.5 pr-2 font-medium">
              (E)F1+ tornadoes per year
            </th>
            <th className="pr-2 text-right font-medium">to 2024</th>
            <th className="text-right font-medium">to 2023</th>
          </tr>
        </thead>
        <tbody>
          {row(
            "East box: 1954–83 → 1984–2013",
            `${fmt(a.east_west.I.east, 1)} → ${fmt(a.east_west.II.east, 1)}`,
            "same",
          )}
          {row(
            "East box: 2014 onward",
            fmt(a.east_west.III.east, 1),
            fmt(b.east_west.III.east, 1),
          )}
          {row(
            "West box: 1954–83 → 1984–2013",
            `${fmt(a.east_west.I.west, 1)} → ${fmt(a.east_west.II.west, 1)}`,
            "same",
          )}
          {row(
            "West box: 2014 onward",
            fmt(a.east_west.III.west, 1),
            fmt(b.east_west.III.west, 1),
          )}
          {row(
            "East still ahead? (99% confidence)",
            ahead(a.east_west.III),
            ahead(b.east_west.III),
          )}
          {row(
            "Map still differs from 1954–83?",
            a.field_sig_III_vs_I.f1.field_significant ? "yes" : "no",
            b.field_sig_III_vs_I.f1.field_significant ? "yes" : "no",
          )}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
        East box {boxShort(data, data.meta.GE)} (central Tennessee) · west box{" "}
        {boxShort(data, data.meta.GW)} (southern Oklahoma) · only {a.n_years}{" "}
        years so far.
      </p>
    </Panel>
  );
}

// ───────────────────────────────────────────────────── east vs west (details)

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
    <Panel title="East box vs west box">
      <p className="mb-2 text-xs text-[var(--color-muted-foreground)]">
        {unit} per year · east {boxShort(data, ge)} · west {boxShort(data, gw)}
      </p>
      <table className="w-full font-mono text-xs tabular-nums">
        <thead className="text-left font-sans text-[var(--color-muted-foreground)]">
          <tr className="border-b border-[var(--color-border)]">
            <th className="py-1.5 pr-3 font-medium">Period</th>
            <th className="pr-3 font-medium">East</th>
            <th className="pr-3 font-medium">West</th>
            <th className="pr-3 font-medium">East − West (99% CI)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.period}
              className="border-b border-[var(--color-border)]/60 last:border-0"
            >
              <td className="py-1.5 pr-3">
                {rangeLabel(r.period === "A" ? sel.a : sel.b, sel.exclude2024)}
              </td>
              <td className="pr-3">{fmt(r.east.mean, 1)}</td>
              <td className="pr-3">{fmt(r.west.mean, 1)}</td>
              <td className="pr-3">
                {signed(r.diff.diff, 1)} {fmtCI(r.diff.ci99, 1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

// ───────────────────────────────────────────────────── seasons (details)

export function SeasonalPanel({
  data,
  rows,
  sigByTag,
  active,
  onPick,
}: {
  data: AlleyData;
  rows: SeasonRow[];
  sigByTag: Record<string, FieldSigResult> | null;
  active: string;
  onPick: (s: SeasonRow["season"]) => void;
}) {
  return (
    <Panel title="By season">
      <table className="w-full text-xs">
        <thead className="text-left text-[var(--color-muted-foreground)]">
          <tr className="border-b border-[var(--color-border)]">
            <th className="py-1.5 pr-3 font-medium">Season</th>
            <th className="pr-3 font-medium">Biggest rise</th>
            <th className="pr-3 font-medium">Biggest drop</th>
            <th className="font-medium">Real shift?</th>
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
                <td className="py-1.5 pr-3 font-sans">
                  {seasonLabel(r.season)}
                </td>
                <td className="pr-3" title={boxShort(data, r.inc)}>
                  {signed(r.incVal, 1)}
                </td>
                <td className="pr-3" title={boxShort(data, r.dec)}>
                  {signed(r.decVal, 1)}
                </td>
                <td className="font-sans">
                  {fs ? (fs.fieldSignificant ? "yes" : "no") : "…"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
        Per box, per year. Click a season to map it.
      </p>
    </Panel>
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
          {unit} per year, by 2.5° box
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
