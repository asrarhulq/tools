"use client";

import { useCallback, useRef, useState } from "react";
import { useBeam } from "../state/store";
import { useBeamAnalysis } from "../state/use-analysis";
import { DIAGRAM_COLORS } from "../ui/primitives";
import * as U from "../lib/units";
import type { BeamResult, Diagram, Load, Support, UnitSystem } from "../types";

/**
 * Interactive beam workspace (SVG). Renders the beam axis, supports, internal
 * hinges, loads (point / moment / distributed), and the live deflected shape.
 * Supports and loads are draggable along the beam with intelligent snapping to
 * beam ends, existing supports/loads, and a fine grid. Everything is in one
 * mapped coordinate space: model x∈[0,L] → screen, so overlays and diagrams
 * below the beam align exactly.
 */

const PAD_X = 60;
const BEAM_Y = 90; // screen y of the beam axis within the canvas viewport
const H = 200; // canvas logical height
const SNAP_PX = 8;

export function BeamCanvas() {
  const {
    beam,
    tool,
    units,
    view,
    selectedSupport,
    selectedLoad,
    activeCase,
    addSupport,
    updateSupport,
    selectSupport,
    addHinge,
    addLoad,
    updateLoad,
    selectLoad,
  } = useBeam();
  const { result } = useBeamAnalysis();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [drag, setDrag] = useState<{
    kind: "support" | "load";
    id: string;
  } | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Measure width responsively.
  const measure = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    wrapRef.current = el;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
  }, []);

  const usableW = Math.max(200, width - PAD_X * 2);
  const xToPx = (x: number) => PAD_X + (x / beam.length) * usableW;
  const pxToX = (px: number) => ((px - PAD_X) / usableW) * beam.length;

  const snap = (x: number): number => {
    const targets = [
      0,
      beam.length,
      ...beam.supports.map((s) => s.x),
      ...beam.loads.map((l) => l.x),
    ];
    const pxX = xToPx(x);
    for (const t of targets) {
      if (Math.abs(xToPx(t) - pxX) < SNAP_PX) return t;
    }
    // grid snap to 0.25 m
    return Math.round(x * 4) / 4;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp(pxToX(e.clientX - rect.left), 0, beam.length);
    setHoverX(x);
    if (drag) {
      const sx = snap(x);
      if (drag.kind === "support") updateSupport(drag.id, { x: sx });
      else updateLoad(drag.id, { x: sx });
    }
  };
  const onPointerUp = () => setDrag(null);

  const onBeamClick = (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = snap(clamp(pxToX(e.clientX - rect.left), 0, beam.length));
    if (tool === "add-support") addSupport(x, "pin");
    else if (tool === "add-hinge") addHinge(x);
    else if (tool === "add-load")
      addLoad({ type: "point", x, magnitude: -10000, caseId: activeCase });
    else {
      selectSupport(null);
    }
  };

  // Deflected shape polyline (screen space), scaled to be visible.
  const deflPath = () => {
    const dfl = result.deflection;
    if (!view.deflected || !result.solved || dfl.x.length < 2) return null;
    const maxAbs = Math.max(1e-12, Math.abs(result.maxDeflection));
    const amp = 28 * view.deflScale; // px
    const pts = dfl.x.map((x, i) => {
      const y = BEAM_Y - ((dfl.y[i] ?? 0) / maxAbs) * amp;
      return `${xToPx(x)},${y}`;
    });
    return pts.join(" ");
  };

  return (
    <div
      ref={measure}
      className="relative w-full overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ height: H + 40 }}
    >
      <svg
        width={width}
        height={H + 40}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          setDrag(null);
          setHoverX(null);
        }}
        className="touch-none select-none"
      >
        {/* Grid ticks */}
        {gridTicks(beam.length).map((gx) => (
          <g key={gx}>
            <line
              x1={xToPx(gx)}
              y1={BEAM_Y + 8}
              x2={xToPx(gx)}
              y2={BEAM_Y + 12}
              stroke="var(--color-border)"
            />
            <text
              x={xToPx(gx)}
              y={BEAM_Y + 24}
              fontSize={9}
              textAnchor="middle"
              fill="var(--color-muted-foreground)"
            >
              {U.lengthFromSI(gx, units).toFixed(units === "si" ? 0 : 1)}
            </text>
          </g>
        ))}

        {/* Distributed loads (draw behind beam) */}
        {view.original &&
          beam.loads
            .filter(
              (l) =>
                l.caseId === activeCase &&
                l.type !== "point" &&
                l.type !== "moment",
            )
            .map((l) => (
              <DistLoad
                key={l.id}
                load={l}
                xToPx={xToPx}
                beamY={BEAM_Y}
                selected={selectedLoad === l.id}
                onSelect={() => selectLoad(l.id)}
                onDrag={() => setDrag({ kind: "load", id: l.id })}
              />
            ))}

        {/* Deflected shape */}
        {deflPath() ? (
          <polyline
            points={deflPath()!}
            fill="none"
            stroke={DIAGRAM_COLORS.deflection}
            strokeWidth={2}
            strokeDasharray="1 0"
            opacity={0.9}
          />
        ) : null}

        {/* Beam axis */}
        {view.original ? (
          <line
            x1={xToPx(0)}
            y1={BEAM_Y}
            x2={xToPx(beam.length)}
            y2={BEAM_Y}
            stroke={DIAGRAM_COLORS.beam}
            strokeWidth={5}
            strokeLinecap="round"
          />
        ) : null}

        {/* Supports */}
        {beam.supports.map((s) => (
          <SupportGlyph
            key={s.id}
            support={s}
            x={xToPx(s.x)}
            y={BEAM_Y}
            selected={selectedSupport === s.id}
            onSelect={() => selectSupport(s.id)}
            onDrag={() => setDrag({ kind: "support", id: s.id })}
          />
        ))}

        {/* Hinges */}
        {beam.hinges.map((h) => (
          <circle
            key={h.id}
            cx={xToPx(h.x)}
            cy={BEAM_Y}
            r={4}
            fill="var(--color-surface)"
            stroke={DIAGRAM_COLORS.beam}
            strokeWidth={2}
          />
        ))}

        {/* Reactions */}
        {view.reactions &&
          result.solved &&
          result.reactions.map((r) =>
            Math.abs(r.Fy) > 1 ? (
              <g key={r.supportId}>
                <line
                  x1={xToPx(r.x)}
                  y1={BEAM_Y + 44}
                  x2={xToPx(r.x)}
                  y2={BEAM_Y + 20}
                  stroke={DIAGRAM_COLORS.reaction}
                  strokeWidth={2.5}
                  markerEnd="url(#rxArrow)"
                />
                <text
                  x={xToPx(r.x)}
                  y={BEAM_Y + 56}
                  fontSize={9}
                  textAnchor="middle"
                  fill={DIAGRAM_COLORS.reaction}
                  fontWeight={600}
                >
                  {U.fmtForce(Math.abs(r.Fy), units)}
                </text>
              </g>
            ) : null,
          )}

        {/* Point loads + moments */}
        {view.original &&
          beam.loads
            .filter(
              (l) =>
                l.caseId === activeCase &&
                (l.type === "point" || l.type === "moment"),
            )
            .map((l) =>
              l.type === "point" ? (
                <PointLoad
                  key={l.id}
                  load={l}
                  x={xToPx(l.x)}
                  y={BEAM_Y}
                  units={units}
                  selected={selectedLoad === l.id}
                  onSelect={() => selectLoad(l.id)}
                  onDrag={() => setDrag({ kind: "load", id: l.id })}
                />
              ) : (
                <MomentLoad
                  key={l.id}
                  load={l}
                  x={xToPx(l.x)}
                  y={BEAM_Y}
                  selected={selectedLoad === l.id}
                  onSelect={() => selectLoad(l.id)}
                  onDrag={() => setDrag({ kind: "load", id: l.id })}
                />
              ),
            )}

        {/* Beam click layer (below glyphs via pointer-events on the rect) */}
        <rect
          x={PAD_X}
          y={BEAM_Y - 30}
          width={usableW}
          height={60}
          fill="transparent"
          onClick={onBeamClick}
          style={{ cursor: tool === "select" ? "default" : "copy" }}
        />

        <defs>
          <marker
            id="rxArrow"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="1"
            orient="auto"
          >
            <path d="M0,7 L4,0 L8,7 Z" fill={DIAGRAM_COLORS.reaction} />
          </marker>
          <marker
            id="ldArrow"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="7"
            orient="auto"
          >
            <path d="M0,0 L4,7 L8,0 Z" fill={DIAGRAM_COLORS.load} />
          </marker>
        </defs>
      </svg>

      {/* Hover readout */}
      {hoverX != null && result.solved ? (
        <HoverReadout result={result} x={hoverX} units={units} />
      ) : null}

      {tool !== "select" ? (
        <div className="glass pointer-events-none absolute top-3 left-3 rounded-lg px-2.5 py-1 text-[11px] font-medium text-[var(--color-foreground)]">
          {tool === "add-support"
            ? "Click the beam to add a support"
            : tool === "add-load"
              ? "Click to add a point load"
              : "Click to add a hinge"}
        </div>
      ) : null}
    </div>
  );
}

