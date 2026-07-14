"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** A metric tile for the dashboard/header. */
export function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
          {label}
        </p>
        {icon ? (
          <span style={accent ? { color: accent } : undefined}>{icon}</span>
        ) : null}
      </div>
      <p
        className="mt-1.5 text-2xl font-semibold tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
          {sub}
        </p>
      ) : null}
    </motion.div>
  );
}

/** Labelled form field wrapper. */
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
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] placeholder:text-[var(--color-muted-foreground)]";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cn(inputBase, "resize-y", props.className)}
    />
  );
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

/** A small pill/badge. */
export function Pill({
  children,
  color,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
      style={color ? { backgroundColor: `${color}22`, color } : undefined}
    >
      {children}
    </span>
  );
}

/** A section card with an optional header + action. */
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
        "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5",
        className,
      )}
    >
      {title || action ? (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title ? <h3 className="font-semibold">{title}</h3> : <span />}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
