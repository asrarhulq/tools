"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useBeam } from "../state/store";
import { useBeamAnalysis } from "../state/use-analysis";
import { DIAGRAM_COLORS } from "../ui/primitives";
import * as U from "../lib/units";
import type { Diagram } from "../types";

/**
 * Stacked analysis diagrams (SFD, BMD, slope, deflection) drawn as filled SVG
 * area charts sharing the beam's x-axis, so they line up vertically with the
 * canvas above. Each chart marks its extreme value, animates on change, and
 * supports a shared hover crosshair. When multiple load cases exist, the shear
 * and moment charts also render the max/min envelope band.
 */

const CHART_H = 96;
const PAD_X = 60;

export function Diagrams() {
  const { beam, units, view } = useBeam();
  const { result, envelope } = useBeamAnalysis();
  const [hoverX, setHoverX] = useState<number | null>(null);

  if (!result.solved) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        Add supports and a load to see the shear, moment, and deflection
        diagrams.
      </div>
    );
  }

  const charts: Array<{
    show: boolean;
    label: string;
    unit: string;
    color: string;
    d: Diagram;
    fmt: (v: number) => string;
    env?: { max: number[]; min: number[] };
  }> = [
    {
      show: view.shear,
      label: "Shear Force (V)",
      unit: U.UNIT_LABELS[units].force,
      color: DIAGRAM_COLORS.shear,
      d: result.shear,
      fmt: (v) => U.fmtForce(v, units),
      env: envelope
        ? { max: envelope.shearMax, min: envelope.shearMin }
        : undefined,
    },
    {
      show: view.moment,
      label: "Bending Moment (M)",
      unit: U.UNIT_LABELS[units].moment,
      color: DIAGRAM_COLORS.moment,
      d: result.moment,
      fmt: (v) => U.fmtMoment(v, units),
      env: envelope
        ? { max: envelope.momentMax, min: envelope.momentMin }
        : undefined,
    },
    {
      show: view.slope,
      label: "Slope (θ)",
      unit: "rad",
      color: DIAGRAM_COLORS.slope,
      d: result.slope,
      fmt: (v) => v.toExponential(2),
    },
    {
      show: view.deflected,
      label: "Deflection (δ)",
      unit: U.UNIT_LABELS[units].smallLen,
      color: DIAGRAM_COLORS.deflection,
      d: result.deflection,
      fmt: (v) => U.fmtSmallLength(v, units, 2),
    },
  ];

  return (
    <div className="space-y-2">
      {charts
        .filter((c) => c.show)
        .map((c) => (
          <DiagramChart
            key={c.label}
            {...c}
            length={beam.length}
            hoverX={hoverX}
            setHoverX={setHoverX}
            envelope={
              c.env ? { x: envelope!.x, max: c.env.max, min: c.env.min } : null
            }
          />
        ))}
    </div>
  );
}

