import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { AU_KM } from "../config";
import {
  formatDateTime,
  formatDistanceKm,
  formatMassKg,
  formatPeriod,
  formatRotation,
  lightTravelTime,
} from "../lib/format";
import { heliocentricPosition } from "../lib/kepler";
import { julianDateToDate } from "../lib/julian-date";
import type { CelestialBody } from "../types";

/**
 * ── Orrery — observation report ──────────────────────────────────────────
 * Mirrors the engineering-tool report idiom used elsewhere in this codebase
 * (see truss-analyzer/lib/report.ts): A4, mm units, a running `y` cursor,
 * `ensureSpace` for page breaks, a try/catch wrapper so a broken export
 * never crashes the app. A viewport screenshot (if the caller has one) runs
 * across the top, followed by the selected body's real computed data at the
 * moment captured.
 */

const BRAND = [125, 211, 252] as const; // sky blue
const INK = [20, 24, 40] as const;
const MUTED = [110, 118, 150] as const;
const PANEL = [3, 4, 10] as const;

const MARGIN = 18;

export interface ObservationReportModel {
  body: CelestialBody;
  parent?: CelestialBody;
  jd: number;
  screenshotDataUrl: string | null;
}

export function generateObservationReport(model: ObservationReportModel): void {
  try {
    buildReport(model);
  } catch {
    // A report is never worth crashing the app over. Swallow and no-op.
  }
}

function buildReport(model: ObservationReportModel): void {
  const { body, parent, jd, screenshotDataUrl } = model;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  let y = titleBlock(doc, body, jd, pageW);

  if (screenshotDataUrl) {
    try {
      const imgW = pageW - MARGIN * 2;
      const imgH = imgW * 0.6;
      doc.addImage(
        screenshotDataUrl,
        "PNG",
        MARGIN,
        y,
        imgW,
        imgH,
        undefined,
        "FAST",
      );
      y += imgH + 8;
    } catch {
      /* skip the screenshot if it fails to decode */
    }
  }

  y = ensureSpace(doc, y, 60, pageH);
  y = sectionHeader(doc, "Orbital data", y);

  const isStar = body.kind === "star";
  const pos = !isStar ? heliocentricPosition(body.elements, jd) : null;
  const distanceKm = pos ? pos.radiusAu * AU_KM : 0;

  const orbitalRows: [string, string][] = [];
  if (pos) {
    orbitalRows.push([
      parent ? `Distance from ${parent.name}` : "Distance from Sun",
      formatDistanceKm(distanceKm),
    ]);
    if (!parent)
      orbitalRows.push(["Light travel time", lightTravelTime(distanceKm)]);
    orbitalRows.push([
      "Orbital period",
      formatPeriod(body.elements.periodDays),
    ]);
    orbitalRows.push([
      "Orbital eccentricity",
      body.elements.eccentricity.toFixed(4),
    ]);
  }
  y = kvTable(
    doc,
    y,
    orbitalRows.length
      ? orbitalRows
      : [["Note", "The Sun is the fixed reference point"]],
  );

  y = ensureSpace(doc, y, 70, pageH);
  y = sectionHeader(doc, "Physical data", y);
  y = kvTable(doc, y, [
    ["Radius", `${body.physical.radiusKm.toLocaleString()} km`],
    ["Mass", formatMassKg(body.physical.massKg)],
    ["Rotation period", formatRotation(body.physical.rotationHours)],
    ["Axial tilt", `${body.physical.axialTiltDeg.toFixed(1)}°`],
    ["Surface gravity", `${body.physical.gravityMs2.toFixed(2)} m/s²`],
    ["Mean temperature", `${body.physical.meanTempC}°C`],
    ["Known moons", `${body.physical.moonCount}`],
  ]);

  y = ensureSpace(doc, y, 40, pageH);
  y = sectionHeader(doc, "Notes", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  for (const fact of body.physical.facts) {
    y = wrappedText(doc, `• ${fact}`, MARGIN, y, pageW - MARGIN * 2, pageH);
  }

  addFooters(doc, pageW, pageH);
  doc.save(
    `orrery-${body.id}-${julianDateToDate(jd).toISOString().slice(0, 10)}.pdf`,
  );
}

function titleBlock(
  doc: jsPDF,
  body: CelestialBody,
  jd: number,
  pageW: number,
): number {
  doc.setFillColor(...PANEL);
  doc.rect(0, 0, pageW, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND);
  doc.text(`Orrery — ${body.name}`, MARGIN, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(220, 228, 245);
  doc.text(`Observed at: ${formatDateTime(julianDateToDate(jd))}`, MARGIN, 25);

  doc.setTextColor(...INK);
  return 42;
}

function sectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BRAND);
  doc.text(title, MARGIN, y);
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y + 2, MARGIN + 36, y + 2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK);
  return y + 8;
}

function kvTable(doc: jsPDF, startY: number, rows: [string, string][]): number {
  autoTable(doc, {
    startY,
    margin: { left: MARGIN, right: MARGIN },
    body: rows,
    theme: "striped",
    styles: { fontSize: 9.5, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 72, textColor: [...MUTED] } },
  });
  return finalY(doc, startY + 10);
}

function finalY(doc: jsPDF, fallback: number): number {
  const withTable = doc as jsPDF & { lastAutoTable?: { finalY?: number } };
  return withTable.lastAutoTable?.finalY ?? fallback;
}

function wrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  pageH: number,
  lineHeight = 5,
): number {
  const lines: string[] = doc.splitTextToSize(text, maxWidth);
  let cursor = y;
  for (const line of lines) {
    cursor = ensureSpace(doc, cursor, lineHeight, pageH);
    doc.text(line, x, cursor);
    cursor += lineHeight;
  }
  return cursor + 1;
}

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

function addFooters(doc: jsPDF, pageW: number, pageH: number): void {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Orrery — Solar System Simulator", MARGIN, pageH - 8);
    doc.text("tools.asrarul.com", pageW / 2, pageH - 8, { align: "center" });
    doc.text(`Page ${i} of ${pages}`, pageW - MARGIN, pageH - 8, {
      align: "right",
    });
  }
}
