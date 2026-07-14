import {
  addDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachQuarterOfInterval,
  eachYearOfInterval,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { ISODate, ZoomLevel } from "../types";
import { addDaysISO, daysBetween, parse, toISO } from "./dates";

/**
 * Timeline geometry. Given a date range and zoom level, produces the pixel
 * scale (px per day) and the header tick columns (major + minor). The Gantt
 * body and axis share this so bars, gridlines, and labels always align.
 */

export interface TimelineTick {
  /** Left offset in px from the timeline origin. */
  x: number;
  width: number;
  label: string;
  /** ISO date of the tick start (for weekend/holiday shading & today line). */
  date: ISODate;
  isWeekendCol?: boolean;
}

export interface Timeline {
  start: ISODate;
  end: ISODate;
  pxPerDay: number;
  totalDays: number;
  width: number;
  majorTicks: TimelineTick[];
  minorTicks: TimelineTick[];
  /** Map an ISO date to an x offset. */
  xFor: (date: ISODate) => number;
  /** Map an x offset back to the nearest ISO date. */
  dateForX: (x: number) => ISODate;
}

const PX_PER_DAY: Record<ZoomLevel, number> = {
  day: 44,
  week: 20,
  month: 6,
  quarter: 2.6,
  year: 1.1,
};

export function buildTimeline(
  rangeStart: ISODate,
  rangeEnd: ISODate,
  zoom: ZoomLevel,
  weekendDays: number[],
): Timeline {
  // Pad the range a little so bars near the edges breathe.
  const start = addDaysISO(rangeStart, -pad(zoom));
  const end = addDaysISO(rangeEnd, pad(zoom));
  const totalDays = Math.max(1, daysBetween(start, end) + 1);
  const pxPerDay = PX_PER_DAY[zoom];
  const width = totalDays * pxPerDay;

  const xFor = (date: ISODate) => daysBetween(start, date) * pxPerDay;
  const dateForX = (x: number) => addDaysISO(start, Math.round(x / pxPerDay));

  const { major, minor } = buildTicks(
    start,
    end,
    zoom,
    pxPerDay,
    xFor,
    weekendDays,
  );

  return {
    start,
    end,
    pxPerDay,
    totalDays,
    width,
    majorTicks: major,
    minorTicks: minor,
    xFor,
    dateForX,
  };
}

function pad(zoom: ZoomLevel): number {
  switch (zoom) {
    case "day":
      return 2;
    case "week":
      return 7;
    case "month":
      return 15;
    case "quarter":
      return 45;
    case "year":
      return 120;
  }
}

function buildTicks(
  start: ISODate,
  end: ISODate,
  zoom: ZoomLevel,
  pxPerDay: number,
  xFor: (d: ISODate) => number,
  weekendDays: number[],
): { major: TimelineTick[]; minor: TimelineTick[] } {
  const s = parse(start);
  const e = parse(end);
  const major: TimelineTick[] = [];
  const minor: TimelineTick[] = [];

  const colWidth = (from: Date, to: Date) =>
    (daysBetween(toISO(from), toISO(to)) + 1) * pxPerDay;

  if (zoom === "day") {
    // Major = months, minor = days.
    for (const m of eachMonthOfInterval({ start: s, end: e })) {
      const from = m < s ? s : startOfMonth(m);
      const to = endOfMonth(m) > e ? e : endOfMonth(m);
      major.push({
        x: xFor(toISO(from)),
        width: colWidth(from, to),
        label: format(m, "MMMM yyyy"),
        date: toISO(from),
      });
    }
    for (const d of eachDayOfInterval({ start: s, end: e })) {
      minor.push({
        x: xFor(toISO(d)),
        width: pxPerDay,
        label: format(d, "d"),
        date: toISO(d),
        isWeekendCol: weekendDays.includes(d.getDay()),
      });
    }
  } else if (zoom === "week") {
    for (const m of eachMonthOfInterval({ start: s, end: e })) {
      const from = m < s ? s : startOfMonth(m);
      const to = endOfMonth(m) > e ? e : endOfMonth(m);
      major.push({
        x: xFor(toISO(from)),
        width: colWidth(from, to),
        label: format(m, "MMM yyyy"),
        date: toISO(from),
      });
    }
    for (const w of eachWeekOfInterval(
      { start: s, end: e },
      { weekStartsOn: 1 },
    )) {
      const from = w < s ? s : startOfWeek(w, { weekStartsOn: 1 });
      const to = endOfWeek(w, { weekStartsOn: 1 });
      minor.push({
        x: xFor(toISO(from)),
        width: colWidth(from, to > e ? e : to),
        label: format(from, "d MMM"),
        date: toISO(from),
      });
    }
  } else if (zoom === "month") {
    for (const q of eachQuarterOfInterval({ start: s, end: e })) {
      const from = q < s ? s : startOfQuarter(q);
      const to = endOfQuarter(q) > e ? e : endOfQuarter(q);
      major.push({
        x: xFor(toISO(from)),
        width: colWidth(from, to),
        label: `Q${Math.floor(q.getMonth() / 3) + 1} ${q.getFullYear()}`,
        date: toISO(from),
      });
    }
    for (const m of eachMonthOfInterval({ start: s, end: e })) {
      const from = m < s ? s : startOfMonth(m);
      const to = endOfMonth(m) > e ? e : endOfMonth(m);
      minor.push({
        x: xFor(toISO(from)),
        width: colWidth(from, to),
        label: format(m, "MMM"),
        date: toISO(from),
      });
    }
  } else if (zoom === "quarter") {
    for (const y of eachYearOfInterval({ start: s, end: e })) {
      const from = y < s ? s : startOfYear(y);
      const to = endOfYear(y) > e ? e : endOfYear(y);
      major.push({
        x: xFor(toISO(from)),
        width: colWidth(from, to),
        label: format(y, "yyyy"),
        date: toISO(from),
      });
    }
    for (const q of eachQuarterOfInterval({ start: s, end: e })) {
      const from = q < s ? s : startOfQuarter(q);
      const to = endOfQuarter(q) > e ? e : endOfQuarter(q);
      minor.push({
        x: xFor(toISO(from)),
        width: colWidth(from, to),
        label: `Q${Math.floor(q.getMonth() / 3) + 1}`,
        date: toISO(from),
      });
    }
  } else {
    // year
    for (const y of eachYearOfInterval({ start: s, end: e })) {
      const from = y < s ? s : startOfYear(y);
      const to = endOfYear(y) > e ? e : endOfYear(y);
      const w = colWidth(from, to);
      major.push({
        x: xFor(toISO(from)),
        width: w,
        label: format(y, "yyyy"),
        date: toISO(from),
      });
      minor.push({
        x: xFor(toISO(from)),
        width: w,
        label: format(y, "yyyy"),
        date: toISO(from),
      });
    }
  }

  return { major, minor };
}

/** Round a pixel delta to a whole-day delta at the current scale. */
export function pxToDays(px: number, pxPerDay: number): number {
  return Math.round(px / pxPerDay);
}

export { addDays };
