"use client";

import { cn } from "@/lib/utils";

/**
 * Small UI vocabulary for the Alley Tracker: hairline panels, uppercase micro-
 * labels, mono tabular readouts and a segmented control — the same "precision
 * instrument" idiom as the hub's other research tools.
 */

export function Panel({
  title,
  action,
  children,
  className,
  id,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4",
        className,
      )}
    >
      {title || action ? (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title ? <h2 className="microlabel">{title}</h2> : <span />}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly { value: T; label: string; title?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-wrap gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm ring-1 ring-[var(--color-border)]"
              : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="microlabel">{label}</span>
      {children}
      {hint ? (
        <span className="text-[11px] text-[var(--color-muted-foreground)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="microlabel mb-1">{label}</div>
      <div className="font-mono text-lg leading-tight text-[var(--color-foreground)] tabular-nums">
        {value}
      </div>
      {sub ? (
        <div className="mt-0.5 font-mono text-[11px] text-[var(--color-muted-foreground)] tabular-nums">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export function Swatch({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-[3px]", className)}
      style={{ background: color }}
    />
  );
}

const THUMB =
  "pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-surface)] [&::-webkit-slider-thumb]:bg-[var(--thumb)] [&::-webkit-slider-thumb]:shadow " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--color-surface)] [&::-moz-range-thumb]:bg-[var(--thumb)] " +
  "focus-visible:outline-none [&:focus-visible::-webkit-slider-thumb]:ring-2 [&:focus-visible::-webkit-slider-thumb]:ring-[var(--color-ring)]";

/** Two-thumb year-range slider (min span enforced so block bootstrap has ≥ 1 block). */
export function YearRangeSlider({
  value,
  min,
  max,
  minSpan = 5,
  color,
  onChange,
  label,
}: {
  value: readonly [number, number];
  min: number;
  max: number;
  minSpan?: number;
  color: string;
  onChange: (v: [number, number]) => void;
  label: string;
}) {
  const [lo, hi] = value;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div className="relative h-6" style={{ ["--thumb" as string]: color }}>
      <div className="absolute inset-x-0 top-[11px] h-0.5 rounded bg-[var(--color-border)]" />
      <div
        className="absolute top-[10px] h-1 rounded"
        style={{
          left: `${pct(lo)}%`,
          right: `${100 - pct(hi)}%`,
          background: color,
        }}
      />
      <input
        type="range"
        aria-label={`${label} start year`}
        min={min}
        max={max}
        value={lo}
        onChange={(e) =>
          onChange([Math.min(+e.target.value, hi - minSpan + 1), hi])
        }
        className={THUMB}
      />
      <input
        type="range"
        aria-label={`${label} end year`}
        min={min}
        max={max}
        value={hi}
        onChange={(e) =>
          onChange([lo, Math.max(+e.target.value, lo + minSpan - 1)])
        }
        className={THUMB}
      />
    </div>
  );
}

export function fmt(v: number, d = 2) {
  return Number.isFinite(v) ? v.toFixed(d) : "–";
}
export function fmtCI(ci: readonly number[], d = 2) {
  return `[${fmt(ci[0]!, d)}, ${fmt(ci[1]!, d)}]`;
}
export function fmtP(p: number) {
  if (!Number.isFinite(p)) return "–";
  return p < 0.001 ? "< 0.001" : p.toFixed(3);
}
export function signed(v: number, d = 2) {
  return (v > 0 ? "+" : "") + fmt(v, d);
}
