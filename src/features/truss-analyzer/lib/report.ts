import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Truss, AnalysisResult, UnitSystem, NodeResult } from "../types";
import { getMaterial } from "./materials";
import * as U from "./units";

/**
 * ── Truss Analysis Studio — PDF calculation report ───────────────────────────
 * Framework-free (no React). Builds a professional, multi-section engineering
 * calculation document for a planar truss analysed by the direct-stiffness
 * (matrix) method, then triggers a client-side download via `doc.save(...)`.
 *
 * Why this shape: an engineering "calc" is a legal/QA artifact. It has to read
 * like one — a title block with method + determinacy, a captured geometry
 * figure, model/material/loading tables, reactions with an equilibrium check,
 * the governing member-force table (critical members first), deflections,
 * scores, and an explicit statement of assumptions + the governing equations.
 * Reviewers scan for the equilibrium tick and the governing FoS, so those are
 * called out deliberately.
 *
 * Layout: A4 portrait, mm units, ~18 mm margins. We track a running `y` cursor
 * and hand off to a page-break helper (`ensureSpace`) before any block that
 * would overflow. autoTable paginates its own long tables; we read its
 * `finalY` (via a guarded cast — it isn't in jsPDF's public typings) to resume
 * flowing content after each table.
 *
 * Colours are always numeric (r,g,b) — jsPDF's `setTextColor`/`setFillColor`
 * accept hex strings too, but we keep to tuples so `noUncheckedIndexedAccess`
 * and the spread-into-setters idiom stay uniform. jsPDF core fonts can't render
 * real math, so equations are written as clear ASCII text.
 *
 * The report never throws on odd input (empty / unsolved truss): every lookup
 * and reduce is guarded so a partial model still produces a (clearly-labelled)
 * document instead of crashing the export.
 * ────────────────────────────────────────────────────────────────────────────
 */

const BRAND = [37, 99, 235] as const; // blue-600
const INK = [23, 23, 30] as const;
const MUTED = [110, 110, 130] as const;
const TENSION = [30, 64, 175] as const; // blue-800
const COMPRESSION = [185, 28, 28] as const; // red-700
const WARN_BG = [254, 226, 226] as const; // red-100
const WARN_INK = [153, 27, 27] as const; // red-800

const MARGIN = 18;

export interface TrussReportOptions {
  units: UnitSystem;
  /** PNG data URL of the truss canvas, may be null. */
  diagramImage: string | null;
}

/** Build the truss-analysis PDF and trigger a download. Never throws. */
export function generateTrussReport(
  truss: Truss,
  result: AnalysisResult,
  opts: TrussReportOptions,
): void {
  try {
    buildReport(truss, result, opts);
  } catch {
    // A report is never worth crashing the app over. Swallow and no-op.
  }
}

function buildReport(
  truss: Truss,
  result: AnalysisResult,
  opts: TrussReportOptions,
): void {
  const { units } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── 1. Cover / title block ─────────────────────────────────────────────
  coverPage(doc, truss, result, opts, pageW, pageH);

  // ── 2. Truss diagram ───────────────────────────────────────────────────
  doc.addPage();
  let y = sectionHeader(doc, "Truss Diagram", MARGIN);
  y = diagramSection(doc, opts, pageW, y);

  // ── 3. Model summary ───────────────────────────────────────────────────
  y = ensureSpace(doc, y, 90, pageH);
  y = sectionHeader(doc, "Model Summary", MARGIN, y + 8);
  y = modelSummary(doc, truss, result, units, y);

  // ── 4. Material & section properties ───────────────────────────────────
  y = ensureSpace(doc, y, 70, pageH);
  y = sectionHeader(doc, "Material & Section Properties", MARGIN, y + 8);
  y = materialSection(doc, truss, units, y);

  // ── 5. Loading & supports ──────────────────────────────────────────────
  doc.addPage();
  y = sectionHeader(doc, "Loading & Supports", MARGIN);
  y = loadingSection(doc, truss, result, units, y, pageH);

  // ── 6. Reaction forces ─────────────────────────────────────────────────
  y = ensureSpace(doc, y, 90, pageH);
  y = sectionHeader(doc, "Reaction Forces & Equilibrium", MARGIN, y + 8);
  y = reactionsSection(doc, truss, result, units, y);

  // ── 7. Member force results ────────────────────────────────────────────
  doc.addPage();
  y = sectionHeader(doc, "Member Force Results", MARGIN);
  y = memberForceSection(doc, truss, result, units, y);

  // ── 8. Deflection results ──────────────────────────────────────────────
  y = ensureSpace(doc, y, 80, pageH);
  y = sectionHeader(doc, "Deflection Results", MARGIN, y + 8);
  y = deflectionSection(doc, result, units, y);

  // ── 9. Governing results / scores ──────────────────────────────────────
  y = ensureSpace(doc, y, 90, pageH);
  y = sectionHeader(doc, "Governing Results & Scores", MARGIN, y + 8);
  y = governingSection(doc, result, units, y, pageW, pageH);

  // ── 10. Assumptions & equations ────────────────────────────────────────
  doc.addPage();
  y = sectionHeader(doc, "Assumptions & Equations", MARGIN);
  assumptionsSection(doc, y, pageW);

  // ── 11. Footers on every page except the cover ─────────────────────────
  addFooters(doc, pageW, pageH);

  doc.save(`truss-analysis-${sanitize(truss.name)}.pdf`);
}

