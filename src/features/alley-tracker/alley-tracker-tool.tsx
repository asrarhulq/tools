"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Download, FileDown, Loader2, RotateCcw, Table2 } from "lucide-react";
import { toast } from "sonner";
import type { ToolWithHref } from "@/types/tool";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import logoLight from "./assets/purdue-logo-light.svg";
import logoDark from "./assets/purdue-logo-dark.svg";
import logoPng from "./assets/purdue-logo-light.png";
import { PROJECT, REFERENCES } from "./config";
import type { BoxIdx, Selection, SeasonFilter } from "./lib/types";
import {
  boxBounds,
  boxLabel,
  measureLabel,
  rangeLabel,
  seasonLabel,
} from "./lib/data";
import { SERIES } from "./lib/colors";
import { useAlleyData, useFieldSignificance, useIsDark } from "./state/hooks";
import { useAnalysis } from "./state/analysis";
import { GridMap } from "./ui/grid-map";
import { SeriesChart } from "./ui/series-chart";
import {
  EastWestPanel,
  GridTable,
  PeriodStats,
  ReferencePanel,
  SeasonalPanel,
  SignificancePanel,
} from "./ui/panels";
import { Field, Panel, Segmented, YearRangeSlider } from "./ui/primitives";

/**
 * Alley Tracker: Boilermaker Edition — an interactive replication and
 * extension of Agee et al. (2016) over the SPC tornado record, 1954–2024.
 * Lazy-loaded by the tool router; the dataset (one ~40 kB-gzipped JSON),
 * the stats worker and jsPDF each load only when needed.
 */

const DEFAULT: Selection = {
  a: [1954, 1983],
  b: [1984, 2013],
  rating: "f1",
  measure: "c",
  season: "ALL",
  exclude2024: false,
  view: "diff",
  radiusKm: 300,
  box: [2, 7],
};

const PRESETS: { label: string; a: [number, number]; b: [number, number] }[] = [
  { label: "Agee 2016: I → II", a: [1954, 1983], b: [1984, 2013] },
  { label: "II → III", a: [1984, 2013], b: [2014, 2024] },
  { label: "I → III", a: [1954, 1983], b: [2014, 2024] },
  { label: "Last 20 yr vs prior 20", a: [1985, 2004], b: [2005, 2024] },
];

