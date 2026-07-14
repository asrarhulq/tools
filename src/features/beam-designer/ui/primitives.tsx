"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Panel({
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
        "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5",
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

export function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border)] py-1.5 last:border-0">
      <span className="text-xs text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <span
        className="text-right text-sm font-medium tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function Field({
  label,
  children,
  className,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] text-[var(--color-muted-foreground)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]";
export function NumberInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      type="number"
      {...props}
      className={cn(inputBase, "tabular-nums", props.className)}
    />
  );
}
export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}
export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(inputBase, "cursor-pointer", props.className)}
    >
      {children}
    </select>
  );
}

export function Stat({
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      <p className="text-[11px] text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p
        className="mt-0.5 text-lg font-semibold tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
        {unit ? (
          <span className="ml-1 text-xs font-normal text-[var(--color-muted-foreground)]">
            {unit}
          </span>
        ) : null}
      </p>
    </motion.div>
  );
}

export function Pill({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {children}
    </span>
  );
}

/** Diagram-color palette shared by canvas overlays + legend + report. */
export const DIAGRAM_COLORS = {
  shear: "#0ea5e9",
  moment: "#8b5cf6",
  deflection: "#f59e0b",
  slope: "#14b8a6",
  beam: "#334155",
  load: "#e11d48",
  reaction: "#22c55e",
  support: "#64748b",
} as const;
