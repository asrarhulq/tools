/**
 * Julian Date helpers. Orbital mechanics works in continuous days since an
 * epoch rather than calendar dates, so the simulation clock is a Julian Date
 * (JD) internally and only converted to/from `Date` at the UI boundary.
 */

/** JD for 2000-01-01 12:00 TT (the J2000.0 epoch our orbital elements use). */
export const J2000_EPOCH_JD = 2451545.0;

const MS_PER_DAY = 86_400_000;
/** Unix epoch (1970-01-01 00:00 UTC) expressed as a Julian Date. */
const UNIX_EPOCH_JD = 2440587.5;

export function dateToJulianDate(date: Date): number {
  return date.getTime() / MS_PER_DAY + UNIX_EPOCH_JD;
}

export function julianDateToDate(jd: number): Date {
  return new Date((jd - UNIX_EPOCH_JD) * MS_PER_DAY);
}

export function daysSinceJ2000(jd: number): number {
  return jd - J2000_EPOCH_JD;
}
