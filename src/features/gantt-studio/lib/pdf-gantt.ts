import type { jsPDF } from "jspdf";
import type {
  Project,
  ScheduleResult,
  ScheduledTask,
  ZoomLevel,
} from "../types";
import { buildTimeline, type Timeline } from "./timeline";
import { daysBetween, formatShort, todayISO } from "./dates";
import { colorForCategory } from "./factory";

/**
 * ── Native-vector Gantt renderer for jsPDF ──────────────────────────────────
 *
 * WHY THIS EXISTS
 * The previous PDF path rasterized the on-screen Gantt to a single PNG and
 * embedded it. For real projects (hundreds of tasks, multi-year ranges) the
 * off-screen canvas needed to capture the whole chart overflows the browser's
 * maximum canvas dimension (~16k–32k px depending on the engine) and silently
 * produces a blank/garbage bitmap. It is also blurry when zoomed or printed.
 *
 * This module draws the chart with pure jsPDF vector primitives — rects, lines,
 * triangles, text — so it is crisp at any zoom/print resolution and, crucially,
 * it PAGINATES so nothing ever overflows a fixed surface.
 *
 * THE TILING / PAGINATION APPROACH (the hard part)
 * We build the timeline geometry ONCE with `buildTimeline`, which works in
 * pixels. We then pick a `mmPerDay` scale (clamped to a legible band) and convert
 * every px measurement to millimetres — the jsPDF unit. Two independent axes are
 * paginated:
 *
 *   • ROWS paginate DOWN.  The flattened task list is sliced into row-bands, each
 *     `rowsPerPage` tall. rowPages = ceil(nTasks / rowsPerPage).
 *
 *   • THE TIMELINE paginates ACROSS.  The full chart width in mm may exceed the
 *     drawable timeline width of one landscape page. We slice the width into
 *     `colPages` horizontal tiles, each covering a mm sub-window [tileX0, tileX1)
 *     of the timeline. Each tile maps to a date sub-range via the timeline.
 *
 * The label column is STICKY: it is redrawn on every page (for every column tile)
 * so a reader can always identify the rows on a right-hand tile. The timeline
 * header (two-tier: major on top, minor below) is redrawn per page showing only
 * the ticks that fall inside that tile's mm window.
 *
 * Pages are emitted row-band by row-band, left-to-right across the column tiles,
 * i.e. sheet index = rowPage * colPages + colPage. Total = rowPages × colPages.
 *
 * DRAWING WITHIN A TILE
 * Every x drawn on a tile is first shifted by the tile origin and then CLAMPED to
 * the tile's drawable timeline window, so a bar spanning several tiles is drawn
 * as the correct fragment on each — no bar ever bleeds into the label column or
 * past the page edge. Dependency arrows are only drawn on the page where BOTH
 * endpoints are visible (same row-band and both x's inside the tile window);
 * this is a deliberate, documented simplification over cross-page routing.
 *
 * COLOURS
 * Task colours are hex ("#6366f1"); jsPDF wants numeric r,g,b. `hexToRgb` parses
 * (guarding against empty/malformed input via a category fallback) and `tint`
 * blends toward white for the light bar fill. We NEVER hand jsPDF an 8-digit hex.
 *
 * Deterministic: no Math.random / Date.now beyond the provided todayISO().
 * ────────────────────────────────────────────────────────────────────────────
 */

export interface PdfGanttOptions {
  paper: "a4" | "letter";
  zoom: ZoomLevel;
  /** mm. */ margin: number;
}

// ── Fixed layout constants (all mm unless noted) ─────────────────────────────
const LABEL_COL_W = 70; // sticky task-name column, repeated on every page
const ROW_H = 7; // per-task row height
const HEADER_BAND_H = 12; // section-title band at the top of each page
const TIMELINE_HEADER_H = 14; // two-tier axis header (major row + minor row)
const FOOTER_H = 8; // footer band reserved at the bottom
const BAR_H = 4; // leaf task bar height, centred in the row
const SUMMARY_BAR_H = 2.2; // slim summary/parent bracket bar
const MILESTONE_R = 2; // milestone diamond half-diagonal (mm)

