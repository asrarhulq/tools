"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** A labelled key/value row used throughout the analysis panels. */
export function DataRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-border)] py-2 last:border-0">
      <span className="text-sm text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <span
        className="text-right text-sm font-medium tabular-nums"
        title={hint}
      >
        {value}
      </span>
    </div>
  );
}

/** A prominent metric tile (big number + label). */
export function StatTile({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
      <p
        className="mt-1 text-2xl font-semibold tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
        {unit ? (
          <span className="ml-1 text-sm font-normal text-[var(--color-muted-foreground)]">
            {unit}
          </span>
        ) : null}
      </p>
    </motion.div>
  );
}

/** A 0–100 score meter with a colored fill. */
export function ScoreMeter({
  label,
  score,
  invert,
}: {
  label: string;
  score: number;
  /** When true, low scores are good (e.g. complexity). */
  invert?: boolean;
}) {
  const good = invert ? score < 40 : score > 66;
  const mid = invert ? score < 70 : score > 33;
  const color = good ? "#22c55e" : mid ? "#f59e0b" : "#ef4444";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--color-muted-foreground)]">{label}</span>
        <span className="font-medium tabular-nums">
          {Math.round(score)}/100
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/** A status pill (ok / warn / bad). */
export function StatusPill({
  status,
  children,
}: {
  status: "ok" | "warn" | "bad";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        status === "ok" &&
          "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
        status === "warn" &&
          "bg-amber-500/12 text-amber-600 dark:text-amber-400",
        status === "bad" && "bg-rose-500/12 text-rose-600 dark:text-rose-400",
      )}
    >
      {children}
    </span>
  );
}

/** A compact labelled number input used across the control panels. */
export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  suffix,
  className,
}: {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label ? (
        <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
          {label}
        </span>
      ) : null}
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(n);
          }}
          className="w-full min-w-0 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 py-1.5 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        />
        {suffix ? (
          <span className="shrink-0 text-xs text-[var(--color-muted-foreground)]">
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/** Card wrapper for a panel section. */
export function PanelCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
