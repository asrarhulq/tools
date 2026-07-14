"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Instrument-grade UI primitives for the Beam Designer. The house style is a
 * "precision instrument": layered surfaces for depth, mono tabular readouts for
 * every computed number, hairline rules, tight uppercase micro-labels, and one
 * restrained violet accent reserved for interactive/active state. Semantic
 * status (ok / warn / crit) is a separate palette from the accent.
 */

type Tone = "default" | "ok" | "warn" | "crit" | "accent";

const TONE_FG: Record<Tone, string> = {
  default: "var(--color-foreground)",
  ok: "var(--color-ok)",
  warn: "var(--color-warn)",
  crit: "var(--color-crit)",
  accent: "var(--color-primary)",
};

/** A panel — the base surface. `inset` recesses it (used for the stage). */
export function Panel({
  title,
  action,
  children,
  className,
  flush,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        flush ? "" : "p-3.5",
        className,
      )}
    >
      {title || action ? (
        <header
          className={cn(
            "flex items-center justify-between gap-2",
            flush ? "px-3.5 pt-3 pb-2" : "mb-3",
          )}
        >
          {title ? <span className="microlabel">{title}</span> : <span />}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** A collapsible section for progressive disclosure of advanced controls. */
export function Group({
  title,
  action,
  children,
  defaultOpen = true,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      className={cn(
        "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
    >
      <header className="flex items-center gap-1.5 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1.5 text-left"
          aria-expanded={open}
        >
          <ChevronRight
            className={cn(
              "size-3 text-[var(--color-muted-foreground)] transition-transform",
              open && "rotate-90",
            )}
          />
          <span className="microlabel">{title}</span>
        </button>
        {action}
      </header>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--color-hair)] px-3 pt-3 pb-3.5">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

/** A labelled row in a spec sheet: hairline-separated label → mono value. */
export function Row({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-hair)] py-1.5 last:border-0">
      <span className="text-xs text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <span
        className="readout text-right text-[13px] font-medium"
        style={{ color: TONE_FG[tone] }}
      >
        {value}
      </span>
    </div>
  );
}

/** A form field with a tight uppercase label and optional hint. */
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
      <span className="microlabel mb-1.5 block">{label}</span>
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
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-1.5 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]/30 hover:border-[var(--color-muted-foreground)]/40";

export function NumberInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { suffix?: string },
) {
  const { suffix, className, ...rest } = props;
  if (!suffix)
    return (
      <input
        type="number"
        {...rest}
        className={cn(inputBase, "readout", className)}
      />
    );
  return (
    <div className="relative">
      <input
        type="number"
        {...rest}
        className={cn(inputBase, "readout pr-9", className)}
      />
      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[11px] font-medium text-[var(--color-muted-foreground)]">
        {suffix}
      </span>
    </div>
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

/**
 * A segmented control — the house replacement for rows of pill buttons and
 * radio-like choices. Distinct, tactile, and clearly interactive.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: React.ReactNode; title?: string }>;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5",
        className,
      )}
      role="group"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            title={o.title}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative rounded-[6px] font-medium transition-colors",
              size === "sm" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs",
              active
                ? "text-[var(--color-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`seg-${className ?? ""}-${options.length}`}
                className="absolute inset-0 rounded-[6px] bg-[var(--color-surface)] shadow-sm ring-1 ring-[var(--color-border)]"
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
            ) : null}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The primary result readout — a large mono value with a status stripe down
 * its left edge, a micro-label, and an optional unit. This is what carries the
 * HUD summary strip.
 */
export function Readout({
  label,
  value,
  unit,
  tone = "default",
  hint,
  large,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: Tone;
  hint?: string;
  large?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5"
    >
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{
          backgroundColor: TONE_FG[tone],
          opacity: tone === "default" ? 0.35 : 1,
        }}
      />
      <p className="microlabel truncate">{label}</p>
      <p
        className={cn(
          "readout mt-1 font-semibold",
          large ? "text-2xl" : "text-lg",
        )}
        style={{ color: TONE_FG[tone] }}
      >
        {value}
        {unit ? (
          <span className="ml-1 text-xs font-normal text-[var(--color-muted-foreground)]">
            {unit}
          </span>
        ) : null}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[10px] text-[var(--color-muted-foreground)]">
          {hint}
        </p>
      ) : null}
    </motion.div>
  );
}

/** Backwards-compatible alias — Stat now renders as a Readout. */
export const Stat = Readout;

/** A status pill. `tone` maps to the semantic palette; `color` overrides it. */
export function Pill({
  children,
  color,
  tone,
}: {
  children: React.ReactNode;
  color?: string;
  tone?: Tone;
}) {
  const c = color ?? (tone ? TONE_FG[tone] : "var(--color-muted-foreground)");
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: `color-mix(in oklch, ${c} 14%, transparent)`,
        color: c,
      }}
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
