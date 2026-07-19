import type { ArgGraph, ArgNode, GraphMetrics } from "../types";
import { EDGE_META, EVIDENCE_META, NODE_META } from "../config";

/**
 * Pure structural analytics over the argument graph. No React, no canvas — just
 * graph theory over our `ArgGraph`. These feed the analytics panel and the
 * heatmaps; the health score (see `engine.ts`) consumes several of them.
 */

const byId = (nodes: ArgNode[]) => new Map(nodes.map((n) => [n.id, n]));

/** Incoming/outgoing adjacency for the graph. */
export function adjacency(graph: ArgGraph) {
  const incoming = new Map<string, string[]>(); // target ← sources
  const outgoing = new Map<string, string[]>(); // source → targets
  for (const n of graph.nodes) {
    incoming.set(n.id, []);
    outgoing.set(n.id, []);
  }
  for (const e of graph.edges) {
    outgoing.get(e.source)?.push(e.target);
    incoming.get(e.target)?.push(e.source);
  }
  return { incoming, outgoing };
}

/**
 * A node's "support score" 0..1 — how well backed it is. Combines its own
 * confidence with the polarity-weighted strength of its incoming edges (support
 * lifts, attacks lower), tempered by evidence quality when the source is
 * evidence.
 */
export function supportScore(nodeId: string, graph: ArgGraph): number {
  const nodes = byId(graph.nodes);
  const self = nodes.get(nodeId);
  if (!self) return 0;
  let lift = 0;
  let drag = 0;
  for (const e of graph.edges) {
    if (e.target !== nodeId) continue;
    const meta = EDGE_META[e.data.kind];
    const src = nodes.get(e.source);
    if (!src) continue;
    let w = (e.data.weight / 100) * (src.data.confidence / 100);
    if (src.data.kind === "evidence" && src.data.evidenceQuality) {
      w *= EVIDENCE_META[src.data.evidenceQuality].weight;
    }
    if (meta.polarity > 0) lift += w;
    else if (meta.polarity < 0) drag += w;
  }
  const base = self.data.confidence / 100;
  // Blend intrinsic confidence with net incoming support, clamped 0..1.
  const net = base * 0.5 + Math.min(1, lift) * 0.5 - Math.min(1, drag) * 0.5;
  return Math.max(0, Math.min(1, net));
}

/** Longest inference chain terminating at a node (depth), memoised per call. */
export function chainDepths(graph: ArgGraph): Map<string, number> {
  const { incoming } = adjacency(graph);
  const memo = new Map<string, number>();
  const visiting = new Set<string>();
  const depth = (id: string): number => {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return 0; // cycle guard
    visiting.add(id);
    const parents = incoming.get(id) ?? [];
    const d = parents.length
      ? 1 + Math.max(...parents.map((p) => depth(p)))
      : 0;
    visiting.delete(id);
    memo.set(id, d);
    return d;
  };
  for (const n of graph.nodes) depth(n.id);
  return memo;
}

export function computeMetrics(graph: ArgGraph): GraphMetrics {
  const { incoming, outgoing } = adjacency(graph);
  const n = graph.nodes.length;
  const e = graph.edges.length;

  const avgConfidence =
    n === 0 ? 0 : graph.nodes.reduce((s, d) => s + d.data.confidence, 0) / n;

  const evidenceNodes = graph.nodes.filter((d) => d.data.kind === "evidence");
  const evidenceScore =
    evidenceNodes.length === 0
      ? 0
      : (evidenceNodes.reduce(
          (s, d) =>
            s +
            (d.data.evidenceQuality
              ? EVIDENCE_META[d.data.evidenceQuality].weight
              : 0.4),
          0,
        ) /
          evidenceNodes.length) *
        100;

  const assumptionCount = graph.nodes.filter(
    (d) => d.data.kind === "assumption",
  ).length;

  const contradictionCount = graph.edges.filter(
    (ed) => ed.data.kind === "contradicts",
  ).length;

  // Claims (or interim/conclusion) with no incoming support edges.
  const unsupportedCount = graph.nodes.filter((d) => {
    const role = NODE_META[d.data.kind].role;
    if (role !== "claim") return false;
    const parents = incoming.get(d.id) ?? [];
    return !parents.some((p) => {
      const edge = graph.edges.find(
        (ed) => ed.source === p && ed.target === d.id,
      );
      return edge && EDGE_META[edge.data.kind].polarity > 0;
    });
  }).length;

  const branchingFactor = n === 0 ? 0 : e / n;

  const depths = chainDepths(graph);
  const depthVals = [...depths.values()];
  const maxDepth = depthVals.length ? Math.max(...depthVals) : 0;
  const leafDepths = graph.nodes
    .filter((d) => (outgoing.get(d.id) ?? []).length === 0)
    .map((d) => depths.get(d.id) ?? 0);
  const avgChainLength = leafDepths.length
    ? leafDepths.reduce((s, x) => s + x, 0) / leafDepths.length
    : 0;

  // Weakest / strongest by support score.
  let weakestNodeId: string | undefined;
  let strongestNodeId: string | undefined;
  let lo = Infinity;
  let hi = -Infinity;
  for (const node of graph.nodes) {
    const s = supportScore(node.id, graph);
    if (s < lo) {
      lo = s;
      weakestNodeId = node.id;
    }
    if (s > hi) {
      hi = s;
      strongestNodeId = node.id;
    }
  }

  // Debate balance: net polarity of all edges, normalised.
  let pol = 0;
  let polCount = 0;
  for (const ed of graph.edges) {
    const p = EDGE_META[ed.data.kind].polarity;
    if (p !== 0) {
      pol += p;
      polCount++;
    }
  }
  const debateBalance = polCount ? pol / polCount : 0;

  // Complexity: node + edge count + depth, log-scaled into 0..100.
  const complexity = Math.min(
    100,
    Math.round((n * 4 + e * 3 + maxDepth * 6) * 0.9),
  );

  return {
    nodeCount: n,
    edgeCount: e,
    avgConfidence,
    evidenceScore,
    assumptionCount,
    contradictionCount,
    unsupportedCount,
    branchingFactor,
    avgChainLength,
    maxDepth,
    weakestNodeId,
    strongestNodeId,
    complexity,
    debateBalance,
  };
}
