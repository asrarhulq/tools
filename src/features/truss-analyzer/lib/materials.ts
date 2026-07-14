import type { Material } from "../types";

/**
 * Material library (SI base units: E and yield in Pa, density in kg/m³).
 * Representative engineering values for common structural materials.
 */
export const MATERIALS: readonly Material[] = [
  {
    id: "steel-a36",
    name: "Structural Steel (A36)",
    E: 200e9,
    yield: 250e6,
    density: 7850,
  },
  {
    id: "steel-a992",
    name: "Structural Steel (A992)",
    E: 200e9,
    yield: 345e6,
    density: 7850,
  },
  {
    id: "aluminum-6061",
    name: "Aluminum 6061-T6",
    E: 68.9e9,
    yield: 276e6,
    density: 2700,
  },
  {
    id: "aluminum-6063",
    name: "Aluminum 6063-T5",
    E: 68.9e9,
    yield: 145e6,
    density: 2700,
  },
  {
    id: "titanium",
    name: "Titanium Ti-6Al-4V",
    E: 113.8e9,
    yield: 880e6,
    density: 4430,
  },
  {
    id: "wood-df",
    name: "Douglas Fir (timber)",
    E: 13.1e9,
    yield: 50e6,
    density: 530,
  },
  {
    id: "cfrp",
    name: "Carbon Fiber (CFRP)",
    E: 150e9,
    yield: 1500e6,
    density: 1600,
  },
] as const;

export const DEFAULT_MATERIAL_ID = "steel-a36";

export function getMaterial(id: string): Material {
  return MATERIALS.find((m) => m.id === id) ?? MATERIALS[0]!;
}

/**
 * Standard cross-section presets, area in m². Users can also enter a custom
 * area. `radiusOfGyration` (m) is used for the Euler buckling check; for a
 * generic section we approximate r ≈ 0.35·√area (a mid-range value between a
 * solid bar and a hollow tube) unless a specific section provides it.
 */
export interface SectionPreset {
  id: string;
  name: string;
  area: number; // m²
  /** Radius of gyration, m (for buckling). */
  r: number;
}

export const SECTIONS: readonly SectionPreset[] = [
  { id: "rod-10", name: "Solid rod ⌀10 mm", area: 7.85e-5, r: 2.5e-3 },
  { id: "rod-20", name: "Solid rod ⌀20 mm", area: 3.14e-4, r: 5e-3 },
  { id: "tube-25x2", name: "Tube 25×2 mm", area: 1.45e-4, r: 8.2e-3 },
  { id: "tube-40x3", name: "Tube 40×3 mm", area: 3.49e-4, r: 1.31e-2 },
  { id: "shs-50x4", name: "Square HSS 50×4 mm", area: 7.04e-4, r: 1.87e-2 },
  { id: "angle-50x5", name: "Angle 50×50×5 mm", area: 4.8e-4, r: 9.7e-3 },
] as const;

export const DEFAULT_AREA = 3.49e-4; // Tube 40×3 mm

/** Approximate radius of gyration (m) for buckling when the section is custom. */
export function radiusOfGyration(area: number, sectionId?: string): number {
  const preset = SECTIONS.find((s) => s.id === sectionId);
  if (preset) return preset.r;
  // Generic fallback: r ≈ 0.35·√A (between solid & hollow bounds).
  return 0.35 * Math.sqrt(Math.max(area, 1e-9));
}
