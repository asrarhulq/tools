/**
 * ── Beam Designer — professional PDF calculation report ─────────────────────
 *
 * Framework-free (no React) generator that turns a solved {@link Beam} +
 * {@link BeamResult} into a premium, commercial-grade engineering-calculation
 * PDF using jsPDF + jspdf-autotable (both already dependencies). The intent is
 * that the output reads like the report a paid FE tool (RISA, SkyCiv, etc.)
 * would print: a branded cover, model/material/loads summaries, reaction &
 * equilibrium check, embedded SFD/BMD/deflection plots, the governing maxima,
 * and a documented set of assumptions + equations so the numbers are auditable.
 *
 * Design notes / invariants:
 *   • All solver quantities are strict SI base (m, N, N·m, Pa, m², m⁴). Nothing
 *     here re-derives physics — it only *formats* results via the `U.*` helpers
 *     and the section library, so the report can never disagree with the solver.
 *   • jsPDF colour setters get numeric (r,g,b) tuples, NEVER hex strings — hex
 *     is silently mis-parsed by some jsPDF builds. All palette values below are
 *     numeric `as const` triples spread with `...`.
 *   • Built for `noUncheckedIndexedAccess`: every array index is asserted with
 *     `!` where the surrounding logic guarantees presence, and division /
 *     indexing is otherwise guarded so a malformed result can't throw.
 *   • The whole thing is wrapped in try/catch and NEVER throws — a report is a
 *     convenience, not a correctness path; a failed export must not crash the UI.
 *   • Pagination is manual via `ensureSpace()` for free-form blocks (images,
 *     prose); autoTable paginates its own long tables. We continue after a table
 *     through a guarded cast to `doc.lastAutoTable.finalY`.
 *
 * Required branding (do not remove): the cover centres "A Product by Asrar ul
 * Haq" over "tools.asrarul.com", and every non-cover page footer centres
 * "A Product by Asrar ul Haq · tools.asrarul.com".
 * ────────────────────────────────────────────────────────────────────────────
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Beam, BeamResult, UnitSystem } from "../types";
import { sectionProps, SECTION_LABELS } from "./sections";
import * as U from "./units";

// ── Palette (numeric r,g,b — never hex to jsPDF setters) ─────────────────────
const BRAND = [37, 99, 235] as const; // blue-600
const BRAND_DARK = [30, 58, 138] as const; // blue-900
const INK = [23, 23, 30] as const;
const MUTED = [110, 110, 130] as const;
const DANGER = [220, 38, 38] as const; // red-600
const OK = [22, 163, 74] as const; // green-600
const LINE = [210, 214, 222] as const;

const MARGIN = 18;

export interface BeamReportOptions {
  units: UnitSystem;
  beamDiagram: string | null; // PNG data URL of the beam + loads canvas
  shearDiagram: string | null; // PNG data URL
  momentDiagram: string | null;
  deflectionDiagram: string | null;
  projectName?: string;
}

/**
 * Build the beam-analysis PDF and trigger a browser download. Never throws:
 * any failure is swallowed (best-effort convenience export).
 */
export function generateBeamReport(
  beam: Beam,
  result: BeamResult,
  opts: BeamReportOptions,
): void {
  try {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const u = opts.units;

    // 1 — Cover
    coverPage(doc, beam, opts, pageW, pageH);

    // 2 — Model summary
    doc.addPage();
    let y = sectionHeader(doc, "1.  Model Summary");
    y = modelSummary(doc, beam, result, u, y);

    // 3 — Material properties
    y = ensureSpace(doc, y, 70, pageH);
    y = sectionHeader(doc, "2.  Material Properties", y + 8);
    y = materialTable(doc, beam, u, y);

    // 4 — Supports & loads
    y = ensureSpace(doc, y, 70, pageH);
    y = sectionHeader(doc, "3.  Supports & Loads", y + 8);
    y = supportsTable(doc, beam, u, y);
    y = ensureSpace(doc, y, 40, pageH);
    y = loadsTable(doc, beam, u, y + 4);

    // 5 — Reactions & equilibrium
    y = ensureSpace(doc, y, 80, pageH);
    y = sectionHeader(doc, "4.  Reaction Forces & Equilibrium Check", y + 8);
    y = reactionsTable(doc, beam, result, u, y);

    // 6 — Diagrams
    doc.addPage();
    y = sectionHeader(doc, "5.  Analysis Diagrams");
    diagramsSection(doc, opts, pageW, pageH, y);

    // 7 — Maximum values & results
    doc.addPage();
    y = sectionHeader(doc, "6.  Maximum Values & Results");
    y = resultsSection(doc, result, u, pageW, y);

    // 8 — Assumptions & equations
    y = ensureSpace(doc, y, 90, pageH);
    y = sectionHeader(doc, "7.  Engineering Assumptions & Equations", y + 8);
    assumptionsSection(doc, pageW, y);

    // 9 — Footers on every page except the cover
    addFooters(doc, pageW, pageH);

    doc.save(
      `beam-analysis-${sanitize(beam.name || opts.projectName || "beam")}.pdf`,
    );
  } catch {
    // Never throw — a failed export must not crash the caller.
  }
}