// ── 1. Cover ─────────────────────────────────────────────────────────────────

function coverPage(
  doc: jsPDF,
  truss: Truss,
  result: AnalysisResult,
  opts: TrussReportOptions,
  pageW: number,
  pageH: number,
): void {
  // Thin coloured top band.
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 6, "F");

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Truss Analysis Report", MARGIN, 46);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...MUTED);
  const subtitle = truss.name?.trim() ? truss.name : "Untitled Truss";
  doc.text(doc.splitTextToSize(subtitle, pageW - MARGIN * 2), MARGIN, 56);

  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, 62, pageW - MARGIN, 62);

  // Right-aligned info block.
  const infoRight = pageW - MARGIN;
  const infoY = 80;
  const rows: Array<[string, string]> = [
    ["Date", new Date().toLocaleString()],
    ["Analysis method", "Direct stiffness (matrix) method"],
    [
      "Units",
      opts.units === "si" ? "SI (mm, N, MPa)" : "Imperial (in, lb, ksi)",
    ],
    ["Determinacy", determinacyLabel(result)],
    ["Stability", result.stable ? "Stable" : "UNSTABLE"],
  ];
  doc.setFontSize(10.5);
  rows.forEach(([label, value], i) => {
    const ry = infoY + i * 8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(`${label}:`, infoRight, ry, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(value, infoRight, ry + 4.5, { align: "right" });
  });

  // A few headline figures on the left as a light "at a glance" panel.
  const glanceY = 80;
  const glance: Array<[string, string]> = [
    ["Joints", String(truss.nodes.length)],
    ["Members", String(truss.members.length)],
    ["Applied loads", String(truss.loads.length)],
    ["Governing FoS", isFinite(result.minFoS) ? result.minFoS.toFixed(2) : "∞"],
    ["Total mass", U.fmtMass(result.totalMass, opts.units)],
  ];
  doc.setFontSize(10.5);
  glance.forEach(([label, value], i) => {
    const gy = glanceY + i * 8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(`${label}:`, MARGIN, gy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(value, MARGIN + 34, gy);
  });

  // Cover branding, centered at the bottom.
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, pageH - 24, pageW - MARGIN, pageH - 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text("A Product by Asrar ul Haq", pageW / 2, pageH - 16, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("tools.asrarul.com", pageW / 2, pageH - 10, { align: "center" });
}

function determinacyLabel(result: AnalysisResult): string {
  const d = result.determinacy;
  if (d === 0) return "Statically determinate";
  if (d > 0) return `Statically indeterminate (degree ${d})`;
  return `Unstable / under-constrained (degree ${d})`;
}

// ── 2. Diagram ─────────────────────────────────────────────────────────────

function diagramSection(
  doc: jsPDF,
  opts: TrussReportOptions,
  pageW: number,
  y: number,
): number {
  const boxX = MARGIN;
  const boxW = pageW - MARGIN * 2;
  const boxH = 100;
  doc.setDrawColor(210);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, y, boxW, boxH, 2, 2, "S");

  if (opts.diagramImage) {
    try {
      doc.addImage(
        opts.diagramImage,
        "PNG",
        boxX + 4,
        y + 4,
        boxW - 8,
        boxH - 8,
        undefined,
        "FAST",
      );
    } catch {
      placeholder(doc, boxX, y, boxW, boxH, "Diagram could not be embedded");
    }
  } else {
    placeholder(doc, boxX, y, boxW, boxH, "No diagram captured");
  }

  const capY = y + boxH + 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("Figure 1 — Truss geometry, supports, and loads", pageW / 2, capY, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  return capY + 4;
}

function placeholder(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
): void {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text(text, x + w / 2, y + h / 2, { align: "center" });
}

// ── 3. Model summary ───────────────────────────────────────────────────────

function modelSummary(
  doc: jsPDF,
  truss: Truss,
  result: AnalysisResult,
  units: UnitSystem,
  y: number,
): number {
  const nodes = truss.nodes;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const span = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
  const height = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;

  const supportCounts = new Map<string, number>();
  for (const n of nodes) {
    if (n.support === "none") continue;
    supportCounts.set(n.support, (supportCounts.get(n.support) ?? 0) + 1);
  }
  const supportSummary = supportCounts.size
    ? [...supportCounts.entries()]
        .map(([k, v]) => `${v}× ${supportLabel(k)}`)
        .join(", ")
    : "None";

  const defaultMat = getMaterial(truss.defaultMaterialId);

  return kvTable(
    doc,
    y,
    [
      ["Joints (nodes)", String(nodes.length)],
      ["Members", String(truss.members.length)],
      ["Supports", supportSummary],
      ["Applied loads", String(truss.loads.length)],
      ["Total span (X)", U.fmtLength(span, units)],
      ["Overall height (Y)", U.fmtLength(height, units)],
      ["Total structure mass", U.fmtMass(result.totalMass, units)],
      ["Default material", defaultMat.name],
    ],
    ["Model Property", "Value"],
  );
}

function supportLabel(t: string): string {
  switch (t) {
    case "pin":
      return "Pin";
    case "roller-x":
      return "Roller (X-free)";
    case "roller-y":
      return "Roller (Y-free)";
    case "fixed":
      return "Fixed";
    default:
      return t;
  }
}

// ── 4. Material & section ──────────────────────────────────────────────────

function materialSection(
  doc: jsPDF,
  truss: Truss,
  units: UnitSystem,
  y: number,
): number {
  const ids = new Set<string>();
  ids.add(truss.defaultMaterialId);
  for (const m of truss.members) ids.add(m.materialId);

  const rows: string[][] = [...ids].map((id) => {
    const mat = getMaterial(id);
    return [
      mat.name,
      U.fmtStress(mat.E, units),
      U.fmtStress(mat.yield, units),
      `${mat.density.toFixed(0)} kg/m³`,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Material", "Young's modulus (E)", "Yield strength", "Density"]],
    body: rows.length ? rows : [["—", "—", "—", "—"]],
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [...BRAND], textColor: 255 },
  });
  y = finalY(doc, y + 10);

  // Section area note.
  const areas = new Set<number>();
  areas.add(truss.defaultArea);
  for (const m of truss.members) areas.add(m.area);
  const areaText = [...areas]
    .filter((a) => a > 0)
    .map((a) => U.fmtArea(a, units))
    .join(", ");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(`Cross-sectional area(s) in use: ${areaText || "—"}`, MARGIN, y + 4);
  doc.setFont("helvetica", "normal");
  return y + 8;
}

// ── 5. Loading & supports ──────────────────────────────────────────────────

function loadingSection(
  doc: jsPDF,
  truss: Truss,
  result: AnalysisResult,
  units: UnitSystem,
  y: number,
  pageH: number,
): number {
  const byNode = nodeResultMap(result);

  // Supports table (with reactions if available).
  const supportRows = truss.nodes
    .filter((n) => n.support !== "none")
    .map((n) => {
      const nr = byNode.get(n.id);
      return [
        n.id,
        supportLabel(n.support),
        nr ? U.fmtForce(nr.rx, units) : "—",
        nr ? U.fmtForce(nr.ry, units) : "—",
      ];
    });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("Supports", MARGIN, y + 2);
  doc.setFont("helvetica", "normal");
  autoTable(doc, {
    startY: y + 4,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Joint", "Support type", "Reaction Rx", "Reaction Ry"]],
    body: supportRows.length
      ? supportRows
      : [["—", "No supports defined", "—", "—"]],
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [...BRAND], textColor: 255 },
  });
  y = finalY(doc, y + 14);

  // Applied loads table.
  y = ensureSpace(doc, y, 50, pageH);
  const loadRows = truss.loads.map((l) => [
    l.nodeId,
    U.fmtForce(l.fx, units),
    U.fmtForce(l.fy, units),
  ]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("Applied loads", MARGIN, y + 6);
  doc.setFont("helvetica", "normal");
  autoTable(doc, {
    startY: y + 8,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Joint", "Fx", "Fy"]],
    body: loadRows.length ? loadRows : [["—", "No loads applied", "—"]],
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [...BRAND], textColor: 255 },
  });
  return finalY(doc, y + 18);
}

// ── 6. Reactions & equilibrium ─────────────────────────────────────────────

function reactionsSection(
  doc: jsPDF,
  truss: Truss,
  result: AnalysisResult,
  units: UnitSystem,
  y: number,
): number {
  const byNode = nodeResultMap(result);
  const supported = truss.nodes.filter((n) => n.support !== "none");

  let sumRx = 0;
  let sumRy = 0;
  const rows: string[][] = supported.map((n) => {
    const nr = byNode.get(n.id);
    const rx = nr?.rx ?? 0;
    const ry = nr?.ry ?? 0;
    sumRx += rx;
    sumRy += ry;
    const mag = Math.hypot(rx, ry);
    return [
      n.id,
      U.fmtForce(rx, units),
      U.fmtForce(ry, units),
      U.fmtForce(mag, units),
    ];
  });

  // Equilibrium: Σ reactions should balance −Σ applied loads.
  const appliedFx = truss.loads.reduce((s, l) => s + l.fx, 0);
  const appliedFy = truss.loads.reduce((s, l) => s + l.fy, 0);
  const residualX = sumRx + appliedFx;
  const residualY = sumRy + appliedFy;
  const scale = Math.max(
    1,
    Math.abs(appliedFx),
    Math.abs(appliedFy),
    Math.abs(sumRx),
    Math.abs(sumRy),
  );
  const balanced =
    Math.abs(residualX) / scale < 1e-3 && Math.abs(residualY) / scale < 1e-3;
  const tick = balanced ? "✓" : "✗";

  rows.push(["Σ R", U.fmtForce(sumRx, units), U.fmtForce(sumRy, units), "—"]);
  rows.push([
    "Σ applied (−F)",
    U.fmtForce(-appliedFx, units),
    U.fmtForce(-appliedFy, units),
    "—",
  ]);
  rows.push([
    `Equilibrium ${tick}`,
    U.fmtForce(residualX, units),
    U.fmtForce(residualY, units),
    balanced ? "Balanced" : "Residual",
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Joint", "Rx", "Ry", "Resultant |R|"]],
    body: rows,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [...BRAND], textColor: 255 },
    didParseCell: (data) => {
      // Highlight the summary/check rows at the bottom.
      const idx = data.row.index;
      const total = rows.length;
      if (data.section === "body" && idx >= total - 3) {
        data.cell.styles.fontStyle = "bold";
        if (idx === total - 1) {
          data.cell.styles.textColor = balanced
            ? [21, 128, 61]
            : [...COMPRESSION];
        }
      }
    },
  });
  return finalY(doc, y + 10);
}

