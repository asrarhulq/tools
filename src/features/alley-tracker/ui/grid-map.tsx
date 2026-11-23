"use client";

import { useMemo, useState } from "react";
import type { AlleyData, BoxIdx, Selection } from "../lib/types";
import { NX, NY, boxLabel, cellOf } from "../lib/data";
import { MAP_H, MAP_W, outlinePath, project, ringPolygon } from "../lib/geo";
import { diverging, sequential } from "../lib/colors";
import type { FieldSigResult } from "../lib/stats";
import { fmt, signed } from "./primitives";

/**
 * The Agee et al. (2016) 2.5° grid over state outlines. Fill = annual mean in
 * Period A or B (sequential blue) or B − A (diverging blue↔red). Dots mark
 * boxes whose change is locally significant (block bootstrap, p < 0.05).
 * Hover any box for its numbers; click to inspect its time series.
 */
export function GridMap({
  data,
  sel,
  gA,
  gB,
  diff,
  ext,
  sig,
  dark,
  onSelectBox,
  unit,
}: {
  data: AlleyData;
  sel: Selection;
  gA: Float64Array;
  gB: Float64Array;
  diff: Float64Array;
  ext: { inc: BoxIdx; dec: BoxIdx; maxA: BoxIdx; maxB: BoxIdx };
  sig: FieldSigResult | null;
  dark: boolean;
  onSelectBox: (b: BoxIdx) => void;
  unit: string;
}) {
  const [hover, setHover] = useState<{
    b: BoxIdx;
    x: number;
    y: number;
  } | null>(null);
  const outline = useMemo(() => outlinePath(data.outline), [data.outline]);
  const { lat0, lon0, d } = data.meta.grid;
  const c = data.meta.center;
  const ring = useMemo(
    () => ringPolygon(c.lat, c.lon, sel.radiusKm),
    [c.lat, c.lon, sel.radiusKm],
  );
  const [sx, sy] = project(c.lon, c.lat);

  const values = sel.view === "a" ? gA : sel.view === "b" ? gB : diff;
  const scaleMax = useMemo(() => {
    if (sel.view === "diff") return Math.max(...diff.map(Math.abs));
    return Math.max(...gA, ...gB); // shared scale so A and B are comparable
  }, [sel.view, gA, gB, diff]);
  const fill = (v: number) =>
    sel.view === "diff"
      ? diverging(v, scaleMax, dark)
      : sequential(v, scaleMax, dark);

  const cell = (iy: number, ix: number) => {
    const [x0, y0] = project(lon0 + d * ix, lat0 + d * (iy + 1));
    const [x1, y1] = project(lon0 + d * (ix + 1), lat0 + d * iy);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };
  const g0 = cell(NY - 1, 0),
    g1 = cell(0, NX - 1);

  const highlight = (b: BoxIdx, stroke: string, dash?: string) => {
    const r = cell(b[0], b[1]);
    return (
      <rect
        x={r.x + 1.5}
        y={r.y + 1.5}
        width={r.w - 3}
        height={r.h - 3}
        fill="none"
        stroke={stroke}
        strokeWidth={3}
        strokeDasharray={dash}
        pointerEvents="none"
      />
    );
  };
  const ink = dark ? "#f0efec" : "#0b0b0b";
  const muted = dark ? "#8c8b86" : "#8a8984";

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="h-auto w-full select-none"
        role="img"
        aria-label="Map of the 2.5 degree tornado grid"
      >
        <defs>
          <pattern
            id="at-dots"
            width="9"
            height="9"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="4.5" cy="4.5" r="1.6" fill={ink} opacity="0.75" />
          </pattern>
        </defs>
        {Array.from({ length: NY }, (_, iy) =>
          Array.from({ length: NX }, (_, ix) => {
            const r = cell(iy, ix);
            const v = values[iy * NX + ix]!;
            return (
              <g key={`${iy}-${ix}`}>
                <rect
                  x={r.x + 1}
                  y={r.y + 1}
                  width={r.w - 2}
                  height={r.h - 2}
                  rx={3}
                  fill={fill(v)}
                  className="cursor-pointer"
                  onPointerMove={(e) => {
                    const box = (
                      e.currentTarget.ownerSVGElement as SVGSVGElement
                    ).getBoundingClientRect();
                    setHover({
                      b: [iy, ix],
                      x: e.clientX - box.left,
                      y: e.clientY - box.top,
                    });
                  }}
                  onPointerLeave={() => setHover(null)}
                  onClick={() => onSelectBox([iy, ix])}
                />
                {sig?.local[iy * NX + ix] ? (
                  <rect
                    x={r.x + 1}
                    y={r.y + 1}
                    width={r.w - 2}
                    height={r.h - 2}
                    fill="url(#at-dots)"
                    pointerEvents="none"
                  />
                ) : null}
              </g>
            );
          }),
        )}
        <path
          d={outline}
          fill="none"
          stroke={ink}
          strokeOpacity={0.55}
          strokeWidth={1.1}
          strokeLinejoin="round"
          pointerEvents="none"
        />
        <rect
          x={g0.x}
          y={g0.y}
          width={g1.x + g1.w - g0.x}
          height={g1.y + g1.h - g0.y}
          fill="none"
          stroke={muted}
          strokeWidth={1}
          pointerEvents="none"
        />
        {sel.view === "diff" ? (
          <>
            {highlight(ext.inc, ink)}
            {highlight(ext.dec, ink, "8 5")}
          </>
        ) : (
          highlight(sel.view === "a" ? ext.maxA : ext.maxB, ink)
        )}
        {highlight(sel.box, "var(--color-primary)")}
        <polyline
          points={ring.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          strokeDasharray="10 6"
          pointerEvents="none"
        />
        <polygon
          points={star(sx, sy, 13, 5.5)}
          fill="#cfb991"
          stroke={dark ? "#f0efec" : "#0b0b0b"}
          strokeWidth={1.5}
          pointerEvents="none"
        />
        {/* lat/lon ticks */}
        {[30, 35, 40, 45, 50].map((lat) => {
          const [, y] = project(-105, lat);
          return (
            <text
              key={lat}
              x={g0.x - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="13"
              fill={muted}
              className="font-mono"
            >
              {lat}°N
            </text>
          );
        })}
        {[-105, -100, -95, -90, -85, -80].map((lon) => {
          const [x] = project(lon, 30);
          return (
            <text
              key={lon}
              x={x}
              y={g1.y + g1.h + 18}
              textAnchor="middle"
              fontSize="13"
              fill={muted}
              className="font-mono"
            >
              {-lon}°W
            </text>
          );
        })}
      </svg>
      {hover ? (
        <Tooltip
          data={data}
          b={hover.b}
          x={hover.x}
          y={hover.y}
          gA={gA}
          gB={gB}
          sig={sig}
          unit={unit}
        />
      ) : null}
      <Legend
        view={sel.view}
        max={scaleMax}
        dark={dark}
        unit={unit}
        hasSig={!!sig}
      />
    </div>
  );
}

function star(cx: number, cy: number, R: number, r: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function Tooltip({
  data,
  b,
  x,
  y,
  gA,
  gB,
  sig,
  unit,
}: {
  data: AlleyData;
  b: BoxIdx;
  x: number;
  y: number;
  gA: Float64Array;
  gB: Float64Array;
  sig: FieldSigResult | null;
  unit: string;
}) {
  const c = cellOf(b);
  return (
    <div
      className="pointer-events-none absolute z-10 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-xs shadow-lg"
      style={{
        left: Math.min(x + 14, 9999),
        top: y + 14,
        transform: x > 420 ? "translateX(-110%)" : undefined,
      }}
    >
      <div className="mb-1.5 font-medium text-[var(--color-foreground)]">
        {boxLabel(data, b)}
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 font-mono text-[var(--color-muted-foreground)] tabular-nums">
        <dt>Period A</dt>
        <dd className="text-right text-[var(--color-foreground)]">
          {fmt(gA[c]!)}
        </dd>
        <dt>Period B</dt>
        <dd className="text-right text-[var(--color-foreground)]">
          {fmt(gB[c]!)}
        </dd>
        <dt>B − A</dt>
        <dd className="text-right text-[var(--color-foreground)]">
          {signed(gB[c]! - gA[c]!)}
        </dd>
      </dl>
      <div className="mt-1.5 text-[11px] text-[var(--color-muted-foreground)]">
        {unit} per year ·{" "}
        {sig
          ? sig.local[c]
            ? "change locally significant (p < 0.05)"
            : "change not significant"
          : "testing…"}
      </div>
    </div>
  );
}

function Legend({
  view,
  max,
  dark,
  unit,
  hasSig,
}: {
  view: Selection["view"];
  max: number;
  dark: boolean;
  unit: string;
  hasSig: boolean;
}) {
  const stops = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    return view === "diff"
      ? diverging((t * 2 - 1) * max, max, dark)
      : sequential(t * max, max, dark);
  });
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[var(--color-muted-foreground)]">
      <div className="flex items-center gap-2">
        <span className="font-mono tabular-nums">
          {view === "diff" ? signed(-max, 1) : "0"}
        </span>
        <span
          className="h-2.5 w-40 rounded-sm"
          style={{ background: `linear-gradient(90deg, ${stops.join(",")})` }}
        />
        <span className="font-mono tabular-nums">
          {view === "diff" ? signed(max, 1) : fmt(max, 1)}
        </span>
        <span>
          {view === "diff"
            ? `change in ${unit}/yr (B − A)`
            : `${unit} per year`}
        </span>
      </div>
      {hasSig ? (
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" aria-hidden>
            <rect
              width="14"
              height="14"
              rx="2"
              fill={dark ? "#383835" : "#f0efec"}
            />
            <circle cx="4" cy="4" r="1.4" fill={dark ? "#f0efec" : "#0b0b0b"} />
            <circle
              cx="10"
              cy="10"
              r="1.4"
              fill={dark ? "#f0efec" : "#0b0b0b"}
            />
          </svg>
          locally significant change
        </span>
      ) : null}
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-[2px] border-2 border-[var(--color-foreground)]" />
        {view === "diff"
          ? "largest increase (solid) / decrease (dashed)"
          : "busiest box"}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-[2px] border-2 border-[var(--color-primary)]" />
        inspected box
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-[#b59a62]">★</span> West Lafayette (Purdue) ·
        dashed ring = radius
      </span>
    </div>
  );
}