// ── 1. Cover ────────────────────────────────────────────────────────────────

function coverPage(
  doc: jsPDF,
  beam: Beam,
  opts: BeamReportOptions,
  pageW: number,
  pageH: number,
): void {
  const u = opts.units;

  // Colored top band.
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 34, "F");
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 34, pageW, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("STRUCTURAL CALCULATION REPORT", MARGIN, 21);

  // Title.
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("Beam Analysis Report", MARGIN, 68);

  // Subtitle — beam / project name.
  const subtitle = opts.projectName
    ? `${opts.projectName} — ${beam.name}`
    : beam.name || "Untitled Beam";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(15);
  doc.setTextColor(...MUTED);
  doc.text(doc.splitTextToSize(subtitle, pageW - MARGIN * 2), MARGIN, 80);

  // Right-aligned info block.
  const infoRight = pageW - MARGIN;
  const infoLabelX = pageW - MARGIN - 62;
  let iy = 108;
  const info: Array<[string, string]> = [
    ["Date", new Date().toLocaleString()],
    ["Analysis method", "Euler-Bernoulli finite element"],
    [
      "Units",
      U.UNIT_LABELS[u].force +
        " · " +
        U.UNIT_LABELS[u].len +
        " · " +
        U.UNIT_LABELS[u].stress,
    ],
    ["Span length", U.fmtLength(beam.length, u)],
    ["Support configuration", supportConfigSummary(beam)],
  ];
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.4);
  doc.line(infoLabelX, iy - 6, infoRight, iy - 6);
  for (const [label, value] of info) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), infoLabelX, iy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    const wrapped = doc.splitTextToSize(value, infoRight - infoLabelX);
    doc.text(wrapped, infoRight, iy + 5, { align: "right" });
    iy += 5 + wrapped.length * 5 + 3;
  }

  // Bottom-centered branding (required).
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, pageH - 40, pageW - MARGIN, pageH - 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text("A Product by Asrar ul Haq", pageW / 2, pageH - 28, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND);
  doc.text("tools.asrarul.com", pageW / 2, pageH - 21, { align: "center" });
}

/** Infer a human support-configuration label from the support layout. */
function supportConfigSummary(beam: Beam): string {
  const supports = beam.supports;
  const n = supports.length;
  if (n === 0) return "Unsupported";
  const fixedCount = supports.filter((s) => s.type === "fixed").length;
  const verticalCount = supports.filter(
    (s) => s.type === "pin" || s.type === "roller",
  ).length;

  if (n === 1)
    return supports[0]!.type === "fixed" ? "Cantilever" : "Single support";
  // Cantilever: exactly one fixed support and nothing else vertical.
  if (fixedCount === 1 && verticalCount === 0 && n === 1) return "Cantilever";
  if (fixedCount === 1 && n === 1) return "Cantilever";
  // Propped cantilever: one fixed + one simple.
  if (fixedCount === 1 && verticalCount >= 1 && n === 2)
    return "Propped cantilever";
  // Fixed-fixed.
  if (fixedCount === 2 && n === 2) return "Fixed-fixed (built-in)";
  if (n === 2) return "Simply supported";
  return "Continuous";
}

// ── Section header + table helpers ───────────────────────────────────────────

function sectionHeader(doc: jsPDF, title: string, y = 24): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...BRAND);
  doc.text(title, MARGIN, y);
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 2.5, MARGIN + 48, y + 2.5);
  return y + 10;
}

