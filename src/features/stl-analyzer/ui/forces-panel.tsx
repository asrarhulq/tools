"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, TriangleAlert, ShieldCheck } from "lucide-react";
import { useAnalyzer } from "../state/analyzer-context";
import { useDerivedAnalysis } from "../state/use-derived";
import { DataRow, PanelCard, StatTile, StatusPill } from "./primitives";
import { Button } from "@/components/ui/button";
import type { Vec3 } from "../types";

const AXES: Array<{ label: string; dir: Vec3 }> = [
  { label: "−Z (down)", dir: [0, 0, -1] },
  { label: "+Z (up)", dir: [0, 0, 1] },
  { label: "+X", dir: [1, 0, 0] },
  { label: "+Y", dir: [0, 1, 0] },
];

/** Force & stability panel: define loads/supports, read the tipping analysis. */
export function ForcesPanel() {
  const {
    geometry,
    forces,
    supports,
    addForce,
    removeForce,
    clearForces,
    clearSupports,
    setViewer,
    viewer,
  } = useAnalyzer();
  const { stability } = useDerivedAnalysis();
  const [magnitude, setMagnitude] = useState(50);
  const [dirIndex, setDirIndex] = useState(0);

  if (!geometry) return null;
  const com = geometry.centerOfMass;

  return (
    <div className="space-y-4">
      <PanelCard
        title="Apply force"
        description="Click the model to place a load, or add one at the center of mass"
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
              Magnitude (N)
            </span>
            <input
              type="number"
              min={0}
              value={magnitude}
              onChange={(e) => setMagnitude(Number(e.target.value))}
              className="w-28 rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
              Direction
            </span>
            <select
              value={dirIndex}
              onChange={(e) => setDirIndex(Number(e.target.value))}
              className="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              {AXES.map((a, i) => (
                <option key={a.label} value={i} className="bg-[var(--color-surface)]">
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="sm"
            onClick={() =>
              addForce({
                point: com,
                direction: AXES[dirIndex]!.dir,
                magnitude,
              })
            }
          >
            <Plus className="size-4" /> Add force
          </Button>
        </div>

        {forces.length ? (
          <ul className="mt-4 space-y-2">
            {forces.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
              >
                <span>
                  {f.magnitude} N @ [{f.point.map((c) => c.toFixed(0)).join(", ")}]
                </span>
                <button
                  type="button"
                  onClick={() => removeForce(f.id)}
                  aria-label="Remove force"
                  className="text-[var(--color-muted-foreground)] hover:text-rose-500"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {(forces.length > 0 || supports.length > 0) && (
          <div className="mt-3 flex gap-2">
            {forces.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearForces}>
                Clear forces
              </Button>
            )}
            {supports.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSupports}>
                Clear supports
              </Button>
            )}
          </div>
        )}
      </PanelCard>

      {stability ? (
        <PanelCard
          title="Stability analysis"
          description="Rigid-body overturning about the base"
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
          <div className="mb-4 grid grid-cols-2 gap-3">
            <StatTile
              label="Tipping factor"
              value={stability.tippingThreshold.toFixed(2)}
              accent={stability.willTip ? "#ef4444" : "#22c55e"}
            />
            <StatTile
              label="Overturning torque"
              value={stability.overturningTorque.toFixed(2)}
              unit="N·m"
            />
          </div>
          <DataRow
            label="Restoring torque"
            value={`${stability.restoringTorque.toFixed(2)} N·m`}
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
              Enable{" "}
              <button
                type="button"
                className="underline"
                onClick={() => setViewer({ showForces: !viewer.showForces })}
              >
                force display
              </button>{" "}
              in the viewer to watch the tipping animation.
            </p>
          ) : null}
        </PanelCard>
      ) : (
        <p className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
          Add a force to run the stability analysis.
        </p>
      )}
    </div>
  );
}
