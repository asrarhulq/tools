"use client";

import { motion } from "framer-motion";
import { FileUp, Sparkles, Rocket } from "lucide-react";
import { useGantt } from "../state/store";
import { TEMPLATES, buildFromTemplate } from "../lib/templates";
import { todayISO } from "../lib/dates";
import { Card } from "./primitives";
import { Button } from "@/components/ui/button";

/**
 * First-run start screen: pick a template, load the sample project, start blank,
 * or import. Only shown when the current project has no tasks.
 */
export function StartScreen({ onImport }: { onImport: () => void }) {
  const { loadProject, addTask, updateMeta } = useGantt();

  const startBlank = () => {
    updateMeta({ name: "New Project", startDate: todayISO() });
    addTask({ name: "First task" });
  };

  const loadSample = () => {
    loadProject(buildFromTemplate(TEMPLATES[0]!, todayISO()));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
          <Rocket className="size-6" />
        </span>
        <h2 className="text-2xl font-semibold tracking-tight">
          Start your project plan
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted-foreground)]">
          Pick a template to begin in seconds, load the sample project, or
          import an existing plan. Everything runs privately in your browser.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={loadSample}>
            <Sparkles className="size-4" /> Load sample project
          </Button>
          <Button variant="outline" onClick={startBlank}>
            Start blank
          </Button>
          <Button variant="outline" onClick={onImport}>
            <FileUp className="size-4" /> Import file
          </Button>
        </div>
      </motion.div>

      <Card title="Templates">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t, i) => (
            <motion.button
              key={t.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => loadProject(buildFromTemplate(t, todayISO()))}
              className="group flex flex-col rounded-xl border border-[var(--color-border)] p-3.5 text-left transition-all hover:border-[var(--color-primary)] hover:shadow-md"
            >
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[var(--color-primary)]" />
                <span className="text-sm font-semibold">{t.name}</span>
              </span>
              <span className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">
                {t.description}
              </span>
              <span className="mt-2 text-[11px] font-medium text-[var(--color-primary)] opacity-0 transition-opacity group-hover:opacity-100">
                Use template →
              </span>
            </motion.button>
          ))}
        </div>
      </Card>
    </div>
  );
}
