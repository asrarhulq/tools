"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, Play, Eye, Activity, Ruler } from "lucide-react";
import { useTruss } from "../state/store";
import { useAnalysis } from "../state/use-analysis";
import { TrussCanvas } from "../viewer/canvas";
import { ToolsPanel } from "./tools-panel";
import { ResultsPanel } from "./results-panel";
import { LearningPanel } from "./learning-panel";
import { cn } from "@/lib/utils";

/** The full four-panel truss workspace: tools · canvas · results · status. */
export function Workspace() {
  const { units, setUnits, view, setView, learning, setLearning, truss } =
    useTruss();
  const { result } = useAnalysis();
  const [mobileTab, setMobileTab] = useState<"tools" | "canvas" | "results">(
    "canvas",
  );

  const viewToggles = [
    { key: "showOriginal" as const, label: "Original", icon: Eye },
    { key: "showDeformed" as const, label: "Deformed", icon: Activity },
    { key: "showForces" as const, label: "Forces", icon: Play },
    { key: "showStress" as const, label: "Stress", icon: Ruler },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            <Activity className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold">Truss Analysis Studio</h1>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {truss.name}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggles */}
          <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)]">
            {viewToggles.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setView({ [v.key]: !view[v.key] })}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium transition-colors",
                  view[v.key]
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          {/* Units */}
          <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)]">
            {(["si", "imperial"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnits(u)}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium transition-colors",
                  units === u
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
                )}
              >
                {u === "si" ? "SI" : "Imperial"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLearning(!learning)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors [&_svg]:size-3.5",
              learning
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
            )}
          >
            <GraduationCap /> Learn
          </button>
        </div>
      </div>

      {/* Deform scale slider (only when deformed view on) */}
      <AnimatePresence>
        {view.showDeformed && result.solved ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          >
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Deformation scale
            </span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={view.deformScale}
              onChange={(e) => setView({ deformScale: Number(e.target.value) })}
              className="flex-1 accent-[var(--color-primary)]"
            />
            <span className="w-10 text-right text-xs tabular-nums">
              {view.deformScale.toFixed(1)}×
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Mobile tab switch */}
      <div className="flex gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 lg:hidden">
        {(["tools", "canvas", "results"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setMobileTab(t)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              mobileTab === t
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "text-[var(--color-muted-foreground)]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main 3-column layout (stacks to tabs on mobile) */}
      <div className="grid gap-3 lg:grid-cols-[260px_1fr_320px]">
        <div
          className={cn("lg:block", mobileTab === "tools" ? "block" : "hidden")}
        >
          <ToolsPanel />
        </div>
        <div
          className={cn(
            "lg:block",
            mobileTab === "canvas" ? "block" : "hidden",
          )}
        >
          <div className="truss-canvas h-[420px] sm:h-[560px] lg:h-[640px]">
            <TrussCanvas />
          </div>
          {learning ? <LearningPanel /> : null}
        </div>
        <div
          className={cn(
            "lg:block",
            mobileTab === "results" ? "block" : "hidden",
          )}
        >
          <ResultsPanel />
        </div>
      </div>

      <p className="text-center text-[11px] text-[var(--color-muted-foreground)]">
        Direct stiffness (matrix) method · results are model estimates for study
        and preliminary design
      </p>
    </div>
  );
}