// mm-per-day is derived from the timeline's px scale, then clamped so a single
// day column is never absurdly wide (day zoom) or an invisible sliver (year).
const MM_PER_DAY_MIN = 0.4;
const MM_PER_DAY_MAX = 12;
const PX_TO_MM = 0.26; // rough px→mm factor before clamping

// Palette (r,g,b) — jsPDF numeric colours.
const INK: [number, number, number] = [30, 30, 40];
const BRAND: [number, number, number] = [79, 70, 229];
const MUTED: [number, number, number] = [110, 110, 130];
const GRID: [number, number, number] = [222, 224, 232];
const WEEKEND: [number, number, number] = [238, 240, 245];
const ROW_ALT: [number, number, number] = [248, 249, 252];
const LINK: [number, number, number] = [140, 143, 156];
const RED: [number, number, number] = [220, 38, 38];
const SUMMARY_INK: [number, number, number] = [55, 58, 72];
const DEFAULT_COLOR = "#6366f1";

// ── Public entry point ───────────────────────────────────────────────────────

/** Draws the Gantt onto NEW pages appended to `doc`. Assumes the caller adds
 *  the title/data pages separately. Returns nothing. */
export function drawGanttPages(
  doc: jsPDF,
  project: Project,
  schedule: ScheduleResult,
  opts: PdfGanttOptions,
): void {
  const tasks = schedule.tasks;
  if (tasks.length === 0) return;

  const weekendDays = project.meta.weekendDays ?? [];
  const holidays = project.meta.holidays ?? [];

  // Chart window = earliest start .. latest end across tasks, clamped to the
  // project window when the project window is the wider bound.
  const { chartStart, chartEnd } = chartRange(project, tasks);
  const tl = buildTimeline(chartStart, chartEnd, opts.zoom, weekendDays);

  // px → mm, clamped to a legible band.
  const mmPerDay = clamp(
    tl.pxPerDay * PX_TO_MM,
    MM_PER_DAY_MIN,
    MM_PER_DAY_MAX,
  );
  const mmPerPx = tl.pxPerDay > 0 ? mmPerDay / tl.pxPerDay : 0;
  const timelineWidthMm = tl.totalDays * mmPerDay;

  // Page geometry (landscape). Compute from a probe page so we know the size.
  doc.addPage(opts.paper, "landscape");
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = opts.margin;
  const contentW = pageW - m * 2;
  const contentH = pageH - m * 2;

  const chartTopY = m + HEADER_BAND_H; // y of the timeline header top
  const rowsTopY = chartTopY + TIMELINE_HEADER_H; // y of the first task row
  const bodyH = contentH - HEADER_BAND_H - TIMELINE_HEADER_H - FOOTER_H;
  const rowsPerPage = Math.max(1, Math.floor(bodyH / ROW_H));

  const drawableTimelineW = contentW - LABEL_COL_W; // mm available for bars
  const colPages = Math.max(1, Math.ceil(timelineWidthMm / drawableTimelineW));
  const rowPages = Math.max(1, Math.ceil(tasks.length / rowsPerPage));
  const totalSheets = rowPages * colPages;

  const chartLeftX = m + LABEL_COL_W; // left edge of the drawable timeline

  const ctx: DrawCtx = {
    doc,
    m,
    pageW,
    pageH,
    contentW,
    chartTopY,
    rowsTopY,
    chartLeftX,
    drawableTimelineW,
    rowsPerPage,
    mmPerPx,
    mmPerDay,
    tl,
    weekendDays,
    holidays,
    zoom: opts.zoom,
    tasks,
  };

  let sheet = 0;
  for (let rp = 0; rp < rowPages; rp++) {
    const rowStart = rp * rowsPerPage;
    const rowEnd = Math.min(tasks.length, rowStart + rowsPerPage);

    for (let cp = 0; cp < colPages; cp++) {
      sheet += 1;
      // First sheet reuses the probe page; later sheets add their own.
      if (sheet > 1) doc.addPage(opts.paper, "landscape");

      const tileX0 = cp * drawableTimelineW; // mm window into the timeline
      const tileX1 = Math.min(timelineWidthMm, tileX0 + drawableTimelineW);

      drawSheet(ctx, {
        rowStart,
        rowEnd,
        tileX0,
        tileX1,
        sheet,
        totalSheets,
      });
    }
  }
}

