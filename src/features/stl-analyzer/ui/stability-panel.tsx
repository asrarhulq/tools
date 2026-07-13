"use client";

import { motion } from "framer-motion";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { useAnalyzer } from "../state/analyzer-context";
import { useDerivedAnalysis } from "../state/use-derived";
import { DataRow, PanelCard, StatTile, StatusPill } from "./primitives";

/**
 * Rigid-body stability panel. Reads the support-polygon tipping analysis and
 * updates automatically as orientation, material, and forces change.
 */
export function StabilityPanel() {
  const { viewer, setViewer } = useAnalyzer();
  const { stability } = useDerivedAnalysis();

  if (!stability) {
    return (
      <p className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        Loading stability analysis…
      </p>
    );
  }

  const fos = stability.tippingThreshold;
  const fosStatus = stability.willTip ? "bad" : fos < 1.5 ? "warn" : "ok";

  return (
    <div className="space-y-4">
      <PanelCard
        title="Stability analysis"
        description="Support-polygon tip-over about the base"
        action={
          stability.willTip ? (
            <StatusPill status="bad">
              <TriangleAlert className="size-3" /> Tips over
            </StatusPill>
          ) : (
            <StatusPill status="ok">
              <ShieldCheck className="size-3" /> Stable
            </StatusPill>
          )
        }
      >
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile
            label="Factor of safety"
            value={fos >= 999 ? "∞" : fos.toFixed(2)}
            accent={
              fosStatus === "ok"
                ? "#22c55e"
                : fosStatus === "warn"
                  ? "#f59e0b"
                  : "#ef4444"
            }
          />
          <StatTile
            label="Stability margin"
            value={stability.stabilityMargin.toFixed(1)}
            unit="mm"
            accent={stability.stabilityMargin >= 0 ? undefined : "#ef4444"}
          />
          <StatTile
            label="Mass"
            value={stability.massGrams.toFixed(1)}
            unit="g"
          />
        </div>

        <DataRow
          label="CoG over support"
          value={
            <StatusPill status={stability.cogInsidePolygon ? "ok" : "bad"}>
              {stability.cogInsidePolygon ? "Inside" : "Outside"}
            </StatusPill>
          }
        />
        <DataRow
          label="Overturning moment"
          value={`${stability.overturningTorque.toFixed(2)} N·m`}
        />
        <DataRow
          label="Restoring moment"
          value={`${stability.restoringTorque.toFixed(2)} N·m`}
        />
        <DataRow
          label="Tip direction"
          value={
            stability.tipDirection
              ? `[${stability.tipDirection[0].toFixed(2)}, ${stability.tipDirection[1].toFixed(2)}]`
              : "—"
          }
        />
        <DataRow
          label="Center of gravity"
          value={stability.centerOfGravity.map((c) => c.toFixed(1)).join(", ")}
        />

        <motion.p
          key={stability.recommendation}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 rounded-lg bg-[var(--color-muted)] p-3 text-sm text-[var(--color-muted-foreground)]"
        >
          {stability.recommendation}
        </motion.p>

        {stability.willTip ? (
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            {viewer.showForces ? (
              "Watch the predicted tip-over animation in the viewport."
            ) : (
              <>
                Enable{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => setViewer({ showForces: true })}
                >
                  force display
                </button>{" "}
                to watch the predicted tip-over animation.
              </>
            )}
          </p>
        ) : null}
      </PanelCard>
    </div>
  );
}