// ── Sub-glyphs ────────────────────────────────────────────────────────────────

function SupportGlyph({
  support,
  x,
  y,
  selected,
  onSelect,
  onDrag,
}: {
  support: Support;
  x: number;
  y: number;
  selected: boolean;
  onSelect: () => void;
  onDrag: () => void;
}) {
  const c = selected ? "#111827" : DIAGRAM_COLORS.support;
  const s = 12;
  const common = {
    className: "cursor-grab",
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect();
      onDrag();
    },
  };
  return (
    <g {...common}>
      {support.type === "pin" ? (
        <>
          <polygon
            points={`${x},${y} ${x - s},${y + s} ${x + s},${y + s}`}
            fill="none"
            stroke={c}
            strokeWidth={2}
          />
          <line
            x1={x - s * 1.3}
            y1={y + s}
            x2={x + s * 1.3}
            y2={y + s}
            stroke={c}
            strokeWidth={2}
          />
        </>
      ) : support.type === "roller" ? (
        <>
          <polygon
            points={`${x},${y} ${x - s},${y + s - 3} ${x + s},${y + s - 3}`}
            fill="none"
            stroke={c}
            strokeWidth={2}
          />
          <circle cx={x - 5} cy={y + s} r={3} fill={c} />
          <circle cx={x + 5} cy={y + s} r={3} fill={c} />
          <line
            x1={x - s * 1.3}
            y1={y + s + 4}
            x2={x + s * 1.3}
            y2={y + s + 4}
            stroke={c}
            strokeWidth={2}
          />
        </>
      ) : support.type === "fixed" ? (
        <>
          <line
            x1={x}
            y1={y - s}
            x2={x}
            y2={y + s}
            stroke={c}
            strokeWidth={2}
          />
          {[-s, -4, 4, s].map((o) => (
            <line
              key={o}
              x1={x}
              y1={y + o}
              x2={x - 8}
              y2={y + o - 6}
              stroke={c}
              strokeWidth={1.5}
            />
          ))}
        </>
      ) : (
        // spring
        <>
          <path
            d={`M ${x} ${y} l 0 6 l -6 3 l 12 6 l -12 6 l 12 6 l -6 3`}
            fill="none"
            stroke={c}
            strokeWidth={1.5}
          />
          <line
            x1={x - s}
            y1={y + s + 12}
            x2={x + s}
            y2={y + s + 12}
            stroke={c}
            strokeWidth={2}
          />
        </>
      )}
    </g>
  );
}

