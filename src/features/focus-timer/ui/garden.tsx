"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useFocus } from "../state/store";
import { computeStats, heatmapCells } from "../lib/stats";
import { plantFor } from "../lib/garden";
import { Plant } from "./plant";

/**
 * The garden: one plant per active day. Recent days render as living plants
 * that grow with the day's focus count (sprout → flourish); the full year sits
 * below as a compact heat grid so months of history stay glanceable. Hovering a
 * plant surfaces its day + count. The whole bed rests on a soft soil gradient
 * with a horizon glow so it reads as a scene, not a chart.
 */
export function Garden() {
  const { sessions, settings } = useFocus();
  const reduce = useReducedMotion();
  const goal = settings.dailyGoal;

  const { byDay } = useMemo(() => computeStats(sessions), [sessions]);
  const recent = useMemo(() => heatmapCells(byDay, 84), [byDay]); // ~12 weeks
  const year = useMemo(() => heatmapCells(byDay, 364), [byDay]);

  const [hover, setHover] = useState<{ key: string; count: number } | null>(
    null,
  );

  const grown = recent.filter((c) => c.count > 0).length;

  const level = (c: number) =>
    c === 0 ? 0 : c === 1 ? 1 : c <= 3 ? 2 : c <= 5 ? 3 : 4;
  const alpha = [0, 0.3, 0.52, 0.76, 1];
  const yearWeeks: (typeof year)[] = [];
  for (let i = 0; i < year.length; i += 7) yearWeeks.push(year.slice(i, i + 7));

  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <span className="microlabel">Your garden</span>
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
            {grown > 0
              ? `${grown} day${grown === 1 ? "" : "s"} in bloom over the last 12 weeks`
              : "Complete a focus session to plant your first sprout"}
          </p>
        </div>
        <span className="h-5 text-right text-[11px] text-[var(--color-muted-foreground)]">
          {hover
            ? `${hover.count} session${hover.count === 1 ? "" : "s"} · ${new Date(
                hover.key,
              ).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}`
            : `Goal ${goal}/day`}
        </span>
      </div>

      {/* the living bed */}
      <div className="relative mt-3">
        {/* horizon glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-primary) 12%, transparent), transparent)",
          }}
        />
        {/* soil band */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-6"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-foreground) 10%, transparent), transparent)",
          }}
        />

        <div className="relative overflow-x-auto px-4 pb-4">
          <div
            className="grid grid-flow-col gap-x-1 gap-y-0"
            style={{
              gridTemplateRows: "repeat(7, minmax(0, 1fr))",
            }}
          >
            {recent.map((c, i) => {
              const spec = plantFor(c.key, c.count, goal);
              const active = c.count > 0;
              return (
                <motion.div
                  key={c.key}
                  initial={
                    reduce || !active ? false : { opacity: 0, y: 6, scale: 0.6 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: reduce ? 0 : Math.min(i * 0.004, 0.4),
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  onMouseEnter={() => setHover({ key: c.key, count: c.count })}
                  onMouseLeave={() => setHover(null)}
                  className="flex h-7 w-5 items-end justify-center text-[var(--color-ok)]"
                  title={`${c.count} on ${c.key}`}
                >
                  <div className="h-full w-full origin-bottom">
                    <Plant spec={spec} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* full-year compact grid */}
      <div className="border-t border-[var(--color-border)] px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="microlabel">Full year</span>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted-foreground)]">
            Less
            {alpha.map((a, i) => (
              <span
                key={i}
                className="size-[9px] rounded-[2px]"
                style={{
                  backgroundColor:
                    a === 0
                      ? "var(--color-muted)"
                      : `color-mix(in oklch, var(--color-ok) ${a * 100}%, transparent)`,
                }}
              />
            ))}
            More
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-[3px]">
            {yearWeeks.map((w, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {w.map((c) => (
                  <span
                    key={c.key}
                    onMouseEnter={() =>
                      setHover({ key: c.key, count: c.count })
                    }
                    onMouseLeave={() => setHover(null)}
                    className="size-[9px] rounded-[2px] transition-colors"
                    style={{
                      backgroundColor:
                        c.count === 0
                          ? "var(--color-muted)"
                          : `color-mix(in oklch, var(--color-ok) ${alpha[level(c.count)]! * 100}%, transparent)`,
                    }}
                    title={`${c.count} on ${c.key}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
