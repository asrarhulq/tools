"use client";

import { create } from "zustand";
import type {
  ArgEdge,
  ArgEdgeData,
  ArgGraph,
  ArgNode,
  ArgNodeData,
  EdgeKind,
  HeatmapMode,
  LayoutKind,
  NodeKind,
} from "./types";
import { EDGE_META } from "./config";

/**
 * The single graph store (Zustand). Holds the document (nodes + edges),
 * selection, UI mode (heatmap/focus/zen), and an undo/redo history. Every
 * mutation goes through `commit()` which snapshots the previous state onto the
 * undo stack — so undo/redo is uniform and infinite (capped for memory).
 *
 * Persistence is manual + debounced (see `persist.ts` wired from the provider)
 * rather than zustand/middleware, to keep it SSR-safe and localStorage-guarded.
 */

const HISTORY_LIMIT = 100;
let counter = 0;
const genId = (p: string) => `${p}-${Date.now().toString(36)}-${counter++}`;

export interface AmState {
  nodes: ArgNode[];
  edges: ArgEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  heatmap: HeatmapMode;
  layout: LayoutKind;
  focusNodeId: string | null; // highlighted from a diagnostic click
  zen: boolean;
  hydrated: boolean;
  /** Bumped to ask the canvas to re-fit the view (load / layout). */
  fitRequest: number;

  past: ArgGraph[];
  future: ArgGraph[];

  // ── selection / ui ──
  select: (nodeId: string | null, edgeId?: string | null) => void;
  setHeatmap: (m: HeatmapMode) => void;
  setLayout: (l: LayoutKind) => void;
  setFocus: (id: string | null) => void;
  toggleZen: () => void;

  // ── graph mutations (each commits history) ──
  addNode: (kind: NodeKind, position: { x: number; y: number }) => string;
  updateNodeData: (id: string, patch: Partial<ArgNodeData>) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  moveNodesLive: (positions: Record<string, { x: number; y: number }>) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;

  addEdge: (source: string, target: string, kind?: EdgeKind) => void;
  updateEdgeData: (id: string, patch: Partial<ArgEdgeData>) => void;
  deleteEdge: (id: string) => void;

  setGraph: (graph: ArgGraph, resetHistory?: boolean) => void;
  applyPositions: (positions: Map<string, { x: number; y: number }>) => void;
  clear: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  hydrate: (graph: ArgGraph) => void;
  snapshot: () => ArgGraph;
  requestFit: () => void;
}

const clone = (g: ArgGraph): ArgGraph => ({
  nodes: g.nodes.map((n) => ({
    ...n,
    data: { ...n.data },
    position: { ...n.position },
  })),
  edges: g.edges.map((e) => ({ ...e, data: { ...e.data } })),
});

