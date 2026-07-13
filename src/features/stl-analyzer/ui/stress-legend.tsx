"use client";

import { rampCss } from "../lib/colormap";

/**
 * Color legend / scale bar for an FEA field. Renders the shared color ramp as a
 * gradient with min → max tick labels, so a color in the viewport maps to a real
 * engineering value.
 */
export function StressLegend({
  max,
  unit,
  label,
  min = 0,
}: {
  max: number;
  unit: string;
  label: string;
  min?: number;
}) {
  // Sample the gradient densely and apply the same gamma the mesh uses, so a
  // color on this bar corresponds to the same value on the model.
  const stops = Array.from({ length: 11 }, (_, i) => i / 10);
  const gradient = `linear-gradient(to right, ${stops
    .map((t) => `${rampCss(Math.pow(t, 0.7))} ${t * 100}%`)
    .join(", ")})`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => min + (max - min) * t);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
        <span>{label}</span>
        <span>{unit}</span>
      </div>
      <div
        className="h-3 w-full rounded-full"
        style={{ background: gradient }}
        aria-hidden
      />
      <div className="mt-1 flex justify-between text-[10px] text-[var(--color-muted-foreground)] tabular-nums">
        {ticks.map((v, i) => (
          <span key={i}>{formatTick(v)}</span>
        ))}
      </div>
    </div>
  );
}

function formatTick(v: number): string {
  if (v === 0) return "0";
  if (Math.abs(v) < 0.01) return v.toExponential(1);
  if (Math.abs(v) >= 100) return v.toFixed(0);
  return v.toFixed(2);
}