/** Guarded read of autoTable's finalY to continue after a table. */
function lastFinalY(doc: jsPDF, fallback: number): number {
  const withTable = doc as jsPDF & { lastAutoTable?: { finalY?: number } };
  return withTable.lastAutoTable?.finalY ?? fallback;
}

/** Key/value striped table. */
function kvTable(
  doc: jsPDF,
  startY: number,
  rows: Array<[string, string]>,
  head: [string, string],
): number {
  autoTable(doc, {
    startY,
    margin: { left: MARGIN, right: MARGIN },
    head: [head],
    body: rows,
    theme: "striped",
    styles: { fontSize: 9.5, cellPadding: 2, textColor: [...INK] },
    headStyles: { fillColor: [...BRAND], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [244, 246, 250] },
    columnStyles: {
      0: { cellWidth: 74, textColor: [...MUTED], fontStyle: "bold" },
    },
  });
  return lastFinalY(doc, startY + 10);
}

/** Generic multi-column grid table. */
function gridTable(
  doc: jsPDF,
  startY: number,
  head: string[],
  body: string[][],
): number {
  autoTable(doc, {
    startY,
    margin: { left: MARGIN, right: MARGIN },
    head: [head],
    body,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2, textColor: [...INK] },
    headStyles: { fillColor: [...BRAND], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [244, 246, 250] },
  });
  return lastFinalY(doc, startY + 10);
}

/** Page-break helper: if `needed` mm won't fit, start a fresh page. */
function ensureSpace(
  doc: jsPDF,
  y: number,
  needed: number,
  pageH: number,
): number {
  if (y + needed > pageH - 20) {
    doc.addPage();
    return 24;
  }
  return y;
}

// ── 2. Model summary ─────────────────────────────────────────────────────────

function modelSummary(
  doc: jsPDF,
  beam: Beam,
  result: BeamResult,
  u: UnitSystem,
  y: number,
): number {
  const props = sectionProps(beam.section);
  const byType = countByType(beam);
  const dims = beam.section.dims;
  const dimStr = Object.entries(dims)
    .map(
      ([k, v]) =>
        `${k}=${U.dimFromSI(v, u).toFixed(u === "imperial" ? 2 : 1)}${U.UNIT_LABELS[u].dim}`,
    )
    .join(", ");

  return kvTable(
    doc,
    y,
    [
      ["Span length", U.fmtLength(beam.length, u)],
      ["Supports", supportCountSummary(byType)],
      ["Loads", `${beam.loads.length} (${loadCountSummary(beam)})`],
      ["Material", beam.material.name],
      ["Section type", SECTION_LABELS[beam.section.type]],
      ["Section dimensions", dimStr || "—"],
      ["Cross-section area", fmtArea(props.area, u)],
      ["Second moment of area, I", fmtInertia(props.I, u)],
      ["Section modulus, S", fmtSectionModulus(props.S, u)],
      ["Extreme-fibre distance, c", U.fmtSmallLength(props.c, u)],
      ["Radius of gyration, r", U.fmtSmallLength(props.r, u)],
      ["Total mass", U.fmtMass(result.mass, u)],
      ["Estimated cost", formatCost(result.cost)],
    ],
    ["Model Parameter", "Value"],
  );
}

function countByType(beam: Beam): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of beam.supports) out[s.type] = (out[s.type] ?? 0) + 1;
  return out;
}

function supportCountSummary(byType: Record<string, number>): string {
  const total = Object.values(byType).reduce((a, b) => a + b, 0);
  const parts = Object.entries(byType).map(([t, n]) => `${n} ${t}`);
  return parts.length ? `${total} (${parts.join(", ")})` : "0";
}

function loadCountSummary(beam: Beam): string {
  const byType: Record<string, number> = {};
  for (const l of beam.loads) byType[l.type] = (byType[l.type] ?? 0) + 1;
  const parts = Object.entries(byType).map(([t, n]) => `${n} ${t}`);
  return parts.length ? parts.join(", ") : "none";
}

// ── 3. Material properties ───────────────────────────────────────────────────

