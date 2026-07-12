import type { Unit } from "../types";

/** Length-unit conversion + formatting. Model space is millimeters. */

const MM_PER_UNIT: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  in: 25.4,
};

export const UNIT_LABELS: Record<Unit, string> = {
  mm: "mm",
  cm: "cm",
  in: "in",
};

/** Convert a millimeter value into the target display unit. */
export function fromMm(valueMm: number, unit: Unit): number {
  return valueMm / MM_PER_UNIT[unit];
}

export function formatLength(valueMm: number, unit: Unit, digits = 2): string {
  return `${fromMm(valueMm, unit).toFixed(digits)} ${UNIT_LABELS[unit]}`;
}

/** Area (mm²) → unit². */
export function formatArea(valueMm2: number, unit: Unit, digits = 1): string {
  const f = MM_PER_UNIT[unit] ** 2;
  return `${(valueMm2 / f).toFixed(digits)} ${UNIT_LABELS[unit]}²`;
}

/** Volume (mm³) → unit³. */
export function formatVolume(valueMm3: number, unit: Unit, digits = 1): string {
  const f = MM_PER_UNIT[unit] ** 3;
  return `${(valueMm3 / f).toFixed(digits)} ${UNIT_LABELS[unit]}³`;
}

export function formatMass(grams: number): string {
  return grams >= 1000
    ? `${(grams / 1000).toFixed(2)} kg`
    : `${grams.toFixed(1)} g`;
}

export function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}