// ── 7. Member forces ───────────────────────────────────────────────────────

function memberForceSection(
  doc: jsPDF,
  truss: Truss,
  result: AnalysisResult,
  units: UnitSystem,
  y: number,
): number {
  const memberById = new Map(truss.members.map((m) => [m.id, m]));

  // Sort by |axial force| descending so critical members are on top.
  const sorted = [...result.members].sort(
    (a, b) => Math.abs(b.axialForce) - Math.abs(a.axialForce),
  );

  const stateLabel: Record<string, string> = {
    tension: "Tension",
    compression: "Compression",
    zero: "Zero",
  };

  const rows = sorted.map((mr) => {
    const m = memberById.get(mr.memberId);
    const connectivity = m ? `${m.from}–${m.to}` : "—";
    const area = m ? m.area : 0;
    const fos = isFinite(mr.factorOfSafety)
      ? mr.factorOfSafety.toFixed(2)
      : "∞";
    return [
      mr.memberId,
      connectivity,
      U.fmtLength(mr.length, units),
      U.fmtArea(area, units),
      U.fmtForce(mr.axialForce, units),
      stateLabel[mr.state] ?? mr.state,
      U.fmtStress(mr.stress, units),
      `${(mr.utilization * 100).toFixed(1)}%`,
      fos,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [
      [
        "Member",
        "Nodes",
        "Length",
        "Area",
        "Axial force",
        "State",
        "Stress",
        "Util.",
        "FoS",
      ],
    ],
    body: rows.length
      ? rows
      : [["—", "No members", "", "", "", "", "", "", ""]],
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 1.6 },
    headStyles: { fillColor: [...BRAND], textColor: 255, fontSize: 8 },
    columnStyles: { 5: { fontStyle: "bold" } },
    didParseCell: (data) => {
      // Colour the State cell text by member state.
      if (data.section === "body" && data.column.index === 5) {
        const label = String(data.cell.raw ?? "");
        if (label === "Tension") data.cell.styles.textColor = [...TENSION];
        else if (label === "Compression")
          data.cell.styles.textColor = [...COMPRESSION];
        else data.cell.styles.textColor = [...MUTED];
      }
    },
  });
  return finalY(doc, y + 10);
}

