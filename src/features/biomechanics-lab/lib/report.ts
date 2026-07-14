import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  ActivityId,
  BodyParams,
  CycleSummary,
  FrameAnalysis,
  PostureAssessment,
  UnitSystem,
} from "../types";
import { ACTIVITY_MAP, bodyWeightN } from "./anthropometry";
import * as U from "./units";

/**
 * Professional biomechanics PDF report (jsPDF + autoTable): cover page, movement
 * summary, force & joint analysis, injury-risk assessment, posture evaluation,
 * recommendations, and a captured 3D screenshot. Footed "Developed by Asrar ul Haq".
 */

const BRAND: [number, number, number] = [99, 102, 241];
const INK: [number, number, number] = [23, 23, 30];
const MUTED: [number, number, number] = [110, 110, 130];
const FOOTER = "Developed by Asrar ul Haq";

export interface ReportInput {
  activity: ActivityId;
  body: BodyParams;
  units: UnitSystem;
  frame: FrameAnalysis;
  summary: CycleSummary;
  posture: PostureAssessment;
  screenshot: string | null;
  subject: string;
}

export function generateReport(input: ReportInput): void {
  const { activity, body, units, frame, summary, posture } = input;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const bw = bodyWeightN(body);
  const act = ACTIVITY_MAP[activity];

  // ── Cover ─────────────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 4, "F");
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("Human Biomechanics Lab", margin, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...MUTED);
  doc.text(`${act.label} — Movement Analysis Report`, margin, 54);

  // Screenshot.
  const boxY = 66;
  const boxW = pageW - margin * 2;
  const boxH = 105;
  doc.setDrawColor(220);
  doc.roundedRect(margin, boxY, boxW, boxH, 3, 3, "S");
  if (input.screenshot) {
    try {
      doc.addImage(
        input.screenshot,
        "PNG",
        margin + 4,
        boxY + 4,
        boxW - 8,
        boxH - 8,
        undefined,
        "FAST",
      );
    } catch {
      /* ignore */
    }
  }

  const infoY = boxY + boxH + 16;
  const info: Array<[string, string]> = [
    ["Subject", input.subject || "—"],
    ["Activity", act.label],
    [
      "Body",
      `${U.length(body.height, units)}, ${U.mass(body.mass, units)}, ${body.sex}`,
    ],
    ["External load", U.mass(body.loadKg, units)],
    ["Date", new Date().toLocaleString()],
    ["Overall injury risk", summary.overallRisk.toUpperCase()],
  ];
  doc.setFontSize(11);
  info.forEach(([l, v], i) => {
    const y = infoY + i * 7;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(l, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(v, margin + 44, y);
  });

  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.5);
  doc.line(margin, pageH - 22, pageW - margin, pageH - 22);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(FOOTER, pageW / 2, pageH - 15, { align: "center" });

  // ── Analysis page ──────────────────────────────────────────────────────────
  doc.addPage();
  let y = section(doc, "Movement Summary", margin, 24);
  y = table(doc, y, margin, [
    ["Activity", act.label],
    ["Description", act.description],
    [
      "Peak ground reaction force",
      `${U.force(summary.peakGrfN, units)} (${summary.peakGrfBodyweights.toFixed(2)}×BW)`,
    ],
    [
      "Peak joint load",
      `${summary.peakJoint.label}: ${U.force(summary.peakJoint.forceN, units)}`,
    ],
    ["Peak L5/S1 compression", U.force(summary.peakSpinalN, units)],
    ["Average metabolic power", U.power(summary.avgMetabolicW, units)],
    ["Energy per cycle", U.energy(summary.energyPerCycleJ, units)],
    ["Cadence", `${summary.cadence.toFixed(0)} /min`],
    ["Movement symmetry", `${summary.symmetryPct.toFixed(0)}%`],
  ]);

  y = section(doc, "Joint & Force Analysis", margin, y + 8);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "striped",
    styles: { fontSize: 9 },
    head: [["Joint", "Reaction force", "Torque", "×BW"]],
    headStyles: { fillColor: BRAND, textColor: 255 },
    body: frame.jointLoads
      .slice()
      .sort((a, b) => b.forceN - a.forceN)
      .map((jl) => [
        jl.label,
        U.force(jl.forceN, units),
        U.torque(jl.torqueNm, units),
        jl.bodyweights.toFixed(2),
      ]),
  });
  y = lastY(doc, y);

  // ── Injury + posture page ──────────────────────────────────────────────────
  doc.addPage();
  y = section(doc, "Injury Risk Assessment", margin, 24);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "striped",
    styles: { fontSize: 9 },
    head: [["Region", "Risk", "Level", "Note"]],
    headStyles: { fillColor: BRAND, textColor: 255 },
    columnStyles: { 3: { cellWidth: 80 } },
    body: frame.injuries.map((r) => [
      r.region,
      `${Math.round(r.risk * 100)}%`,
      r.level,
      r.note,
    ]),
  });
  y = lastY(doc, y) + 8;

  y = section(doc, "Posture Evaluation", margin, y);
  y = table(doc, y, margin, [
    ["Posture score", `${posture.score}/100`],
    ["Spinal alignment", `${posture.spinalAlignmentDeg.toFixed(0)}°`],
    ["Neck angle", `${posture.neckAngleDeg.toFixed(0)}°`],
    ["Shoulder symmetry", `${posture.shoulderSymmetryDeg.toFixed(1)}°`],
    ["Hip alignment", `${posture.hipAlignmentDeg.toFixed(1)}°`],
  ]);

  y = section(doc, "Recommendations", margin, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  const recs = [...posture.recommendations, ...frame.notes];
  let cursor = y + 2;
  for (const r of recs) {
    const lines = doc.splitTextToSize(`•  ${r}`, pageW - margin * 2);
    doc.text(lines, margin, cursor);
    cursor += lines.length * 5 + 2;
  }

  // Footers.
  const pages = doc.getNumberOfPages();
  for (let i = 2; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(FOOTER, margin, pageH - 8);
    doc.text(`Page ${i} of ${pages}`, pageW - margin, pageH - 8, {
      align: "right",
    });
  }

  void bw;
  doc.save(`biomechanics-${activity}-report.pdf`);
}

function section(doc: jsPDF, title: string, margin: number, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND);
  doc.text(title, margin, y);
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 2, margin + 40, y + 2);
  return y + 8;
}

function table(
  doc: jsPDF,
  startY: number,
  margin: number,
  rows: Array<[string, string]>,
): number {
  autoTable(doc, {
    startY,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 2.2 },
    body: rows,
    columnStyles: { 0: { cellWidth: 60, fontStyle: "bold", textColor: MUTED } },
  });
  return lastY(doc, startY);
}

function lastY(doc: jsPDF, fallback: number): number {
  const w = doc as jsPDF & { lastAutoTable?: { finalY?: number } };
  return w.lastAutoTable?.finalY ?? fallback;
}
