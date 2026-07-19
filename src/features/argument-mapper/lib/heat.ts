import type { ArgGraph, HeatmapMode } from "../types";
import { adjacency, supportScore } from "./metrics";

/**
 * Heatmap value model. For a given `HeatmapMode`, compute a 0..1 value per node
 * (higher = more of that dimension) and turn it into a colour. The canvas passes
 * each node its precomputed value so nodes stay dumb + fast.
 *
 * `heatColor` runs blue(cool)→green→amber→red(hot) in OKLCH so it reads well in
 * both themes and matches the site's status palette family.
 */

export function heatColor(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  // hue 250 (cool blue) → 150 (green) → 90 (amber) → 25 (red)
  const hue = 250 - x * 225;
  return `oklch(0.66 0.16 ${hue})`;
}

export function nodeHeatValues(
  graph: ArgGraph,
  mode: HeatmapMode,
): Map<string, number> {
  const out = new Map<string, number>();
  if (mode === "none") return out;

  const { incoming, outgoing } = adjacency(graph);
  const maxAssumptionFanout = Math.max(
    1,
    ...graph.nodes.map((n) => (outgoing.get(n.id) ?? []).length),
  );

  for (const n of graph.nodes) {
    let v = 0;
    switch (mode) {
      case "confidence":
        v = n.data.confidence / 100;
        break;
      case "strength":
        v = supportScore(n.id, graph);
        break;
      case "evidence":
        v =
          n.data.kind === "evidence"
            ? Math.min(1, n.data.confidence / 100)
            : 0.15;
        break;
      case "assumption":
        v =
          n.data.kind === "assumption"
            ? Math.min(
                1,
                (outgoing.get(n.id)?.length ?? 0) / maxAssumptionFanout,
              )
            : 0.1;
        break;
      case "vulnerability": {
        // Hot = weakly supported AND relied upon by others.
        const support = supportScore(n.id, graph);
        const reliance = Math.min(1, (outgoing.get(n.id)?.length ?? 0) / 3);
        void incoming;
        v = (1 - support) * 0.6 + reliance * 0.4;
        break;
      }
      default:
        v = 0;
    }
    out.set(n.id, v);
  }
  return out;
}
