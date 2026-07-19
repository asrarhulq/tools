import type { ArgGraph, Diagnostic, HealthReport } from "../types";
import { EDGE_META, NODE_META } from "../config";
import { adjacency, computeMetrics, supportScore } from "./metrics";
import { scanText } from "./fallacies";

/**
 * The reasoning engine. Given the graph it returns a `HealthReport`: a list of
 * explained diagnostics + a 0..100 Reasoning Health Score + structural metrics.
 *
 * Every diagnostic explains *why* it fired and *how* to fix it — the goal is to
 * teach, not just grade. All checks are deterministic pure functions over the
 * graph; nothing here calls out to a model or network.
 */

/** Find every directed cycle (circular reasoning) among *support* edges. */
function findCycles(graph: ArgGraph): string[][] {
  const { outgoing } = adjacency(graph);
  // Only support-like edges create genuine reasoning circularity.
  const supportOut = new Map<string, string[]>();
  for (const n of graph.nodes) supportOut.set(n.id, []);
  for (const e of graph.edges) {
    if (EDGE_META[e.data.kind].polarity > 0 || e.data.kind === "dependsOn") {
      supportOut.get(e.source)?.push(e.target);
    }
  }
  void outgoing;

  const cycles: string[][] = [];
  const seen = new Set<string>();
  const stack: string[] = [];
  const onStack = new Set<string>();

  const dfs = (id: string) => {
    stack.push(id);
    onStack.add(id);
    for (const nxt of supportOut.get(id) ?? []) {
      if (onStack.has(nxt)) {
        const i = stack.indexOf(nxt);
        if (i >= 0) {
          const cyc = stack.slice(i);
          const key = [...cyc].sort().join("|");
          if (!seen.has(key)) {
            seen.add(key);
            cycles.push(cyc);
          }
        }
      } else if (!stack.includes(nxt)) {
        dfs(nxt);
      }
    }
    stack.pop();
    onStack.delete(id);
  };

  for (const n of graph.nodes) dfs(n.id);
  return cycles;
}

