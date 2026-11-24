import type { jsPDF as JsPDF } from "jspdf";
import type { AlleyData, BoxIdx, Selection } from "./types";
import type { FieldSigResult } from "./stats";
import type { Analysis, SeriesStats } from "../state/analysis";
import {
  NX,
  NY,
  boxShort,
  measureLabel,
  rangeLabel,
  seasonLabel,
} from "./data";
import { MAP_H, MAP_W, project, ringPolygon } from "./geo";
import { PDF, lerpStops } from "./colors";
import { PAPER_CREDIT, PROJECT, REFERENCES } from "../config";

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
    const lw = 52,
      lh = (lw * 225) / 1257;
    doc.addImage(logo, "PNG", (W - lw) / 2, y, lw, lh);
    y += lh + 8;
  }
  font(17, "bold");
  doc.text(PROJECT.title, W / 2, y, { align: "center" });
  y += 6.5;
  font(11, "italic");
  doc.text(PROJECT.subtitle, W / 2, y, { align: "center" });
  y += 7;
  font(12, "bold");
  doc.text(PROJECT.author, W / 2, y, { align: "center" });
  y += 5.5;
  font(10.5);
  for (const l of [
    `${PROJECT.courseLine} · Instructor: ${PROJECT.instructor}`,
    `${PROJECT.department}, ${PROJECT.university}`,
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  ]) {
    doc.text(l, W / 2, y, { align: "center" });
    y += 4.8;
  }
  y += 4;

  // credit box
  font(9.5);
  const credit = doc.splitTextToSize(
    `Based on: ${PAPER_CREDIT.authors} (2016), "${PAPER_CREDIT.title}," ${PAPER_CREDIT.journal}, doi:${PAPER_CREDIT.doi}. ${PAPER_CREDIT.note}`,
    TW - 8,
  ) as string[];
  const ch = credit.length * 4 + 4;
  doc.setFillColor(245, 243, 238);
  doc.setDrawColor(207, 185, 145);
  doc.setLineWidth(0.8);
  doc.rect(M, y, TW, ch, "F");
  doc.line(M, y, M, y + ch);
  doc.text(credit, M + 4, y + 5);
  y += ch + 7;

  // ── Summary ──────────────────────────────────────────────────────────
  const rows = data.validation;
  const comp = rows.filter((r) => r.diff_pct !== null);
  const close = comp.filter((r) => Math.abs(r.diff_pct!) <= 10).length;
  const x24 = data.extension.thru2024,
    x23 = data.extension.thru2023;
  heading("Summary");
  for (const s of [
    `1. Our analysis. Starting from the raw NOAA tornado record, our own code finds the same eastward shift: tornado activity fell in Oklahoma/Texas and rose in Tennessee/Alabama between 1954–83 and 1984–2013.`,
    `2. Check. ${close} of ${comp.length} numbers published by ${PAPER_CREDIT.short} are matched within 10%, and the field-significance test gives the same verdict (real shift).`,
    `3. After 2013. With the same method, the shift is still there in 2014–2024 (east box ${f(x24.east_west.III.east, 1)} vs west box ${f(x24.east_west.III.west, 1)} tornadoes/yr) but it has not grown. Leaving out the record year 2024 gives ${f(x23.east_west.III.east, 1)} vs ${f(x23.east_west.III.west, 1)}.`,
  ])
    para(s, 10.5, "normal", 2);

  // ── 1. Our analysis ──────────────────────────────────────────────────
  doc.addPage();
  y = M;
  heading("1. Our analysis");
  para(
    `${unit}, ${seasonLabel(sel.season).toLowerCase()}: ${B} compared with ${A}.`,
    10.5,
    "normal",
    2,
  );
  const mapW = TW * 0.78,
    mapH = (mapW * MAP_H) / MAP_W;
  drawMap(doc, data, sel, g.diff, sig ?? null, (W - mapW) / 2, y, mapW);
  y += mapH + 3;
  drawDivLegend(doc, (W - 80) / 2, y, 80, Math.max(...g.diff.map(Math.abs)));
  y += 9;
  caption(
    "Figure 1. Change per year in each 2.5° box (red = more, blue = fewer). Dots = significant change. Star = West Lafayette.",
  );
  if (sig)
    para(
      `${f(sig.N, 0)}% of the boxes changed significantly; chance alone would give up to ${f(sig.threshold, 0)}%. The shift is ${sig.fieldSignificant ? "real (field significant)" : "not distinguishable from chance"}.`,
    );
  table(
    ["Season", "Biggest rise / yr", "Biggest drop / yr", "Real shift?"],
    seasonal.map((r) => [
      seasonLabel(r.season),
      `${sg(r.incVal, 1)}  (${boxShort(data, r.inc)})`,
      `${sg(r.decVal, 1)}  (${boxShort(data, r.dec)})`,
      sigByTag[r.season]
        ? sigByTag[r.season]!.fieldSignificant
          ? "yes"
          : "no"
        : "-",
    ]),
    { fontSize: 8.5 },
  );

  // ── 2. Check against the paper ───────────────────────────────────────
  doc.addPage();
  y = M;
  heading(`2. Check against ${PAPER_CREDIT.short}`);
  para(
    `${close} of ${comp.length} published numbers within 10%. Larger gaps are listed, not hidden; NOAA has revised the database since 2016.`,
    10.5,
    "normal",
    2,
  );
  table(
    ["Published number", "Paper", "Ours", "Diff."],
    rows.map((r) => [
      `${r.group}: ${r.what}`,
      r.paper,
      r.ours,
      r.diff_pct === null
        ? ""
        : `${r.diff_pct > 0 ? "+" : ""}${f(r.diff_pct, 0)}%`,
    ]),
    { fontSize: 8, colW: [TW - 60, 20, 20, 20] },
  );

  // ── 3. After 2013 ────────────────────────────────────────────────────
  doc.addPage();
  y = M;
  heading("3. Same method after 2013");
  const ahead = (r: { ci99: number[] }) =>
    r.ci99[0]! > 0 ? "yes" : "not quite";
  table(
    ["(E)F1+ tornadoes per year", "2014–2024", "2014–2023"],
    [
      [
        "East box (central Tennessee), 1954–83 / 1984–2013",
        `${f(x24.east_west.I.east, 1)} / ${f(x24.east_west.II.east, 1)}`,
        "same",
      ],
      [
        "East box, 2014 onward",
        f(x24.east_west.III.east, 1),
        f(x23.east_west.III.east, 1),
      ],
      [
        "West box (southern Oklahoma), 1954–83 / 1984–2013",
        `${f(x24.east_west.I.west, 1)} / ${f(x24.east_west.II.west, 1)}`,
        "same",
      ],
      [
        "West box, 2014 onward",
        f(x24.east_west.III.west, 1),
        f(x23.east_west.III.west, 1),
      ],
      [
        "East still ahead? (99% confidence)",
        ahead(x24.east_west.III),
        ahead(x23.east_west.III),
      ],
      [
        "Map still differs from 1954–83? (field test)",
        x24.field_sig_III_vs_I.f1.field_significant ? "yes" : "no",
        x23.field_sig_III_vs_I.f1.field_significant ? "yes" : "no",
      ],
    ],
    { fontSize: 9, colW: [TW - 60, 30, 30] },
  );
  caption(
    `Only ${x24.n_years} years so far, so this is a first look. 2024 was a record year (943 (E)F1+ tornadoes).`,
  );

  heading(`4. Near Purdue (within ${sel.radiusKm} km of West Lafayette)`);
  drawBars(doc, M, y, TW, 46, ring, sel);
  y += 50;
  caption(
    `Figure 2. ${unit} per year. Blue = ${A}, orange = ${B}; lines = averages.`,
  );
  para(
    `Average ${f(ring.a.mean, 1)} per year in ${A} and ${f(ring.b.mean, 1)} in ${B} (change ${sg(ring.diff.diff, 1)}; ${ring.diff.ci95[0] > 0 || ring.diff.ci95[1] < 0 ? "significant" : "not significant"} at 95%).`,
  );

  heading("Method");
  for (const s of [
    "Data: NOAA Storm Prediction Center tornado tracks, 1954–2024, (E)F1 and stronger.",
    "Grid: 2.5° boxes over 30–50°N, 80–105°W; a tornado counts in every box its straight path touches.",
    "Field test: block bootstrap (5-year blocks, 10 000 runs) with a Monte Carlo threshold, alpha = 0.05.",
    `All following ${PAPER_CREDIT.short}; our code is independent and checked in Section 2.`,
  ])
    para(`• ${s}`, 9.5, "normal", 1);

  heading("References");
  font(9);
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
      `${PROJECT.author} · ${PROJECT.courseLine}, ${PROJECT.university} · method: ${PAPER_CREDIT.short}`,
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
