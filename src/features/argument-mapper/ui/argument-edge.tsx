"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { EDGE_META } from "../config";
import type { ArgEdgeData } from "../types";
import { useAmStore } from "../store";

/**
 * A typed relationship edge. The stroke colour + dash come from the edge kind;
 * the stroke *width* scales with the link weight; supporting/attacking edges get
 * a flowing dash animation (disabled under reduced motion via a CSS class on the
 * canvas root). A small glass pill shows the relationship word and is clickable
 * to select the edge for editing.
 */

function ArgumentEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const d = (data ?? { kind: "supports", weight: 75 }) as ArgEdgeData;
  const meta = EDGE_META[d.kind];
  const select = useAmStore((s) => s.select);

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const width = 1.2 + (d.weight / 100) * 2.4;
  const word = d.label ?? meta.label;
  const animated = meta.polarity !== 0;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={`url(#am-arrow-${d.kind})`}
        style={{
          stroke: meta.color,
          strokeWidth: selected ? width + 1 : width,
          strokeDasharray: meta.dashed ? "6 5" : animated ? "7 6" : undefined,
          opacity: selected ? 1 : 0.85,
        }}
        className={animated ? "am-edge-flow" : undefined}
      />
      <EdgeLabelRenderer>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            select(null, id);
          }}
          className="nodrag nopan pointer-events-auto absolute rounded-full border border-[var(--color-border)] bg-[var(--glass-bg)] px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm transition-transform hover:scale-105"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            color: meta.color,
            borderColor: selected
              ? `color-mix(in oklch, ${meta.color} 70%, transparent)`
              : undefined,
          }}
        >
          {word}
        </button>
      </EdgeLabelRenderer>
    </>
  );
}

export const ArgumentEdge = memo(ArgumentEdgeInner);
