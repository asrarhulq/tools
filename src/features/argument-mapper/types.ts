/**
 * Domain model for the Argument Mapper — a visual reasoning canvas.
 *
 * The graph is a set of typed **nodes** (units of an argument) joined by typed
 * **edges** (dialectical relationships). Everything the canvas, the logic
 * engine, the analytics, and persistence need is described here so the store
 * stays the single source of truth. Kept framework-free (no React Flow imports)
 * so the pure logic modules can type against it without pulling in the canvas.
 */

/** The seventeen kinds of argument node the canvas supports. */
export type NodeKind =
  | "claim"
  | "premise"
  | "intermediate" // intermediate conclusion
  | "conclusion" // final conclusion
  | "assumption"
  | "definition"
  | "evidence"
  | "objection"
  | "rebuttal"
  | "counterexample"
  | "analogy"
  | "thoughtExperiment"
  | "question"
  | "principle"
  | "example"
  | "hypothesis"
  | "observation";

/** The ten dialectical relationships an edge can express. */
export type EdgeKind =
  | "supports"
  | "attacks"
  | "dependsOn"
  | "contradicts"
  | "defines"
  | "qualifies"
  | "illustrates"
  | "causes"
  | "explains"
  | "analogousTo";

/** Evidence provenance — affects credibility weighting in the engine. */
export type EvidenceQuality =
  | "empirical"
  | "statistical"
  | "experimental"
  | "historical"
  | "mathematical"
  | "expert"
  | "testimonial"
  | "anecdotal"
  | "intuition"
  | "observational"
  | "simulation";

/** Data carried by every node (stored on React Flow's `node.data`). */
export interface ArgNodeData {
  kind: NodeKind;
  label: string;
  detail?: string;
  /** 0..100 subjective confidence — drives opacity/border/edge strength. */
  confidence: number;
  /** Only meaningful for evidence nodes. */
  evidenceQuality?: EvidenceQuality;
  /** Free-text tags for search/filter. */
  tags?: string[];
  bookmarked?: boolean;
  [key: string]: unknown; // React Flow data index signature
}

/** Data carried by every edge. */
export interface ArgEdgeData {
  kind: EdgeKind;
  /** Optional editable label overriding the relationship's default word. */
  label?: string;
  /** 0..100 strength of the link. */
  weight: number;
  [key: string]: unknown;
}

/** A serialisable node (our own shape; mapped to/from React Flow nodes). */
export interface ArgNode {
  id: string;
  data: ArgNodeData;
  position: { x: number; y: number };
}

export interface ArgEdge {
  id: string;
  source: string;
  target: string;
  data: ArgEdgeData;
}

/** The full persisted document. */
export interface ArgGraph {
  nodes: ArgNode[];
  edges: ArgEdge[];
}

/** Auto-layout algorithms exposed in the UI. */
export type LayoutKind =
  "tree" | "debate" | "radial" | "mindmap" | "flow" | "layered";

/** Heatmap overlays that recolour the graph. */
export type HeatmapMode =
  | "none"
  | "confidence"
  | "strength"
  | "evidence"
  | "assumption"
  | "vulnerability";

/** A single finding from the logic engine. */
export interface Diagnostic {
  id: string;
  severity: "error" | "warning" | "info";
  /** Which node/edge it anchors to (for click-to-focus). */
  nodeId?: string;
  edgeId?: string;
  title: string;
  detail: string;
  /** Actionable suggestion to strengthen the argument. */
  fix?: string;
  /** Category slug (e.g. "circular", "unsupported", "fallacy:strawman"). */
  code: string;
}

/** The aggregate reasoning report. */
export interface HealthReport {
  score: number; // 0..100
  diagnostics: Diagnostic[];
  metrics: GraphMetrics;
}

export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  avgConfidence: number;
  evidenceScore: number;
  assumptionCount: number;
  contradictionCount: number;
  unsupportedCount: number;
  branchingFactor: number;
  avgChainLength: number;
  maxDepth: number;
  weakestNodeId?: string;
  strongestNodeId?: string;
  complexity: number;
  debateBalance: number; // -1 (all attacks) .. +1 (all supports)
}
