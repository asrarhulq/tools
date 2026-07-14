"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  GraduationCap,
  Plus,
  SquareStack,
  ChevronDown,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { useBeam } from "../state/store";
import { BeamCanvas } from "../viewer/beam-canvas";
import { Diagrams } from "../viewer/diagrams";
import { ToolDock, SetupColumn } from "./tools-panel";
import { ResultsPanel } from "./results-panel";
import { LearningPanel } from "./learning-panel";
import { ResultHud } from "./hud";
import { Segmented } from "./primitives";
import type { LoadType } from "../types";
import { cn } from "@/lib/utils";

const VIEW_TOGGLES = [
  { key: "original" as const, label: "Beam" },
  { key: "deflected" as const, label: "Deflection" },
  { key: "shear" as const, label: "Shear" },
  { key: "moment" as const, label: "Moment" },
  { key: "slope" as const, label: "Slope" },
  { key: "reactions" as const, label: "Reactions" },
];

const LOAD_TYPES: Array<{ type: LoadType; label: string }> = [
  { type: "point", label: "Point load" },
  { type: "udl", label: "Uniform (UDL)" },
  { type: "triangular", label: "Triangular" },
  { type: "trapezoidal", label: "Trapezoidal" },
  { type: "moment", label: "Moment" },
];

const UNIT_OPTIONS = [
  { value: "si" as const, label: "SI", title: "SI base units (m, N, Pa)" },
  { value: "metric" as const, label: "Metric", title: "kN, mm, MPa" },
  { value: "imperial" as const, label: "Imperial", title: "kip, in, ksi" },
];

/** The full beam workspace: header · results HUD · dock · setup · stage · inspector. */
export function Workspace() {
  const {
    beam,
    units,
    setUnits,
    view,
    setView,
    learning,
    setLearning,
    addLoad,
    activeCase,
    setMovingLoadX,
  } = useBeam();
  const [loadMenu, setLoadMenu] = useState(false);
  const [mobileTab, setMobileTab] = useState<"setup" | "workspace" | "results">(
    "workspace",
  );
  const [moving, setMoving] = useState(false);

  // Moving-load animation: a transient roving point load sweeping the span (an
  // influence-line demonstration). It updates the store's `movingLoadX` (which
  // the solver honors) via requestAnimationFrame — outside the undo history.
  useEffect(() => {
    if (!moving) {
      setMovingLoadX(null);
      return;
    }
    let raf = 0;
    let x = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      x = (x + dt * (beam.length / 4)) % beam.length;
      setMovingLoadX(x);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setMovingLoadX(null);
    };
  }, [moving, beam.length, setMovingLoadX]);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-primary)] shadow-[var(--shadow-glow)]">
            <SquareStack className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-lg font-semibold">
              Beam Designer
            </h1>
            <p className="readout text-[11px] text-[var(--color-muted-foreground)]">
              {beam.name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLoadMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary-foreground)] shadow-sm transition-transform active:scale-[0.97] [&_svg]:size-3.5"
            >
              <Plus /> Add load <ChevronDown className="size-3 opacity-70" />
            </button>
            <AnimatePresence>
              {loadMenu ? (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLoadMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl"
                  >
                    {LOAD_TYPES.map((l) => (
                      <button
                        key={l.type}
                        type="button"
                        onClick={() => {
                          addLoad({
                            type: l.type,
                            x: beam.length / 2,
                            caseId: activeCase,
                          });
                          setLoadMenu(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-muted)]"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{
                            backgroundColor:
                              l.type === "moment"
                                ? "var(--color-primary)"
                                : "var(--color-crit)",
                          }}
                        />
                        {l.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>
          </div>

          <Segmented value={units} onChange={setUnits} options={UNIT_OPTIONS} />

          <button
            type="button"
            onClick={() => setLearning(!learning)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors [&_svg]:size-3.5",
              learning
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
            )}
          >
            <GraduationCap /> Learn
          </button>
        </div>
      </div>

      {/* ── Results HUD (the summary, above the fold) ──────────────────── */}
      <ResultHud />

      {/* ── Mobile tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 lg:hidden">
        {(["setup", "workspace", "results"] as const).map((t) => (
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

      {/* ── Main grid: dock · setup · stage · inspector ────────────────── */}
      <div className="grid gap-3 lg:grid-cols-[auto_236px_1fr_320px]">
        {/* Tool dock (slim rail) */}
        <div
          className={cn(
            "lg:block",
            mobileTab === "workspace" || mobileTab === "setup"
              ? "block"
              : "hidden",
          )}
        >
          <ToolDock />
        </div>

        {/* Setup column */}
        <div
          className={cn("lg:block", mobileTab === "setup" ? "block" : "hidden")}
        >
          <SetupColumn />
        </div>

        {/* Stage — the elevated instrument surface */}
        <div
          className={cn(
            "min-w-0 lg:block",
            mobileTab === "workspace" ? "block" : "hidden",
          )}
        >
          <div className="instrument-stage rounded-[var(--radius)] border border-[var(--color-border)] p-2.5">
            {/* View controls bar over the stage */}
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {VIEW_TOGGLES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setView({ [t.key]: !view[t.key] })}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    view[t.key]
                      ? "border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
                  )}
                >
                  {t.label}
                </button>
              ))}
              <span className="flex-1" />
              {view.deflected ? (
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted-foreground)]">
                  Scale
                  <input
                    type="range"
                    min={0.2}
                    max={5}
                    step={0.1}
                    value={view.deflScale}
                    onChange={(e) =>
                      setView({ deflScale: Number(e.target.value) })
                    }
                    className="w-20 accent-[var(--color-primary)]"
                  />
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setMoving((m) => !m)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors [&_svg]:size-3.5",
                  moving
                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
                )}
              >
                {moving ? <PauseCircle /> : <PlayCircle />} Moving load
              </button>
            </div>

            <div className="beam-canvas">
              <BeamCanvas />
            </div>
            <div className="mt-2">
              <Diagrams />
            </div>
          </div>

          {learning ? (
            <div className="mt-3">
              <LearningPanel />
            </div>
          ) : null}
        </div>

        {/* Inspector */}
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
        Euler–Bernoulli finite-element analysis · validated against textbook
        cases · A Product by Asrar ul Haq · tools.asrarul.com
      </p>
    </div>
  );
}