// ── Per-sheet drawing ─────────────────────────────────────────────────────────

interface DrawCtx {
  doc: jsPDF;
  m: number;
  pageW: number;
  pageH: number;
  contentW: number;
  chartTopY: number;
  rowsTopY: number;
  chartLeftX: number;
  drawableTimelineW: number;
  rowsPerPage: number;
  /** Scale factors bridging the timeline's px geometry to page mm. */
  mmPerPx: number;
  mmPerDay: number;
  tl: Timeline;
  weekendDays: number[];
  holidays: string[];
  zoom: ZoomLevel;
  tasks: ScheduledTask[];
}

interface SheetSpec {
  rowStart: number;
  rowEnd: number;
  /** mm window into the timeline this tile covers. */
  tileX0: number;
  tileX1: number;
  sheet: number;
  totalSheets: number;
}

function drawSheet(ctx: DrawCtx, s: SheetSpec): void {
  const { doc } = ctx;
  const rows = ctx.tasks.slice(s.rowStart, s.rowEnd);

  // Date range covered by this tile (for the title / footer label).
  const winStartISO = ctx.tl.dateForX(mmToPx(ctx, s.tileX0));
  const winEndISO = ctx.tl.dateForX(
    mmToPx(ctx, Math.max(s.tileX0, s.tileX1 - 0.01)),
  );

  // Convert a timeline mm offset to an absolute page x within this tile,
  // returning null when it lies outside the tile window (so callers can skip).
  const pageXRaw = (mmOffset: number) => ctx.chartLeftX + (mmOffset - s.tileX0);
  // Clamp an absolute page x to the drawable timeline band of this tile.
  const clampX = (x: number) =>
    clamp(x, ctx.chartLeftX, ctx.chartLeftX + (s.tileX1 - s.tileX0));

  // 1) Section title band.
  drawTitleBand(ctx, s, winStartISO, winEndISO);

  // 2) Backgrounds: weekend/holiday shading + alternating rows + gridlines.
  const bodyTop = ctx.rowsTopY;
  const bodyBottom = ctx.rowsTopY + rows.length * ROW_H;
  const bandRight = ctx.chartLeftX + (s.tileX1 - s.tileX0);

  drawWeekendShading(ctx, s, pageXRaw, bodyTop, bodyBottom);
  drawRowStripes(ctx, rows.length, bodyTop);
  drawMajorGridlines(ctx, s, pageXRaw, bodyTop, bodyBottom);

  // 3) Timeline header (two-tier) — only ticks inside this tile window.
  drawTimelineHeader(ctx, pageXRaw, clampX, bandRight);

  // 4) Sticky label column + task names.
  drawLabelColumn(ctx, rows, bodyTop);

  // 5) Task bars / milestones / summary brackets.
  const barCenters = new Map<string, { y: number; x1: number; x2: number }>();
  rows.forEach((task, i) => {
    const rowY = bodyTop + i * ROW_H;
    drawTaskRow(ctx, s, task, rowY, pageXRaw, clampX, barCenters);
  });

  // 6) Dependency arrows — only when both ends are on THIS page.
  drawDependencies(ctx, s, rows, barCenters);

  // 7) Today line (red) if today falls inside this tile window.
  drawTodayLine(ctx, s, pageXRaw, bodyTop, bodyBottom);

  // 8) Frame around the drawable band + label column border.
  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.2);
  doc.line(ctx.chartLeftX, bodyTop, ctx.chartLeftX, bodyBottom); // label divider
  doc.rect(ctx.m, bodyTop, ctx.contentW, rows.length * ROW_H);

  // 9) Footer (page number + sheet + date range). No author branding here.
  drawFooter(ctx, s, winStartISO, winEndISO);
}

function drawTitleBand(
  ctx: DrawCtx,
  s: SheetSpec,
  winStartISO: string,
  winEndISO: string,
): void {
  const { doc } = ctx;
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, ctx.pageW, 2.4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BRAND);
  doc.text("Gantt Chart", ctx.m, ctx.m + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const range = `${formatShort(winStartISO)} → ${formatShort(winEndISO)}`;
  doc.text(range, ctx.m, ctx.m + 11);

  const sheetLabel = `Sheet ${s.sheet} of ${s.totalSheets}`;
  doc.text(sheetLabel, ctx.pageW - ctx.m, ctx.m + 6, { align: "right" });
}

