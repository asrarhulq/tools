"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Box,
  Boxes,
  FileText,
  Layers,
  Printer,
  RotateCcw,
  Activity,
  Weight,
} from "lucide-react";
import { toast } from "sonner";
import { useAnalyzer } from "../state/analyzer-context";
import { useDerivedAnalysis } from "../state/use-derived";
import { ViewerPanel } from "../viewer/viewer-panel";
import { GeometryPanel } from "./geometry-panel";
import { MaterialPanel } from "./material-panel";
import { ForcesPanel } from "./forces-panel";
import { FeaPanel } from "./fea-panel";
import { PrintingPanel } from "./printing-panel";
import { generateReport } from "../report/generate-report";
import { Button } from "@/components/ui/button";
import { UNIT_LABELS } from "../lib/units";
import type { Unit } from "../types";
import { cn } from "@/lib/utils";

type TabId = "geometry" | "material" | "forces" | "fea" | "printing";

const TABS: Array<{ id: TabId; label: string; icon: typeof Box }> = [
  { id: "geometry", label: "Geometry", icon: Boxes },
  { id: "material", label: "Material", icon: Layers },
  { id: "forces", label: "Forces & Stability", icon: Weight },
  { id: "fea", label: "Stress (FEA)", icon: Activity },
  { id: "printing", label: "3D Printing", icon: Printer },
];

const UNITS: Unit[] = ["mm", "cm", "in"];

/** The full analysis workspace: viewport + tabbed data panels + actions. */
export function Dashboard() {
  const {
    model,
    geometry,
    unit,
    setUnit,
    clearModel,
    material,
    forces,
    supports,
    print,
    screenshotRef,
  } = useAnalyzer();
  const derived = useDerivedAnalysis();
  const [tab, setTab] = useState<TabId>("geometry");
  const [exporting, setExporting] = useState(false);

  if (!model || !geometry) return null;

  async function onExport() {
    if (!geometry) return;
    setExporting(true);
    try {
      const preview = screenshotRef.current?.() ?? null;
      await generateReport({
        modelName: model!.name,
        geometry,
        material,
        stability: derived.stability,
        fea: derived.fea,
        printEstimate: derived.print,
        recommendation: derived.recommendation,
        printSettings: print,
        forces,
        supports,
        previewImage: preview,
      });
      toast.success("Report downloaded");
    } catch (error) {
      toast.error("Report failed", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            <Box className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-semibold">{model.name}</h1>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {geometry.quality.triangleCount.toLocaleString()} triangles ·{" "}
              {(model.sizeBytes / 1024).toFixed(0)} KB
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-[var(--color-border)]">
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  unit === u
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
                )}
              >
                {UNIT_LABELS[u]}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={onExport} disabled={exporting}>
            <FileText className="size-4" />
            {exporting ? "Generating…" : "Export report"}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Load a different model" onClick={clearModel}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Viewport + panels */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <ViewerPanel />
        </div>

        <div>
          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Analysis sections"
            className="mb-4 flex flex-wrap gap-1 rounded-full border border-[var(--color-border)] p-1"
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors [&_svg]:size-3.5",
                    active
                      ? "text-[var(--color-primary-foreground)]"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="stl-tab-pill"
                      className="absolute inset-0 rounded-full bg-[var(--color-primary)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <span className="relative flex items-center gap-1.5">
                    <t.icon />
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "geometry" ? <GeometryPanel /> : null}
              {tab === "material" ? <MaterialPanel /> : null}
              {tab === "forces" ? <ForcesPanel /> : null}
              {tab === "fea" ? <FeaPanel /> : null}
              {tab === "printing" ? <PrintingPanel /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