function PointLoad({
  load,
  x,
  y,
  units,
  selected,
  onSelect,
  onDrag,
}: {
  load: Load;
  x: number;
  y: number;
  units: UnitSystem;
  selected: boolean;
  onSelect: () => void;
  onDrag: () => void;
}) {
  const down = load.magnitude <= 0;
  const y0 = down ? y - 42 : y + 42;
  const y1 = down ? y - 3 : y + 3;
  return (
    <g
      className="cursor-grab"
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        onDrag();
      }}
    >
      <line
        x1={x}
        y1={y0}
        x2={x}
        y2={y1}
        stroke={selected ? "#111827" : DIAGRAM_COLORS.load}
        strokeWidth={selected ? 3 : 2}
        markerEnd="url(#ldArrow)"
      />
      <text
        x={x}
        y={y0 - 4}
        fontSize={9}
        textAnchor="middle"
        fill={DIAGRAM_COLORS.load}
        fontWeight={600}
      >
        {U.fmtForce(Math.abs(load.magnitude), units)}
      </text>
    </g>
  );
}

function MomentLoad({
  load,
  x,
  y,
  selected,
  onSelect,
  onDrag,
}: {
  load: Load;
  x: number;
  y: number;
  selected: boolean;
  onSelect: () => void;
  onDrag: () => void;
}) {
  const cw = load.magnitude >= 0;
  return (
    <g
      className="cursor-grab"
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        onDrag();
      }}
    >
      <path
        d={`M ${x - 14} ${y} A 14 14 0 1 ${cw ? 1 : 0} ${x + 14} ${y}`}
        fill="none"
        stroke={selected ? "#111827" : DIAGRAM_COLORS.load}
        strokeWidth={2}
        markerEnd="url(#ldArrow)"
      />
    </g>
  );
}

