"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Info, List, Settings, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Viewer } from "../viewer/viewer";
import { TimeControlsBar } from "./time-controls-bar";
import { BodyInfoPanel } from "./body-info-panel";
import { BodyListSearch } from "./body-list-search";
import { SkyTrackPanel } from "./sky-track-panel";
import { ViewSettingsPanel } from "./view-settings-panel";
import { TourPanel } from "./tour-panel";
import { Card } from "./primitives";

type Tab = "info" | "bodies" | "sky" | "settings" | "tour";

const TABS: { id: Tab; label: string; icon: typeof Info }[] = [
  { id: "info", label: "Info", icon: Info },
  { id: "bodies", label: "Bodies", icon: List },
  { id: "sky", label: "Sky track", icon: TrendingUp },
  { id: "settings", label: "Display", icon: Settings },
  { id: "tour", label: "Tour", icon: Sparkles },
];

export function Workspace() {
  const [tab, setTab] = useState<Tab>("info");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: 3D viewport + time controls */}
        <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="p-3">
            <Viewer />
          </div>
          <TimeControlsBar />
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
                    layoutId="orrery-tab"
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

          <div className="max-h-[560px] overflow-y-auto pr-0.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {tab === "info" ? <BodyInfoPanel /> : null}
                {tab === "bodies" ? (
                  <Card title="All bodies">
                    <BodyListSearch />
                  </Card>
                ) : null}
                {tab === "sky" ? <SkyTrackPanel /> : null}
                {tab === "settings" ? <ViewSettingsPanel /> : null}
                {tab === "tour" ? <TourPanel /> : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-[var(--color-muted-foreground)]">
        Two-body Keplerian orbits from real J2000 elements — correct relative
        motion, not a full n-body ephemeris. Developed by Asrar ul Haq
      </p>
    </div>
  );
}