// ── 8. Deflections ─────────────────────────────────────────────────────────

function deflectionSection(
  doc: jsPDF,
  result: AnalysisResult,
  units: UnitSystem,
  y: number,
): number {
  const rows = result.nodes.map((nr) => {
    const mag = Math.hypot(nr.ux, nr.uy);
    return [
      nr.nodeId,
      U.fmtLength(nr.ux, units, 3),
      U.fmtLength(nr.uy, units, 3),
      U.fmtLength(mag, units, 3),
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Joint", "ux", "uy", "Resultant |u|"]],
    body: rows.length ? rows : [["—", "No results", "—", "—"]],
    theme: "striped",
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    headStyles: { fillColor: [...BRAND], textColor: 255 },
  });
  y = finalY(doc, y + 10);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(
    `Maximum nodal displacement: ${U.fmtLength(result.maxDisplacement, units, 3)}`,
    MARGIN,
    y + 4,
  );
  doc.setFont("helvetica", "normal");
  return y + 8;
}

// ── 9. Governing results / scores ──────────────────────────────────────────

function governingSection(
  doc: jsPDF,
  result: AnalysisResult,
  units: UnitSystem,
  y: number,
  pageW: number,
  pageH: number,
): number {
  // Instability warning box.
  if (!result.stable) {
    const boxH = 16;
    doc.setFillColor(...WARN_BG);
    doc.setDrawColor(...COMPRESSION);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGIN, y, pageW - MARGIN * 2, boxH, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...WARN_INK);
    doc.text(
      "STRUCTURE UNSTABLE — results are not valid",
      pageW / 2,
      y + boxH / 2 + 1.5,
      { align: "center" },
    );
    doc.setFont("helvetica", "normal");
    y += boxH + 6;
    y = ensureSpace(doc, y, 60, pageH);
  }

  // Find the member governing the minimum factor of safety.
  let governing = "—";
  let govFos = Infinity;
  for (const mr of result.members) {
    if (mr.state === "zero") continue;
    if (mr.factorOfSafety < govFos) {
      govFos = mr.factorOfSafety;
      governing = mr.memberId;
    }
  }
  const minFosText = isFinite(result.minFoS) ? result.minFoS.toFixed(2) : "∞";
  const govText = governing !== "—" ? ` (member ${governing})` : "";

  return kvTable(
    doc,
    y,
    [
      ["Governing factor of safety", `${minFosText}${govText}`],
      ["Safety score", `${Math.round(result.safetyScore)} / 100`],
      [
        "Structural efficiency score",
        `${Math.round(result.efficiencyScore)} / 100`,
      ],
      ["Total mass", U.fmtMass(result.totalMass, units)],
      ["Max displacement", U.fmtLength(result.maxDisplacement, units, 3)],
      ["Solved", result.solved ? "Yes" : "No"],
    ],
    ["Governing Result", "Value"],
  );
}

