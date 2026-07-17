"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Flame, Target, Timer, TrendingUp } from "lucide-react";
import { useFocus } from "../state/store";
import { computeStats } from "../lib/stats";
import { formatClock, formatHours, relativeDay } from "../lib/format";
import { MODE_LABEL } from "../lib/config";
import { Garden } from "./garden";

/** Animated count-up number (integers or 1-decimal), respects reduced motion. */
function Rolling({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const raf = useRef(0);

  useEffect(() => {
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- snap to target, no animation
      setDisplay(value);
      return;
    }
    const from = display;
    const start = performance.now();
    const dur = 700;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(from + (value - from) * eased);
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return (
    <span className="tabular-nums">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function StatCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-2)] p-4 transition-shadow hover:shadow-[var(--shadow-glow)]">
      {/* soft accent wash on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 -right-6 size-16 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "color-mix(in oklch, var(--color-primary) 40%, transparent)",
        }}
      />
      <div className="relative flex items-center gap-2 text-[var(--color-muted-foreground)] [&_svg]:size-4">
        {icon}
        <span className="microlabel">{label}</span>
      </div>
      <div className="font-display relative mt-2 text-2xl font-semibold">
        {children}
      </div>
    </div>
  );
}

export function StatsDashboard() {
  const { sessions } = useFocus();
  const stats = useMemo(() => computeStats(sessions), [sessions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Target />} label="Today">
          <Rolling value={stats.todayCount} />
        </StatCard>
        <StatCard icon={<Timer />} label="Focus hours">
          <span className="tabular-nums">
            {formatHours(stats.totalFocusHours)}
          </span>
        </StatCard>
        <StatCard icon={<Flame />} label="Streak">
          <Rolling value={stats.currentStreak} suffix="d" />
        </StatCard>
        <StatCard icon={<TrendingUp />} label="Focus score">
          <Rolling value={stats.focusScore} />
        </StatCard>
      </div>

      <FocusScoreRow />
      <Garden />
      <Timeline />
    </div>
  );
}

/** Secondary metrics row + a focus-score meter. */
function FocusScoreRow() {
  const { sessions } = useFocus();
  const s = useMemo(() => computeStats(sessions), [sessions]);
  const metrics = [
    { label: "This week", value: `${s.weekCount}` },
    { label: "Longest streak", value: `${s.longestStreak}d` },
    { label: "Avg session", value: `${Math.round(s.avgSessionMin)}m` },
    { label: "Completion", value: `${Math.round(s.completionPct)}%` },
    { label: "Interrupted", value: `${s.interrupted}` },
  ];
  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="microlabel">{m.label}</div>
            <div className="font-display mt-0.5 text-lg font-semibold tabular-nums">
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Recent sessions, newest first, grouped by day. */
function Timeline() {
  const { sessions } = useFocus();
  const recent = useMemo(() => sessions.slice(-12).reverse(), [sessions]);

  if (recent.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No sessions yet. Press{" "}
          <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-[10px]">
            Space
          </kbd>{" "}
          to begin your first focus session.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <span className="microlabel">Recent sessions</span>
      <ul className="mt-3 space-y-2">
        {recent.map((s, i) => (
          <motion.li
            key={`${s.at}-${i}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className="flex items-center gap-3 text-sm"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  s.mode === "focus"
                    ? "var(--color-primary)"
                    : "var(--color-muted-foreground)",
                opacity: s.completed ? 1 : 0.4,
              }}
            />
            <span className="w-24 shrink-0 font-medium">
              {MODE_LABEL[s.mode]}
            </span>
            <span className="flex-1 truncate text-[var(--color-muted-foreground)]">
              {s.completed
                ? `${Math.round(s.elapsed / 60)} min`
                : `interrupted · ${Math.round(s.elapsed / 60)} min`}
            </span>
            <span className="readout shrink-0 text-xs text-[var(--color-muted-foreground)]">
              {relativeDay(s.at)} · {formatClock(s.at)}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
