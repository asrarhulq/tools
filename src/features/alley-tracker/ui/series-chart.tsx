"use client";

import { useState } from "react";
import type { SeriesStats } from "../state/analysis";
import { SERIES } from "../lib/colors";
import { fmt } from "./primitives";

/**
 * Annual bars (one per year) coloured by period membership, with each period's
 * mean (solid) and bootstrap 95 % CI (band). Years outside both periods are
 * neutral grey; an excluded 2024 is drawn as an outline only.
 */
export function SeriesChart({
  s,
  dark,
  unit,
  exclude2024,
}: {
  s: SeriesStats;
  dark: boolean;
  unit: string;
  exclude2024: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720,
    H = 220,
    L = 40,
    R = 10,
    T = 12,
    B = 26;
  const n = s.years.length;
  const yMax = Math.max(1, ...s.values) * 1.08;
  const bw = (W - L - R) / n;
  const x = (i: number) => L + i * bw;
  const y = (v: number) => T + (H - T - B) * (1 - v / yMax);
  const col = dark ? SERIES.dark : SERIES.light;
  const grey = dark ? "#4a4a46" : "#cfcdc6";
  const inA = new Set(s.idxA),
    inB = new Set(s.idxB);
  const ticks = niceTicks(yMax);
  const muted = dark ? "#8c8b86" : "#8a8984";

  const band = (
    idx: number[],
    m: { mean: number; ci95: [number, number] },
    c: string,
  ) => {
    if (!idx.length) return null;
    const x0 = x(Math.min(...idx)),
      x1 = x(Math.max(...idx)) + bw;
    return (
      <g pointerEvents="none">
        <rect
          x={x0}
          y={y(m.ci95[1])}
          width={x1 - x0}
          height={Math.max(1, y(m.ci95[0]) - y(m.ci95[1]))}
          fill={c}
          opacity={0.16}
        />
        <line
          x1={x0}
          x2={x1}
          y1={y(m.mean)}
          y2={y(m.mean)}
          stroke={c}
          strokeWidth={2}
        />
      </g>
    );
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Annual ${unit}, ${s.years[0]}–${s.years[n - 1]}`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={L}
              x2={W - R}
              y1={y(t)}
              y2={y(t)}
              stroke={muted}
              strokeOpacity={0.25}
            />
            <text
              x={L - 6}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="11"
              fill={muted}
              className="font-mono"
            >
              {t}
            </text>
          </g>
        ))}
        {s.values.map((v, i) => {
          const yr = s.years[i];
          const excluded = exclude2024 && yr === 2024;
          const c = inB.has(i) ? col.b : inA.has(i) ? col.a : grey;
          const top = y(v);
          return (
            <rect
              key={yr}
              x={x(i) + 1}
              y={top}
              width={Math.max(1, bw - 2)}
              height={Math.max(0, y(0) - top)}
              rx={Math.min(2, bw / 4)}
              fill={excluded ? "none" : c}
              stroke={excluded ? muted : "none"}
              strokeDasharray={excluded ? "3 2" : undefined}
              opacity={hover === null || hover === i ? 1 : 0.55}
            />
          );
        })}
        {band(s.idxA, s.a, col.a)}
        {band(s.idxB, s.b, col.b)}
        <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke={muted} />
        {s.years.map((yr, i) =>
          yr % 10 === 0 ? (
            <text
              key={yr}
              x={x(i) + bw / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              fill={muted}
              className="font-mono"
            >
              {yr}
            </text>
          ) : null,
        )}
        {s.values.map((_, i) => (
          <rect
            key={i}
            x={x(i)}
            y={T}
            width={bw}
            height={H - T - B}
            fill="transparent"
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {hover !== null ? (
        <div
          className="pointer-events-none absolute top-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 font-mono text-[11px] tabular-nums shadow"
          style={{
            left: `${((x(hover) + bw / 2) / W) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {s.years[hover]!}:{" "}
          <span className="text-[var(--color-foreground)]">
            {fmt(s.values[hover]!, 0)}
          </span>{" "}
          {unit}
          {exclude2024 && s.years[hover] === 2024 ? " (excluded)" : ""}
        </div>
      ) : null}
    </div>
  );
}

function niceTicks(max: number): number[] {
  const step0 = max / 4;
  const p = 10 ** Math.floor(Math.log10(step0));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= step0) ?? p * 10;
  const out: number[] = [];
  for (let v = 0; v <= max; v += step) out.push(+v.toFixed(6));
  return out;
}
