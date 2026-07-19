import type { ArgGraph, LayoutKind } from "../types";

/**
 * Auto-layout via **elkjs**. We lazily import the (large) ELK worker bundle only
 * when a layout is actually requested, so it never touches the initial tool
 * bundle. Each `LayoutKind` maps to an ELK algorithm + options tuned for the
 * feel described in the taxonomy (top-down debate tree, radial belief map, etc).
 *
 * Returns a map of nodeId → {x,y}. The caller animates nodes from their current
 * positions to these targets (framer-motion / React Flow), so switching layouts
 * glides rather than jumps.
 */

const NODE_W = 220;
const NODE_H = 96;

type ElkNode = {
  id: string;
  width?: number;
  height?: number;
  children?: ElkNode[];
  layoutOptions?: Record<string, string>;
  x?: number;
  y?: number;
};

interface ElkInstance {
  layout(graph: {
    id: string;
    layoutOptions?: Record<string, string>;
    children: ElkNode[];
    edges: { id: string; sources: string[]; targets: string[] }[];
  }): Promise<{ children?: ElkNode[] }>;
}

let elkPromise: Promise<ElkInstance> | null = null;
async function getElk(): Promise<ElkInstance> {
  if (!elkPromise) {
    elkPromise = import("elkjs/lib/elk.bundled.js").then((m) => {
      const ELK = m.default as unknown as new () => ElkInstance;
      return new ELK();
    });
  }
  return elkPromise;
}

function optionsFor(kind: LayoutKind): Record<string, string> {
  const base = {
    "elk.spacing.nodeNode": "48",
    "elk.layered.spacing.nodeNodeBetweenLayers": "90",
  };
  switch (kind) {
    case "tree":
    case "debate":
      return {
        ...base,
        "elk.algorithm": "layered",
        "elk.direction": "DOWN",
        "elk.layered.spacing.nodeNodeBetweenLayers": "110",
      };
    case "flow":
      return {
        ...base,
        "elk.algorithm": "layered",
        "elk.direction": "RIGHT",
      };
    case "layered":
      return {
        ...base,
        "elk.algorithm": "layered",
        "elk.direction": "DOWN",
        "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      };
    case "radial":
      return {
        ...base,
        "elk.algorithm": "radial",
        "elk.radial.radius": "260",
      };
    case "mindmap":
      return {
        ...base,
        "elk.algorithm": "mrtree",
        "elk.spacing.nodeNode": "56",
      };
    default:
      return { ...base, "elk.algorithm": "layered" };
  }
}

export async function runLayout(
  graph: ArgGraph,
  kind: LayoutKind,
): Promise<Map<string, { x: number; y: number }>> {
  const elk = await getElk();
  const result = await elk.layout({
    id: "root",
    layoutOptions: optionsFor(kind),
    children: graph.nodes.map((n) => ({
      id: n.id,
      width: NODE_W,
      height: NODE_H,
    })),
    edges: graph.edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  });

  const positions = new Map<string, { x: number; y: number }>();
  for (const child of result.children ?? []) {
    positions.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
  }
  return positions;
}
