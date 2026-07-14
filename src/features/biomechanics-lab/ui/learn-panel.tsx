"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";
import { useBiomech } from "../state/store";
import { Card } from "./primitives";
import { BODY_REGIONS, LESSONS } from "../lib/education";
import { ACTIVITY_MAP } from "../lib/anthropometry";

/** Educational content for the current activity + an interactive body map. */
export function LearnPanel() {
  const { activity } = useBiomech();
  const lesson = LESSONS[activity];
  const [region, setRegion] = useState<string | null>(null);
  const selected = BODY_REGIONS.find((r) => r.id === region) ?? null;

  const blocks = [
    { label: "What is happening", body: lesson.what },
    { label: "Why it matters", body: lesson.why },
    { label: "Engineering principle", body: lesson.engineering },
    { label: "Biology", body: lesson.biology },
  ];

  return (
    <div className="space-y-4">
      <Card
        title={`Learn: ${ACTIVITY_MAP[activity].label}`}
        action={<BookOpen className="size-4 text-[var(--color-primary)]" />}
      >
        <div className="space-y-3">
          {blocks.map((b) => (
            <div key={b.label}>
              <p className="text-[11px] font-semibold tracking-wide text-[var(--color-primary)] uppercase">
                {b.label}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Interactive body map">
        <p className="mb-3 text-[11px] text-[var(--color-muted-foreground)]">
          Select a region to explore its anatomy, function, and injury
          prevention.
        </p>
        <div className="flex flex-wrap gap-2">
          {BODY_REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRegion(region === r.id ? null : r.id)}
              className={
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors [&_svg]:size-3 " +
                (region === r.id
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]")
              }
            >
              {r.label}
              <ChevronRight
                className={
                  region === r.id
                    ? "rotate-90 transition-transform"
                    : "transition-transform"
                }
              />
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="space-y-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-3 text-xs">
                <Detail label="Anatomy" body={selected.anatomy} />
                <Detail label="Function" body={selected.function} />
                <Detail label="Biomechanics" body={selected.biomechanics} />
                <div>
                  <p className="font-semibold text-[var(--color-foreground)]">
                    Common injuries
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {selected.injuries.map((inj) => (
                      <span
                        key={inj}
                        className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[11px] text-rose-600 dark:text-rose-400"
                      >
                        {inj}
                      </span>
                    ))}
                  </div>
                </div>
                <Detail label="Prevention" body={selected.prevention} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Card>
    </div>
  );
}

function Detail({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="font-semibold text-[var(--color-foreground)]">{label}</p>
      <p className="mt-0.5 leading-relaxed text-[var(--color-muted-foreground)]">
        {body}
      </p>
    </div>
  );
}
