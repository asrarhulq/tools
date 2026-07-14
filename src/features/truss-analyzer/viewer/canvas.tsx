"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTruss } from "../state/store";
import { useAnalysis } from "../state/use-analysis";
import { fmtForce } from "../lib/units";
import type { AnalysisResult, MemberResult, Node } from "../types";

/**
 * The interactive truss canvas (SVG). Handles zoom/pan, world↔screen mapping
 * with an auto-fit view, and renders the original geometry, the deformed shape,
 * color-coded members (tension = blue, compression = red), supports, loads, and
 * hover read-outs. Editing is tool-driven: clicking empty space adds a node,
 * clicking two nodes adds a member, etc. — routed through the store.
 *
 * SVG (not canvas/WebGL) is deliberate for a 2D truss: crisp at any zoom,
 * trivially exportable, accessible, and fast for interactive structural sizes.
 */

const TENSION = "#2563eb";
const COMPRESSION = "#dc2626";
const ZERO = "#94a3b8";

export function TrussCanvas() {
  const {
    truss,
    tool,
    view,
    selectedNode,
    selectedMember,
    selectNode,
    selectMember,
    addNode,
    addMember,
    moveNode,
    setSupport,
    addLoad,
  } = useTruss();
  const { result } = useAnalysis();

  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const [pendingMember, setPendingMember] = useState<string | null>(null);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef<{
    sx: number;
    sy: number;
    vx: number;
    vy: number;
  } | null>(null);

  // World bounds → default viewBox (auto-fit with padding). y is flipped so +y
  // is up on screen. All model coords are metres.
  const bounds = useMemo(() => {
    if (truss.nodes.length === 0)
      return { minX: -1, maxX: 1, minY: -1, maxY: 1 };
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const n of truss.nodes) {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    }
    return { minX, maxX, minY, maxY };
  }, [truss.nodes]);

  const fitBox = useMemo(() => {
    const w = Math.max(1, bounds.maxX - bounds.minX);
    const h = Math.max(1, bounds.maxY - bounds.minY);
    const pad = Math.max(w, h) * 0.25 + 0.5;
    return {
      x: bounds.minX - pad,
      y: bounds.minY - pad,
      w: w + pad * 2,
      h: h + pad * 2,
    };
  }, [bounds]);

  const vb = viewBox ?? fitBox;

  // Convert a client (mouse) point to world coords (y flipped: +y is up).
  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;
      return { x: vb.x + px * vb.w, y: vb.y + (1 - py) * vb.h };
    },
    [vb],
  );

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.12 : 0.89;
    const w = toWorld(e.clientX, e.clientY);
    setViewBox((prev) => {
      const cur = prev ?? fitBox;
      const nw = cur.w * factor;
      const nh = cur.h * factor;
      // keep the cursor's world point stationary
      return {
        x: w.x - (w.x - cur.x) * factor,
        y: w.y - (w.y - cur.y) * factor, // note: y handled in world space
        w: nw,
        h: nh,
      };
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (
      e.button === 1 ||
      e.button === 2 ||
      (e.button === 0 && tool === "select" && !dragNode)
    ) {
      // middle/right or empty select → pan
      panRef.current = { sx: e.clientX, sy: e.clientY, vx: vb.x, vy: vb.y };
      setIsPanning(true);
      (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragNode) {
      const w = toWorld(e.clientX, e.clientY);
      moveNode(dragNode, snap(w.x), snap(w.y));
      return;
    }
    if (panRef.current) {
      const dx =
        ((e.clientX - panRef.current.sx) /
          svgRef.current!.getBoundingClientRect().width) *
        vb.w;
      const dy =
        ((e.clientY - panRef.current.sy) /
          svgRef.current!.getBoundingClientRect().height) *
        vb.h;
      setViewBox({
        x: panRef.current.vx - dx,
        y: panRef.current.vy + dy,
        w: vb.w,
        h: vb.h,
      });
    }
  };
  const onPointerUp = () => {
    panRef.current = null;
    setIsPanning(false);
    if (dragNode) setDragNode(null);
  };

  const onBackgroundClick = (e: React.MouseEvent) => {
    if (tool === "add-node") {
      const w = toWorld(e.clientX, e.clientY);
      addNode(snap(w.x), snap(w.y));
    } else if (tool === "select") {
      selectNode(null);
    }
  };

  const onNodeClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool === "add-member") {
      if (pendingMember == null) setPendingMember(id);
      else {
        addMember(pendingMember, id);
        setPendingMember(null);
      }
    } else if (tool === "add-support") {
      const cur = truss.nodes.find((n) => n.id === id)?.support ?? "none";
      const order: Node["support"][] = [
        "none",
        "pin",
        "roller-x",
        "roller-y",
        "fixed",
      ];
      setSupport(id, order[(order.indexOf(cur) + 1) % order.length]!);
    } else if (tool === "add-load") {
      addLoad(id, 0, -10000); // default 10 kN down; editable in the panel
      selectNode(id);
    } else {
      selectNode(id);
    }
  };

  const resFor = (id: string): MemberResult | undefined =>
    result.members.find((m) => m.memberId === id);
  const nodeRes = (id: string) => result.nodes.find((n) => n.nodeId === id);

  const scale = view.deformScale * autoDeformScale(result, bounds);

  const nodePos = (n: Node, deformed: boolean) => {
    if (!deformed) return { x: n.x, y: n.y };
    const nr = nodeRes(n.id);
    return { x: n.x + (nr?.ux ?? 0) * scale, y: n.y + (nr?.uy ?? 0) * scale };
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <svg
        ref={svgRef}
        className="h-full w-full touch-none select-none"
        viewBox={`${vb.x} ${-(vb.y + vb.h)} ${vb.w} ${vb.h}`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          cursor:
            tool === "add-node"
              ? "crosshair"
              : isPanning
                ? "grabbing"
                : "default",
        }}
      >
        {/* Scene group flips y so +y is up. */}
        <g transform="scale(1,-1)">
          <GridLayer vb={vb} />
          {/* Click target for background */}
          <rect
            x={vb.x}
            y={vb.y}
            width={vb.w}
            height={vb.h}
            fill="transparent"
            onClick={onBackgroundClick}
          />

          {/* Deformed (ghost) members behind */}
          {view.showDeformed &&
            result.solved &&
            truss.members.map((m) => {
              const a = truss.nodes.find((n) => n.id === m.from);
              const b = truss.nodes.find((n) => n.id === m.to);
              if (!a || !b) return null;
              const pa = nodePos(a, true),
                pb = nodePos(b, true);
              return (
                <line
                  key={`d${m.id}`}
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke={memberColor(resFor(m.id), view.showStress)}
                  strokeOpacity={0.4}
                  strokeWidth={strokeW(vb)}
                  strokeDasharray={`${strokeW(vb) * 2} ${strokeW(vb) * 2}`}
                />
              );
            })}

          {/* Original members */}
          {view.showOriginal &&
            truss.members.map((m) => {
              const a = truss.nodes.find((n) => n.id === m.from);
              const b = truss.nodes.find((n) => n.id === m.to);
              if (!a || !b) return null;
              const r = resFor(m.id);
              const sel = selectedMember === m.id;
              return (
                <line
                  key={m.id}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={sel ? "#111827" : memberColor(r, view.showStress)}
                  strokeWidth={strokeW(vb) * (sel ? 1.8 : forceWidth(r))}
                  strokeLinecap="round"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectMember(m.id);
                  }}
                  onPointerEnter={(e) => {
                    const w = toWorld(e.clientX, e.clientY);
                    setHover({
                      x: w.x,
                      y: w.y,
                      text: r
                        ? `${m.id}: ${r.state} ${fmtForce(Math.abs(r.axialForce), "si")}`
                        : m.id,
                    });
                  }}
                  onPointerLeave={() => setHover(null)}
                />
              );
            })}

          {/* Force magnitude labels */}
          {view.showForces &&
            result.solved &&
            truss.members.map((m) => {
              const a = truss.nodes.find((n) => n.id === m.from);
              const b = truss.nodes.find((n) => n.id === m.to);
              const r = resFor(m.id);
              if (!a || !b || !r || r.state === "zero") return null;
              const mx = (a.x + b.x) / 2,
                my = (a.y + b.y) / 2;
              return (
                <g
                  key={`f${m.id}`}
                  transform={`translate(${mx},${my}) scale(1,-1)`}
                >
                  <text
                    x={0}
                    y={0}
                    fontSize={fontSize(vb)}
                    textAnchor="middle"
                    fill={memberColor(r, view.showStress)}
                    fontWeight={600}
                    style={{ paintOrder: "stroke" }}
                    stroke="#ffffff"
                    strokeWidth={fontSize(vb) * 0.18}
                  >
                    {(Math.abs(r.axialForce) / 1000).toFixed(1)}
                  </text>
                </g>
              );
            })}

          {/* Supports */}
          {truss.nodes.map((n) => (
            <SupportGlyph key={`s${n.id}`} node={n} size={strokeW(vb) * 6} />
          ))}

          {/* Loads */}
          {truss.loads.map((l) => {
            const n = truss.nodes.find((nn) => nn.id === l.nodeId);
            if (!n) return null;
            return (
              <LoadArrow
                key={l.id}
                x={n.x}
                y={n.y}
                fx={l.fx}
                fy={l.fy}
                len={vb.w * 0.06}
              />
            );
          })}

          {/* Nodes */}
          {truss.nodes.map((n) => {
            const sel = selectedNode === n.id;
            const pend = pendingMember === n.id;
            return (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={strokeW(vb) * (sel || pend ? 3.4 : 2.6)}
                fill={
                  pend ? "#f59e0b" : sel ? "#111827" : "var(--color-primary)"
                }
                stroke="#ffffff"
                strokeWidth={strokeW(vb) * 0.6}
                className="cursor-pointer"
                onClick={(e) => onNodeClick(n.id, e)}
                onPointerDown={(e) => {
                  if (tool === "select") {
                    e.stopPropagation();
                    setDragNode(n.id);
                    (e.currentTarget as SVGElement).setPointerCapture(
                      e.pointerId,
                    );
                  }
                }}
              />
            );
          })}
        </g>
      </svg>

      {/* Hover tooltip */}
      {hover ? (
        <div className="glass pointer-events-none absolute top-3 left-3 rounded-lg px-2.5 py-1 text-[11px] font-medium text-[var(--color-foreground)]">
          {hover.text}
        </div>
      ) : null}

      {/* Fit button */}
      <button
        type="button"
        onClick={() => setViewBox(null)}
        className="glass absolute right-3 bottom-3 rounded-lg px-2.5 py-1 text-[11px] font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        Fit view
      </button>

      {tool === "add-member" && pendingMember ? (
        <div className="glass pointer-events-none absolute bottom-3 left-3 rounded-lg px-2.5 py-1 text-[11px] text-[var(--color-foreground)]">
          Click a second joint to connect
        </div>
      ) : null}
    </div>
  );
}

