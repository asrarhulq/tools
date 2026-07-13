"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Lock,
  MousePointerClick,
  Plus,
  Trash2,
} from "lucide-react";
import { useAnalyzer } from "../state/analyzer-context";
import { useDerivedAnalysis } from "../state/use-derived";
import { NumberField, PanelCard, StatusPill } from "./primitives";
import { Button } from "@/components/ui/button";
import { length as vlen } from "../lib/vec";
import type { ConstraintMode, Force, Vec3 } from "../types";

/** Named preset directions the user can pick without typing a vector. */
const DIR_PRESETS: Array<{ label: string; dir: Vec3 }> = [
  { label: "−Z (down)", dir: [0, 0, -1] },
  { label: "+Z (up)", dir: [0, 0, 1] },
  { label: "+X", dir: [1, 0, 0] },
  { label: "−X", dir: [-1, 0, 0] },
  { label: "+Y", dir: [0, 1, 0] },
  { label: "−Y", dir: [0, -1, 0] },
];

const CONSTRAINTS: Array<{
  mode: ConstraintMode;
  label: string;
  hint: string;
}> = [
  {
    mode: "build-plate",
    label: "Build plate fixed",
    hint: "Everything touching the plate (z ≈ 0) is held. Auto-detected from the current orientation.",
  },
  {
    mode: "bottom-face",
    label: "Bottom face fixed",
    hint: "The lowest flat face is fully constrained.",
  },
  {
    mode: "selected-face",
    label: "Selected face fixed",
    hint: "Click the model in the viewport to anchor the nearest face.",
  },
  {
    mode: "custom",
    label: "Custom constraints",
    hint: "Use the points you pick as fixed anchors.",
  },
];