function drawWeekendShading(
  ctx: DrawCtx,
  s: SheetSpec,
  pageXRaw: (mm: number) => number,
  top: number,
  bottom: number,
): void {
  if (ctx.zoom !== "day" && ctx.zoom !== "week") return;
  if (bottom <= top) return;
  const { doc } = ctx;
  const bandLeft = ctx.chartLeftX;
  const bandRight = ctx.chartLeftX + (s.tileX1 - s.tileX0);
  doc.setFillColor(...WEEKEND);
  for (const tick of ctx.tl.minorTicks) {
    const isWeekend = tick.isWeekendCol === true;
    const isHoliday = ctx.holidays.includes(tick.date);
    if (!isWeekend && !isHoliday) continue;
    const x0mm = tick.x * ctx.mmPerPx;
    const wMm = tick.width * ctx.mmPerPx;
    let x1 = pageXRaw(x0mm);
    let x2 = pageXRaw(x0mm + wMm);
    x1 = clamp(x1, bandLeft, bandRight);
    x2 = clamp(x2, bandLeft, bandRight);
    if (x2 - x1 <= 0.05) continue;
    doc.rect(x1, top, x2 - x1, bottom - top, "F");
  }
}

function drawRowStripes(ctx: DrawCtx, nRows: number, top: number): void {
  const { doc } = ctx;
  doc.setFillColor(...ROW_ALT);
  for (let i = 0; i < nRows; i++) {
    if (i % 2 === 1) continue; // shade even rows
    doc.rect(ctx.m, top + i * ROW_H, ctx.contentW, ROW_H, "F");
  }
}

function drawMajorGridlines(
  ctx: DrawCtx,
  s: SheetSpec,
  pageXRaw: (mm: number) => number,
  top: number,
  bottom: number,
): void {
  if (bottom <= top) return;
  const { doc } = ctx;
  const bandLeft = ctx.chartLeftX;
  const bandRight = ctx.chartLeftX + (s.tileX1 - s.tileX0);
  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.2);
  for (const tick of ctx.tl.majorTicks) {
    const xMm = tick.x * ctx.mmPerPx;
    const x = pageXRaw(xMm);
    if (x < bandLeft - 0.01 || x > bandRight + 0.01) continue;
    doc.line(x, top, x, bottom);
  }
}

function drawTimelineHeader(
  ctx: DrawCtx,
  pageXRaw: (mm: number) => number,
  clampX: (x: number) => number,
  bandRight: number,
): void {
  const { doc } = ctx;
  const top = ctx.chartTopY;
  const majorH = TIMELINE_HEADER_H * 0.55;
  const minorTop = top + majorH;
  const bandLeft = ctx.chartLeftX;

  // Header background.
  doc.setFillColor(245, 246, 250);
  doc.rect(bandLeft, top, bandRight - bandLeft, TIMELINE_HEADER_H, "F");
  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.2);
  doc.rect(bandLeft, top, bandRight - bandLeft, TIMELINE_HEADER_H);
  doc.line(bandLeft, minorTop, bandRight, minorTop);

  const mm = ctx.mmPerPx;

  // Major ticks (top row).
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  for (const tick of ctx.tl.majorTicks) {
    const x0 = pageXRaw(tick.x * mm);
    const x1 = pageXRaw((tick.x + tick.width) * mm);
    const cx0 = clampX(x0);
    const cx1 = clampX(x1);
    if (cx1 - cx0 <= 0.5) continue;
    doc.setDrawColor(...GRID);
    doc.line(cx0, top, cx0, minorTop);
    if (cx1 - cx0 >= 8) {
      doc.text(
        fit(doc, tick.label, cx1 - cx0 - 3),
        cx0 + 1.5,
        top + majorH - 2,
      );
    }
  }

  // Minor ticks (bottom row).
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  for (const tick of ctx.tl.minorTicks) {
    const x0 = pageXRaw(tick.x * mm);
    const x1 = pageXRaw((tick.x + tick.width) * mm);
    const cx0 = clampX(x0);
    const cx1 = clampX(x1);
    if (cx1 - cx0 <= 0.2) continue;
    doc.setDrawColor(...GRID);
    doc.line(cx0, minorTop, cx0, top + TIMELINE_HEADER_H);
    if (cx1 - cx0 >= 3.2) {
      const label = fit(doc, tick.label, cx1 - cx0 - 1);
      doc.text(
        label,
        (cx0 + cx1) / 2,
        minorTop + (TIMELINE_HEADER_H - majorH) / 2 + 1,
        {
          align: "center",
        },
      );
    }
  }
}