// ── 10. Assumptions & equations ────────────────────────────────────────────

function assumptionsSection(doc: jsPDF, y: number, pageW: number): number {
  const contentW = pageW - MARGIN * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Modeling assumptions", MARGIN, y);
  y += 6;

  const assumptions = [
    "Joints are idealized as frictionless pins; members are pin-connected.",
    "Members are two-force members carrying axial force only (no bending or shear).",
    "Behavior is linear-elastic under small displacements (geometry not updated for deflection).",
    "Self-weight is neglected unless applied explicitly as nodal loads.",
    "Loads are applied only at joints (nodes).",
    "The Euler buckling check uses an approximate radius of gyration derived from the section area.",
  ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  for (const a of assumptions) {
    const wrapped = doc.splitTextToSize(`•  ${a}`, contentW);
    doc.text(wrapped, MARGIN, y);
    y += wrapped.length * 5 + 1.5;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Governing equations", MARGIN, y);
  y += 6;

  const equations: Array<[string, string]> = [
    ["Member stiffness", "k = E*A / L"],
    ["Global system", "[K]{u} = {F}"],
    [
      "Axial force",
      "N = (E*A / L) * (-c, -s, c, s) . {u}   (tension positive)",
    ],
    ["  where", "c = cos(theta), s = sin(theta) of the member axis"],
    ["Axial stress", "sigma = N / A"],
    ["Factor of safety", "FoS = sigma_yield / |sigma|"],
    ["Euler buckling", "P_cr = pi^2 * E * I / L^2"],
  ];
  doc.setFontSize(9.5);
  for (const [label, expr] of equations) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MUTED);
    doc.text(label, MARGIN, y);
    doc.setFont("courier", "normal");
    doc.setTextColor(...INK);
    doc.text(expr, MARGIN + 42, y);
    y += 6;
  }
  doc.setFont("helvetica", "normal");
  return y;
}

