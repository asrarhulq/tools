import type { jsPDF as JsPDF } from "jspdf";
import type { AlleyData, BoxIdx, Selection } from "./types";
import type { FieldSigResult } from "./stats";
import type { Analysis, SeriesStats } from "../state/analysis";
import {
  NX,
  NY,
  boxLabel,
  measureLabel,
  rangeLabel,
  seasonLabel,
} from "./data";
import { MAP_H, MAP_W, project, ringPolygon } from "./geo";
import { PDF, lerpStops } from "./colors";
import { PAPER, PROJECT, REFERENCES } from "../config";

/**
 * Research-report PDF for the current selection, generated fully client-side.
 * Plain academic style (Times, black text, numbered sections, captioned
 * figures, booktabs-like tables). Every figure is drawn as vectors from the
 * same numbers the page shows, so the report and the page always agree.
 * jsPDF is imported lazily so it is only downloaded when the button is used.
 */

export interface ReportInput {
  data: AlleyData;
  sel: Selection;
  analysis: Analysis;
  sigByTag: Record<string, FieldSigResult>;
  logoUrl: string;
}

const INK: [number, number, number] = [20, 20, 20];
const MUTED: [number, number, number] = [95, 95, 95];
const M = 20; // margin, mm

/** The built-in Times font is WinAnsi-only: map the few non-WinAnsi glyphs we use. */
function pdfSafe(t: string): string {
  return t
    .replace(/\u2212/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/\u03b1/g, "alpha")
    .replace(/\u2265/g, ">=")
    .replace(/\u2264/g, "<=");
}

