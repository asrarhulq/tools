"use client";

import { useMemo, useState } from "react";
import { BODY_BY_ID } from "../data";
import { formatDateShort } from "../lib/format";
import { computeSkyTrack, synodicPeriodDays } from "../lib/geocentric";
import { julianDateToDate } from "../lib/julian-date";
import { useOrrery } from "../state/orrery-context";
import { Card } from "./primitives";

const TRACKABLE_IDS = [
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
] as const;

const SAMPLES = 180;
const CHART_W = 600;
const CHART_H = 200;
const PAD = { left: 40, right: 12, top: 12, bottom: 26 };

/**
 * Plots a planet's geocentric ecliptic longitude — its position as seen
 * from Earth, not the Sun — across a window sized to its synodic period
 * with Earth. A planet's own orbit only ever moves forward; this is what
 * reveals that its apparent path across Earth's sky periodically loops
 * backward (see `lib/geocentric.ts`), the observation that historically
 * broke the geocentric model.
 */
export function SkyTrackPanel() {
  const [targetId, setTargetId] =
    useState<(typeof TRACKABLE_IDS)[number]>("mars");
  const { displayJd } = useOrrery();

  const earth = BODY_BY_ID.get("earth")!;
  const body = BODY_BY_ID.get(targetId)!;

  const { points, retrogradeRuns, todayIndex } = useMemo(() => {
    const synodic = synodicPeriodDays(
      body.elements.periodDays,
      earth.elements.periodDays,
    );
    const windowDays = synodic * 0.72;
    const pts = computeSkyTrack(body, earth, displayJd, windowDays, SAMPLES);

    const runs: { from: number; to: number }[] = [];
    let runStart: number | null = null;
    for (let i = 1; i < pts.length; i++) {
      const retro = pts[i]!.longitudeDeg < pts[i - 1]!.longitudeDeg;
      if (retro && runStart === null) runStart = i - 1;
      if (!retro && runStart !== null) {
        runs.push({ from: runStart, to: i - 1 });
        runStart = null;
      }
    }
    if (runStart !== null) runs.push({ from: runStart, to: pts.length - 1 });

    return {
      points: pts,
      retrogradeRuns: runs,
      todayIndex: Math.round(SAMPLES / 2),
    };
  }, [body, earth, displayJd]);

  const longitudes = points.map((p) => p.longitudeDeg);
  const minL = Math.min(...longitudes);
  const maxL = Math.max(...longitudes);
  const span = maxL - minL || 1;

  const xFor = (i: number) =>
    PAD.left + (i / (points.length - 1)) * (CHART_W - PAD.left - PAD.right);
  const yFor = (l: number) =>
    PAD.top + (1 - (l - minL) / span) * (CHART_H - PAD.top - PAD.bottom);

  const pathD = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(p.longitudeDeg).toFixed(1)}`,
    )
    .join(" ");

  const hasRetrograde = retrogradeRuns.length > 0;

  return (
    <Card title="Sky track">
      <p className="mb-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
        This is {body.name}&apos;s position projected onto Earth&apos;s sky —
        not its orbit. A planet always moves forward around the Sun, but as seen
        from Earth it can appear to drift backward for weeks at a time.
      </p>

      <label className="mb-3 flex items-center gap-2 text-xs">
        <span className="text-[var(--color-muted-foreground)]">Track</span>
        <select
          value={targetId}
          onChange={(e) =>
            setTargetId(e.target.value as (typeof TRACKABLE_IDS)[number])
          }
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1"
        >
          {TRACKABLE_IDS.map((id) => (
            <option key={id} value={id}>
              {BODY_BY_ID.get(id)!.name}
            </option>
          ))}
        </select>
      </label>

      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full overflow-visible"
        role="img"
        aria-label={`${body.name}'s geocentric ecliptic longitude over time`}
      >
        {/* Y-axis gridlines + labels */}
        {[0, 0.5, 1].map((t) => {
          const y = PAD.top + t * (CHART_H - PAD.top - PAD.bottom);
          const value = maxL - t * span;
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={CHART_W - PAD.right}
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={9}
                fill="var(--color-muted-foreground)"
              >
                {value.toFixed(0)}°
              </text>
            </g>
          );
        })}

        {/* "Today" marker */}
        <line
          x1={xFor(todayIndex)}
          x2={xFor(todayIndex)}
          y1={PAD.top}
          y2={CHART_H - PAD.bottom}
          stroke="#f5c26b"
          strokeWidth={1.2}
          strokeDasharray="3 3"
        />

        <path d={pathD} fill="none" stroke="#7dd3fc" strokeWidth={2} />

        {retrogradeRuns.map((run, i) => {
          const seg = points
            .slice(run.from, run.to + 1)
            .map(
              (p, j) =>
                `${j === 0 ? "M" : "L"} ${xFor(run.from + j).toFixed(1)} ${yFor(p.longitudeDeg).toFixed(1)}`,
            )
            .join(" ");
          return (
            <path
              key={i}
              d={seg}
              fill="none"
              stroke="#f47174"
              strokeWidth={3}
            />
          );
        })}

        <text
          x={xFor(0)}
          y={CHART_H - 6}
          fontSize={9}
          fill="var(--color-muted-foreground)"
        >
          {formatDateShort(julianDateToDate(points[0]!.jd))}
        </text>
        <text
          x={xFor(points.length - 1)}
          y={CHART_H - 6}
          textAnchor="end"
          fontSize={9}
          fill="var(--color-muted-foreground)"
        >
          {formatDateShort(julianDateToDate(points[points.length - 1]!.jd))}
        </text>
      </svg>

      <div className="mt-2 flex items-center gap-4 text-[11px] text-[var(--color-muted-foreground)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 bg-[#7dd3fc]" /> Prograde
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 bg-[#f47174]" /> Retrograde
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-0 border-l border-dashed border-[#f5c26b]" />{" "}
          Today
        </span>
      </div>

      {!hasRetrograde && (
        <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
          No retrograde loop in this window — try nudging the simulated date;
          {` ${body.name}`} only reverses near opposition/conjunction.
        </p>
      )}
    </Card>
  );
}
