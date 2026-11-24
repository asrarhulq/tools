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
import { PAPER_CREDIT, PROJECT, REFERENCES } from "./config";
import type { BoxIdx, Selection, SeasonFilter } from "./lib/types";
import {
  boxBounds,
  boxShort,
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
  AfterPanel,
  EastWestPanel,
  GridTable,
  PeriodStats,
  SeasonalPanel,
  ValidationPanel,
  Verdict,
} from "./ui/panels";
import { Field, Panel, Segmented, YearRangeSlider } from "./ui/primitives";

/**
 * Alley Tracker: Boilermaker Edition — redoes the analysis of Agee et al.
 * (2016) from the raw NOAA tornado record, checks it against their published
 * numbers, and continues the same method past 2013. Lazy-loaded; the dataset
 * (~40 kB gzipped), the stats worker and jsPDF each load only when needed.
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
  { label: "1954–83 vs 1984–2013", a: [1954, 1983], b: [1984, 2013] },
  { label: "1984–2013 vs 2014–24", a: [1984, 2013], b: [2014, 2024] },
  { label: "1954–83 vs 2014–24", a: [1954, 1983], b: [2014, 2024] },
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
      "iy,ix,lat_s,lat_n,lon_w,lon_e,mean_A,mean_B,B_minus_A,locally_significant",
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
            sig ? sig.local[c] : "",
          ].join(","),
        );
      }
    const header = `# ${PROJECT.title}; ${unit}; ${seasonLabel(sel.season)}; A=${rangeLabel(sel.a, sel.exclude2024)}; B=${rangeLabel(sel.b, sel.exclude2024)}; annual means per 2.5 deg box; method: ${PAPER_CREDIT.short}; data: SPC\n`;
    const url = URL.createObjectURL(
      new Blob([header + rows.join("\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `alley-tracker-grid-${sel.rating}${sel.measure}-${sel.season}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ready =
    data && an.grid && an.ring && an.box && an.eastWest && an.seasonal;

  return (
    <div className="flex flex-col gap-4">
      <JsonLd data={softwareApplicationSchema(tool)} />

      {/* ── Title + credit ───────────────────────────────────── */}
      <header className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2.5">
            <Image
              src={logoLight}
              alt="Purdue University"
              className="h-8 w-auto self-start dark:hidden"
              priority
            />
            <Image
              src={logoDark}
              alt="Purdue University"
              className="hidden h-8 w-auto self-start dark:block"
              priority
            />
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-3xl">
              {PROJECT.title}
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {PROJECT.subtitle}
            </p>
            <p className="text-xs text-[var(--color-foreground)]">
              <span className="font-medium">{PROJECT.author}</span> ·{" "}
              {PROJECT.courseLine}, {PROJECT.university} · Instructor:{" "}
              {PROJECT.instructor}
            </p>
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
              {fs.status !== "done" ? "Preparing…" : "Download PDF report"}
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={!data}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] disabled:opacity-50"
            >
              <Download className="size-4" /> Map data (CSV)
            </button>
          </div>
        </div>
        <div className="mt-4 rounded-lg border-l-2 border-[#cfb991] bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-foreground)]">
          <span className="microlabel mr-2">Based on</span>
          {PAPER_CREDIT.authors} (2016),{" "}
          <a
            href={PAPER_CREDIT.url}
            target="_blank"
            rel="noopener noreferrer"
            className="italic underline decoration-[var(--color-border)] underline-offset-2 hover:decoration-current"
          >
            {PAPER_CREDIT.title}
          </a>
          , {PAPER_CREDIT.journal}.{" "}
          <span className="text-[var(--color-muted-foreground)]">
            {PAPER_CREDIT.note}
          </span>
        </div>
      </header>

      {error ? <Panel>Could not load the dataset: {error}</Panel> : null}
      {!ready ? (
        <div className="h-[520px] animate-pulse rounded-[var(--radius)] bg-[var(--color-surface-2)]" />
      ) : (
        <>
          {/* ── Step 1: our analysis ────────────────────────────── */}
          <Panel
            title="Step 1 · Our analysis of the NOAA tornado record"
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
            <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <Verdict sig={sig} running={fs.status !== "done"} />
                  <div className="flex items-center gap-2">
                    <Segmented<Selection["view"]>
                      label="Map view"
                      value={sel.view}
                      onChange={(v) => set("view", v)}
                      options={[
                        { value: "a", label: "A" },
                        { value: "b", label: "B" },
                        { value: "diff", label: "Change" },
                      ]}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTable((t) => !t)}
                      aria-pressed={showTable}
                      title="Show as a table"
                      className="rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                    >
                      <Table2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                {showTable ? (
                  <GridTable
                    data={data}
                    values={
                      sel.view === "a"
                        ? an.grid!.gA
                        : sel.view === "b"
                          ? an.grid!.gB
                          : an.grid!.diff
                    }
                    unit={sel.view === "diff" ? `Change in ${unit}` : unit}
                  />
                ) : (
                  <GridMap
                    data={data}
                    sel={sel}
                    gA={an.grid!.gA}
                    gB={an.grid!.gB}
                    diff={an.grid!.diff}
                    ext={an.grid!.ext}
                    sig={sig}
                    dark={dark}
                    unit={unit}
                    onSelectBox={(b: BoxIdx) => set("box", b)}
                  />
                )}
              </div>

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
                <Field label={`A · ${rangeLabel(sel.a, sel.exclude2024)}`}>
                  <YearRangeSlider
                    label="Period A"
                    value={sel.a}
                    min={data!.meta.years[0]}
                    max={data!.meta.years[1]}
                    color={col.a}
                    onChange={(v) => set("a", v)}
                  />
                </Field>
                <Field label={`B · ${rangeLabel(sel.b, sel.exclude2024)}`}>
                  <YearRangeSlider
                    label="Period B"
                    value={sel.b}
                    min={data!.meta.years[0]}
                    max={data!.meta.years[1]}
                    color={col.b}
                    onChange={(v) => set("b", v)}
                  />
                </Field>
                <Field label="Count">
                  <Segmented
                    label="What to count"
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
                      { value: "f1d", label: "Tornado days" },
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
                <label className="inline-flex items-center gap-2 text-xs text-[var(--color-foreground)]">
                  <input
                    type="checkbox"
                    checked={sel.exclude2024}
                    onChange={(e) => set("exclude2024", e.target.checked)}
                    className="size-3.5 accent-[var(--color-primary)]"
                  />
                  Leave out 2024 (record year)
                </label>
                <div className="mt-1 border-t border-[var(--color-border)] pt-3">
                  <div className="microlabel mb-2">
                    Selected box · {boxShort(data!, sel.box)} · click the map to
                    change
                  </div>
                  <PeriodStats s={an.box!} sel={sel} dark={dark} />
                  <div className="mt-2">
                    <SeriesChart
                      s={an.box!}
                      dark={dark}
                      unit={unit}
                      exclude2024={sel.exclude2024}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          {/* ── Steps 2 and 3 ──────────────────────────────────── */}
          <div className="grid gap-4 xl:grid-cols-2">
            <ValidationPanel data={data!} />
            <AfterPanel data={data!} />
          </div>

          {/* ── Near Purdue ──────────────────────────────────── */}
          <Panel
            title="Near Purdue"
            action={
              <label className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                within{" "}
                <span className="w-12 text-right font-mono text-[var(--color-foreground)]">
                  {sel.radiusKm} km
                </span>
                <input
                  type="range"
                  min={100}
                  max={500}
                  step={25}
                  value={sel.radiusKm}
                  onChange={(e) => set("radiusKm", +e.target.value)}
                  aria-label="Radius around West Lafayette in km"
                  className="w-32 accent-[var(--color-primary)]"
                />
              </label>
            }
          >
            <p className="mb-3 text-sm text-[var(--color-muted-foreground)]">
              {unit} passing within {sel.radiusKm} km of West Lafayette, per
              year.
            </p>
            <PeriodStats s={an.ring!} sel={sel} dark={dark} />
            <div className="mx-auto mt-3 max-w-3xl">
              <SeriesChart
                s={an.ring!}
                dark={dark}
                unit={unit}
                exclude2024={sel.exclude2024}
              />
            </div>
          </Panel>

          {/* ── Details, collapsed ─────────────────────────────── */}
          <details className="group rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <summary className="microlabel cursor-pointer select-none">
              More statistics
            </summary>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <EastWestPanel
                data={data!}
                ge={an.eastWest!.ge}
                gw={an.eastWest!.gw}
                rows={an.eastWest!.rows}
                sel={sel}
                unit={unit}
              />
              <SeasonalPanel
                data={data!}
                rows={an.seasonal!}
                sigByTag={fs.status === "done" ? fs.byTag : null}
                active={sel.season}
                onPick={(s) => set("season", s)}
              />
            </div>
          </details>

          <details className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <summary className="microlabel cursor-pointer select-none">
              How it works &amp; references
            </summary>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-[var(--color-muted-foreground)]">
              <li>
                Data: NOAA Storm Prediction Center tornado tracks, 1954–2024,
                (E)F1 and stronger (
                {data!.meta.tornadoesUsed.f1.toLocaleString()} tornadoes).
              </li>
              <li>
                Grid: 2.5° boxes over 30–50°N, 80–105°W. A tornado counts in
                every box its straight path touches.
              </li>
              <li>
                Field test: block bootstrap (5-year blocks, 10 000 runs) with a
                Monte Carlo threshold, α = 0.05.
              </li>
              <li>
                All of this follows {PAPER_CREDIT.short}; our code is
                independent and is checked against their numbers in Step 2.
              </li>
            </ul>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-[var(--color-muted-foreground)]">
              {REFERENCES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </details>
        </>
      )}
    </div>
  );
}