// ── rendering helpers ────────────────────────────────────────────────────────

function memberColor(r: MemberResult | undefined, byStress: boolean): string {
  if (!r || r.state === "zero") return ZERO;
  if (byStress) {
    const u = Math.min(1, r.utilization);
    // green→amber→red by utilization
    const c =
      u < 0.5 ? [34, 197, 94] : u < 0.8 ? [245, 158, 11] : [220, 38, 38];
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }
  return r.state === "tension" ? TENSION : COMPRESSION;
}

function forceWidth(r: MemberResult | undefined): number {
  if (!r || r.state === "zero") return 0.8;
  return 1 + Math.min(2.5, r.utilization * 2.5);
}

function strokeW(vb: { w: number }): number {
  return vb.w * 0.006;
}
function fontSize(vb: { w: number }): number {
  return vb.w * 0.022;
}

/** Auto scale so the deformed shape is visible (target ~8% of model size). */
function autoDeformScale(
  result: AnalysisResult,
  b: { maxX: number; minX: number; maxY: number; minY: number },
): number {
  if (!result.solved || result.maxDisplacement < 1e-12) return 0;
  const size = Math.max(b.maxX - b.minX, b.maxY - b.minY, 1);
  return (size * 0.08) / result.maxDisplacement;
}

function snap(v: number): number {
  return Math.round(v * 2) / 2; // 0.5 m grid
}

