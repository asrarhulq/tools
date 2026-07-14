import type { UnitSystem } from "../types";

/**
 * Unit conversion + formatting. Model is SI base (m, N, N·m, Pa, m⁴). Display:
 *   si       → mm, kN, kN·m, MPa
 *   metric   → m, kN, kN·m, MPa  (larger length scale for civil spans)
 *   imperial → in/ft, kip/lb, kip·ft, ksi
 */

const IN = 39.3701;
const FT = 3.28084;
const LB = 0.224809;

export function fmtLength(m: number, u: UnitSystem, digits = 2): string {
  if (u === "imperial") return `${(m * FT).toFixed(digits)} ft`;
  if (u === "metric") return `${m.toFixed(digits)} m`;
  return `${(m * 1000).toFixed(digits === 2 ? 0 : digits)} mm`;
}

/** Small lengths (deflection) — mm / in with more precision. */
export function fmtSmallLength(m: number, u: UnitSystem, digits = 2): string {
  return u === "imperial"
    ? `${(m * IN).toFixed(digits)} in`
    : `${(m * 1000).toFixed(digits)} mm`;
}

export function fmtForce(n: number, u: UnitSystem, digits = 2): string {
  if (u === "imperial") {
    const lb = n * LB;
    return Math.abs(lb) >= 1000
      ? `${(lb / 1000).toFixed(digits)} kip`
      : `${lb.toFixed(0)} lb`;
  }
  return `${(n / 1000).toFixed(digits)} kN`;
}

export function fmtMoment(nm: number, u: UnitSystem, digits = 2): string {
  return u === "imperial"
    ? `${(nm * LB * FT).toFixed(digits)} lb·ft`
    : `${(nm / 1000).toFixed(digits)} kN·m`;
}

export function fmtStress(pa: number, u: UnitSystem, digits = 1): string {
  return u === "imperial"
    ? `${(pa * 1.45038e-7).toFixed(digits)} ksi`
    : `${(pa / 1e6).toFixed(digits)} MPa`;
}

export function fmtDistLoad(npm: number, u: UnitSystem, digits = 2): string {
  return u === "imperial"
    ? `${((npm * LB) / FT).toFixed(digits)} lb/ft`
    : `${(npm / 1000).toFixed(digits)} kN/m`;
}

export function fmtMass(kg: number, u: UnitSystem): string {
  return u === "imperial"
    ? `${(kg * 2.20462).toFixed(1)} lb`
    : `${kg.toFixed(1)} kg`;
}

export function fmtFreq(hz: number): string {
  return `${hz.toFixed(1)} Hz`;
}

// display → SI
export function lengthToSI(v: number, u: UnitSystem): number {
  if (u === "imperial") return v / FT;
  if (u === "metric") return v;
  return v / 1000;
}
export function lengthFromSI(m: number, u: UnitSystem): number {
  if (u === "imperial") return m * FT;
  if (u === "metric") return m;
  return m * 1000;
}
export function forceToSI(v: number, u: UnitSystem): number {
  return u === "imperial" ? v / LB : v * 1000; // kN → N (si/metric)
}
export function forceFromSI(n: number, u: UnitSystem): number {
  return u === "imperial" ? n * LB : n / 1000;
}
export function dimToSI(v: number, u: UnitSystem): number {
  // Section dims entered in mm (si/metric) or in (imperial).
  return u === "imperial" ? v / IN : v / 1000;
}
export function dimFromSI(m: number, u: UnitSystem): number {
  return u === "imperial" ? m * IN : m * 1000;
}

export const UNIT_LABELS: Record<
  UnitSystem,
  {
    len: string;
    smallLen: string;
    force: string;
    moment: string;
    stress: string;
    dist: string;
    dim: string;
  }
> = {
  si: {
    len: "mm",
    smallLen: "mm",
    force: "kN",
    moment: "kN·m",
    stress: "MPa",
    dist: "kN/m",
    dim: "mm",
  },
  metric: {
    len: "m",
    smallLen: "mm",
    force: "kN",
    moment: "kN·m",
    stress: "MPa",
    dist: "kN/m",
    dim: "mm",
  },
  imperial: {
    len: "ft",
    smallLen: "in",
    force: "kip",
    moment: "lb·ft",
    stress: "ksi",
    dist: "lb/ft",
    dim: "in",
  },
};
