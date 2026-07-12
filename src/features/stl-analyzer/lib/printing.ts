import type {
  GeometryResult,
  Material,
  PrintEstimate,
  PrintRecommendation,
  PrintSettings,
} from "../types";
import { MATERIALS } from "./materials";

/**
 * FDM print-cost & feasibility estimator. Physically-motivated heuristics
 * (solid-volume + infill fraction → filament mass → time/cost). Approximate,
 * in the spirit of a slicer's pre-estimate rather than a full slice.
 */

const FILAMENT_DIAMETER_MM = 1.75;
const PRINTER_POWER_W = 120; // typical FDM incl. heated bed
const ELECTRICITY_COST_PER_KWH = 0.15;
const CO2_PER_KWH_G = 400; // grid average g CO₂/kWh
const CO2_PER_G_FILAMENT = 3.1; // embodied CO₂ of plastic

export function estimatePrint(
  geometry: GeometryResult,
  material: Material,
  settings: PrintSettings,
): PrintEstimate {
  const volumeMm3 = geometry.volume;
  const surfaceMm2 = geometry.surfaceArea;

  // Shell volume ≈ surface area × wall thickness; interior filled at infill%.
  const wallThickness = settings.wallCount * settings.nozzleDiameter;
  const shellVolume = Math.min(volumeMm3, surfaceMm2 * wallThickness);
  const interiorVolume = Math.max(0, volumeMm3 - shellVolume);
  const solidVolume =
    shellVolume + interiorVolume * (settings.infillPercent / 100);

  // Support material estimate from overhang fraction.
  const supportVolume = settings.supports
    ? volumeMm3 * geometry.diagnostics.overhangArea * 0.4
    : 0;

  const totalVolumeMm3 = solidVolume + supportVolume;
  const materialWeightGrams = (totalVolumeMm3 / 1000) * material.density;

  // Filament length: volume / cross-sectional area of the strand.
  const strandArea = Math.PI * (FILAMENT_DIAMETER_MM / 2) ** 2; // mm²
  const filamentLengthM = totalVolumeMm3 / strandArea / 1000;

  // Time: extruded volume ÷ volumetric flow rate, with a layer-count penalty.
  const lineWidth = settings.nozzleDiameter * 1.2;
  const flowRate = settings.printSpeed * lineWidth * settings.layerHeight; // mm³/s
  const layerCount = geometry.boundingBox.size[2] / settings.layerHeight;
  const baseSeconds = flowRate > 0 ? totalVolumeMm3 / flowRate : 0;
  const printTimeHours = (baseSeconds * 1.35 + layerCount * 2) / 3600;

  const energyKwh = (PRINTER_POWER_W * printTimeHours) / 1000;
  const electricityCost = energyKwh * ELECTRICITY_COST_PER_KWH;
  const materialCost = (materialWeightGrams / 1000) * material.costPerKg;
  const totalCost = materialCost + electricityCost;
  const co2Grams =
    energyKwh * CO2_PER_KWH_G + materialWeightGrams * CO2_PER_G_FILAMENT;

  // Feasibility signals.
  const warpRisk = clamp01(
    (material.thermalExpansion - 60) / 80 +
      geometry.boundingBox.size[0] / 400,
  );
  const failureRisk = clamp01(
    geometry.diagnostics.overhangArea * 0.6 +
      (geometry.diagnostics.watertight ? 0 : 0.25) +
      (settings.supports ? 0 : geometry.diagnostics.overhangArea * 0.3),
  );
  const supportRequired = geometry.diagnostics.overhangArea > 0.15;
  const difficulty: PrintEstimate["difficulty"] =
    failureRisk > 0.6 ? "hard" : failureRisk > 0.3 ? "moderate" : "easy";

  return {
    printTimeHours,
    filamentLengthM,
    materialWeightGrams,
    materialCost,
    electricityCost,
    totalCost,
    co2Grams,
    difficulty,
    failureRisk,
    warpRisk,
    supportRequired,
  };
}

export function recommendPrint(
  geometry: GeometryResult,
): PrintRecommendation {
  const overhang = geometry.diagnostics.overhangArea;
  const tall =
    geometry.boundingBox.size[2] >
    Math.max(geometry.boundingBox.size[0], geometry.boundingBox.size[1]) * 1.5;

  // Pick the cheapest material that clears a reasonable strength bar.
  const bestMaterial =
    [...MATERIALS]
      .filter((m) => m.yieldStrength >= 40)
      .sort((a, b) => a.costPerKg - b.costPerKg)[0] ?? MATERIALS[0]!;

  return {
    bestMaterialId: bestMaterial.id,
    orientation: tall
      ? "Lay the longest axis flat on the bed to reduce layer-adhesion stress."
      : "Keep the largest flat face on the bed for adhesion and minimal supports.",
    infillPercent: geometry.volume > 50000 ? 15 : 25,
    layerHeight: overhang > 0.2 ? 0.16 : 0.2,
    supportStrategy:
      overhang > 0.15
        ? "Enable supports on overhangs beyond 45°; tree supports minimize waste."
        : "No supports required for this geometry.",
  };
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  infillPercent: 20,
  infillPattern: "gyroid",
  layerHeight: 0.2,
  nozzleDiameter: 0.4,
  wallCount: 3,
  topBottomLayers: 4,
  printSpeed: 60,
  supports: false,
  brimRaft: "none",
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