/** Force & constraint definition panel for the FEA load case. */
export function ForcesPanel() {
  const {
    forces,
    addForce,
    updateForce,
    removeForce,
    clearForces,
    forceDraft,
    setForceDraft,
    constraint,
    setConstraint,
  } = useAnalyzer();
  const { geometry, contact } = useDerivedAnalysis();

  const [expanded, setExpanded] = useState<string | null>(null);

  if (!geometry) return null;
  const com = geometry.centerOfMass;

  // The add-force controls edit the shared draft, so clicking the model in the
  // viewport places a force with exactly these settings.
  const magnitude = forceDraft.magnitude;
  const dirIndex = Math.max(
    0,
    DIR_PRESETS.findIndex(
      (p) =>
        p.dir[0] === forceDraft.direction[0] &&
        p.dir[1] === forceDraft.direction[1] &&
        p.dir[2] === forceDraft.direction[2],
    ),
  );

  return (
    <div className="space-y-4">
      {/* ── Constraints ─────────────────────────────────────────────── */}
      <PanelCard
        title="Constraints"
        description="How the part is held during analysis"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {CONSTRAINTS.map((c) => {
            const active = constraint.mode === c.mode;
            return (
              <button
                key={c.mode}
                type="button"
                onClick={() => setConstraint({ mode: c.mode })}
                className={
                  "flex items-start gap-2 rounded-xl border p-3 text-left transition-colors " +
                  (active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/8"
                    : "border-[var(--color-border)] hover:border-[var(--color-muted-foreground)]/40")
                }
              >
                <Lock
                  className={
                    "mt-0.5 size-4 shrink-0 " +
                    (active
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-muted-foreground)]")
                  }
                />
                <span>
                  <span className="block text-sm font-medium">{c.label}</span>
                  <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
                    {c.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {constraint.mode === "build-plate" && contact ? (
          <p className="mt-3 flex items-center justify-between rounded-lg bg-[var(--color-muted)] px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
            <span>
              {contact.faceCount > 0
                ? `${contact.faceCount} contact face${contact.faceCount === 1 ? "" : "s"} on the plate`
                : "No flat contact — the part may need supports or reorienting."}
            </span>
            <span className="tabular-nums">
              {contact.area.toFixed(0)} mm² contact
            </span>
          </p>
        ) : null}
      </PanelCard>

      {/* ── Forces ──────────────────────────────────────────────────── */}
      <PanelCard
        title="Forces"
        description="Loads applied to the part"
        action={
          <StatusPill status={forces.length ? "ok" : "warn"}>
            {forces.length} load{forces.length === 1 ? "" : "s"}
          </StatusPill>
        }
      >
        {/* Add-force controls */}
        <div className="flex flex-wrap items-end gap-3">
          <NumberField
            label="Magnitude"
            value={magnitude}
            min={0}
            onChange={(v) => setForceDraft({ magnitude: v })}
            suffix="N"
            className="w-28"
          />
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
              Direction
            </span>
            <select
              value={dirIndex}
              onChange={(e) =>
                setForceDraft({
                  direction: DIR_PRESETS[Number(e.target.value)]!.dir,
                })
              }
              className="rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              {DIR_PRESETS.map((a, i) => (
                <option
                  key={a.label}
                  value={i}
                  className="bg-[var(--color-surface)]"
                >
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
                direction: DIR_PRESETS[dirIndex]!.dir,
                magnitude,
              })
            }
          >
            <Plus className="size-4" /> Add at CoM
          </Button>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
          <MousePointerClick className="size-3.5" />
          Tip: click the model in the viewport to place a load at that point
          with the magnitude above.
        </p>

        {/* Force list — each row editable */}
        {forces.length ? (
          <ul className="mt-4 space-y-2">
            {forces.map((f) => {
              const open = expanded === f.id;
              return (
                <li
                  key={f.id}
                  className="overflow-hidden rounded-xl border border-[var(--color-border)]"
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : f.id)}
                      className="flex flex-1 items-center gap-2 text-left text-sm"
                    >
                      <ChevronDown
                        className={
                          "size-4 text-[var(--color-muted-foreground)] transition-transform " +
                          (open ? "rotate-180" : "")
                        }
                      />
                      <span className="font-medium">{f.name}</span>
                      <span className="text-[var(--color-muted-foreground)] tabular-nums">
                        {f.magnitude} N
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeForce(f.id)}
                      aria-label={`Delete ${f.name}`}
                      className="text-[var(--color-muted-foreground)] transition-colors hover:text-rose-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/40"
                      >
                        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">
                          <label className="col-span-2 block sm:col-span-3">
                            <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
                              Name
                            </span>
                            <input
                              value={f.name}
                              onChange={(e) =>
                                updateForce(f.id, { name: e.target.value })
                              }
                              className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                            />
                          </label>
                          <NumberField
                            label="Magnitude (N)"
                            value={f.magnitude}
                            min={0}
                            onChange={(v) =>
                              updateForce(f.id, { magnitude: v })
                            }
                          />
                          <DirectionEditor force={f} onChange={updateForce} />
                          <PointEditor force={f} onChange={updateForce} />
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-[var(--color-border)] p-4 text-center text-xs text-[var(--color-muted-foreground)]">
            No forces yet. Add one above or click the model.
          </p>
        )}

        {forces.length > 0 ? (
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={clearForces}>
              Clear all forces
            </Button>
          </div>
        ) : null}
      </PanelCard>
    </div>
  );
}

/** Direction sub-editor: presets that normalize to a unit vector. */
function DirectionEditor({
  force,
  onChange,
}: {
  force: Force;
  onChange: (id: string, patch: Partial<Omit<Force, "id">>) => void;
}) {
  // Match the current direction to a preset, else show "custom".
  const matchIndex = DIR_PRESETS.findIndex((p) => {
    const d = force.direction;
    const l = vlen(d) || 1;
    return (
      Math.abs(d[0] / l - p.dir[0]) < 0.05 &&
      Math.abs(d[1] / l - p.dir[1]) < 0.05 &&
      Math.abs(d[2] / l - p.dir[2]) < 0.05
    );
  });
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
        Direction
      </span>
      <select
        value={matchIndex}
        onChange={(e) => {
          const i = Number(e.target.value);
          if (i >= 0) onChange(force.id, { direction: DIR_PRESETS[i]!.dir });
        }}
        className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      >
        {matchIndex < 0 ? (
          <option value={-1} className="bg-[var(--color-surface)]">
            Custom
          </option>
        ) : null}
        {DIR_PRESETS.map((a, i) => (
          <option key={a.label} value={i} className="bg-[var(--color-surface)]">
            {a.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Application-point sub-editor (X/Y/Z in mm). */
function PointEditor({
  force,
  onChange,
}: {
  force: Force;
  onChange: (id: string, patch: Partial<Omit<Force, "id">>) => void;
}) {
  const set = (axis: 0 | 1 | 2, v: number) => {
    const p = force.point;
    const next: Vec3 = [
      axis === 0 ? v : p[0],
      axis === 1 ? v : p[1],
      axis === 2 ? v : p[2],
    ];
    onChange(force.id, { point: next });
  };
  return (
    <div className="col-span-2 sm:col-span-3">
      <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
        Location (mm)
      </span>
      <div className="grid grid-cols-3 gap-2">
        <NumberField
          value={force.point[0]}
          onChange={(v) => set(0, v)}
          suffix="X"
        />
        <NumberField
          value={force.point[1]}
          onChange={(v) => set(1, v)}
          suffix="Y"
        />
        <NumberField
          value={force.point[2]}
          onChange={(v) => set(2, v)}
          suffix="Z"
        />
      </div>
    </div>
  );
}