function drawLabelColumn(
  ctx: DrawCtx,
  rows: ScheduledTask[],
  top: number,
): void {
  const { doc } = ctx;
  const colLeft = ctx.m;
  const textLeft = colLeft + 2;
  const maxNameW = LABEL_COL_W - 4;

  rows.forEach((task, i) => {
    const rowY = top + i * ROW_H;
    const baseline = rowY + ROW_H / 2 + 1.6;
    const indent = Math.min(task.depth, 6) * 3; // clamp deep nesting
    let x = textLeft + indent;

    // Milestone marker glyph.
    if (task.isMilestone) {
      const color = resolveColor(task);
      doc.setFillColor(...color);
      diamond(doc, x + 1.4, rowY + ROW_H / 2, 1.4, color);
      x += 4;
    }

    const bold = task.hasChildren;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...(bold ? SUMMARY_INK : INK));
    const name = fit(
      doc,
      task.name || "(untitled)",
      maxNameW - indent - (task.isMilestone ? 4 : 0),
    );
    doc.text(name, x, baseline);
  });
}

function drawTaskRow(
  ctx: DrawCtx,
  s: SheetSpec,
  task: ScheduledTask,
  rowY: number,
  pageXRaw: (mm: number) => number,
  clampX: (x: number) => number,
  barCenters: Map<string, { y: number; x1: number; x2: number }>,
): void {
  const { doc } = ctx;
  const midY = rowY + ROW_H / 2;
  const color = resolveColor(task);

  // Raw (pre-clamp) endpoints, so we can record true positions for arrows and
  // decide whether an endpoint is visible on this tile.
  const startX = pageXRaw(mmForDate(ctx, task.startDate));
  // Bars are inclusive: extend one day past the end date's left edge.
  const endX = pageXRaw(mmForDate(ctx, task.endDate) + ctx.mmPerDay);

  if (task.isMilestone) {
    if (inTile(ctx, s, startX)) {
      diamond(doc, clampX(startX), midY, MILESTONE_R, color);
    }
    barCenters.set(task.id, { y: midY, x1: startX, x2: startX });
    return;
  }

  const x1 = clampX(startX);
  const x2 = clampX(endX);
  barCenters.set(task.id, { y: midY, x1: startX, x2: endX });

  const drawW = x2 - x1;
  if (drawW <= 0.2) return; // nothing of this bar is on this tile

  if (task.hasChildren) {
    // Summary/parent bracket bar: slim dark rect + down-ticks at each end.
    const by = midY - SUMMARY_BAR_H / 2;
    doc.setFillColor(...SUMMARY_INK);
    doc.rect(x1, by, drawW, SUMMARY_BAR_H, "F");
    // End caps (down-ticks) only where the real end is visible on this tile.
    const capH = 2;
    if (inTile(ctx, s, startX)) {
      doc.setFillColor(...SUMMARY_INK);
      doc.triangle(
        x1,
        by + SUMMARY_BAR_H,
        x1 + 2,
        by + SUMMARY_BAR_H,
        x1,
        by + SUMMARY_BAR_H + capH,
        "F",
      );
    }
    if (inTile(ctx, s, endX)) {
      doc.triangle(
        x2,
        by + SUMMARY_BAR_H,
        x2 - 2,
        by + SUMMARY_BAR_H,
        x2,
        by + SUMMARY_BAR_H + capH,
        "F",
      );
    }
    return;
  }

  // Leaf bar: light tint fill + coloured stroke, rounded.
  const by = midY - BAR_H / 2;
  const fill = tint(color, 0.8);
  doc.setFillColor(...fill);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  roundedRect(doc, x1, by, drawW, BAR_H, 0.8, "FD");

  // Progress overlay: solid task colour covering rolledProgress% of the bar,
  // measured against the FULL bar width, then clipped to the drawn fragment.
  const prog = clamp(task.rolledProgress ?? task.progress ?? 0, 0, 100) / 100;
  if (prog > 0) {
    const fullW = endX - startX;
    const progRightRaw = startX + fullW * prog;
    const pStart = Math.max(x1, startX);
    const pEnd = Math.min(x2, progRightRaw);
    const pw = pEnd - pStart;
    if (pw > 0.05) {
      doc.setFillColor(...color);
      roundedRect(doc, pStart, by, pw, BAR_H, 0.6, "F");
    }
  }

  // Critical accent: thin red top edge + red dot at the (visible) bar end.
  if (task.critical) {
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.35);
    doc.line(x1, by, x2, by);
    if (inTile(ctx, s, endX)) {
      doc.setFillColor(...RED);
      doc.circle(x2, midY, 0.7, "F");
    }
  }
}

