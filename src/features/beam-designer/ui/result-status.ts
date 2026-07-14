import type { BeamResult } from "../types";

export type Tone = "default" | "ok" | "warn" | "crit" | "accent";

/**
 * Maps a factor of safety to a semantic status tone. These thresholds are the
 * shared source of truth for the HUD strip, the results panel, and any status
 * pill — so the same number never reads green in one place and amber in
 * another. FoS ≥ 2 is comfortable, 1–2 is marginal, < 1 has failed.
 */
export function fosTone(fos: number): Tone {
  if (!Number.isFinite(fos)) return "ok";
  if (fos >= 2) return "ok";
  if (fos >= 1) return "warn";
  return "crit";
}

/** Deflection tone against the common L/250 serviceability limit. */
export function deflectionTone(result: BeamResult, span: number): Tone {
  const limit = span / 250;
  const d = Math.abs(result.maxDeflection);
  if (d <= limit * 0.75) return "ok";
  if (d <= limit) return "warn";
  return "crit";
}
