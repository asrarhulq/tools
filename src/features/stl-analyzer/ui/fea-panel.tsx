"use client";

import { Info } from "lucide-react";
import { useAnalyzer } from "../state/analyzer-context";
import { useDerivedAnalysis } from "../state/use-derived";
import { DataRow, PanelCard, StatTile, StatusPill } from "./primitives";
import { Button } from "@/components/ui/button";
import { StressLegend } from "./stress-legend";

/**
 * FEA panel. Surfaces the linear-elastic voxel-FEM results (von Mises stress,
 * displacement, safety factor) and drives the viewport heat map.
 */
export function FeaPanel() {
  const { forces, constraint, viewer, setViewer } = useAnalyzer();
  const { fea } = useDerivedAnalysis();

  if (!fea) {
    return (
      <p className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        Add at least one force (and pick a constraint) to run the stress
        analysis.
      </p>
    );
  }

  const sfStatus =
    fea.safetyFactor >= 2 ? "ok" : fea.safetyFactor >= 1 ? "warn" : "bad";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-xs text-[var(--color-muted-foreground)]">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Linear-elastic finite-element solve on a {fea.resolution}³ voxel mesh
          ({fea.elementCount.toLocaleString()} elements),{" "}
          {constraint.mode.replace("-", " ")} constraint. In-browser FEM
          suitable for comparative engineering assessment.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label="Max von Mises"
          value={fea.maxStress.toFixed(1)}
          unit="MPa"
        />
        <StatTile
          label="Max displacement"
          value={fea.maxDisplacement.toFixed(3)}
          unit="mm"
        />
        <StatTile
          label="Safety factor"
          value={fea.safetyFactor >= 999 ? "∞" : fea.safetyFactor.toFixed(2)}
          accent={
            sfStatus === "ok"
              ? "#22c55e"
              : sfStatus === "warn"
                ? "#f59e0b"
                : "#ef4444"
          }
        />
      </div>

      <PanelCard
        title="Results"
        action={
          <StatusPill status={sfStatus}>
            {sfStatus === "ok"
              ? "Safe"
              : sfStatus === "warn"
                ? "Marginal"
                : "Yields"}
          </StatusPill>
        }
      >
        <DataRow
          label="Estimated peak strain"
          value={fea.estimatedStrain.toExponential(2)}
        />
        <DataRow
          label="Stress concentrations"
          value={`${fea.stressConcentrations.length} region(s)`}
        />
        <DataRow
          label="Load case"
          value={`${forces.length} force${forces.length === 1 ? "" : "s"}`}
        />
        <DataRow
          label="Solver"
          value={
            <StatusPill status={fea.converged ? "ok" : "warn"}>
              {fea.converged ? "Converged" : "Max iterations"}
            </StatusPill>
          }
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant={viewer.showStress ? "primary" : "outline"}
            size="sm"
            onClick={() => setViewer({ showStress: !viewer.showStress })}
          >
            {viewer.showStress ? "Hide" : "Show"} heat map
          </Button>
          {viewer.showStress ? (
            <div className="flex overflow-hidden rounded-full border border-[var(--color-border)] text-xs">
              {(["stress", "displacement"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setViewer({ feaField: f })}
                  className={
                    "px-3 py-1.5 font-medium capitalize transition-colors " +
                    (viewer.feaField === f
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]")
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {viewer.showStress ? (
          <div className="mt-4">
            <StressLegend
              max={
                viewer.feaField === "displacement"
                  ? fea.maxDisplacement
                  : fea.maxStress
              }
              unit={viewer.feaField === "displacement" ? "mm" : "MPa"}
              label={
                viewer.feaField === "displacement"
                  ? "Displacement"
                  : "von Mises stress"
              }
            />
          </div>
        ) : null}
      </PanelCard>
    </div>
  );
}
