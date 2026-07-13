"use client";

import { RotateCcw, RotateCw, Wand2, Undo2 } from "lucide-react";
import { useAnalyzer } from "../state/analyzer-context";
import { useDerivedAnalysis } from "../state/use-derived";
import { DataRow, NumberField, PanelCard } from "./primitives";
import { Button } from "@/components/ui/button";
import { formatLength } from "../lib/units";
import type { Orientation } from "../types";

const AXES: Array<{ key: keyof Orientation; label: string; color: string }> = [
  { key: "rx", label: "Rotate X", color: "#ef4444" },
  { key: "ry", label: "Rotate Y", color: "#22c55e" },
  { key: "rz", label: "Rotate Z", color: "#3b82f6" },
];

/**
 * Orientation controls: numeric angle entry, 90° quick rotations, lay-flat, and
 * reset. Every change flows through the analyzer state, so the viewport, mass
 * properties, stability, and FEA all update together.
 */
export function OrientationPanel() {
  const {
    orientation,
    unit,
    setOrientation,
    rotateBy,
    resetOrientation,
    layFlat,
  } = useAnalyzer();
  const { geometry, contact } = useDerivedAnalysis();

  return (
    <div className="space-y-4">
      <PanelCard
        title="Build orientation"
        description="Rotate the part, then drop it onto the plate"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={layFlat}>
              <Wand2 className="size-4" /> Lay flat
            </Button>
            <Button variant="ghost" size="sm" onClick={resetOrientation}>
              <Undo2 className="size-4" /> Reset
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {AXES.map((a) => (
            <div key={a.key} className="flex items-center gap-3">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: a.color }}
                aria-hidden
              />
              <NumberField
                label={a.label}
                value={Math.round(orientation[a.key])}
                step={1}
                onChange={(v) => setOrientation({ [a.key]: v })}
                suffix="°"
                className="flex-1"
              />
              <div className="flex gap-1 self-end pb-0.5">
                <button
                  type="button"
                  aria-label={`${a.label} −90°`}
                  onClick={() => rotateBy(a.key, -90)}
                  className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                >
                  <RotateCcw className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`${a.label} +90°`}
                  onClick={() => rotateBy(a.key, 90)}
                  className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
                >
                  <RotateCw className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </PanelCard>

      {geometry ? (
        <PanelCard
          title="On the plate"
          description="Result of the current orientation"
        >
          <DataRow
            label="Footprint (W × D)"
            value={`${formatLength(geometry.boundingBox.size[0], unit)} × ${formatLength(geometry.boundingBox.size[1], unit)}`}
          />
          <DataRow
            label="Height"
            value={formatLength(geometry.boundingBox.size[2], unit)}
          />
          <DataRow
            label="Contact area"
            value={contact ? `${contact.area.toFixed(0)} mm²` : "—"}
          />
          <DataRow
            label="Overhang area"
            value={`${(geometry.diagnostics.overhangArea * 100).toFixed(0)}%`}
          />
        </PanelCard>
      ) : null}
    </div>
  );
}
