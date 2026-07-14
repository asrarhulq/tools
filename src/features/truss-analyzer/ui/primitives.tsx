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
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border)] py-1.5 last:border-0">
      <span className="text-xs text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <span className="text-right text-sm font-medium tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
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

export function ScoreGauge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center">
      <div className="relative mx-auto size-16">
        <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="27"
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="6"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="27"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 27}
            initial={{ strokeDashoffset: 2 * Math.PI * 27 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 27 * (1 - v / 100) }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
          {Math.round(v)}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
        {label}
      </p>
    </div>
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