function materialTable(
  doc: jsPDF,
  beam: Beam,
  u: UnitSystem,
  y: number,
): number {
  const m = beam.material;
  const density =
    u === "imperial"
      ? `${(m.density * 0.062428).toFixed(1)} lb/ft³`
      : `${m.density.toFixed(0)} kg/m³`;
  return kvTable(
    doc,
    y,
    [
      ["Material", m.name],
      ["Young's modulus, E", U.fmtStress(m.E, u, 0)],
      ["Poisson ratio, ν", m.nu.toFixed(2)],
      ["Yield strength, σy", U.fmtStress(m.yield, u)],
      ["Density, ρ", density],
      ["Thermal expansion, α", `${(m.alpha * 1e6).toFixed(1)} µm/m·°C`],
    ],
    ["Material Property", "Value"],
  );
}

// ── 4. Supports & loads ──────────────────────────────────────────────────────

function supportsTable(
  doc: jsPDF,
  beam: Beam,
  u: UnitSystem,
  y: number,
): number {
  if (beam.supports.length === 0) {
    return note(doc, "No supports defined.", y);
  }
  const body = beam.supports.map((s, i) => {
    const t =
      s.type === "spring" && s.springK != null
        ? `spring (k=${(s.springK / 1000).toFixed(1)} kN/m)`
        : s.type;
    return [`S${i + 1}`, U.fmtLength(s.x, u), t];
  });
  return gridTable(doc, y, ["Support", "Position (from left)", "Type"], body);
}

function loadsTable(doc: jsPDF, beam: Beam, u: UnitSystem, y: number): number {
  if (beam.loads.length === 0) {
    return note(doc, "No loads applied.", y);
  }
  const body = beam.loads.map((l, i) => {
    let magnitude: string;
    switch (l.type) {
      case "point":
        magnitude = U.fmtForce(l.magnitude, u);
        break;
      case "moment":
        magnitude = U.fmtMoment(l.magnitude, u);
        break;
      case "trapezoidal":
        magnitude = `${U.fmtDistLoad(l.magnitude, u)} → ${U.fmtDistLoad(l.magnitude2 ?? l.magnitude, u)}`;
        break;
      case "triangular":
        magnitude = `0 → ${U.fmtDistLoad(l.magnitude2 ?? l.magnitude, u)}`;
        break;
      case "udl":
      default:
        magnitude = U.fmtDistLoad(l.magnitude, u);
        break;
    }
    const spans = l.type === "point" || l.type === "moment";
    return [
      `L${i + 1}`,
      capitalize(l.type),
      U.fmtLength(l.x, u),
      spans ? "—" : U.fmtLength(l.length, u),
      magnitude,
    ];
  });
  return gridTable(
    doc,
    y,
    ["Load", "Type", "Position", "Length", "Magnitude"],
    body,
  );
}

// ── 5. Reactions & equilibrium ───────────────────────────────────────────────