export const useAmStore = create<AmState>((set, get) => {
  /** Push current graph to `past`, clear `future`, then apply the producer. */
  const commit = (producer: (draft: ArgGraph) => ArgGraph | void) => {
    const cur: ArgGraph = { nodes: get().nodes, edges: get().edges };
    const before = clone(cur);
    const draft = clone(cur);
    const next = producer(draft) ?? draft;
    set((s) => ({
      nodes: next.nodes,
      edges: next.edges,
      past: [...s.past, before].slice(-HISTORY_LIMIT),
      future: [],
    }));
  };

  return {
    nodes: [],
    edges: [],
    selectedNodeId: null,
    selectedEdgeId: null,
    heatmap: "none",
    layout: "tree",
    focusNodeId: null,
    zen: false,
    hydrated: false,
    fitRequest: 0,
    past: [],
    future: [],

    select: (nodeId, edgeId = null) =>
      set({ selectedNodeId: nodeId, selectedEdgeId: edgeId }),
    setHeatmap: (heatmap) => set({ heatmap }),
    setLayout: (layout) => set({ layout }),
    setFocus: (focusNodeId) => set({ focusNodeId }),
    toggleZen: () => set((s) => ({ zen: !s.zen })),

    addNode: (kind, position) => {
      const id = genId("n");
      const data: ArgNodeData = {
        kind,
        label: "",
        confidence: 70,
        ...(kind === "evidence" ? { evidenceQuality: "empirical" } : {}),
      };
      commit((g) => {
        g.nodes.push({ id, position, data });
      });
      set({ selectedNodeId: id, selectedEdgeId: null });
      return id;
    },

    updateNodeData: (id, patch) =>
      commit((g) => {
        const n = g.nodes.find((x) => x.id === id);
        if (n) n.data = { ...n.data, ...patch };
      }),

    moveNode: (id, position) =>
      commit((g) => {
        const n = g.nodes.find((x) => x.id === id);
        if (n) n.position = position;
      }),

    // Live drag: update positions WITHOUT pushing history every frame.
    moveNodesLive: (positions) =>
      set((s) => ({
        nodes: s.nodes.map((n) =>
          positions[n.id] ? { ...n, position: positions[n.id]! } : n,
        ),
      })),

    deleteNode: (id) =>
      commit((g) => {
        g.nodes = g.nodes.filter((n) => n.id !== id);
        g.edges = g.edges.filter((e) => e.source !== id && e.target !== id);
      }),

    duplicateNode: (id) => {
      const src = get().nodes.find((n) => n.id === id);
      if (!src) return;
      const newId = genId("n");
      commit((g) => {
        g.nodes.push({
          id: newId,
          position: { x: src.position.x + 40, y: src.position.y + 40 },
          data: { ...src.data, label: src.data.label },
        });
      });
      set({ selectedNodeId: newId });
    },

    addEdge: (source, target, kind = "supports") => {
      if (source === target) return;
      const exists = get().edges.some(
        (e) => e.source === source && e.target === target,
      );
      if (exists) return;
      const data: ArgEdgeData = { kind, weight: 75 };
      commit((g) => {
        g.edges.push({ id: genId("e"), source, target, data });
      });
    },

    updateEdgeData: (id, patch) =>
      commit((g) => {
        const e = g.edges.find((x) => x.id === id);
        if (e) e.data = { ...e.data, ...patch };
      }),

    deleteEdge: (id) =>
      commit((g) => {
        g.edges = g.edges.filter((e) => e.id !== id);
      }),

    setGraph: (graph, resetHistory = false) => {
      if (resetHistory) {
        set({
          nodes: clone(graph).nodes,
          edges: clone(graph).edges,
          past: [],
          future: [],
        });
      } else {
        commit(() => clone(graph));
      }
      set({ selectedNodeId: null, selectedEdgeId: null });
    },

    applyPositions: (positions) =>
      commit((g) => {
        for (const n of g.nodes) {
          const p = positions.get(n.id);
          if (p) n.position = p;
        }
      }),

    clear: () => commit(() => ({ nodes: [], edges: [] })),

    undo: () => {
      const { past } = get();
      if (past.length === 0) return;
      const prev = past[past.length - 1]!;
      const cur: ArgGraph = { nodes: get().nodes, edges: get().edges };
      set((s) => ({
        nodes: clone(prev).nodes,
        edges: clone(prev).edges,
        past: s.past.slice(0, -1),
        future: [clone(cur), ...s.future].slice(0, HISTORY_LIMIT),
        selectedNodeId: null,
        selectedEdgeId: null,
      }));
    },

    redo: () => {
      const { future } = get();
      if (future.length === 0) return;
      const next = future[0]!;
      const cur: ArgGraph = { nodes: get().nodes, edges: get().edges };
      set((s) => ({
        nodes: clone(next).nodes,
        edges: clone(next).edges,
        past: [...s.past, clone(cur)].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        selectedNodeId: null,
        selectedEdgeId: null,
      }));
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    hydrate: (graph) =>
      set((s) => ({
        nodes: clone(graph).nodes,
        edges: clone(graph).edges,
        hydrated: true,
        past: [],
        future: [],
        fitRequest: s.fitRequest + 1,
      })),

    snapshot: () => ({ nodes: get().nodes, edges: get().edges }),
    requestFit: () => set((s) => ({ fitRequest: s.fitRequest + 1 })),
  };
});

/** Default relationship word for an edge kind (used by the edge label UI). */
export const defaultEdgeLabel = (kind: EdgeKind) => EDGE_META[kind].label;
