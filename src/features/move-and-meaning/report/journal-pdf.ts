import { jsPDF } from "jspdf";
import type { JournalEntry, JournalModel } from "../types";

/**
 * ── Move & Meaning — journal PDF export ──────────────────────────────────────
 * Mirrors the engineering-tool report idiom used elsewhere in this codebase
 * (see truss-analyzer/lib/report.ts): A4, mm units, a running `y` cursor
 * threaded through section functions, `ensureSpace` for page breaks, a
 * try/catch wrapper so a broken export never crashes the app. No autoTable
 * here — a reflective journal reads as flowing prose, not a data table, so
 * `splitTextToSize` handles wrapping instead. jsPDF's core "times" font gives
 * the literary register the philosophy content wants; "helvetica" stays for
 * small UI-ish chrome (headings, footers).
 */

const BRAND = [201, 162, 75] as const; // brass
const INK = [42, 30, 20] as const; // walnut ink
const MUTED = [140, 120, 90] as const;
const PANEL = [26, 17, 8] as const; // near-black warm header band

const MARGIN = 18;

export interface JournalReportOptions {
  /** PNG data URL of the current board position, if the caller has one. */
  boardSnapshotDataUrl?: string | null;
}

export function generateJournalReport(
  model: JournalModel,
  opts?: JournalReportOptions,
): void {
  try {
    buildReport(model, opts ?? {});
  } catch {
    // A report is never worth crashing the app over. Swallow and no-op.
  }
}

function buildReport(model: JournalModel, opts: JournalReportOptions): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  let y = titleBlock(doc, model, opts, pageW);

  if (model.entries.length === 0) {
    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text(
      "No flagged positions or reflections recorded yet.",
      MARGIN,
      y + 6,
    );
  }

  for (const entry of model.entries) {
    y = ensureSpace(doc, y, 30, pageH);
    y = entrySection(doc, entry, pageW, pageH, y);
  }

  addFooters(doc, pageW, pageH);
  doc.save(`move-and-meaning-journal-${sanitize(model.date)}.pdf`);
}

function titleBlock(
  doc: jsPDF,
  model: JournalModel,
  opts: JournalReportOptions,
  pageW: number,
): number {
  doc.setFillColor(...PANEL);
  doc.rect(0, 0, pageW, 40, "F");

  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND);
  doc.text(model.title, MARGIN, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(240, 232, 210);
  doc.text(
    `${model.players.white} vs ${model.players.black} — ${model.date}`,
    MARGIN,
    29,
  );
  doc.text(
    `Mode: ${model.mode === "assisted" ? "Engine-assisted analysis" : "Unassisted reflection"}`,
    MARGIN,
    35,
  );

  let y = 50;
  if (opts.boardSnapshotDataUrl) {
    try {
      doc.addImage(
        opts.boardSnapshotDataUrl,
        "PNG",
        MARGIN,
        y,
        50,
        50,
        undefined,
        "FAST",
      );
      y += 56;
    } catch {
      /* skip the snapshot if it fails to decode */
    }
  }
  doc.setTextColor(...INK);
  return y;
}

function entrySection(
  doc: jsPDF,
  entry: JournalEntry,
  pageW: number,
  pageH: number,
  y: number,
): number {
  const maxWidth = pageW - MARGIN * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BRAND);
  const heading = `Move ${entry.ply}: ${entry.san}${entry.flagged ? " — flagged as critical" : ""}`;
  doc.text(heading, MARGIN, y);
  y += 6;

  if (entry.motifs.length) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`Motifs: ${entry.motifs.join(", ")}`, MARGIN, y);
    y += 6;
  }

  if (entry.comment) {
    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    y = wrappedText(doc, entry.comment, MARGIN, y, maxWidth, pageH);
  }

  if (entry.unassistedGuess) {
    y = ensureSpace(doc, y, 12, pageH);
    doc.setFont("times", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text("Before checking the engine:", MARGIN, y);
    y += 5;
    doc.setFont("times", "normal");
    y = wrappedText(doc, entry.unassistedGuess, MARGIN, y, maxWidth, pageH);
  }

  for (const lensResponse of entry.lensResponses) {
    y = ensureSpace(doc, y, 16, pageH);
    doc.setFont("times", "bolditalic");
    doc.setFontSize(10.5);
    doc.setTextColor(...BRAND);
    doc.text(lensResponse.lensName, MARGIN, y);
    y += 5;

    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    y = wrappedText(doc, lensResponse.prompt, MARGIN, y, maxWidth, pageH, 4.4);

    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    y = wrappedText(doc, lensResponse.response, MARGIN, y, maxWidth, pageH);
  }

  y = ensureSpace(doc, y, 6, pageH);
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, pageW - MARGIN, y);
  return y + 8;
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
  return cursor + 2;
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
    doc.text("Move & Meaning — Reflective Chess Journal", MARGIN, pageH - 8);
    doc.text("tools.asrarul.com", pageW / 2, pageH - 8, { align: "center" });
    doc.text(`Page ${i} of ${pages}`, pageW - MARGIN, pageH - 8, {
      align: "right",
    });
  }
}

function sanitize(text: string): string {
  return (text || "game").replace(/[^a-z0-9-]+/gi, "-");
}
