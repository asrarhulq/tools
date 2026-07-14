import type { UnitSystem } from "../types";

/**
 * Unit conversion + formatting for the data panels. Internal values are SI;
 * these render them in SI or Imperial with appropriate precision and labels.
 */

export function force(n: number, u: UnitSystem): string {
  return u === "si" ? `${n.toFixed(0)} N` : `${(n * 0.224809).toFixed(0)} lbf`;
}

export function torque(nm: number, u: UnitSystem): string {
  return u === "si"
    ? `${nm.toFixed(1)} N·m`
    : `${(nm * 0.737562).toFixed(1)} ft·lb`;
}

export function mass(kg: number, u: UnitSystem): string {
  return u === "si" ? `${kg.toFixed(1)} kg` : `${(kg * 2.20462).toFixed(1)} lb`;
}

export function length(m: number, u: UnitSystem): string {
  if (u === "si") return `${(m * 100).toFixed(0)} cm`;
  const totalIn = m * 39.3701;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return `${ft}′${inch}″`;
}

export function power(w: number, u: UnitSystem): string {
  return u === "si" ? `${w.toFixed(0)} W` : `${(w / 745.7).toFixed(2)} hp`;
}

export function energy(j: number, u: UnitSystem): string {
  return u === "si"
    ? `${(j / 1000).toFixed(1)} kJ`
    : `${(j * 0.000239006).toFixed(1)} kcal`;
}

export function speed(mps: number, u: UnitSystem): string {
  return u === "si"
    ? `${(mps * 3.6).toFixed(1)} km/h`
    : `${(mps * 2.23694).toFixed(1)} mph`;
}

export function degrees(rad: number): string {
  return `${((rad * 180) / Math.PI).toFixed(0)}°`;
}
