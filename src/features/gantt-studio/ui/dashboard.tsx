"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  ListTodo,
  Lightbulb,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useSchedule } from "../state/use-schedule";
import { StatCard, Card, Pill } from "./primitives";
import { formatShort } from "../lib/dates";
import { STATUS_META } from "../lib/factory";
import type { ScheduledTask } from "../types";

/** Executive dashboard: KPI tiles, progress ring, status mix, alerts, milestones. */
export function Dashboard() {
  const { stats, conflicts, suggestions, tasks } = useSchedule();

  const statusCounts = tasks
    .filter((t) => !t.hasChildren)
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    }, {});
  const leafCount = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total tasks"
          value={stats.totalTasks}
          icon={<ListTodo className="size-4" />}
        />
        <StatCard
          label="Completed"
          value={stats.completedTasks}
          sub={`${stats.remainingTasks} remaining`}
          accent="#22c55e"
          icon={<CheckCircle2 className="size-4" />}
        />
        <StatCard
          label="Critical tasks"
          value={stats.criticalTaskCount}
          accent="#f43f5e"
          icon={<Zap className="size-4" />}
        />
        <StatCard
          label="Delayed"
          value={stats.delayedTasks}
          accent={stats.delayedTasks ? "#f59e0b" : undefined}
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Progress ring */}
        <Card title="Overall progress">
          <div className="flex items-center gap-5">
            <ProgressRing value={stats.overallProgress} />
            <div className="space-y-1 text-sm">
              <p className="text-[var(--color-muted-foreground)]">
                {stats.projectStart ? formatShort(stats.projectStart) : "—"} →{" "}
                {stats.projectEnd ? formatShort(stats.projectEnd) : "—"}
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <TrendingUp className="size-4 text-[var(--color-primary)]" />
                {stats.totalDurationDays} day span
              </p>
            </div>
          </div>
        </Card>

        {/* Status mix */}
        <Card title="Status breakdown">
          <div className="space-y-2.5">
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const count = statusCounts[key] ?? 0;
              const pct = Math.round((count / leafCount) * 100);
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[var(--color-muted-foreground)]">
                      {meta.label}
                    </span>
                    <span className="tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: meta.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming milestones */}
        <Card title="Upcoming milestones">
          {stats.upcomingMilestones.length ? (
            <ul className="space-y-2.5">
              {stats.upcomingMilestones.map((m: ScheduledTask) => (
                <li key={m.id} className="flex items-center gap-2.5 text-sm">
                  <Flag className="size-3.5 shrink-0 text-[var(--color-primary)]" />
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  <span className="shrink-0 text-xs text-[var(--color-muted-foreground)]">
                    {formatShort(m.startDate)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No upcoming milestones. Add a milestone to mark a key date.
            </p>
          )}
        </Card>
      </div>

      {/* Smart scheduling */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Smart scheduling"
          action={
            <Pill color={conflicts.length ? "#f59e0b" : "#22c55e"}>
              {conflicts.length
                ? `${conflicts.length} issue${conflicts.length === 1 ? "" : "s"}`
                : "Healthy"}
            </Pill>
          }
        >
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
                <span className="text-[var(--color-muted-foreground)]">
                  {s}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Conflicts & warnings">
          {conflicts.length ? (
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {conflicts.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0"
                    style={{
                      color: c.severity === "error" ? "#ef4444" : "#f59e0b",
                    }}
                  />
                  <span className="text-[var(--color-muted-foreground)]">
                    {c.message}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
              <CheckCircle2 className="size-4 text-emerald-500" />
              No scheduling conflicts detected.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 80 80" className="size-24 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="8"
        />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold tabular-nums">
        {value}%
      </span>
    </div>
  );
}
