import type { Material } from "../types";

/**
 * Material database for common FDM filaments. Values are representative
 * engineering figures (typical datasheet ranges) in consistent units:
 *   density g/cm³ · moduli & strengths MPa · thermal µm/m·°C · cost /kg.
 * Users can edit any field or add a custom material at runtime.
 */
export const MATERIALS: readonly Material[] = [
  {
    id: "pla",
    name: "PLA",
    density: 1.24,
    youngsModulus: 3500,
    yieldStrength: 50,
    ultimateStrength: 60,
    poissonRatio: 0.36,
    thermalExpansion: 68,
    costPerKg: 22,
  },
  {
    id: "pla-plus",
    name: "PLA+",
    density: 1.25,
    youngsModulus: 3200,
    yieldStrength: 55,
    ultimateStrength: 65,
    poissonRatio: 0.36,
    thermalExpansion: 70,
    costPerKg: 28,
  },
  {
    id: "petg",
    name: "PETG",
    density: 1.27,
    youngsModulus: 2100,
    yieldStrength: 50,
    ultimateStrength: 53,
    poissonRatio: 0.4,
    thermalExpansion: 60,
    costPerKg: 26,
  },
  {
    id: "abs",
    name: "ABS",
    density: 1.04,
    youngsModulus: 2000,
    yieldStrength: 40,
    ultimateStrength: 44,
    poissonRatio: 0.35,
    thermalExpansion: 90,
    costPerKg: 24,
  },
  {
    id: "asa",
    name: "ASA",
    density: 1.07,
    youngsModulus: 2100,
    yieldStrength: 44,
    ultimateStrength: 48,
    poissonRatio: 0.35,
    thermalExpansion: 98,
    costPerKg: 30,
  },
  {
    id: "pc",
    name: "Polycarbonate (PC)",
    density: 1.2,
    youngsModulus: 2300,
    yieldStrength: 62,
    ultimateStrength: 70,
    poissonRatio: 0.37,
    thermalExpansion: 68,
    costPerKg: 45,
  },
  {
    id: "nylon",
    name: "Nylon (PA)",
    density: 1.14,
    youngsModulus: 1700,
    yieldStrength: 48,
    ultimateStrength: 70,
    poissonRatio: 0.39,
    thermalExpansion: 95,
    costPerKg: 40,
  },
  {
    id: "tpu",
    name: "TPU",
    density: 1.21,
    youngsModulus: 26,
    yieldStrength: 9,
    ultimateStrength: 39,
    poissonRatio: 0.48,
    thermalExpansion: 140,
    costPerKg: 35,
  },
  {
    id: "cf-pla",
    name: "Carbon Fiber PLA",
    density: 1.29,
    youngsModulus: 6000,
    yieldStrength: 60,
    ultimateStrength: 68,
    poissonRatio: 0.34,
    thermalExpansion: 55,
    costPerKg: 48,
  },
  {
    id: "cf-nylon",
    name: "Carbon Fiber Nylon",
    density: 1.18,
    youngsModulus: 4500,
    yieldStrength: 75,
    ultimateStrength: 95,
    poissonRatio: 0.36,
    thermalExpansion: 50,
    costPerKg: 65,
  },
] as const;

export const DEFAULT_MATERIAL_ID = "pla";

export function getMaterial(id: string): Material {
  return MATERIALS.find((m) => m.id === id) ?? MATERIALS[0]!;
}

/** Build an editable custom material seeded from an existing one. */
export function makeCustomMaterial(seed: Material): Material {
  return { ...seed, id: "custom", name: "Custom", custom: true };
}