function drawDependencies(
  ctx: DrawCtx,
  s: SheetSpec,
  rows: ScheduledTask[],
  barCenters: Map<string, { y: number; x1: number; x2: number }>,
): void {
  const { doc } = ctx;
  const visibleIds = new Set(rows.map((r) => r.id));

  for (const succ of rows) {
    for (const dep of succ.dependencies) {
      const predId = dep.from;
      // Both endpoints must be visible on THIS page (row-band).
      if (!visibleIds.has(predId) || !visibleIds.has(succ.id)) continue;
      const pred = barCenters.get(predId);
      const sc = barCenters.get(succ.id);
      const predTask = rows.find((r) => r.id === predId);
      if (!pred || !sc || !predTask) continue;

      // FS-style routing: predecessor bar END → successor bar START.
      const fromX = pred.x2;
      const toX = sc.x1;
      const fromY = pred.y;
      const toY = sc.y;

      // Both x positions must be inside this tile window.
      if (!inTile(ctx, s, fromX) || !inTile(ctx, s, toX)) continue;

      const critical = predTask.critical && succ.critical;
      const stroke = critical ? RED : LINK;
      doc.setDrawColor(...stroke);
      doc.setLineWidth(0.3);

      // Orthogonal polyline: out-stub → vertical drop → into successor start.
      const stub = 3;
      doc.line(fromX, fromY, fromX + stub, fromY);
      doc.line(fromX + stub, fromY, fromX + stub, toY);
      if (fromX + stub !== toX) {
        doc.line(fromX + stub, toY, toX, toY);
      }

      // Arrowhead at the successor start, pointing right (into the bar).
      doc.setFillColor(...stroke);
      const a = 1.1;
      doc.triangle(
        toX,
        toY,
        toX - a,
        toY - a * 0.8,
        toX - a,
        toY + a * 0.8,
        "F",
      );
    }
  }
}

function drawTodayLine(
  ctx: DrawCtx,
  s: SheetSpec,
  pageXRaw: (mm: number) => number,
  top: number,
  bottom: number,
): void {
  if (bottom <= top) return;
  const today = todayISO();
  // Only if today is within the overall timeline.
  if (
    daysBetween(ctx.tl.start, today) < 0 ||
    daysBetween(today, ctx.tl.end) < 0
  )
    return;
  const x = pageXRaw(mmForDate(ctx, today));
  if (!inTile(ctx, s, x)) return;
  const { doc } = ctx;
  doc.setDrawColor(...RED);
  doc.setLineWidth(0.4);
  doc.line(x, top, x, bottom);
  doc.setFillColor(...RED);
  doc.circle(x, top, 0.9, "F");
}

