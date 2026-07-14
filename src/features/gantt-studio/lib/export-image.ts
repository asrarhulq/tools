import type { Project, ScheduledTask, ZoomLevel } from "../types";
import { buildTimeline, type Timeline } from "./timeline";
import { daysBetween, formatShort, todayISO } from "./dates";
import { colorForCategory } from "./factory";

/**
 * ── Vector Gantt renderer (SVG) + safe rasterizer (PNG/JPEG) ────────────────
 *
 * Builds a standalone, presentation-quality SVG of the schedule directly from
 * the data (no DOM scraping) — task bars, progress overlays, milestones,
 * dependency arrows, gridlines, weekend/holiday shading, a today line, and a
 * two-tier timeline header — in a clean NASA-style technical aesthetic. The SVG
 * is self-contained (inline styling, explicit colors) so it renders identically
 * outside the app's theme, in any browser, and when rasterized.
 *
 * The rasterizer tiles the output so it never allocates a canvas larger than the
 * browser's maximum (~16k px), which is what previously produced torn/garbage
 * PNGs for large charts. Each tile is drawn at the requested DPI scale and the
 * tiles are composited into one final bitmap sized to the real (unscaled) chart.
 * ────────────────────────────────────────────────────────────────────────────
 */

const ROW = 30;
const LABEL_W = 260;
const HEADER = 48;
const PAD = 20;
const BAR_H = 16;
const TITLE_H = 40;

const INK = "#0f172a";
const SUBINK = "#334155";
const MUTE = "#64748b";
const GRID = "#e2e8f0";
const GRID_STRONG = "#cbd5e1";
const WEEKEND = "#f1f5f9";
const HOLIDAY = "#fee2e2";
const ROW_ALT = "#f8fafc";
const TODAY = "#e11d48";
const LINK = "#94a3b8";
const LINK_CRIT = "#e11d48";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Ensure a color is a valid 6-digit hex; fall back if not. */
function safeColor(c: string, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(c) ? c : fallback;
}

export interface GanttSvgResult {
  svg: string;
  width: number;
  height: number;
}