function GridLayer({
  vb,
}: {
  vb: { x: number; y: number; w: number; h: number };
}) {
  const step = niceStep(vb.w);
  const lines: React.ReactElement[] = [];
  const x0 = Math.floor(vb.x / step) * step;
  const y0 = Math.floor(vb.y / step) * step;
  for (let x = x0; x <= vb.x + vb.w; x += step) {
    lines.push(
      <line
        key={`gx${x}`}
        x1={x}
        y1={vb.y}
        x2={x}
        y2={vb.y + vb.h}
        stroke="var(--color-border)"
        strokeWidth={vb.w * 0.0012}
        strokeOpacity={0.5}
      />,
    );
  }
  for (let y = y0; y <= vb.y + vb.h; y += step) {
    lines.push(
      <line
        key={`gy${y}`}
        x1={vb.x}
        y1={y}
        x2={vb.x + vb.w}
        y2={y}
        stroke="var(--color-border)"
        strokeWidth={vb.w * 0.0012}
        strokeOpacity={0.5}
      />,
    );
  }
  return <g>{lines}</g>;
}

function niceStep(w: number): number {
  const raw = w / 10;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p;
}

function SupportGlyph({ node, size }: { node: Node; size: number }) {
  if (node.support === "none") return null;
  const { x, y } = node;
  const s = size;
  // Drawn in the flipped scene; counter-flip text/triangles as needed.
  if (node.support === "pin" || node.support === "fixed") {
    return (
      <g>
        <polygon
          points={`${x},${y} ${x - s * 0.7},${y - s} ${x + s * 0.7},${y - s}`}
          fill="none"
          stroke="var(--color-muted-foreground)"
          strokeWidth={s * 0.12}
        />
        <line
          x1={x - s}
          y1={y - s}
          x2={x + s}
          y2={y - s}
          stroke="var(--color-muted-foreground)"
          strokeWidth={s * 0.12}
        />
      </g>
    );
  }
  // rollers
  const roll = (
    <g>
      <polygon
        points={`${x},${y} ${x - s * 0.7},${y - s} ${x + s * 0.7},${y - s}`}
        fill="none"
        stroke="var(--color-muted-foreground)"
        strokeWidth={s * 0.12}
      />
      <circle
        cx={x - s * 0.35}
        cy={y - s - s * 0.2}
        r={s * 0.2}
        fill="var(--color-muted-foreground)"
      />
      <circle
        cx={x + s * 0.35}
        cy={y - s - s * 0.2}
        r={s * 0.2}
        fill="var(--color-muted-foreground)"
      />
    </g>
  );
  return roll;
}

function LoadArrow({
  x,
  y,
  fx,
  fy,
  len,
}: {
  x: number;
  y: number;
  fx: number;
  fy: number;
  len: number;
}) {
  const mag = Math.hypot(fx, fy) || 1;
  const ux = (fx / mag) * len;
  const uy = (fy / mag) * len;
  // Arrow points in load direction, starting away from the node.
  const tail = { x: x - ux, y: y - uy };
  return (
    <g stroke="#e11d48" strokeWidth={len * 0.08} fill="#e11d48">
      <line x1={tail.x} y1={tail.y} x2={x} y2={y} />
      <polygon
        points={`${x},${y} ${x - ux * 0.28 - uy * 0.12},${y - uy * 0.28 + ux * 0.12} ${x - ux * 0.28 + uy * 0.12},${y - uy * 0.28 - ux * 0.12}`}
      />
    </g>
  );
}