function rgb(h: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}
const f = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "–");
const sg = (v: number, d = 2) => (v > 0 ? "+" : "") + f(v, d);
const ci = (c: readonly number[], d = 2) => `[${f(c[0]!, d)}, ${f(c[1]!, d)}]`;
const pv = (p: number) => (p < 0.001 ? "< 0.001" : f(p, 3));

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => res(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateReport(inp: ReportInput): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const { data, sel, analysis: an, sigByTag } = inp;
  const g = an.grid!,
    ring = an.ring!,
    box = an.box!,
    ew = an.eastWest!,
    seasonal = an.seasonal!;
  const sig = sigByTag[sel.season];
  const unit = measureLabel(sel.rating, sel.measure);
  const A = rangeLabel(sel.a, sel.exclude2024),
    B = rangeLabel(sel.b, sel.exclude2024);
  const logo = await toDataUrl(inp.logoUrl);

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  // Route every string through pdfSafe (text + wrapping measure the same glyphs).
  const rawText = doc.text.bind(doc);
  const rawSplit = doc.splitTextToSize.bind(doc);
  const safe = (t: unknown) =>
    typeof t === "string"
      ? pdfSafe(t)
      : Array.isArray(t)
        ? t.map((x) => (typeof x === "string" ? pdfSafe(x) : x))
        : t;
  doc.text = ((t: unknown, ...rest: unknown[]) =>
    (rawText as (...a: unknown[]) => JsPDF)(
      safe(t),
      ...rest,
    )) as typeof doc.text;
  // autoTable passes arrays of lines too, so sanitize strings and string arrays alike.
  doc.splitTextToSize = ((t: unknown, ...rest: unknown[]) =>
    (rawSplit as (...a: unknown[]) => string[])(
      safe(t),
      ...rest,
    )) as typeof doc.splitTextToSize;
  const W = doc.internal.pageSize.getWidth(),
    H = doc.internal.pageSize.getHeight();
  const TW = W - 2 * M;
  let y = M;

  const font = (
    size: number,
    style: "normal" | "bold" | "italic" | "bolditalic" = "normal",
    color = INK,
  ) => {
    doc.setFont("times", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const need = (h: number) => {
    if (y + h > H - M - 8) {
      doc.addPage();
      y = M;
    }
  };
  const para = (
    text: string,
    size = 10.5,
    style: "normal" | "italic" = "normal",
    gap = 2.5,
  ) => {
    font(size, style);
    const lines = doc.splitTextToSize(text, TW) as string[];
    const lh = size * 0.42;
    need(lines.length * lh);
    doc.text(lines, M, y + lh * 0.8, { align: "justify", maxWidth: TW });
    y += lines.length * lh + gap;
  };
  const heading = (t: string, level: 1 | 2 = 1) => {
    need(14);
    y += level === 1 ? 3 : 1.5;
    font(level === 1 ? 12.5 : 11, "bold");
    doc.text(t, M, y + 4);
    y += level === 1 ? 7.5 : 6.5;
  };
  const caption = (t: string) => {
    font(9, "normal", MUTED);
    const lines = doc.splitTextToSize(t, TW) as string[];
    doc.text(lines, M, y + 3.2);
    y += lines.length * 3.9 + 4;
  };
  const table = (
    head: string[],
    body: (string | number)[][],
    opts: { colW?: number[]; fontSize?: number } = {},
  ) => {
    need(10 + body.length * 5);
    autoTable(doc, {
      startY: y,
      head: [head.map(pdfSafe)],
      body: body.map((r) => r.map((c) => pdfSafe(String(c)))),
      theme: "plain",
      margin: { left: M, right: M },
      styles: {
        font: "times",
        fontSize: opts.fontSize ?? 9,
        cellPadding: { top: 1, bottom: 1, left: 1.2, right: 1.2 },
        textColor: INK,
        lineColor: INK,
      },
      headStyles: { fontStyle: "bold", lineWidth: { top: 0.35, bottom: 0.2 } },
      bodyStyles: { lineWidth: 0 },
      columnStyles: opts.colW
        ? Object.fromEntries(opts.colW.map((w, i) => [i, { cellWidth: w }]))
        : undefined,
      didDrawPage: () => undefined,
    });
    const last = (doc as unknown as { lastAutoTable: { finalY: number } })
      .lastAutoTable.finalY;
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.35);
    doc.line(M, last, W - M, last);
    y = last + 5;
  };

  // ── Title block ───────────────────────────────────────────────────────
  if (logo) {
    const lw = 58,
      lh = (lw * 225) / 1257;
    doc.addImage(logo, "PNG", (W - lw) / 2, y, lw, lh);
    y += lh + 9;
  }
  font(17, "bold");
  doc.text(PROJECT.title, W / 2, y, { align: "center" });
  y += 7;
  font(11, "italic");
  const sub = doc.splitTextToSize(PROJECT.subtitle, TW - 10) as string[];
  doc.text(sub, W / 2, y, { align: "center" });
  y += sub.length * 4.8 + 4;
  font(12, "bold");
  doc.text(PROJECT.author, W / 2, y, { align: "center" });
  y += 5.5;
  font(10.5);
  for (const l of [
    PROJECT.courseLine,
    `Instructor: ${PROJECT.instructor}`,
    `${PROJECT.department}, ${PROJECT.university}`,
    `${PROJECT.place} · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
  ]) {
    doc.text(l, W / 2, y, { align: "center" });
    y += 4.8;
  }
  y += 3;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 6;

  // ── Abstract ──────────────────────────────────────────────────────────
  const e = g.ext;
  const val = (arr: Float64Array, b: BoxIdx) => arr[b[0] * NX + b[1]]!;
  const ewB = ew.rows[1]!;
  font(11, "bold");
  doc.text("Abstract", M, y + 3);
  y += 6.5;
  para(
    `Agee et al. (2016) showed that U.S. tornado activity shifted eastward, from the southern Plains toward Tennessee and Alabama, between 1954–1983 and 1984–2013. ` +
      `This project reproduces their 2.5° grid-box method with the current NOAA Storm Prediction Center database, extends it through 2024, and adds interactive tests for any pair of periods. ` +
      `For ${unit} (${seasonLabel(sel.season).toLowerCase()}), comparing Period A (${A}) with Period B (${B}), ` +
      (sig
        ? `${f(sig.N, 1)}% of the 80 boxes show a locally significant change against a Monte Carlo threshold of ${f(sig.threshold, 1)}%, so the change is ${sig.fieldSignificant ? "field significant" : "not field significant"} at the 95% level. `
        : "") +
      `The largest increase is in ${boxLabel(data, e.inc)} (${sg(val(g.diff, e.inc))} per year) and the largest decrease in ${boxLabel(data, e.dec)} (${sg(val(g.diff, e.dec))} per year). ` +
      `In Period B the paper's east box exceeds its west box by ${f(ewB.diff.diff)} per year (99% bootstrap CI ${ci(ewB.diff.ci99)}). ` +
      `Within ${sel.radiusKm} km of West Lafayette, activity averaged ${f(ring.a.mean)} per year in A and ${f(ring.b.mean)} in B (difference ${sg(ring.diff.diff)}, 95% CI ${ci(ring.diff.ci95)}), with a Theil–Sen trend of ${sg(ring.trend.slopePerDecade)} per decade (Mann–Kendall p = ${pv(ring.trend.p)}).`,
  );

  font(9.5, "bold");
  doc.text("Configuration of this report", M, y + 3);
  y += 5;
  table(
    ["Setting", "Value"],
    [
      ["Period A / Period B", `${A} / ${B}`],
      ["Measure", unit],
      ["Season", seasonLabel(sel.season)],
      ["2024 (record year)", sel.exclude2024 ? "excluded" : "included"],
      ["Ring around West Lafayette (40.43°N, 86.91°W)", `${sel.radiusKm} km`],
      ["Inspected box", boxLabel(data, sel.box)],
      [
        "Data",
        `SPC 1950–2024 actual tornado tracks; ${data.meta.tornadoesUsed.f1.toLocaleString()} (E)F1+ tornadoes, 1954–2024`,
      ],
    ],
    { colW: [70, TW - 70] },
  );

  // ── 1. Data and methods ───────────────────────────────────────────────
  doc.addPage();
  y = M;
  heading("1. Data and methods");
  para(
    'Data. Tornado tracks come from the NOAA/NWS Storm Prediction Center Severe Weather Database (file 1950-2024_actual_tornadoes.csv; whole tracks, not per-state segments). As in the paper, 1950–1953 are dropped as inhomogeneous, (E)F0 tornadoes are excluded, and "significant" means (E)F2+. Tornadoes with unknown rating (EF-U, coded −9, 2016 onward) are excluded.',
  );
  para(
    "Grid and counting. The domain 30–50°N, 80–105°W is divided into 80 boxes of 2.5° × 2.5°. A tornado counts once in every box its straight-line path (start to end point) starts in, ends in, or crosses; a tornado day is a calendar date with at least one qualifying tornado in the box. Because periods can differ in length, all comparisons use annual means.",
  );
  para(
    "Field significance (Elmore et al. 2006, as used by Agee et al. 2016). For every box, a moving-block bootstrap (block length 5 years, 10 000 resamples, the same resampled years for all boxes) gives a 95% interval for the change in annual mean (B − A); N is the share of boxes whose interval excludes zero. The threshold is the 95th percentile, over 10 000 Monte Carlo trials, of the share of boxes whose annual series correlates significantly (α = 0.05) with a random N(0,1) series (Livezey and Chen 1983); this preserves the spatial correlation of the field. The field is significant when N exceeds the threshold.",
  );
  para(
    "Bootstrap of annual means. Following the paper's Fig. 12, n east-box and n west-box years are drawn independently with replacement, the mean of the n differences is taken, and this is repeated 10 000 times; 95% and 99% percentile intervals are reported. Trends use the Theil–Sen slope with the Mann–Kendall test (tie-corrected).",
  );
  para(
    "Distance ring. For each tornado the closest point of its path to West Lafayette (great-circle distance) is computed; for each tornado day, the closest tornado of that day. Counts within the chosen radius are summed per year. All resampling uses fixed random seeds, so the numbers are reproducible.",
  );

  heading("2. Validation against Agee et al. (2016)");
  const r24 = data.reference.thru2024;
  const fsr = (k: string) => r24.field_sig[k]?.II_vs_I;
  table(
    [
      "Quantity (1954–1983 = I, 1984–2013 = II)",
      "This study",
      "Agee et al. (2016)",
    ],
    [
      [
        "Busiest box, (E)F1+ tornadoes, Period I",
        r24.max_box.f1_counts.I[0],
        PAPER.maxBoxI,
      ],
      [
        "Busiest box, (E)F1+ tornadoes, Period II",
        r24.max_box.f1_counts.II[0],
        PAPER.maxBoxII,
      ],
      [
        "Busiest box, (E)F2+ tornadoes, I / II",
        `${r24.max_box.f2_counts.I[0]} / ${r24.max_box.f2_counts.II[0]}`,
        `${PAPER.f2MaxI} / ${PAPER.f2MaxII}`,
      ],
      [
        "Most tornado days in a box, I / II",
        `${r24.max_box.f1_days.I[0]} / ${r24.max_box.f1_days.II[0]}`,
        `${PAPER.daysMaxI} / ${PAPER.daysMaxII}`,
      ],
      [
        "Oklahoma (E)F1+ tornadoes, I / II",
        `${r24.state.OK.I} / ${r24.state.OK.II}`,
        PAPER.stateOK.join(" / "),
      ],
      [
        "Tennessee (E)F1+ tornadoes, I / II",
        `${r24.state.TN.I} / ${r24.state.TN.II}`,
        PAPER.stateTN.join(" / "),
      ],
      [
        "Field significance (E)F1+, N / threshold (%)",
        `${f(fsr("f1_counts")?.N_pct ?? NaN, 1)} / ${f(fsr("f1_counts")?.threshold_pct ?? NaN, 2)}`,
        `${PAPER.fieldSigF1.N} / ${PAPER.fieldSigF1.threshold}`,
      ],
      [
        "Field significance (E)F2+, N / threshold (%)",
        `${f(fsr("f2_counts")?.N_pct ?? NaN, 1)} / ${f(fsr("f2_counts")?.threshold_pct ?? NaN, 2)}`,
        `${PAPER.fieldSigF2.N} / ${PAPER.fieldSigF2.threshold}`,
      ],
    ],
    { colW: [90, 40, TW - 130] },
  );
  caption(
    "Table 1. Reproduction of published values. The (E)F1+ field-significance N is reproduced exactly; remaining gaps are attributed to revisions of the SPC database since 2016 (re-rated, added and merged tracks) and are reported rather than tuned away.",
  );

  // ── 3. Results ────────────────────────────────────────────────────────
  doc.addPage();
  y = M;
  heading("3. Results for the selected configuration");
  heading("3.1 Spatial change and field significance", 2);
  const mapW = TW * 0.82,
    mapH = (mapW * MAP_H) / MAP_W;
  need(mapH + 20);
  drawMap(doc, data, sel, g.diff, sig ?? null, (W - mapW) / 2, y, mapW);
  y += mapH + 3;
  const maxAbs = Math.max(...g.diff.map(Math.abs));
  drawDivLegend(doc, (W - 80) / 2, y, 80, maxAbs);
  y += 9;
  caption(
    `Figure 1. Change in annual mean ${unit} per 2.5° box, Period B (${B}) minus Period A (${A}), ${seasonLabel(sel.season).toLowerCase()}. Red = increase, blue = decrease. Dots mark boxes whose change is locally significant (block bootstrap, p < 0.05). Solid/dashed frames: largest increase/decrease. Star: West Lafayette; dashed circle: ${sel.radiusKm} km.`,
  );
  table(
    ["Season", "N (%)", "Threshold (%)", "Boxes", "Field significant?"],
    (["ALL", "DJF", "MAM", "JJA", "SON"] as const).map((s) => {
      const r = sigByTag[s];
      return [
        seasonLabel(s),
        f(r?.N ?? NaN, 1),
        f(r?.threshold ?? NaN, 2),
        r ? `${r.nSig} / 80` : "–",
        r ? (r.fieldSignificant ? "yes" : "no") : "–",
      ];
    }),
  );
  caption(
    `Table 2. Field significance of the B − A change, ${unit}, by season (10 000 block-bootstrap resamples, block 5 years, α = 0.05).`,
  );

  heading("3.2 Seasonal pattern", 2);
  table(
    [
      "Season",
      "Largest increase (per yr)",
      "Largest decrease (per yr)",
      "Busiest box A → B",
    ],
    seasonal.map((r) => [
      seasonLabel(r.season),
      `${sg(r.incVal)}  ${boxLabel(data, r.inc)}`,
      `${sg(r.decVal)}  ${boxLabel(data, r.dec)}`,
      `${f(r.maxAVal, 1)} → ${f(r.maxBVal, 1)}`,
    ]),
    { fontSize: 8.5, colW: [24, 58, 58, TW - 140] },
  );
  caption(
    "Table 3. Seasonal extremes of the B − A change in annual mean per 2.5° box. Seasons are assigned by calendar month within the calendar year.",
  );

  heading("3.3 East box versus west box", 2);
  table(
    [
      "Period",
      "East (GE) mean [95% CI]",
      "West (GW) mean [95% CI]",
      "GE − GW",
      "99% CI",
    ],
    ew.rows.map((r) => [
      `${r.period}: ${r.period === "A" ? A : B}`,
      `${f(r.east.mean)} ${ci(r.east.ci95)}`,
      `${f(r.west.mean)} ${ci(r.west.ci95)}`,
      sg(r.diff.diff),
      ci(r.diff.ci99),
    ]),
    { fontSize: 8.5 },
  );
  caption(
    `Table 4. Annual ${unit} in the paper's boxes of greatest increase, GE (${boxLabel(data, ew.ge)}), and greatest decrease, GW (${boxLabel(data, ew.gw)}). Bootstrap after Agee et al. (2016, Fig. 12), 10 000 resamples.`,
  );
  const hw = (TW - 8) / 2;
  need(42);
  ew.rows.forEach((r, k) =>
    drawHist(
      doc,
      M + k * (hw + 8),
      y,
      hw,
      32,
      r.diff.hist,
      r.diff.diff,
      `${r.period}: ${r.period === "A" ? A : B}`,
      k ? PDF.b : PDF.a,
    ),
  );
  y += 38;
  caption(
    "Figure 2. Bootstrap distributions of the mean GE − GW difference for Periods A and B (vertical line: observed difference; dashed: zero). Separated distributions mirror the paper's Fig. 14.",
  );

  heading(
    `3.4 Tornado activity near Purdue (within ${sel.radiusKm} km of West Lafayette)`,
    2,
  );
  need(60);
  drawBars(doc, M, y, TW, 46, ring, sel);
  y += 50;
  caption(
    `Figure 3. Annual ${unit} whose path came within ${sel.radiusKm} km of West Lafayette, ${data.meta.years[0]}–${data.meta.years[1]}. Blue = Period A, orange = Period B; horizontal lines and bands are period means and bootstrap 95% CIs.${sel.exclude2024 ? " 2024 excluded (outlined)." : ""}`,
  );
  table(
    ["", "Period A", "Period B", "B − A", "Trend (Theil–Sen, MK p)"],
    [
      [
        `Within ${sel.radiusKm} km`,
        `${f(ring.a.mean)} ${ci(ring.a.ci95)}`,
        `${f(ring.b.mean)} ${ci(ring.b.ci95)}`,
        `${sg(ring.diff.diff)} ${ci(ring.diff.ci95)}`,
        `${sg(ring.trend.slopePerDecade)}/decade ${ci(ring.trend.ci95)}, p ${pv(ring.trend.p)}`,
      ],
      [
        `Box ${boxLabel(data, sel.box)}`,
        `${f(box.a.mean)} ${ci(box.a.ci95)}`,
        `${f(box.b.mean)} ${ci(box.b.ci95)}`,
        `${sg(box.diff.diff)} ${ci(box.diff.ci95)}`,
        `${sg(box.trend.slopePerDecade)}/decade ${ci(box.trend.ci95)}, p ${pv(box.trend.p)}`,
      ],
    ],
    { fontSize: 8, colW: [34, 32, 32, 34, TW - 132] },
  );
  caption(
    "Table 5. Annual means with bootstrap 95% CIs (10 000 resamples) and Theil–Sen trend with Sen's 95% CI over all included years.",
  );

  // ── 4. Period III and 2024 ───────────────────────────────────────────
  heading("4. Extension to 2024, with and without the record year");
  const r23 = data.reference.thru2023_no2024;
  const ewp = (r: typeof r24, p: string) => {
    const v = r.east_west.f1_counts.periods[p];
    return v
      ? `${f(v.east_mean)} / ${f(v.west_mean)}  (E−W 99% ${ci(v.diff_ci99)})`
      : "–";
  };
  const fs3 = (r: typeof r24, k: string) => {
    const v = r.field_sig[k]?.III_vs_II;
    return v ? `${f(v.N_pct, 1)} / ${f(v.threshold_pct, 1)}` : "–";
  };
  table(
    ["(E)F1+ unless noted", "Period III = 2014–2024", "Period III = 2014–2023"],
    [
      ["East / West per year, Period II", ewp(r24, "II"), ewp(r23, "II")],
      ["East / West per year, Period III", ewp(r24, "III"), ewp(r23, "III")],
      [
        "Field significance III vs II, N / thr (%)",
        fs3(r24, "f1_counts"),
        fs3(r23, "f1_counts"),
      ],
      [
        "Field significance III vs II, (E)F2+",
        fs3(r24, "f2_counts"),
        fs3(r23, "f2_counts"),
      ],
      [
        "E − W trend 1954–end (per decade, MK p)",
        `${sg(r24.trend_diff.slope_per_decade)} (${pv(r24.trend_diff.p)})`,
        `${sg(r23.trend_diff.slope_per_decade)} (${pv(r23.trend_diff.p)})`,
      ],
    ],
    { fontSize: 8.5, colW: [62, (TW - 62) / 2, (TW - 62) / 2] },
  );
  caption(
    "Table 6. Fixed-period results from the offline pipeline (tornado-analysis/scripts). 2024 had 943 (E)F1+ tornadoes, a record; including it raises Period III means but does not change the conclusion that the eastward shift has persisted, not grown.",
  );

  heading("5. Discussion and limitations");
  para(
    "The eastward redistribution reported by Agee et al. (2016) is reproduced with today's database: the (E)F1+ field-significance result matches the published N exactly, and the east box exceeds the west box at the 99% level in Period II. Extending the record through 2024 shows the shift has held but not intensified; the 2014–2024 period is too short (about two 5-year blocks) for its own field-significance result to carry weight, so it is treated as descriptive. Box counts are sensitive to non-meteorological changes in the record (the 2007 switch to the Enhanced Fujita scale, growth in reporting and damage surveys, and later re-ratings), which is one reason the paper and this study focus on (E)F1+ and (E)F2+ rather than all tornadoes. The 2.5° grid is coarse relative to individual tracks, and straight-line paths approximate curved ones.",
  );

  heading("References");
  font(9.5);
  for (const r of REFERENCES) {
    const lines = doc.splitTextToSize(r, TW - 6) as string[];
    need(lines.length * 4 + 1.5);
    doc.text(lines, M + 6, y + 3, { maxWidth: TW - 6 });
    y += lines.length * 4 + 1.5;
  }

  // footers
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    font(8.5, "normal", MUTED);
    doc.text(
      `${PROJECT.author} · ${PROJECT.courseLine} · ${PROJECT.university}`,
      M,
      H - 10,
    );
    doc.text(`Page ${i} of ${n}`, W - M, H - 10, { align: "right" });
  }

  doc.save(
    `alley-tracker-report-${sel.a[0]}-${sel.a[1]}_vs_${sel.b[0]}-${sel.b[1]}.pdf`,
  );
}

// ───────────────────────────────────────────────────── vector figures

function drawMap(
  doc: JsPDF,
  data: AlleyData,
  sel: Selection,
  diff: Float64Array,
  sig: FieldSigResult | null,
  x0: number,
  y0: number,
  w: number,
) {
  const s = w / MAP_W;
  const P = (lon: number, lat: number): [number, number] => {
    const [px, py] = project(lon, lat);
    return [x0 + px * s, y0 + py * s];
  };
  const { lat0, lon0, d } = data.meta.grid;
  const maxAbs = Math.max(...diff.map(Math.abs)) || 1;
  for (let iy = 0; iy < NY; iy++)
    for (let ix = 0; ix < NX; ix++) {
      const [ax, ay] = P(lon0 + d * ix, lat0 + d * (iy + 1));
      const [bx, by] = P(lon0 + d * (ix + 1), lat0 + d * iy);
      const v = diff[iy * NX + ix]!;
      doc.setFillColor(
        ...rgb(
          lerpStops(
            v >= 0 ? [...PDF.div.pos] : [...PDF.div.neg],
            Math.abs(v) / maxAbs,
          ),
        ),
      );
      doc.rect(ax + 0.15, ay + 0.15, bx - ax - 0.3, by - ay - 0.3, "F");
      if (sig?.local[iy * NX + ix]) {
        doc.setFillColor(20, 20, 20);
        for (let i = 1; i < 4; i++)
          for (let j = 1; j < 4; j++)
            doc.circle(
              ax + ((bx - ax) * i) / 4,
              ay + ((by - ay) * j) / 4,
              0.32,
              "F",
            );
      }
    }
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.18);
  for (const l of data.outline) {
    for (let i = 2; i < l.length; i += 2) {
      const [ax, ay] = P(l[i - 2]!, l[i - 1]!);
      const [bx, by] = P(l[i]!, l[i + 1]!);
      doc.line(ax, ay, bx, by);
    }
  }
  const frame = (b: BoxIdx, dash: boolean) => {
    const [ax, ay] = P(lon0 + d * b[1], lat0 + d * (b[0] + 1));
    const [bx, by] = P(lon0 + d * (b[1] + 1), lat0 + d * b[0]);
    doc.setDrawColor(10, 10, 10);
    doc.setLineWidth(0.6);
    if (dash) doc.setLineDashPattern([1.2, 0.8], 0);
    doc.rect(ax + 0.4, ay + 0.4, bx - ax - 0.8, by - ay - 0.8, "S");
    doc.setLineDashPattern([], 0);
  };
  let inc = 0,
    dec = 0;
  for (let c = 1; c < 80; c++) {
    if (diff[c]! > diff[inc]!) inc = c;
    if (diff[c]! < diff[dec]!) dec = c;
  }
  frame([Math.floor(inc / NX), inc % NX], false);
  frame([Math.floor(dec / NX), dec % NX], true);
  const c = data.meta.center;
  const ring = ringPolygon(c.lat, c.lon, sel.radiusKm, 96).map(([px, py]) => [
    x0 + px * s,
    y0 + py * s,
  ]);
  doc.setDrawColor(10, 10, 10);
  doc.setLineWidth(0.35);
  doc.setLineDashPattern([1.5, 1], 0);
  for (let i = 1; i < ring.length; i++)
    doc.line(ring[i - 1]![0]!, ring[i - 1]![1]!, ring[i]![0]!, ring[i]![1]!);
  doc.setLineDashPattern([], 0);
  const [cx, cy] = P(c.lon, c.lat);
  doc.setFillColor(207, 185, 145);
  doc.setDrawColor(10, 10, 10);
  doc.setLineWidth(0.25);
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5,
      r = i % 2 ? 0.9 : 2.1;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  doc.lines(
    pts.slice(1).map((p, i) => [p[0]! - pts[i]![0]!, p[1]! - pts[i]![1]!]),
    pts[0]![0],
    pts[0]![1],
    [1, 1],
    "FD",
    true,
  );
  // axes labels
  doc.setFont("times", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  for (const lat of [30, 35, 40, 45, 50]) {
    const [px, py] = P(-105, lat);
    doc.text(`${lat}°N`, px - 1, py + 1, { align: "right" });
  }
  for (const lon of [-105, -95, -85]) {
    const [px, py] = P(lon, 30);
    doc.text(`${-lon}°W`, px, py + 3.5, { align: "center" });
  }
}

function drawDivLegend(
  doc: JsPDF,
  x: number,
  y: number,
  w: number,
  max: number,
) {
  const n = 40;
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * 2 - 1;
    doc.setFillColor(
      ...rgb(
        lerpStops(t >= 0 ? [...PDF.div.pos] : [...PDF.div.neg], Math.abs(t)),
      ),
    );
    doc.rect(x + (i * w) / n, y, w / n + 0.05, 2.5, "F");
  }
  doc.setFont("times", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(sg(-max, 1), x - 1, y + 2.2, { align: "right" });
  doc.text(sg(max, 1), x + w + 1, y + 2.2);
  doc.text("change per year (B − A)", x + w / 2, y + 6, { align: "center" });
}

function drawHist(
  doc: JsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  hist: { edges: number[]; counts: number[] },
  obs: number,
  label: string,
  color: string,
) {
  const lo = Math.min(hist.edges[0]!, 0),
    hi = Math.max(hist.edges[hist.edges.length - 1]!, 0);
  const X = (v: number) => x + ((v - lo) / (hi - lo || 1)) * w;
  const cmax = Math.max(...hist.counts);
  doc.setFillColor(...rgb(color));
  hist.counts.forEach((c, i) => {
    const a = X(hist.edges[i]!),
      b = X(hist.edges[i + 1]!);
    const bh = (c / cmax) * (h - 8);
    doc.rect(a, y + h - 4 - bh, Math.max(0.1, b - a - 0.15), bh, "F");
  });
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.2);
  doc.line(x, y + h - 4, x + w, y + h - 4);
  doc.setLineWidth(0.4);
  doc.line(X(obs), y + 3, X(obs), y + h - 4);
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.line(X(0), y + 3, X(0), y + h - 4);
  doc.setLineDashPattern([], 0);
  doc.setFont("times", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(label, x, y + 2);
  doc.text(f(lo, 1), x, y + h, { align: "left" });
  doc.text(f(hi, 1), x + w, y + h, { align: "right" });
  if (X(0) - x > 8 && x + w - X(0) > 8)
    doc.text("0", X(0), y + h, { align: "center" });
}

function drawBars(
  doc: JsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  s: SeriesStats,
  sel: Selection,
) {
  const n = s.years.length;
  const ymax = Math.max(1, ...s.values) * 1.08;
  const L = 9;
  const bw = (w - L) / n;
  const Y = (v: number) => y + h - 5 - (v / ymax) * (h - 8);
  const inA = new Set(s.idxA),
    inB = new Set(s.idxB);
  doc.setFont("times", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  for (const t of [0, ymax / 2, ymax].map((v) => Math.round(v))) {
    doc.setDrawColor(215, 215, 215);
    doc.setLineWidth(0.1);
    doc.line(x + L, Y(t), x + w, Y(t));
    doc.text(String(t), x + L - 1.5, Y(t) + 1, { align: "right" });
  }
  s.values.forEach((v, i) => {
    const yr = s.years[i]!;
    const bx = x + L + i * bw;
    const excluded = sel.exclude2024 && yr === 2024;
    const col = inB.has(i) ? PDF.b : inA.has(i) ? PDF.a : "#c8c6c0";
    if (excluded) {
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.15);
      doc.rect(bx + 0.1, Y(v), bw - 0.2, Y(0) - Y(v), "S");
    } else {
      doc.setFillColor(...rgb(col));
      doc.rect(bx + 0.1, Y(v), Math.max(0.1, bw - 0.2), Y(0) - Y(v), "F");
    }
    if (yr % 10 === 0)
      doc.text(String(yr), bx + bw / 2, y + h, { align: "center" });
  });
  const mean = (
    idx: number[],
    m: { mean: number; ci95: [number, number] },
    col: string,
  ) => {
    if (!idx.length) return;
    const a = x + L + Math.min(...idx) * bw,
      b = x + L + (Math.max(...idx) + 1) * bw;
    doc.setDrawColor(...rgb(col));
    doc.setLineWidth(0.15);
    doc.setLineDashPattern([0.6, 0.6], 0);
    doc.line(a, Y(m.ci95[0]), b, Y(m.ci95[0]));
    doc.line(a, Y(m.ci95[1]), b, Y(m.ci95[1]));
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.5);
    doc.line(a, Y(m.mean), b, Y(m.mean));
  };
  mean(s.idxA, s.a, PDF.a);
  mean(s.idxB, s.b, PDF.b);
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.2);
  doc.line(x + L, Y(0), x + w, Y(0));
}