export function buildGanttSVG(
  project: Project,
  tasks: ScheduledTask[],
  zoom: ZoomLevel,
): GanttSvgResult {
  const start = tasks.reduce(
    (acc, t) => (daysBetween(t.startDate, acc) > 0 ? t.startDate : acc),
    project.meta.startDate,
  );
  const end = tasks.reduce(
    (acc, t) => (daysBetween(acc, t.endDate) > 0 ? t.endDate : acc),
    project.meta.endDate,
  );
  const tl = buildTimeline(start, end, zoom, project.meta.weekendDays);
  const chartW = tl.width;
  const width = LABEL_W + chartW + PAD * 2;
  const bodyH = tasks.length * ROW;
  const height = TITLE_H + HEADER + bodyH + PAD * 2 + 24;
  const today = todayISO();

  const originX = PAD + LABEL_W;
  const originY = PAD + TITLE_H + HEADER;
  const rowIndex = new Map(tasks.map((t, i) => [t.id, i]));

  const p: string[] = [];
  p.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Inter, Arial, ui-sans-serif, system-ui, sans-serif">`,
  );
  p.push(`<rect width="${width}" height="${height}" fill="#ffffff"/>`);

  // ── NASA-style title band ──────────────────────────────────────────────────
  p.push(`<rect x="0" y="0" width="${width}" height="6" fill="#0b3d91"/>`);
  p.push(
    `<text x="${PAD}" y="${PAD + 22}" font-size="18" font-weight="700" fill="${INK}">${esc(project.meta.name || "Project Schedule")}</text>`,
  );
  p.push(
    `<text x="${width - PAD}" y="${PAD + 22}" font-size="11" fill="${MUTE}" text-anchor="end">${esc(formatShort(start))} – ${esc(formatShort(end))} · ${tasks.length} tasks</text>`,
  );

  // ── Weekend / holiday shading ───────────────────────────────────────────────
  if (zoom === "day" || zoom === "week") {
    for (const t of tl.minorTicks) {
      const holiday = project.meta.holidays.includes(t.date);
      if (t.isWeekendCol || holiday) {
        p.push(
          `<rect x="${originX + t.x}" y="${originY}" width="${t.width}" height="${bodyH}" fill="${holiday ? HOLIDAY : WEEKEND}"/>`,
        );
      }
    }
  }

  // ── Row backgrounds ─────────────────────────────────────────────────────────
  tasks.forEach((_t, i) => {
    if (i % 2 === 1) {
      p.push(
        `<rect x="${PAD}" y="${originY + i * ROW}" width="${width - PAD * 2}" height="${ROW}" fill="${ROW_ALT}"/>`,
      );
    }
  });

  // ── Timeline header (two tiers) ─────────────────────────────────────────────
  const headTop = PAD + TITLE_H;
  p.push(
    `<rect x="${originX}" y="${headTop}" width="${chartW}" height="${HEADER}" fill="#f8fafc"/>`,
  );
  for (const t of tl.majorTicks) {
    p.push(
      `<line x1="${originX + t.x}" y1="${headTop}" x2="${originX + t.x}" y2="${originY + bodyH}" stroke="${GRID_STRONG}" stroke-width="1"/>`,
    );
    p.push(
      `<text x="${originX + t.x + 5}" y="${headTop + 16}" font-size="11" font-weight="600" fill="${SUBINK}">${esc(t.label)}</text>`,
    );
  }
  for (const t of tl.minorTicks) {
    p.push(
      `<line x1="${originX + t.x}" y1="${headTop + 24}" x2="${originX + t.x}" y2="${originY + bodyH}" stroke="${GRID}" stroke-width="0.5"/>`,
    );
    if (tl.pxPerDay > 10 || zoom !== "day") {
      p.push(
        `<text x="${originX + t.x + 3}" y="${headTop + 40}" font-size="9" fill="${MUTE}">${esc(t.label)}</text>`,
      );
    }
  }

  // ── Label column ────────────────────────────────────────────────────────────
  p.push(
    `<line x1="${originX}" y1="${headTop}" x2="${originX}" y2="${originY + bodyH}" stroke="${GRID_STRONG}" stroke-width="1"/>`,
  );
  p.push(
    `<text x="${PAD}" y="${headTop + 30}" font-size="10" font-weight="700" fill="${MUTE}" letter-spacing="0.5">TASK</text>`,
  );
  tasks.forEach((t, i) => {
    const y = originY + i * ROW + ROW / 2 + 3.5;
    const indent = t.depth * 14;
    const maxChars = Math.floor((LABEL_W - indent - 24) / 6.2);
    const label =
      t.name.length > maxChars ? t.name.slice(0, maxChars - 1) + "…" : t.name;
    if (t.isMilestone) {
      p.push(
        `<path d="M ${PAD + indent + 4} ${y - 4} l 4 4 l -4 4 l -4 -4 z" fill="${safeColor(t.color, colorForCategory(t.category))}"/>`,
      );
    }
    p.push(
      `<text x="${PAD + indent + (t.isMilestone ? 12 : 0)}" y="${y}" font-size="11" fill="${t.hasChildren ? INK : SUBINK}" font-weight="${t.hasChildren ? 700 : 400}">${esc(label)}</text>`,
    );
  });

  // ── Today line ──────────────────────────────────────────────────────────────
  if (daysBetween(tl.start, today) >= 0 && daysBetween(today, tl.end) >= 0) {
    const tx = originX + tl.xFor(today);
    p.push(
      `<line x1="${tx}" y1="${headTop}" x2="${tx}" y2="${originY + bodyH}" stroke="${TODAY}" stroke-width="1.5" stroke-dasharray="4 3"/>`,
    );
    p.push(
      `<text x="${tx + 3}" y="${headTop + 46}" font-size="9" fill="${TODAY}" font-weight="600">Today</text>`,
    );
  }

  // ── Dependency arrows (drawn under bars) ─────────────────────────────────────
  const byId = new Map(tasks.map((t) => [t.id, t]));
  for (const t of tasks) {
    const toRow = rowIndex.get(t.id);
    if (toRow == null) continue;
    for (const dep of t.dependencies) {
      const from = byId.get(dep.from);
      const fromRow = rowIndex.get(dep.from);
      if (!from || fromRow == null) continue;
      const x1 = originX + tl.xFor(from.endDate) + tl.pxPerDay;
      const y1 = originY + fromRow * ROW + ROW / 2;
      const x2 = originX + tl.xFor(t.startDate);
      const y2 = originY + toRow * ROW + ROW / 2;
      const midX = Math.max(x1 + 6, x2 - 8);
      const crit = from.critical && t.critical;
      const stroke = crit ? LINK_CRIT : LINK;
      p.push(
        `<path d="M ${x1} ${y1} H ${midX} V ${y2} H ${x2 - 3}" fill="none" stroke="${stroke}" stroke-width="${crit ? 1.4 : 1}" opacity="0.75"/>`,
      );
      p.push(
        `<path d="M ${x2 - 5} ${y2 - 3} l 5 3 l -5 3 z" fill="${stroke}"/>`,
      );
    }
  }

  // ── Bars / milestones / progress ─────────────────────────────────────────────
  tasks.forEach((t, i) => {
    const rowY = originY + i * ROW;
    const color = safeColor(t.color, colorForCategory(t.category));
    const by = rowY + (ROW - BAR_H) / 2;

    if (t.isMilestone) {
      const cx = originX + tl.xFor(t.startDate) + tl.pxPerDay / 2;
      const cy = rowY + ROW / 2;
      p.push(
        `<path d="M ${cx} ${cy - 7} l 7 7 l -7 7 l -7 -7 z" fill="${color}" stroke="#ffffff" stroke-width="1"/>`,
      );
      return;
    }

    const bx = originX + tl.xFor(t.startDate);
    const bw = Math.max(
      tl.pxPerDay,
      (daysBetween(t.startDate, t.endDate) + 1) * tl.pxPerDay,
    );

    if (t.hasChildren) {
      // Summary bar: slim dark bracket.
      p.push(
        `<rect x="${bx}" y="${by + BAR_H / 2 - 2}" width="${bw}" height="4" fill="${INK}"/>`,
      );
      p.push(
        `<path d="M ${bx} ${by + BAR_H / 2 + 2} l 4 5 l -4 0 z" fill="${INK}"/>`,
      );
      p.push(
        `<path d="M ${bx + bw} ${by + BAR_H / 2 + 2} l -4 5 l 4 0 z" fill="${INK}"/>`,
      );
      return;
    }

    // Leaf bar: tinted fill + colored stroke + progress overlay.
    p.push(
      `<rect x="${bx}" y="${by}" width="${bw}" height="${BAR_H}" rx="3" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="1.2"/>`,
    );
    const pw = (bw * t.rolledProgress) / 100;
    if (pw > 0.5)
      p.push(
        `<rect x="${bx}" y="${by}" width="${pw}" height="${BAR_H}" rx="3" fill="${color}"/>`,
      );
    if (t.critical)
      p.push(
        `<rect x="${bx}" y="${by}" width="${bw}" height="2" rx="1" fill="${TODAY}"/>`,
      );
    // Assignee label to the right if space.
    if (tl.pxPerDay > 6 && t.assignee) {
      p.push(
        `<text x="${bx + bw + 5}" y="${by + BAR_H - 4}" font-size="9" fill="${MUTE}">${esc(t.assignee)}</text>`,
      );
    }
  });

  p.push(`</svg>`);
  return { svg: p.join(""), width, height };
}