function drawFooter(
  ctx: DrawCtx,
  s: SheetSpec,
  winStartISO: string,
  winEndISO: string,
): void {
  const { doc } = ctx;
  const y = ctx.pageH - 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  const label = `Gantt Chart · Sheet ${s.sheet} of ${s.totalSheets} · ${formatShort(
    winStartISO,
  )} – ${formatShort(winEndISO)}`;
  doc.text(label, ctx.pageW - ctx.m, y, { align: "right" });
  doc.text(String(doc.getNumberOfPages()), ctx.m, y);
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

function chartRange(
  project: Project,
  tasks: ScheduledTask[],
): { chartStart: string; chartEnd: string } {
  let start = tasks[0]!.startDate;
  let end = tasks[0]!.endDate;
  for (const t of tasks) {
    if (daysBetween(t.startDate, start) > 0) start = t.startDate;
    if (daysBetween(end, t.endDate) > 0) end = t.endDate;
  }
  // Clamp to the project window when it is the wider bound.
  const pStart = project.meta.startDate;
  const pEnd = project.meta.endDate;
  if (pStart && daysBetween(pStart, start) > 0) start = pStart;
  if (pEnd && daysBetween(end, pEnd) > 0) end = pEnd;
  return { chartStart: start, chartEnd: end };
}

/** Map an ISO date → mm offset from the timeline origin. */
function mmForDate(ctx: DrawCtx, iso: string): number {
  return ctx.tl.xFor(iso) * ctx.mmPerPx;
}

/** True if absolute page x lies within this tile's drawable timeline band. */
function inTile(ctx: DrawCtx, s: SheetSpec, x: number): boolean {
  const left = ctx.chartLeftX;
  const right = ctx.chartLeftX + (s.tileX1 - s.tileX0);
  return x >= left - 0.01 && x <= right + 0.01;
}

/** Convert a mm offset on the timeline back to a px offset on the timeline. */
function mmToPx(ctx: DrawCtx, mmOffset: number): number {
  return ctx.mmPerPx > 0 ? mmOffset / ctx.mmPerPx : 0;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// ── Drawing primitives ─────────────────────────────────────────────────────────

/** A filled diamond (45°-rotated square) centred at (cx, cy). */
function diamond(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  color: [number, number, number],
): void {
  doc.setFillColor(...color);
  // Two triangles sharing the horizontal diagonal.
  doc.triangle(cx, cy - r, cx + r, cy, cx, cy + r, "F");
  doc.triangle(cx, cy - r, cx - r, cy, cx, cy + r, "F");
}

/** Rounded rectangle wrapper (jsPDF roundedRect with clamped radius). */
function roundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  style: "F" | "FD" | "D",
): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  if (rr <= 0.05) {
    doc.rect(x, y, w, h, style);
    return;
  }
  doc.roundedRect(x, y, w, h, rr, rr, style);
}

/** Truncate text to fit `maxW` mm, appending "…" when clipped. */
function fit(doc: jsPDF, text: string, maxW: number): string {
  if (maxW <= 0) return "";
  if (doc.getTextWidth(text) <= maxW) return text;
  const ell = "…";
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (doc.getTextWidth(text.slice(0, mid) + ell) <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return lo <= 0 ? ell : text.slice(0, lo) + ell;
}

// ── Colour helpers ──────────────────────────────────────────────────────────────

/** Resolve a task's bar colour: explicit hex, else category-derived. */
function resolveColor(task: ScheduledTask): [number, number, number] {
  const raw =
    task.color && task.color.trim()
      ? task.color
      : colorForCategory(task.category);
  return hexToRgb(raw || DEFAULT_COLOR);
}

/** Parse a #rrggbb / #rgb hex into [r,g,b]; falls back to indigo when invalid.
 *  NEVER returns/consumes 8-digit hex — jsPDF takes numeric channels only. */
function hexToRgb(hex: string): [number, number, number] {
  const h = (hex || "").trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    const r = parseInt(h[0]! + h[0]!, 16);
    const g = parseInt(h[1]! + h[1]!, 16);
    const b = parseInt(h[2]! + h[2]!, 16);
    return [r, g, b];
  }
  if (/^[0-9a-fA-F]{6}$/.test(h)) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  // Malformed / empty / 8-digit — fall back to the default indigo.
  return [99, 102, 241];
}

/** Blend a colour toward white by factor `t` (0 = original, 1 = white). */
function tint(
  rgb: [number, number, number],
  t: number,
): [number, number, number] {
  const k = clamp(t, 0, 1);
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * k),
    Math.round(rgb[1] + (255 - rgb[1]) * k),
    Math.round(rgb[2] + (255 - rgb[2]) * k),
  ];
}
