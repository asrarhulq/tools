import type { UnitSystem } from "../types";

/**
 * Unit conversion + formatting. The model is SI base (m, N, Pa, m²); these
 * present values in the user's display system:
 *   SI       → length mm, force N, stress MPa, area mm²
 *   Imperial → length in, force lb, stress ksi, area in²
 */

const MM_PER_M = 1000;
const IN_PER_M = 39.3701;
const LB_PER_N = 0.224809;
const MPA_PER_PA = 1e-6;
const KSI_PER_PA = 1.45038e-7;

export function fmtLength(m: number, u: UnitSystem, digits = 1): string {
  return u === "si"
    ? `${(m * MM_PER_M).toFixed(digits)} mm`
    : `${(m * IN_PER_M).toFixed(digits)} in`;
}

export function fmtForce(n: number, u: UnitSystem, digits = 1): string {
  return u === "si"
    ? formatSci(n, "N", digits)
    : `${(n * LB_PER_N).toFixed(digits)} lb`;
}

export function fmtStress(pa: number, u: UnitSystem, digits = 1): string {
  return u === "si"
    ? `${(pa * MPA_PER_PA).toFixed(digits)} MPa`
    : `${(pa * KSI_PER_PA).toFixed(digits)} ksi`;
}

export function fmtArea(m2: number, u: UnitSystem): string {
  return u === "si"
    ? `${(m2 * MM_PER_M * MM_PER_M).toFixed(1)} mm²`
    : `${(m2 * IN_PER_M * IN_PER_M).toFixed(3)} in²`;
}

export function fmtMass(kg: number, u: UnitSystem): string {
  return u === "si" ? `${kg.toFixed(2)} kg` : `${(kg * 2.20462).toFixed(2)} lb`;
}

/** Compact scientific-ish formatting for forces (kN when large). */
function formatSci(n: number, unit: string, digits: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000) return `${(n / 1000).toFixed(digits)} k${unit}`;
  return `${n.toFixed(digits)} ${unit}`;
}

// ── Input parsing: display units → SI ────────────────────────────────────────

export function lengthToSI(v: number, u: UnitSystem): number {
  return u === "si" ? v / MM_PER_M : v / IN_PER_M;
}
export function lengthFromSI(m: number, u: UnitSystem): number {
  return u === "si" ? m * MM_PER_M : m * IN_PER_M;
}
export function forceToSI(v: number, u: UnitSystem): number {
  return u === "si" ? v : v / LB_PER_N;
}
export function forceFromSI(n: number, u: UnitSystem): number {
  return u === "si" ? n : n * LB_PER_N;
}
export function areaToSI(v: number, u: UnitSystem): number {
  return u === "si" ? v / (MM_PER_M * MM_PER_M) : v / (IN_PER_M * IN_PER_M);
}
export function areaFromSI(m2: number, u: UnitSystem): number {
  return u === "si" ? m2 * MM_PER_M * MM_PER_M : m2 * IN_PER_M * IN_PER_M;
}
export function stressToSI(v: number, u: UnitSystem): number {
  return u === "si" ? v / MPA_PER_PA : v / KSI_PER_PA;
}

export const UNIT_LABELS: Record<
  UnitSystem,
  { length: string; force: string; stress: string; area: string }
> = {
  si: { length: "mm", force: "N", stress: "MPa", area: "mm²" },
  imperial: { length: "in", force: "lb", stress: "ksi", area: "in²" },
};