// ── Shared helpers ─────────────────────────────────────────────────────────

function sectionHeader(
  doc: jsPDF,
  title: string,
  margin: number,
  y = 24,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...BRAND);
  doc.text(title, margin, y);
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 2, margin + 42, y + 2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK);
  return y + 8;
}

function kvTable(
  doc: jsPDF,
  startY: number,
  rows: Array<[string, string]>,
  head?: [string, string],
): number {
  autoTable(doc, {
    startY,
    margin: { left: MARGIN, right: MARGIN },
    head: head ? [head] : undefined,
    body: rows,
    theme: "striped",
    styles: { fontSize: 9.5, cellPadding: 2 },
    headStyles: { fillColor: [...BRAND], textColor: 255 },
    columnStyles: { 0: { cellWidth: 72, textColor: [...MUTED] } },
  });
  return finalY(doc, startY + 10);
}

/** Read autoTable's finalY (not in jsPDF public types) with a guarded cast. */
function finalY(doc: jsPDF, fallback: number): number {
  const withTable = doc as jsPDF & { lastAutoTable?: { finalY?: number } };
  return withTable.lastAutoTable?.finalY ?? fallback;
}

/** Page-break helper: add a page and reset y if a block won't fit. */
function ensureSpace(
  doc: jsPDF,
  y: number,
  needed: number,
  pageH: number,
): number {
  if (y + needed > pageH - MARGIN) {
    doc.addPage();
    return MARGIN + 6;
  }
  return y;
}

function nodeResultMap(result: AnalysisResult): Map<string, NodeResult> {
  return new Map(result.nodes.map((n) => [n.nodeId, n]));
}

function addFooters(doc: jsPDF, pageW: number, pageH: number): void {
  const pages = doc.getNumberOfPages();
  for (let i = 2; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Truss Analysis Report", MARGIN, pageH - 8);
    doc.text(
      "A Product by Asrar ul Haq · tools.asrarul.com",
      pageW / 2,
      pageH - 8,
      {
        align: "center",
      },
    );
    doc.text(`Page ${i} of ${pages}`, pageW - MARGIN, pageH - 8, {
      align: "right",
    });
  }
}

function sanitize(name: string): string {
  const cleaned = (name ?? "")
    .trim()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "untitled";
}
