"use client";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge as rfAddEdge,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { useShallow } from "zustand/react/shallow";
import { EDGE_META, NODE_META } from "../config";
import { useAmStore } from "../store";
import { nodeHeatValues } from "../lib/heat";
import { ArgumentNode } from "./argument-node";
import { ArgumentEdge } from "./argument-edge";

const nodeTypes = { arg: ArgumentNode };
const edgeTypes = { arg: ArgumentEdge };

/** SVG arrowhead markers, one per edge kind so arrows match their edge colour. */
function ArrowDefs() {
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0 }}
      aria-hidden="true"
    >
      <defs>
        {Object.values(EDGE_META).map((m) => (
          <marker
            key={m.kind}
            id={`am-arrow-${m.kind}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill={m.color} />
          </marker>
        ))}
      </defs>
    </svg>
  );
}

function CanvasInner() {
  const { nodes, edges, heatmap, focusNodeId, selectedNodeId, selectedEdgeId } =
    useAmStore(
      useShallow((s) => ({
        nodes: s.nodes,
        edges: s.edges,
        heatmap: s.heatmap,
        focusNodeId: s.focusNodeId,
        selectedNodeId: s.selectedNodeId,
        selectedEdgeId: s.selectedEdgeId,
      })),
    );
  const store = useAmStore;
  const { screenToFlowPosition, fitView } = useReactFlow();

  const graph = useMemo(() => ({ nodes, edges }), [nodes, edges]);
  const heat = useMemo(() => nodeHeatValues(graph, heatmap), [graph, heatmap]);

  // Focus-mode dimming: when a focus node is set, dim everything except it and
  // its immediate neighbours.
  const focusSet = useMemo(() => {
    if (!focusNodeId) return null;
    const s = new Set<string>([focusNodeId]);
    for (const e of edges) {
      if (e.source === focusNodeId) s.add(e.target);
      if (e.target === focusNodeId) s.add(e.source);
    }
    return s;
  }, [focusNodeId, edges]);

  // Map our domain nodes → React Flow nodes (inject heat + dim + selection).
  const rfNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: "arg",
        position: n.position,
        selected: n.id === selectedNodeId,
        data: {
          ...n.data,
          heatmap,
          heat: heat.get(n.id) ?? 0,
          dimmed: focusSet ? !focusSet.has(n.id) : false,
        },
      })),
    [nodes, heatmap, heat, focusSet, selectedNodeId],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "arg",
        selected: e.id === selectedEdgeId,
        data: e.data,
      })),
    [edges, selectedEdgeId],
  );

  // ── React Flow change handlers → store ──
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const s = store.getState();
      const moves: Record<string, { x: number; y: number }> = {};
      for (const c of changes) {
        if (c.type === "position" && c.position && c.dragging) {
          moves[c.id] = c.position;
        }
        if (c.type === "position" && !c.dragging && c.position) {
          // Drag ended → commit to history.
          s.moveNode(c.id, c.position);
        }
        if (c.type === "remove") s.deleteNode(c.id);
        if (c.type === "select") {
          if (c.selected) s.select(c.id, null);
        }
      }
      if (Object.keys(moves).length) s.moveNodesLive(moves);
    },
    [store],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const s = store.getState();
      for (const c of changes) {
        if (c.type === "remove") s.deleteEdge(c.id);
        if (c.type === "select" && c.selected) s.select(null, c.id);
      }
    },
    [store],
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      const s = store.getState();
      if (conn.source && conn.target)
        s.addEdge(conn.source, conn.target, "supports");
      void rfAddEdge;
    },
    [store],
  );

  // Double-click empty canvas → create a claim node there.
  const onPaneDoubleClick = useCallback(
    (evt: React.MouseEvent) => {
      const pos = screenToFlowPosition({ x: evt.clientX, y: evt.clientY });
      store.getState().addNode("claim", { x: pos.x - 110, y: pos.y - 40 });
    },
    [screenToFlowPosition, store],
  );

  // Re-fit the view on explicit "fit requests" (initial hydrate, library load,
  // layout run) — NOT on every node add, which would yank the view while you
  // edit. maxZoom is capped so a small graph fills the frame comfortably rather
  // than blowing a single node up to full screen.
  const fitRequest = useAmStore((s) => s.fitRequest);
  useEffect(() => {
    const t = setTimeout(
      () => fitView({ padding: 0.28, duration: 450, maxZoom: 1 }),
      90,
    );
    return () => clearTimeout(t);
  }, [fitRequest, fitView]);

  const minimapColor = useCallback(
    (n: Node) =>
      NODE_META[(n.data as { kind: keyof typeof NODE_META }).kind].accent,
    [],
  );

  return (
    <div
      className="am-canvas relative h-full w-full"
      onDoubleClick={onPaneDoubleClick}
    >
      <ArrowDefs />
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={() => store.getState().select(null, null)}
        proOptions={{ hideAttribution: true }}
        fitView
        minZoom={0.2}
        maxZoom={2.2}
        defaultEdgeOptions={{ type: "arg" }}
        connectionLineStyle={{ stroke: "var(--color-primary)", strokeWidth: 2 }}
        className="!bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.4}
          className="!bg-[var(--color-background)]"
          color="color-mix(in oklch, var(--color-foreground) 16%, transparent)"
        />
        <Controls
          showInteractive={false}
          className="!border-[var(--color-border)] !bg-[var(--glass-bg)] !shadow-none [&_button]:!border-[var(--color-border)] [&_button]:!bg-transparent [&_button]:!text-[var(--color-foreground)]"
        />
        <MiniMap
          pannable
          zoomable
          nodeColor={minimapColor}
          maskColor="color-mix(in oklch, var(--color-background) 70%, transparent)"
          className="!hidden !border !border-[var(--color-border)] !bg-[var(--glass-bg)] sm:!block"
        />
      </ReactFlow>
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