function DistLoad({
  load,
  xToPx,
  beamY,
  selected,
  onSelect,
  onDrag,
}: {
  load: Load;
  xToPx: (x: number) => number;
  beamY: number;
  selected: boolean;
  onSelect: () => void;
  onDrag: () => void;
}) {
  const x0 = xToPx(load.x),
    x1 = xToPx(load.x + load.length);
  const h1 = load.type === "triangular" ? 0 : 26;
  const h2 =
    load.type === "point"
      ? 26
      : load.type === "trapezoidal"
        ? 26
        : load.type === "triangular"
          ? 26
          : 26;
  const top = beamY - 30;
  const nArrows = Math.max(2, Math.round((x1 - x0) / 22));
  return (
    <g
      className="cursor-grab"
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        onDrag();
      }}
    >
      <polygon
        points={`${x0},${top + (26 - h1)} ${x1},${top + (26 - h2)} ${x1},${beamY - 3} ${x0},${beamY - 3}`}
        fill={`${DIAGRAM_COLORS.load}22`}
        stroke={selected ? "#111827" : DIAGRAM_COLORS.load}
        strokeWidth={1.5}
      />
      {Array.from({ length: nArrows }).map((_, i) => {
        const xa = x0 + ((x1 - x0) * i) / (nArrows - 1);
        return (
          <line
            key={i}
            x1={xa}
            y1={top}
            x2={xa}
            y2={beamY - 3}
            stroke={DIAGRAM_COLORS.load}
            strokeWidth={1}
            opacity={0.5}
            markerEnd="url(#ldArrow)"
          />
        );
      })}
    </g>
  );
}

function HoverReadout({
  result,
  x,
  units,
}: {
  result: BeamResult;
  x: number;
  units: UnitSystem;
}) {
  const at = (d: Diagram) => interp(d.x, d.y, x);
  return (
    <div className="glass pointer-events-none absolute top-3 right-3 space-y-0.5 rounded-lg px-3 py-2 text-[11px] text-[var(--color-foreground)]">
      <div className="font-semibold">x = {U.fmtLength(x, units)}</div>
      <div>V = {U.fmtForce(at(result.shear), units)}</div>
      <div>M = {U.fmtMoment(at(result.moment), units)}</div>
      <div>δ = {U.fmtSmallLength(at(result.deflection), units, 2)}</div>
      <div>σ = {U.fmtStress(at(result.bendingStress), units)}</div>
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function gridTicks(L: number): number[] {
  const step = niceStep(L);
  const out: number[] = [];
  for (let x = 0; x <= L + 1e-9; x += step)
    out.push(Math.round(x * 1000) / 1000);
  return out;
}
function niceStep(L: number): number {
  const raw = L / 8;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p;
}
function interp(xs: number[], ys: number[], x: number): number {
  if (xs.length === 0) return 0;
  if (x <= xs[0]!) return ys[0]!;
  if (x >= xs[xs.length - 1]!) return ys[ys.length - 1]!;
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]!) {
      const t = (x - xs[i - 1]!) / (xs[i]! - xs[i - 1]! || 1);
      return ys[i - 1]! + t * (ys[i]! - ys[i - 1]!);
    }
  }
  return ys[ys.length - 1]!;
}
