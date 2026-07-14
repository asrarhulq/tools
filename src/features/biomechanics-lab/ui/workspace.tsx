"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  FileText,
  PersonStanding,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBiomech } from "../state/store";
import { useAnalysis } from "../state/use-analysis";
import { Viewer } from "../viewer/viewer";
import { ControlsBar, Timeline } from "./controls-bar";
import { AnalysisPanels } from "./analysis-panels";
import { SimulatorPanel, PosturePanel } from "./simulator-panel";
import { LearnPanel } from "./learn-panel";
import { generateReport } from "../lib/report";
import { assessPosture } from "../lib/analysis";
import { cn } from "@/lib/utils";

type Tab = "analysis" | "simulator" | "posture" | "learn";

const TABS: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: "analysis", label: "Analysis", icon: Activity },
  { id: "simulator", label: "Simulator", icon: SlidersHorizontal },
  { id: "posture", label: "Posture", icon: PersonStanding },
  { id: "learn", label: "Learn", icon: BookOpen },
];

/** The full Biomechanics Lab workspace. */
export function Workspace() {
  const { activity, body, units, screenshotRef } = useBiomech();
  const { frame, summary, pose } = useAnalysis();
  const [tab, setTab] = useState<Tab>("analysis");
  const [exporting, setExporting] = useState(false);

  const onExport = () => {
    setExporting(true);
    try {
      const screenshot = screenshotRef.current?.() ?? null;
      generateReport({
        activity,
        body,
        units,
        frame,
        summary,
        posture: assessPosture(pose, body),
        screenshot,
        subject: "",
      });
      toast.success("Report downloaded");
    } catch (e) {
      toast.error("Report failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            <PersonStanding className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold">Human Biomechanics Lab</h1>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Interactive movement simulation & engineering analysis
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={exporting}
        >
          <FileText className="size-4" />
          {exporting ? "Generating…" : "Export report"}
        </Button>
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: viewer + controls */}
        <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <ControlsBar />
          <div className="p-3">
            <Viewer />
          </div>
          <Timeline phaseLabel={frame.phaseLabel} />
        </div>

        {/* Right: tabbed inspector */}
        <div className="flex flex-col">
          <div
            role="tablist"
            className="mb-3 flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors [&_svg]:size-3.5",
                  tab === t.id
                    ? "text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
                )}
              >
                {tab === t.id ? (
                  <motion.span
                    layoutId="biomech-tab"
                    className="absolute inset-0 rounded-full bg-[var(--color-primary)]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <span className="relative flex items-center gap-1.5">
                  <t.icon />
                  <span className="hidden sm:inline">{t.label}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="max-h-[640px] overflow-y-auto pr-0.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {tab === "analysis" ? <AnalysisPanels /> : null}
                {tab === "simulator" ? <SimulatorPanel /> : null}
                {tab === "posture" ? <PosturePanel /> : null}
                {tab === "learn" ? <LearnPanel /> : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-[var(--color-muted-foreground)]">
        Model estimates for education — not lab-measured data. Developed by
        Asrar ul Haq
      </p>
    </div>
  );
}
