"use client";

import { Lightbulb } from "lucide-react";
import { useAnalyzer } from "../state/analyzer-context";
import { useDerivedAnalysis } from "../state/use-derived";
import { DataRow, PanelCard, StatTile, StatusPill } from "./primitives";
import { getMaterial } from "../lib/materials";
import { formatCurrency, formatMass } from "../lib/units";
import type { InfillPattern, PrintSettings } from "../types";

const PATTERNS: InfillPattern[] = [
  "grid",
  "gyroid",
  "honeycomb",
  "triangles",
  "cubic",
];

/** 3D printing parameters + cost/time/feasibility estimate + recommendations. */
export function PrintingPanel() {
  const { print, setPrint } = useAnalyzer();
  const { print: estimate, recommendation } = useDerivedAnalysis();

  if (!estimate) return null;

  const num = (key: keyof PrintSettings, value: string) =>
    setPrint({ [key]: Number(value) } as Partial<PrintSettings>);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Print time"
          value={estimate.printTimeHours.toFixed(1)}
          unit="h"
        />
        <StatTile
          label="Material"
          value={formatMass(estimate.materialWeightGrams)}
        />
        <StatTile
          label="Filament"
          value={estimate.filamentLengthM.toFixed(1)}
          unit="m"
        />
        <StatTile
          label="Total cost"
          value={formatCurrency(estimate.totalCost)}
          accent="var(--color-primary)"
        />
      </div>

      <PanelCard title="Print settings">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <NumField
            label="Infill %"
            value={print.infillPercent}
            onChange={(v) => num("infillPercent", v)}
          />
          <NumField
            label="Layer height (mm)"
            step={0.02}
            value={print.layerHeight}
            onChange={(v) => num("layerHeight", v)}
          />
          <NumField
            label="Nozzle (mm)"
            step={0.1}
            value={print.nozzleDiameter}
            onChange={(v) => num("nozzleDiameter", v)}
          />
          <NumField
            label="Walls"
            value={print.wallCount}
            onChange={(v) => num("wallCount", v)}
          />
          <NumField
            label="Top layers"
            value={print.topLayers}
            onChange={(v) => num("topLayers", v)}
          />
          <NumField
            label="Bottom layers"
            value={print.bottomLayers}
            onChange={(v) => num("bottomLayers", v)}
          />
          <NumField
            label="Speed (mm/s)"
            value={print.printSpeed}
            onChange={(v) => num("printSpeed", v)}
          />
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
              Infill pattern
            </span>
            <select
              value={print.infillPattern}
              onChange={(e) =>
                setPrint({ infillPattern: e.target.value as InfillPattern })
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              {PATTERNS.map((p) => (
                <option key={p} value={p} className="bg-[var(--color-surface)]">
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pt-5 text-sm">
            <input
              type="checkbox"
              checked={print.supports}
              onChange={(e) => setPrint({ supports: e.target.checked })}
              className="size-4 accent-[var(--color-primary)]"
            />
            Supports
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
              Adhesion
            </span>
            <select
              value={print.brimRaft}
              onChange={(e) =>
                setPrint({
                  brimRaft: e.target.value as PrintSettings["brimRaft"],
                })
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              <option value="none" className="bg-[var(--color-surface)]">
                None
              </option>
              <option value="brim" className="bg-[var(--color-surface)]">
                Brim
              </option>
              <option value="raft" className="bg-[var(--color-surface)]">
                Raft
              </option>
            </select>
          </label>
        </div>
      </PanelCard>

      <PanelCard
        title="Estimate breakdown"
        action={
          <StatusPill
            status={
              estimate.difficulty === "easy"
                ? "ok"
                : estimate.difficulty === "moderate"
                  ? "warn"
                  : "bad"
            }
          >
            {estimate.difficulty}
          </StatusPill>
        }
      >
        <DataRow
          label="Material cost"
          value={formatCurrency(estimate.materialCost)}
        />
        <DataRow
          label="Electricity cost"
          value={formatCurrency(estimate.electricityCost)}
        />
        <DataRow
          label="CO₂ estimate"
          value={`${estimate.co2Grams.toFixed(0)} g`}
        />
        <DataRow
          label="Failure risk"
          value={`${(estimate.failureRisk * 100).toFixed(0)}%`}
        />
        <DataRow
          label="Warp risk"
          value={`${(estimate.warpRisk * 100).toFixed(0)}%`}
        />
        <DataRow
          label="Supports required"
          value={estimate.supportRequired ? "Yes" : "No"}
        />
      </PanelCard>

      {recommendation ? (
        <PanelCard title="Recommendations">
          <div className="space-y-2 text-sm">
            <Recommend
              icon
              label="Best material"
              value={getMaterial(recommendation.bestMaterialId).name}
            />
            <Recommend
              label="Infill"
              value={`${recommendation.infillPercent}%`}
            />
            <Recommend
              label="Layer height"
              value={`${recommendation.layerHeight} mm`}
            />
            <Recommend label="Orientation" value={recommendation.orientation} />
            <Recommend
              label="Supports"
              value={recommendation.supportStrategy}
            />
          </div>
        </PanelCard>
      ) : null}
    </div>
  );
}

function NumField({
  label,
  value,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      />
    </label>
  );
}

function Recommend({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon ? (
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
      ) : (
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
      )}
      <p>
        <span className="text-[var(--color-muted-foreground)]">{label}:</span>{" "}
        {value}
      </p>
    </div>
  );
}