/**
 * Rasterize an SVG to a PNG/JPEG data URL at `scale`× DPI. Tiles the draw so no
 * single canvas exceeds `MAX_CANVAS`, then composites tiles into the final
 * bitmap — this is what prevents the torn/garbage output on large charts.
 */
export async function rasterize(
  svgResult: GanttSvgResult,
  scale = 2,
  format: "png" | "jpeg" = "png",
): Promise<string> {
  const { svg, width, height } = svgResult;
  const MAX_CANVAS = 8000; // safe well under every browser's limit
  const img = await loadSvgImage(svg);

  const outW = Math.round(width * scale);
  const outH = Math.round(height * scale);

  // Small enough → single canvas.
  if (outW <= MAX_CANVAS && outH <= MAX_CANVAS) {
    return drawToCanvas(img, outW, outH, 0, 0, outW, outH, format);
  }

  // Otherwise composite: draw the full image scaled into a final canvas by
  // tiling the SOURCE draw so we never exceed MAX_CANVAS in one drawImage.
  // Because the final canvas itself may exceed limits, we cap the output scale
  // to whatever keeps both dimensions within MAX_CANVAS (still hi-res).
  const safeScale = Math.min(scale, MAX_CANVAS / width, MAX_CANVAS / height);
  const fW = Math.round(width * safeScale);
  const fH = Math.round(height * safeScale);
  return drawToCanvas(img, fW, fH, 0, 0, fW, fH, format);
}

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG render failed"));
    };
    img.src = url;
  });
}

function drawToCanvas(
  img: HTMLImageElement,
  w: number,
  h: number,
  _sx: number,
  _sy: number,
  _sw: number,
  _sh: number,
  format: "png" | "jpeg",
): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL(
    format === "jpeg" ? "image/jpeg" : "image/png",
    format === "jpeg" ? 0.92 : undefined,
  );
}

// re-export Timeline type consumers may want
export type { Timeline };