export function AlleyTrackerTool({ tool }: { tool: ToolWithHref }) {
  const { data, error } = useAlleyData();
  const [sel, setSel] = useState<Selection>(DEFAULT);
  const [showTable, setShowTable] = useState(false);
  const [busy, setBusy] = useState(false);
  const dark = useIsDark();
  const an = useAnalysis(data, sel);
  const fs = useFieldSignificance(data, sel);
  const set = useCallback(
    <K extends keyof Selection>(k: K, v: Selection[K]) =>
      setSel((s) => ({ ...s, [k]: v })),
    [],
  );
  const unit = measureLabel(sel.rating, sel.measure);
  const col = dark ? SERIES.dark : SERIES.light;
  const sig = fs.status === "done" ? (fs.byTag[sel.season] ?? null) : null;

  const download = async () => {
    if (!data || fs.status !== "done") return;
    setBusy(true);
    try {
      const { generateReport } = await import("./lib/report");
      await generateReport({
        data,
        sel,
        analysis: an,
        sigByTag: fs.byTag,
        logoUrl: logoPng.src,
      });
      toast.success("Report downloaded");
    } catch (e) {
      console.error("[alley-tracker] report failed", e);
      toast.error("Could not build the PDF", { description: String(e) });
    } finally {
      setBusy(false);
    }
  };

  const downloadCsv = () => {
    if (!data || !an.grid) return;
    const rows = [
      [
        "iy",
        "ix",
        "lat_s",
        "lat_n",
        "lon_w",
        "lon_e",
        "mean_A",
        "mean_B",
        "B_minus_A",
        "locally_significant",
      ].join(","),
    ];
    for (let iy = 0; iy < 8; iy++)
      for (let ix = 0; ix < 10; ix++) {
        const c = iy * 10 + ix;
        const b = boxBounds(data, [iy, ix]);
        rows.push(
          [
            iy,
            ix,
            b.s,
            b.n,
            b.w,
            b.e,
            an.grid.gA[c]!.toFixed(4),
            an.grid.gB[c]!.toFixed(4),
            an.grid.diff[c]!.toFixed(4),
            sig ? sig.local[c]! : "",
          ].join(","),
        );
      }
    const header = `# ${PROJECT.title}; ${unit}; ${seasonLabel(sel.season)}; A=${rangeLabel(sel.a, sel.exclude2024)}; B=${rangeLabel(sel.b, sel.exclude2024)}; annual means per 2.5 deg box; source: SPC 1950-2024 actual tornadoes\n`;
    const url = URL.createObjectURL(
      new Blob([header + rows.join("\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `alley-tracker-grid-${sel.rating}${sel.measure}-${sel.season}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <JsonLd data={softwareApplicationSchema(tool)} />

      {/* ── Title block ─────────────────────────────────────────── */}
      <header className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <Image
              src={logoLight}
              alt="Purdue University"
              className="h-9 w-auto self-start dark:hidden"
              priority
            />
            <Image
              src={logoDark}
              alt="Purdue University"
              className="hidden h-9 w-auto self-start dark:block"
              priority
            />
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-3xl">
                {PROJECT.title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
                {PROJECT.subtitle}
              </p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
              <dt className="microlabel self-center">Author</dt>
              <dd className="font-medium text-[var(--color-foreground)]">
                {PROJECT.author}
              </dd>
              <dt className="microlabel self-center">Course</dt>
              <dd className="text-[var(--color-foreground)]">
                {PROJECT.courseLine}, {PROJECT.university}
              </dd>
              <dt className="microlabel self-center">Instructor</dt>
              <dd className="text-[var(--color-foreground)]">
                {PROJECT.instructor}, {PROJECT.department}
              </dd>
            </dl>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
            <button
              type="button"
              onClick={download}
              disabled={!data || fs.status !== "done" || busy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileDown className="size-4" />
              )}
              {fs.status !== "done"
                ? "Preparing statistics…"
                : "Download PDF report"}
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={!data}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] disabled:opacity-50"
            >
              <Download className="size-4" /> Grid as CSV
            </button>
          </div>
        </div>
      </header>

      {error ? <Panel>Could not load the dataset: {error}</Panel> : null}
      {!data ||
      !an.grid ||
      !an.ring ||
      !an.box ||
      !an.eastWest ||
      !an.seasonal ? (
        <div className="h-[520px] animate-pulse rounded-[var(--radius)] bg-[var(--color-surface-2)]" />
      ) : (
        <>
          {/* ── Controls ──────────────────────────────────────────── */}
          <Panel
            title="Controls"
            action={
              <button
                type="button"
                onClick={() => setSel(DEFAULT)}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <RotateCcw className="size-3" /> Reset
              </button>
            }
          >
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => {
                    const on =
                      sel.a[0] === p.a[0] &&
                      sel.a[1] === p.a[1] &&
                      sel.b[0] === p.b[0] &&
                      sel.b[1] === p.b[1];
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() =>
                          setSel((s) => ({ ...s, a: p.a, b: p.b }))
                        }
                        className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-foreground)]" : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"}`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <Field
                  label={`Period A · ${rangeLabel(sel.a, sel.exclude2024)}`}
                >
                  <YearRangeSlider
                    label="Period A"
                    value={sel.a}
                    min={data.meta.years[0]}
                    max={data.meta.years[1]}
                    color={col.a}
                    onChange={(v) => set("a", v)}
                  />
                </Field>
                <Field
                  label={`Period B · ${rangeLabel(sel.b, sel.exclude2024)}`}
                >
                  <YearRangeSlider
                    label="Period B"
                    value={sel.b}
                    min={data.meta.years[0]}
                    max={data.meta.years[1]}
                    color={col.b}
                    onChange={(v) => set("b", v)}
                  />
                </Field>
                <label className="inline-flex items-center gap-2 text-xs text-[var(--color-foreground)]">
                  <input
                    type="checkbox"
                    checked={sel.exclude2024}
                    onChange={(e) => set("exclude2024", e.target.checked)}
                    className="size-3.5 accent-[var(--color-primary)]"
                  />
                  Exclude 2024 (record year, 943 (E)F1+ tornadoes)
                </label>
              </div>
              <div className="flex flex-col gap-4">
                <Field label="Tornadoes">
                  <Segmented
                    label="Rating and measure"
                    value={`${sel.rating}${sel.measure}`}
                    onChange={(v) =>
                      setSel((s) => ({
                        ...s,
                        rating: v.slice(0, 2) as Selection["rating"],
                        measure: v[2] as Selection["measure"],
                      }))
                    }
                    options={[
                      { value: "f1c", label: "(E)F1+" },
                      { value: "f2c", label: "(E)F2+" },
                      {
                        value: "f1d",
                        label: "Tornado days",
                        title: "Days with ≥ 1 (E)F1+ tornado in the box",
                      },
                      {
                        value: "f2d",
                        label: "Sig. days",
                        title: "Days with ≥ 1 (E)F2+ tornado in the box",
                      },
                    ]}
                  />
                </Field>
                <Field label="Season">
                  <Segmented<SeasonFilter>
                    label="Season"
                    value={sel.season}
                    onChange={(v) => set("season", v)}
                    options={[
                      { value: "ALL", label: "All" },
                      { value: "DJF", label: "Winter" },
                      { value: "MAM", label: "Spring" },
                      { value: "JJA", label: "Summer" },
                      { value: "SON", label: "Autumn" },
                    ]}
                  />
                </Field>
                <Field
                  label={`Ring around West Lafayette · ${sel.radiusKm} km`}
                >
                  <input
                    type="range"
                    min={100}
                    max={500}
                    step={25}
                    value={sel.radiusKm}
                    onChange={(e) => set("radiusKm", +e.target.value)}
                    aria-label="Ring radius in kilometres"
                    className="w-full accent-[var(--color-primary)]"
                  />
                </Field>
              </div>
            </div>
          </Panel>

          {/* ── Map + significance ────────────────────────────────── */}
          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Panel
              title={`${unit} · ${seasonLabel(sel.season)}`}
              action={
                <div className="flex items-center gap-2">
                  <Segmented<Selection["view"]>
                    label="Map view"
                    value={sel.view}
                    onChange={(v) => set("view", v)}
                    options={[
                      { value: "a", label: "Period A" },
                      { value: "b", label: "Period B" },
                      { value: "diff", label: "B − A" },
                    ]}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTable((t) => !t)}
                    aria-pressed={showTable}
                    title="Show values as a table"
                    className="rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  >
                    <Table2 className="size-3.5" />
                  </button>
                </div>
              }
            >
              {showTable ? (
                <GridTable
                  data={data}
                  values={
                    sel.view === "a"
                      ? an.grid.gA
                      : sel.view === "b"
                        ? an.grid.gB
                        : an.grid.diff
                  }
                  unit={sel.view === "diff" ? `Change in ${unit}` : unit}
                />
              ) : (
                <GridMap
                  data={data}
                  sel={sel}
                  gA={an.grid.gA}
                  gB={an.grid.gB}
                  diff={an.grid.diff}
                  ext={an.grid.ext}
                  sig={sig}
                  dark={dark}
                  unit={unit}
                  onSelectBox={(b: BoxIdx) => set("box", b)}
                />
              )}
            </Panel>
            <div className="flex flex-col gap-4">
              <SignificancePanel
                sel={sel}
                sig={sig}
                status={fs.status}
                ms={fs.ms}
              />
              <Panel title={`Inspected box · ${boxLabel(data, sel.box)}`}>
                <PeriodStats
                  s={an.box}
                  sel={sel}
                  unit={`${unit}/yr`}
                  dark={dark}
                  compact
                />
                <div className="mt-3">
                  <SeriesChart
                    s={an.box}
                    dark={dark}
                    unit={unit}
                    exclude2024={sel.exclude2024}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    type="button"
                    className="rounded border border-[var(--color-border)] px-2 py-0.5 hover:bg-[var(--color-surface-2)]"
                    onClick={() => set("box", an.eastWest!.ge)}
                  >
                    Paper&apos;s east box (GE)
                  </button>
                  <button
                    type="button"
                    className="rounded border border-[var(--color-border)] px-2 py-0.5 hover:bg-[var(--color-surface-2)]"
                    onClick={() => set("box", an.eastWest!.gw)}
                  >
                    Paper&apos;s west box (GW)
                  </button>
                  <span className="self-center text-[var(--color-muted-foreground)]">
                    or click any box on the map
                  </span>
                </div>
              </Panel>
            </div>
          </div>

          {/* ── Purdue ring ──────────────────────────────────────── */}
          <Panel
            title={`Near Purdue · paths within ${sel.radiusKm} km of West Lafayette (40.43°N, 86.91°W)`}
          >
            <PeriodStats
              s={an.ring}
              sel={sel}
              unit={`${unit}/yr`}
              dark={dark}
            />
            <div className="mt-3">
              <SeriesChart
                s={an.ring}
                dark={dark}
                unit={unit}
                exclude2024={sel.exclude2024}
              />
            </div>
            <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
              A tornado counts if any point of its straight-line path came
              within the radius (great-circle distance); a tornado day counts if
              its closest tornado did. Bars: blue = Period A, orange = Period B,
              grey = neither. Lines and bands: period mean and bootstrap 95% CI.
            </p>
          </Panel>

          <div className="grid gap-4 xl:grid-cols-2">
            <EastWestPanel
              data={data}
              ge={an.eastWest.ge}
              gw={an.eastWest.gw}
              rows={an.eastWest.rows}
              sel={sel}
              unit={unit}
            />
            <SeasonalPanel
              data={data}
              rows={an.seasonal}
              sigByTag={fs.status === "done" ? fs.byTag : null}
              unit={unit}
              active={sel.season}
              onPick={(s) => set("season", s)}
            />
          </div>

          <ReferencePanel data={data} />

          <Panel title="Methods, data and references">
            <div className="grid gap-6 text-xs leading-relaxed text-[var(--color-muted-foreground)] lg:grid-cols-2">
              <div className="space-y-2">
                <p>
                  <strong className="text-[var(--color-foreground)]">
                    Data.
                  </strong>{" "}
                  NOAA/NWS Storm Prediction Center Severe Weather Database,
                  1950–2024 actual tornado tracks (
                  {data.meta.tornadoesUsed.f1.toLocaleString()} (E)F1+
                  tornadoes, 1954–2024). 1950–53 dropped; (E)F0 and unrated
                  (EF-U) excluded. Aggregated offline into one precomputed file;
                  no raw records are sent to the browser.
                </p>
                <p>
                  <strong className="text-[var(--color-foreground)]">
                    Counting.
                  </strong>{" "}
                  80 boxes of 2.5° over 30–50°N, 80–105°W. A tornado counts once
                  in every box its straight-line path starts in, ends in or
                  crosses. Tornado day = date with ≥ 1 qualifying tornado in the
                  box. Periods of different length are compared as annual means.
                </p>
                <p>
                  <strong className="text-[var(--color-foreground)]">
                    Statistics.
                  </strong>{" "}
                  Field significance: moving-block bootstrap (5-yr blocks, 10
                  000 resamples) per box plus a Livezey–Chen Monte Carlo
                  threshold (10 000 trials), α = 0.05, after Elmore et al.
                  (2006). Annual-mean CIs: classical bootstrap (10 000). Trends:
                  Theil–Sen with Mann–Kendall. All computed live in a Web Worker
                  with fixed seeds; the offline Python pipeline gives the same
                  numbers.
                </p>
                <p>
                  <strong className="text-[var(--color-foreground)]">
                    Caveats.
                  </strong>{" "}
                  Reporting practices changed over time (EF scale from 2007,
                  damage surveys, later re-ratings). The grid is coarse and
                  paths are straight lines. Periods shorter than ~15 years give
                  weak block-bootstrap tests.
                </p>
              </div>
              <ol className="list-decimal space-y-1.5 pl-4">
                {REFERENCES.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
