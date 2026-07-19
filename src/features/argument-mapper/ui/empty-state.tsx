"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Library, MousePointerClick, Plus, Sparkles } from "lucide-react";
import { useAmStore } from "../store";

/**
 * The first-run empty state — a calm, centered invitation rather than a blank
 * void. Offers the three ways in: drop a first claim, open the library, or just
 * double-click the canvas. Disappears the moment a node exists.
 */
export function EmptyState({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const reduce = useReducedMotion();
  const addNode = useAmStore((s) => s.addNode);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto max-w-md text-center"
      >
        <div
          className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--glass-bg)] backdrop-blur-md"
          style={{ color: "var(--color-primary)" }}
        >
          <Sparkles className="size-6" />
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Map an argument
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-[var(--color-muted-foreground)]">
          Lay out premises, evidence, and objections as connected nodes. A live
          engine grades the structure and flags fallacies as you build.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => addNode("claim", { x: 240, y: 200 })}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] transition-transform hover:scale-[1.02] [&_svg]:size-4"
          >
            <Plus /> Add first claim
          </button>
          <button
            type="button"
            onClick={onOpenLibrary}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-muted)] [&_svg]:size-4"
          >
            <Library /> Browse library
          </button>
        </div>

        <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
          <MousePointerClick className="size-3.5" />
          Tip: double-click anywhere on the canvas to drop a node.
        </p>
      </motion.div>
    </div>
  );
}