function DiagramChart({
  label,
  color,
  d,
  fmt,
  length,
  hoverX,
  setHoverX,
  envelope,
}: {
  label: string;
  unit: string;
  color: string;
  d: Diagram;
  fmt: (v: number) => string;
  length: number;
  hoverX: number | null;
  setHoverX: (x: number | null) => void;
  envelope: { x: number[]; max: number[]; min: number[] } | null;
}) {
  const [w, setW] = useState(900);
  const usableW = Math.max(200, w - PAD_X * 2);
  const xToPx = (x: number) => PAD_X + (x / length) * usableW;

  const absMax = Math.max(
    1e-12,
    ...d.y.map((v) => Math.abs(v)),
    ...(envelope ? [...envelope.max, ...envelope.min].map(Math.abs) : []),
  );
  const midY = CHART_H / 2;
  const yToPx = (v: number) => midY - (v / absMax) * (CHART_H / 2 - 12);

  const path = areaPath(d.x, d.y, xToPx, yToPx, midY);
  const linePath = linePathFrom(d.x, d.y, xToPx, yToPx);
  const envPath = envelope ? envelopeBand(envelope, xToPx, yToPx) : null;

  const maxPx = {
    x: xToPx(d.x[d.maxIndex] ?? 0),
    y: yToPx(d.y[d.maxIndex] ?? 0),
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left - PAD_X) / usableW) * length;
    setHoverX(Math.max(0, Math.min(length, x)));
  };

  const peak = fmt(
    Math.abs(d.maxValue) >= Math.abs(d.minValue) ? d.maxValue : d.minValue,
  );
  return (
    <div
      className="overflow-hidden rounded-[calc(var(--radius)-4px)] border border-[var(--color-border)] bg-[var(--color-surface)]/85 p-2 backdrop-blur-sm"
      ref={(el) => {
        if (el) setW(el.clientWidth);
      }}
    >
      <div className="mb-1 flex items-center justify-between px-1 text-[11px]">
        <span className="flex items-center gap-1.5 font-semibold">
          <span
            className="size-2 rounded-[2px]"
            style={{ backgroundColor: color }}
          />
          <span style={{ color }}>{label}</span>
        </span>
        <span className="readout text-[var(--color-muted-foreground)]">
          peak {peak}
        </span>
      </div>
      <svg
        width={w || 900}
        height={CHART_H}
        onPointerMove={onMove}
        onPointerLeave={() => setHoverX(null)}
        className="w-full"
      >
        {/* zero axis */}
        <line
          x1={PAD_X}
          y1={midY}
          x2={xToPx(length)}
          y2={midY}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
        {/* envelope band */}
        {envPath ? (
          <path d={envPath} fill={color} fillOpacity={0.12} stroke="none" />
        ) : null}
        {/* filled area */}
        <motion.path
          d={path}
          fill={color}
          fillOpacity={0.18}
          stroke="none"
          initial={false}
          animate={{ d: path }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.8}
          initial={false}
          animate={{ d: linePath }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* max marker */}
        <circle
          cx={maxPx.x}
          cy={maxPx.y}
          r={3.5}
          fill={color}
          stroke="var(--color-surface)"
          strokeWidth={1.5}
        />
        {/* hover crosshair */}
        {hoverX != null ? (
          <g>
            <line
              x1={xToPx(hoverX)}
              y1={4}
              x2={xToPx(hoverX)}
              y2={CHART_H - 4}
              stroke={color}
              strokeOpacity={0.4}
              strokeDasharray="3 3"
            />
            <circle
              cx={xToPx(hoverX)}
              cy={yToPx(interp(d.x, d.y, hoverX))}
              r={3}
              fill={color}
            />
          </g>
        ) : null}
      </svg>
    </div>
  );
}

// ── path builders ────────────────────────────────────────────────────────────

function linePathFrom(
  xs: number[],
  ys: number[],
  xToPx: (x: number) => number,
  yToPx: (v: number) => number,
): string {
  if (xs.length === 0) return "";
  return xs
    .map(
      (x, i) =>
        `${i === 0 ? "M" : "L"} ${xToPx(x).toFixed(1)} ${yToPx(ys[i] ?? 0).toFixed(1)}`,
    )
    .join(" ");
}
function areaPath(
  xs: number[],
  ys: number[],
  xToPx: (x: number) => number,
  yToPx: (v: number) => number,
  baseY: number,
): string {
  if (xs.length === 0) return "";
  const top = linePathFrom(xs, ys, xToPx, yToPx);
  return `${top} L ${xToPx(xs[xs.length - 1]!).toFixed(1)} ${baseY} L ${xToPx(xs[0]!).toFixed(1)} ${baseY} Z`;
}
function envelopeBand(
  env: { x: number[]; max: number[]; min: number[] },
  xToPx: (x: number) => number,
  yToPx: (v: number) => number,
): string {
  const up = env.x
    .map(
      (x, i) =>
        `${i === 0 ? "M" : "L"} ${xToPx(x).toFixed(1)} ${yToPx(env.max[i] ?? 0).toFixed(1)}`,
    )
    .join(" ");
  const down = [...env.x]
    .reverse()
    .map((x, i) => {
      const idx = env.x.length - 1 - i;
      return `L ${xToPx(x).toFixed(1)} ${yToPx(env.min[idx] ?? 0).toFixed(1)}`;
    })
    .join(" ");
  return `${up} ${down} Z`;
}
function interp(xs: number[], ys: number[], x: number): number {
  if (xs.length === 0) return 0;
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]!) {
      const t = (x - xs[i - 1]!) / (xs[i]! - xs[i - 1]! || 1);
      return (ys[i - 1] ?? 0) + t * ((ys[i] ?? 0) - (ys[i - 1] ?? 0));
    }
  }
  return ys[ys.length - 1] ?? 0;
}
