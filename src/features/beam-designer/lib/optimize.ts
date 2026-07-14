import type { Beam, BeamResult } from "../types";
import { solveBeam } from "./solver";

/**
 * Design assistance: auto member sizing (scale the section to hit a target
 * factor of safety) and engineering suggestions (support placement, weight,
 * material) derived from the current analysis. Kept separate from the UI so it
 * can be reused by the report and tests.
 */

/**
 * Auto-size the cross-section to meet a target factor of safety with minimal
 * material. We scale all section dimensions by a single factor s; because both
 * I and S scale strongly with dimensions, we search s to bring the governing
 * FoS to the target. A geometric bisection on s converges in a few iterations.
 */
export function autoSizeBeam(beam: Beam, targetFoS: number): Beam {
  const base = beam.section.dims;
  const scaledBeam = (s: number): Beam => ({
    ...beam,
    section: {
      ...beam.section,
      dims: Object.fromEntries(
        Object.entries(base).map(([k, v]) => [k, v * s]),
      ),
    },
  });
  const fosAt = (s: number): number => {
    const r = solveBeam(scaledBeam(s));
    return Number.isFinite(r.factorOfSafety) ? r.factorOfSafety : 1e9;
  };

  // Bracket: find lo (FoS < target) and hi (FoS >= target).
  let lo = 0.1,
    hi = 10;
  // Expand hi until target met (bending stress ∝ 1/S ∝ 1/s³ for solid → FoS ∝ s³).
  let guard = 0;
  while (fosAt(hi) < targetFoS && hi < 1000 && guard++ < 20) hi *= 2;
  guard = 0;
  while (fosAt(lo) > targetFoS && lo > 1e-3 && guard++ < 20) lo *= 0.5;

  // Bisection on s.
  for (let i = 0; i < 30; i++) {
    const mid = Math.sqrt(lo * hi); // geometric midpoint (scale is multiplicative)
    if (fosAt(mid) >= targetFoS) hi = mid;
    else lo = mid;
  }
  return scaledBeam(hi);
}

export interface Suggestion {
  kind: "success" | "warning" | "tip";
  text: string;
}

/** Engineering suggestions based on the analysis result. */
export function buildSuggestions(beam: Beam, result: BeamResult): Suggestion[] {
  const out: Suggestion[] = [];
  if (!result.stable) {
    out.push({
      kind: "warning",
      text: "The beam is unstable. Add or reposition supports so it cannot translate or rotate as a rigid body.",
    });
    return out;
  }
  if (!result.solved) return out;

  const fos = result.factorOfSafety;
  if (fos < 1) {
    out.push({
      kind: "warning",
      text: `The beam fails: peak von Mises stress exceeds yield (FoS ${fos.toFixed(2)}). Increase the section size, use a stronger material, add a support, or reduce the load.`,
    });
  } else if (fos < 1.5) {
    out.push({
      kind: "warning",
      text: `Low factor of safety (${fos.toFixed(2)}). Most codes want ≥ 1.5–2.0 — enlarge the section or add support.`,
    });
  } else if (fos > 6) {
    out.push({
      kind: "tip",
      text: `Very high factor of safety (${fos.toFixed(1)}) — the beam is over-designed. Auto-size to save weight and cost.`,
    });
  } else {
    out.push({
      kind: "success",
      text: `Healthy factor of safety (${fos.toFixed(2)}).`,
    });
  }

  // Deflection guidance: common serviceability limit L/250.
  const limit = beam.length / 250;
  if (Math.abs(result.maxDeflection) > limit) {
    out.push({
      kind: "warning",
      text: `Max deflection ${(Math.abs(result.maxDeflection) * 1000).toFixed(1)} mm exceeds the common L/250 serviceability limit (${(limit * 1000).toFixed(1)} mm). Increase I (deeper section) or add support.`,
    });
  }

  // Support placement tip for a simple span with big deflection.
  if (
    beam.supports.length === 2 &&
    beam.supports.every((s) => s.type !== "fixed")
  ) {
    out.push({
      kind: "tip",
      text: "For a simple span, moving the supports inward (creating small overhangs) can cut the peak midspan moment by balancing it against the overhang moment.",
    });
  }

  // Buckling note if a large compressive scenario.
  if (
    Number.isFinite(result.bucklingLoad) &&
    result.maxShear > result.bucklingLoad * 0.5
  ) {
    out.push({
      kind: "tip",
      text: "Axial/compression effects may matter for this slender member — check buckling if it carries axial load.",
    });
  }

  return out;
}