export function analyze(graph: ArgGraph): HealthReport {
  const diagnostics: Diagnostic[] = [];
  const metrics = computeMetrics(graph);
  const { incoming, outgoing } = adjacency(graph);
  const label = (id: string) =>
    graph.nodes.find((n) => n.id === id)?.data.label ?? "a node";

  // ── Circular reasoning ────────────────────────────────────────────────────
  for (const cyc of findCycles(graph)) {
    diagnostics.push({
      id: `circular:${cyc.join("-")}`,
      severity: "error",
      nodeId: cyc[0],
      code: "circular",
      title: "Circular reasoning",
      detail: `These claims support each other in a loop: ${cyc
        .map(label)
        .join(
          " → ",
        )} → ${label(cyc[0]!)}. Nothing in the loop is grounded outside it.`,
      fix: "Break the loop by grounding at least one claim in independent evidence or an accepted premise.",
    });
  }

  // ── Unsupported claims ────────────────────────────────────────────────────
  for (const node of graph.nodes) {
    const role = NODE_META[node.data.kind].role;
    if (role !== "claim") continue;
    const parents = incoming.get(node.id) ?? [];
    const hasSupport = parents.some((p) => {
      const e = graph.edges.find(
        (ed) => ed.source === p && ed.target === node.id,
      );
      return e && EDGE_META[e.data.kind].polarity > 0;
    });
    if (!hasSupport) {
      diagnostics.push({
        id: `unsupported:${node.id}`,
        severity: node.data.kind === "conclusion" ? "error" : "warning",
        nodeId: node.id,
        code: "unsupported",
        title: `Unsupported ${NODE_META[node.data.kind].label.toLowerCase()}`,
        detail: `“${node.data.label}” asserts a conclusion but nothing supports it.`,
        fix: "Add a premise or piece of evidence connected with a “supports” edge.",
      });
    }
  }

  // ── Contradictions ────────────────────────────────────────────────────────
  for (const e of graph.edges) {
    if (e.data.kind === "contradicts") {
      diagnostics.push({
        id: `contradiction:${e.id}`,
        severity: "error",
        edgeId: e.id,
        nodeId: e.source,
        code: "contradiction",
        title: "Contradiction",
        detail: `“${label(e.source)}” and “${label(
          e.target,
        )}” cannot both hold. An argument that contains a contradiction can be used to prove anything.`,
        fix: "Resolve which claim to keep, or qualify them so they no longer conflict.",
      });
    }
  }

  // ── Attacked-but-unrebutted claims ────────────────────────────────────────
  for (const node of graph.nodes) {
    const parents = incoming.get(node.id) ?? [];
    const attacked = parents.some((p) => {
      const e = graph.edges.find(
        (ed) => ed.source === p && ed.target === node.id,
      );
      return e && EDGE_META[e.data.kind].polarity < 0;
    });
    if (!attacked) continue;
    // Is any objection itself answered (has an incoming attack/rebuttal)?
    const unrebutted = parents.some((p) => {
      const e = graph.edges.find(
        (ed) => ed.source === p && ed.target === node.id,
      );
      if (!e || EDGE_META[e.data.kind].polarity >= 0) return false;
      const answers = incoming.get(p) ?? [];
      return !answers.some((a) => {
        const ae = graph.edges.find((ed) => ed.source === a && ed.target === p);
        return ae && EDGE_META[ae.data.kind].polarity < 0;
      });
    });
    if (unrebutted) {
      diagnostics.push({
        id: `unrebutted:${node.id}`,
        severity: "warning",
        nodeId: node.id,
        code: "unrebutted",
        title: "Open objection",
        detail: `“${node.data.label}” faces an objection that hasn't been answered.`,
        fix: "Add a rebuttal (attack the objection) or accept it and revise the claim.",
      });
    }
  }

  // ── Missing evidence for conclusions ──────────────────────────────────────
  const hasEvidence = graph.nodes.some((n) => n.data.kind === "evidence");
  if (
    !hasEvidence &&
    graph.nodes.some((n) => n.data.kind === "conclusion") &&
    graph.nodes.length > 2
  ) {
    diagnostics.push({
      id: "no-evidence",
      severity: "info",
      code: "no-evidence",
      title: "No evidence in the map",
      detail:
        "The argument rests entirely on premises and assumptions — there's no empirical grounding.",
      fix: "Add an evidence node (empirical, statistical, experimental…) to anchor a key claim.",
    });
  }

  // ── Isolated nodes ────────────────────────────────────────────────────────
  for (const node of graph.nodes) {
    const deg =
      (incoming.get(node.id)?.length ?? 0) +
      (outgoing.get(node.id)?.length ?? 0);
    if (deg === 0 && graph.nodes.length > 1) {
      diagnostics.push({
        id: `isolated:${node.id}`,
        severity: "info",
        nodeId: node.id,
        code: "isolated",
        title: "Disconnected node",
        detail: `“${node.data.label}” isn't connected to anything.`,
        fix: "Connect it to the argument, or remove it if it's not relevant.",
      });
    }
  }

  // ── Hidden / heavy assumptions ────────────────────────────────────────────
  const assumptions = graph.nodes.filter((n) => n.data.kind === "assumption");
  for (const a of assumptions) {
    const children = outgoing.get(a.id) ?? [];
    if (children.length >= 2) {
      diagnostics.push({
        id: `load-bearing:${a.id}`,
        severity: "info",
        nodeId: a.id,
        code: "load-bearing-assumption",
        title: "Load-bearing assumption",
        detail: `The assumption “${a.data.label}” props up ${children.length} claims. If it fails, they fail with it.`,
        fix: "Make this assumption explicit and, if possible, defend it or replace it with evidence.",
      });
    }
  }

  // ── Weak inference (low-confidence support of high-stakes claims) ──────────
  for (const node of graph.nodes) {
    if (NODE_META[node.data.kind].role !== "claim") continue;
    const s = supportScore(node.id, graph);
    const hasParents = (incoming.get(node.id)?.length ?? 0) > 0;
    if (hasParents && s < 0.35) {
      diagnostics.push({
        id: `weak:${node.id}`,
        severity: "warning",
        nodeId: node.id,
        code: "weak-inference",
        title: "Weak inference chain",
        detail: `“${node.data.label}” is only weakly supported (${Math.round(
          s * 100,
        )}% net support) — its backing is low-confidence or outweighed by objections.`,
        fix: "Strengthen the supporting premises, raise their confidence, or add evidence.",
      });
    }
  }

  // ── Fallacy scan (lexical heuristics over node text) ──────────────────────
  for (const node of graph.nodes) {
    const text = `${node.data.label} ${node.data.detail ?? ""}`;
    for (const p of scanText(text, node.data.kind)) {
      diagnostics.push({
        id: `${p.code}:${node.id}`,
        severity: "warning",
        nodeId: node.id,
        code: p.code,
        title: `Possible fallacy — ${p.name}`,
        detail: `The wording of “${node.data.label}” can signal ${p.name.toLowerCase()}. ${p.why} e.g. ${p.example}`,
        fix: p.fix,
      });
    }
  }

  // ── Score ─────────────────────────────────────────────────────────────────
  const score = scoreFrom(graph, diagnostics);

  // Sort: errors first, then warnings, then info.
  const rank = { error: 0, warning: 1, info: 2 } as const;
  diagnostics.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return { score, diagnostics, metrics };
}

/**
 * Reasoning Health Score 0..100. Starts from average support and evidence, then
 * subtracts penalties per diagnostic (errors hurt most). An empty graph is
 * neutral (—, represented as 0 with no diagnostics).
 */
function scoreFrom(graph: ArgGraph, diagnostics: Diagnostic[]): number {
  if (graph.nodes.length === 0) return 0;

  const avgSupport =
    graph.nodes.reduce((s, n) => s + supportScore(n.id, graph), 0) /
    graph.nodes.length;

  let score = 40 + avgSupport * 55; // 40..95 baseline from how well-supported it is

  for (const d of diagnostics) {
    if (d.severity === "error") score -= 12;
    else if (d.severity === "warning") score -= 5;
    else score -= 1.5;
  }

  // Reward structural richness a little (evidence present, some depth).
  if (graph.nodes.some((n) => n.data.kind === "evidence")) score += 4;

  return Math.max(0, Math.min(100, Math.round(score)));
}
