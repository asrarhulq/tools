import type { EffectiveMaterial, Material, PrintSettings } from "../types";

/**
 * ── As-printed (effective) material model ───────────────────────────────────
 *
 * An FDM part is not the solid, isotropic material its datasheet describes. Two
 * physical realities dominate its structural behaviour, and both are driven by
 * the print settings — so the numbers that feed FEA, stability, and the
 * strength estimates must be derived here rather than read straight off the
 * `Material`:
 *
 *   1. Porosity. The interior is infill, not solid. The effective stiffness and
 *      strength scale roughly with the solid volume fraction, following a
 *      power-law homogenization (Gibson–Ashby for cellular solids: property ∝
 *      relative-density^n, with n≈1 for stretch-dominated lattices like grid /
 *      triangles and n≈2 for bending-dominated ones). The solid perimeter walls
 *      and top/bottom layers carry most of the load, so they are counted at
 *      full density and only the remaining core is derated by infill.
 *
 *   2. Anisotropy. Layers are fused, not molecularly continuous, so interlayer
 *      (Z / build-direction) strength is a fraction of in-plane (XY) strength.
 *      Thicker layers fuse worse, so the ratio degrades with layer height.
 *
 * All outputs are consumed by the FEA solver (which uses the worst-case
 * orientation-aware modulus/strength) and by the print/mass estimates.
 * ────────────────────────────────────────────────────────────────────────────
 */

/**
 * Structural efficiency of each infill pattern relative to its volume fraction.
 * Stretch-dominated patterns (grid, triangles, cubic) use their material more
 * efficiently than bending-dominated ones (honeycomb walls in shear) or the
 * shell-only gyroid, which trades some stiffness for isotropy and print speed.
 */
const PATTERN_EFFICIENCY: Record<string, number> = {
  grid: 1.0,
  triangles: 1.05,
  cubic: 1.0,
  gyroid: 0.85,
  honeycomb: 0.9,
};

/** Gibson–Ashby exponent: ~1 stretch-dominated, ~2 bending-dominated. */
const PATTERN_EXPONENT: Record<string, number> = {
  grid: 1.15,
  triangles: 1.1,
  cubic: 1.2,
  gyroid: 1.6,
  honeycomb: 1.4,
};

/**
 * Estimate the solid volume fraction of the printed part: full-density shell
 * (walls + top/bottom skins) plus an infill-derated core. `wallShellFraction`
 * is the share of the part's volume occupied by the solid shell, which we
 * approximate from a representative wall thickness against the part's smallest
 * meaningful dimension. Kept dimensionless so it works without the mesh here;
 * callers with geometry can override via `shellFractionHint`.
 */
export function solidFraction(
  settings: PrintSettings,
  shellFractionHint?: number,
): number {
  const infill = clamp01(settings.infillPercent / 100);
  // Without geometry, assume a moderate shell share that grows with wall count
  // and top/bottom layers; callers pass a geometry-derived hint when available.
  const shell =
    shellFractionHint ??
    clamp01(
      0.12 +
        settings.wallCount * 0.06 +
        (settings.topLayers + settings.bottomLayers) * 0.015,
    );
  const core = 1 - shell;
  return clamp01(shell + core * infill);
}

export function effectiveMaterial(
  material: Material,
  settings: PrintSettings,
  shellFractionHint?: number,
): EffectiveMaterial {
  const rel = solidFraction(settings, shellFractionHint); // relative density 0–1
  const eff = PATTERN_EFFICIENCY[settings.infillPattern] ?? 0.95;
  const exp = PATTERN_EXPONENT[settings.infillPattern] ?? 1.3;

  // Homogenized in-plane (XY) properties. Walls dominate strength, so strength
  // scales a little less aggressively with porosity than stiffness does.
  const densityFactor = rel;
  const modulusFactor = eff * Math.pow(rel, exp);
  const strengthFactor = eff * Math.pow(rel, exp * 0.85);

  const modulusXY = material.youngsModulus * modulusFactor;
  const strengthXY = material.yieldStrength * strengthFactor;

  // Interlayer (Z) knock-down. Baseline ~55% of XY for well-tuned FDM, degrading
  // with thicker layers (poorer fusion) and improving slightly with more walls
  // (perimeters bridge layers). Reinforced filaments (CF) fuse worse in Z.
  const layerPenalty = clamp(
    0.35,
    0.55 - (settings.layerHeight - 0.2) * 0.6,
    0.7,
  );
  const cfPenalty = material.id.startsWith("cf-") ? 0.85 : 1;
  const anisotropy = clamp(0.3, layerPenalty * cfPenalty, 0.95);

  return {
    solidFraction: rel,
    modulusXY,
    modulusZ: modulusXY * anisotropy,
    strengthXY,
    strengthZ: strengthXY * anisotropy,
    density: material.density * densityFactor,
    anisotropy,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function clamp(lo: number, n: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
