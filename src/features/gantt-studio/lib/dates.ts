import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
} from "date-fns";
import type { ISODate } from "../types";

/**
 * Date helpers for the scheduler and timeline. Everything works in local-time
 * day granularity through ISO date strings (YYYY-MM-DD) so schedules are stable
 * across time zones and round-trip cleanly through JSON and exports.
 */

export function toISO(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

export function parse(date: ISODate): Date {
  const d = parseISO(date);
  return isValid(d) ? d : new Date();
}

/** Whole days from `a` to `b` (b − a); negative if b precedes a. */
export function daysBetween(a: ISODate, b: ISODate): number {
  return differenceInCalendarDays(parse(b), parse(a));
}

/** Inclusive duration in days: a 1-day task starts and ends the same day. */
export function inclusiveDuration(start: ISODate, end: ISODate): number {
  return Math.max(1, daysBetween(start, end) + 1);
}

/** End date for an inclusive duration starting at `start`. */
export function endForDuration(start: ISODate, duration: number): ISODate {
  return toISO(addDays(parse(start), Math.max(1, duration) - 1));
}

export function addDaysISO(date: ISODate, days: number): ISODate {
  return toISO(addDays(parse(date), days));
}

export function todayISO(): ISODate {
  return toISO(new Date());
}

export function isWeekend(date: ISODate, weekendDays: number[]): boolean {
  return weekendDays.includes(parse(date).getDay());
}

export function isHoliday(date: ISODate, holidays: ISODate[]): boolean {
  return holidays.includes(date);
}

export function minISO(a: ISODate, b: ISODate): ISODate {
  return daysBetween(a, b) >= 0 ? a : b;
}

export function maxISO(a: ISODate, b: ISODate): ISODate {
  return daysBetween(a, b) >= 0 ? b : a;
}

/** Clamp a date into [lo, hi]. */
export function clampISO(date: ISODate, lo: ISODate, hi: ISODate): ISODate {
  if (daysBetween(date, lo) > 0) return lo;
  if (daysBetween(hi, date) > 0) return hi;
  return date;
}

/** Human-friendly formatting for labels and reports. */
export function formatShort(date: ISODate): string {
  return format(parse(date), "d MMM yyyy");
}

export function formatDay(date: ISODate): string {
  return format(parse(date), "d");
}

export function formatMonth(date: ISODate): string {
  return format(parse(date), "MMM yyyy");
}

export function formatISOForFilename(date: ISODate): string {
  return date.replace(/-/g, "");
}
