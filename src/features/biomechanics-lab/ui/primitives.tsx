"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { rampCss } from "../lib/colormap";

/** Section card. */
export function Card({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4",
        className,
      )}
    >
      {title || action ? (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title ? (
            <h3 className="text-sm font-semibold">{title}</h3>
          ) : (
            <span />
          )}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** Metric row: label + value. */
export function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border)] py-1.5 last:border-0">
      <span className="text-xs text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <span className="text-right text-sm font-medium tabular-nums">
        {value}
        {sub ? (
          <span className="ml-1 text-[11px] font-normal text-[var(--color-muted-foreground)]">
            {sub}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/** A labeled load/activation bar colored by the shared ramp. */
export function LoadBar({
  label,
  fraction,
  value,
}: {
  label: string;
  fraction: number;
  value?: string;
}) {
  const f = Math.max(0, Math.min(1, fraction));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-muted-foreground)]">{label}</span>
        {value ? <span className="tabular-nums">{value}</span> : null}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: rampCss(f) }}
          initial={{ width: 0 }}
          animate={{ width: `${f * 100}%` }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/** Risk pill. */
export function RiskPill({ level }: { level: "low" | "moderate" | "high" }) {
  const map = {
    low: { color: "#22c55e", label: "Low" },
    moderate: { color: "#f59e0b", label: "Moderate" },
    high: { color: "#ef4444", label: "High" },
  }[level];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${map.color}22`, color: map.color }}
    >
      {map.label}
    </span>
  );
}

/** A slider with label + value. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs">
        <span className="text-[var(--color-muted-foreground)]">{label}</span>
        <span className="font-medium tabular-nums">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-primary)]"
      />
    </label>
  );
}
