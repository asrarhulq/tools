/**
 * The garden model: each active day grows one plant, and the plant it grows
 * reflects how much focus happened that day. More sessions → a taller, more
 * developed plant (sprout → seedling → bud → bloom → flourish). This turns the
 * raw heatmap into something alive you tend over months.
 *
 * Pure + deterministic: given a day's session count (and the daily goal), it
 * returns which stage to draw and a small variety value derived from the date
 * key, so a given day always looks the same across renders and reloads (no
 * `Math.random()` at call time).
 */

export type PlantStage =
  "empty" | "sprout" | "seedling" | "bud" | "bloom" | "flourish";

export interface PlantSpec {
  stage: PlantStage;
  /** 0..1 overall growth used to scale height / open petals. */
  growth: number;
  /** Whether the day met or beat the daily goal (gets a golden bloom). */
  goalMet: boolean;
  /** Small deterministic variety value (0..1) from the date, for lean/hue. */
  variety: number;
}

/** Map a day's completed-focus count to a growth stage. */
export function stageForCount(count: number, goal: number): PlantStage {
  if (count <= 0) return "empty";
  if (count >= goal) return "flourish";
  if (count === 1) return "sprout";
  if (count === 2) return "seedling";
  if (count === 3) return "bud";
  return "bloom";
}

/** Cheap deterministic hash of a date key → 0..1 (for lean/hue variety). */
function hashKey(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

export function plantFor(key: string, count: number, goal: number): PlantSpec {
  const stage = stageForCount(count, goal);
  // Growth saturates toward the goal; a day at/above goal reads as fully grown.
  const growth =
    stage === "empty"
      ? 0
      : Math.min(1, 0.35 + (count / Math.max(1, goal)) * 0.65);
  return {
    stage,
    growth,
    goalMet: count >= goal && count > 0,
    variety: hashKey(key),
  };
}