function reactionsTable(
  doc: jsPDF,
  beam: Beam,
  result: BeamResult,
  u: UnitSystem,
  y: number,
): number {
  const body: string[][] = result.reactions.map((r, i) => {
    const support = beam.supports.find((s) => s.id === r.supportId);
    const idx = support ? beam.supports.indexOf(support) : i;
    return [
      `S${idx + 1}`,
      U.fmtLength(r.x, u),
      U.fmtForce(r.Fy, u),
      U.fmtMoment(r.M, u),
    ];
  });

  const sumReactions = result.reactions.reduce((a, r) => a + r.Fy, 0);
  const appliedVertical = totalAppliedVerticalLoad(beam); // downward negative
  // Equilibrium: ΣFy_reactions + ΣFy_applied = 0  →  residual should be ~0.
  const residual = sumReactions + appliedVertical;
  const scale = Math.max(Math.abs(sumReactions), Math.abs(appliedVertical), 1);
  const balanced = Math.abs(residual) < 1e-3 * scale + 1e-6;

  y = gridTable(
    doc,
    y,
    ["Support", "Position", "Vertical reaction, Fy", "Moment, M"],
    body,
  );

  // Equilibrium check block.
  y = ensureSpace(doc, y, 34, doc.internal.pageSize.getHeight());
  autoTable(doc, {
    startY: y + 4,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Vertical Equilibrium Check (ΣFy = 0)", "Value"]],
    body: [
      ["Σ reactions (upward +)", U.fmtForce(sumReactions, u)],
      ["Σ applied vertical loads", U.fmtForce(appliedVertical, u)],
      ["Residual (should be 0)", U.fmtForce(residual, u)],
      ["Equilibrium satisfied", balanced ? "Yes  (OK)" : "No  (check)"],
    ],
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 2, textColor: [...INK] },
    headStyles: {
      fillColor: [...BRAND_DARK],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 90, fontStyle: "bold", textColor: [...MUTED] },
    },
    didParseCell: (data) => {
      if (
        data.section === "body" &&
        data.row.index === 3 &&
        data.column.index === 1
      ) {
        data.cell.styles.textColor = balanced ? [...OK] : [...DANGER];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
  return lastFinalY(doc, y + 14);
}

/**
 * Total applied vertical load, downward negative (N). Point → magnitude;
 * UDL → magnitude × length; triangular/trapezoidal → average intensity × length.
 * Moments contribute no net vertical force.
 */
function totalAppliedVerticalLoad(beam: Beam): number {
  let total = 0;
  for (const l of beam.loads) {
    switch (l.type) {
      case "point":
        total += l.magnitude;
        break;
      case "udl":
        total += l.magnitude * l.length;
        break;
      case "triangular":
        total += (0 + (l.magnitude2 ?? l.magnitude)) * 0.5 * l.length;
        break;
      case "trapezoidal":
        total += (l.magnitude + (l.magnitude2 ?? l.magnitude)) * 0.5 * l.length;
        break;
      case "moment":
      default:
        break;
    }
  }
  return total;
}

// ── 6. Diagrams ──────────────────────────────────────────────────────────────

function diagramsSection(
  doc: jsPDF,
  opts: BeamReportOptions,
  pageW: number,
  pageH: number,
  y: number,
): void {
  const items: Array<[string, string, string | null]> = [
    [
      "Beam & Load Configuration",
      "Model geometry, supports and applied loads.",
      opts.beamDiagram,
    ],
    [
      "Shear Force Diagram (SFD)",
      "Internal shear force V along the span.",
      opts.shearDiagram,
    ],
    [
      "Bending Moment Diagram (BMD)",
      "Internal bending moment M along the span.",
      opts.momentDiagram,
    ],
    [
      "Deflection Diagram",
      "Transverse deflection v along the span.",
      opts.deflectionDiagram,
    ],
  ];

  const boxW = pageW - MARGIN * 2;
  const boxH = 78; // ~2 per page

  let cursor = y;
  for (const [title, caption, img] of items) {
    cursor = ensureSpace(doc, cursor, boxH + 18, pageH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(title, MARGIN, cursor + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(caption, MARGIN, cursor + 9);
    framedImage(doc, img, MARGIN, cursor + 12, boxW, boxH);
    cursor += boxH + 22;
  }
}

function framedImage(
  doc: jsPDF,
  image: string | null,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2, "S");
  if (image) {
    try {
      doc.addImage(image, "PNG", x + 3, y + 3, w - 6, h - 6, undefined, "FAST");
      return;
    } catch {
      // fall through to placeholder note
    }
  }
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("Diagram not captured", x + w / 2, y + h / 2, { align: "center" });
  doc.setFont("helvetica", "normal");
}

// ── 7. Maximum values & results ──────────────────────────────────────────────

function resultsSection(
  doc: jsPDF,
  result: BeamResult,
  u: UnitSystem,
  pageW: number,
  y: number,
): number {
  if (!result.stable) {
    // Prominent red warning box.
    doc.setFillColor(254, 226, 226); // red-100
    doc.setDrawColor(...DANGER);
    doc.setLineWidth(0.6);
    doc.roundedRect(MARGIN, y, pageW - MARGIN * 2, 16, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...DANGER);
    doc.text("BEAM UNSTABLE — results not valid", pageW / 2, y + 10, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    y += 24;
  }

  const fos = result.factorOfSafety;
  const fosStr = !isFinite(fos) || fos >= 1e6 ? "∞" : fos.toFixed(2);

  const body: string[][] = [
    ["Maximum shear force", U.fmtForce(result.maxShear, u)],
    ["Maximum bending moment", U.fmtMoment(result.maxMoment, u)],
    ["Maximum bending stress", U.fmtStress(result.maxBendingStress, u)],
    ["Maximum shear stress", U.fmtStress(result.maxShearStress, u)],
    ["Maximum von Mises stress", U.fmtStress(result.maxVonMises, u)],
    ["Maximum deflection", U.fmtSmallLength(result.maxDeflection, u, 3)],
    ["Maximum slope", `${result.maxSlope.toFixed(4)} rad`],
    ["Factor of safety", fosStr],
    ["Euler buckling load, Pcr", U.fmtForce(result.bucklingLoad, u)],
    ["Natural frequency, f1", U.fmtFreq(result.naturalFrequency)],
  ];

  return gridTable(doc, y, ["Governing Result", "Value"], body);
}

// ── 8. Assumptions & equations ───────────────────────────────────────────────

function assumptionsSection(doc: jsPDF, pageW: number, y: number): number {
  const assumptions = [
    "Euler-Bernoulli beam theory: plane sections remain plane, deflections are small, and the material is linear-elastic and isotropic.",
    "Transverse shear deformation is neglected (slender-beam assumption; Timoshenko effects not included).",
    "The cross-section is prismatic (constant along the span) and loaded in a single principal plane of bending.",
    "All loads and reactions act in-plane; out-of-plane, torsional, and second-order (P-Δ) effects are not considered.",
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text("Assumptions", MARGIN, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  for (const a of assumptions) {
    const wrapped = doc.splitTextToSize(`•  ${a}`, pageW - MARGIN * 2 - 2);
    doc.text(wrapped, MARGIN + 2, y);
    y += wrapped.length * 4.6 + 2;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text("Key equations", MARGIN, y);
  y += 6;

  const equations = [
    "Bending stress:            sigma = M*c/I = M/S",
    "Governing equation:        EI d^4v/dx^4 = w(x)",
    "Moment-curvature:          M = EI d^2v/dx^2",
    "Slope:                     theta = dv/dx",
    "Shear:                     V = dM/dx",
    "Factor of safety:          FoS = sigma_yield / sigma_vonMises",
    "Euler buckling:            P_cr = pi^2 * EI / L^2",
  ];
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_DARK);
  for (const eq of equations) {
    doc.text(eq, MARGIN + 2, y);
    y += 5.2;
  }
  doc.setFont("helvetica", "normal");
  return y;
}

// ── 9. Footers ───────────────────────────────────────────────────────────────

function addFooters(doc: jsPDF, pageW: number, pageH: number): void {
  const pages = doc.getNumberOfPages();
  for (let i = 2; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, pageH - 12, pageW - MARGIN, pageH - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Beam Analysis Report", MARGIN, pageH - 8);
    doc.setFont("helvetica", "bold");
    doc.text(
      "A Product by Asrar ul Haq · tools.asrarul.com",
      pageW / 2,
      pageH - 8,
      { align: "center" },
    );
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${i} of ${pages}`, pageW - MARGIN, pageH - 8, {
      align: "right",
    });
  }
}

// ── Small formatting utilities ───────────────────────────────────────────────

/** Cross-section area: mm² (SI/metric) or in² (imperial). */
function fmtArea(m2: number, u: UnitSystem): string {
  return u === "imperial"
    ? `${(m2 * 1550.0031).toFixed(2)} in²`
    : `${(m2 * 1e6).toFixed(1)} mm²`;
}

/** Second moment of area I: mm⁴ (SI/metric) or in⁴ (imperial). */
function fmtInertia(m4: number, u: UnitSystem): string {
  if (u === "imperial") return `${(m4 * 2402509.61).toFixed(3)} in⁴`;
  const mm4 = m4 * 1e12; // m⁴ → mm⁴
  return `${formatBig(mm4)} mm⁴`;
}

/** Section modulus S: mm³ (SI/metric) or in³ (imperial). */
function fmtSectionModulus(m3: number, u: UnitSystem): string {
  if (u === "imperial") return `${(m3 * 61023.744).toFixed(3)} in³`;
  return `${formatBig(m3 * 1e9)} mm³`; // m³ → mm³
}

/** Readable large-number formatting with thousands separators. */
function formatBig(n: number): string {
  if (!isFinite(n)) return "—";
  if (Math.abs(n) >= 1e6) return n.toExponential(3);
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function formatCost(cost: number): string {
  if (!isFinite(cost)) return "—";
  return `$${cost.toFixed(2)}`;
}

function note(doc: jsPDF, text: string, y: number): number {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(text, MARGIN, y + 4);
  doc.setFont("helvetica", "normal");
  return y + 10;
}

function capitalize(s: string): string {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Filename-safe slug from the beam/project name. */
function sanitize(name: string): string {
  return (
    name
      .trim()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "beam"
  );
}
