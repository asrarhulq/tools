"use client";

import { Info } from "lucide-react";
import { useAnalyzer } from "../state/analyzer-context";
import { useDerivedAnalysis } from "../state/use-derived";
import { DataRow, PanelCard, StatTile, StatusPill } from "./primitives";
import { Button } from "@/components/ui/button";

/**
 * FEA (approximate) panel. Surfaces the stress/displacement/safety-factor
 * estimates and clearly labels the method as an approximation, with a toggle
 * for the viewer heat-map.
 */
export function FeaPanel() {
  const { forces, supports, viewer, setViewer } = useAnalyzer();
  const { fea } = useDerivedAnalysis();

  if (!fea) {
    return (
      <p className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        Define at least one force or support to run the stress approximation.
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
          Indicative results from a linear beam-theory approximation — useful for
          spotting stress concentrations and comparing designs, not a substitute
          for a full FE solve. Load case: {forces.length} force
          {forces.length === 1 ? "" : "s"}, {supports.length} support
          {supports.length === 1 ? "" : "s"}.
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
        <DataRow label="Estimated strain" value={fea.estimatedStrain.toExponential(2)} />
        <DataRow
          label="Stress concentrations"
          value={`${fea.stressConcentrations.length} region(s)`}
        />
        <DataRow label="Method" value="Linear beam approximation" />
        <div className="mt-4">
          <Button
            variant={viewer.showStress ? "primary" : "outline"}
            size="sm"
            onClick={() => setViewer({ showStress: !viewer.showStress })}
          >
            {viewer.showStress ? "Hide" : "Show"} stress heat-map
          </Button>
        </div>
      </PanelCard>
    </div>
  );
}
