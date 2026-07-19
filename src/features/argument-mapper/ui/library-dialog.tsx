"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { LIBRARY } from "../data/library";
import type { ArgGraph } from "../types";

/**
 * The famous-arguments library — a grid of classic arguments, each pre-mapped
 * and fully editable once loaded. Choosing one replaces the canvas (undo-able)
 * and auto-lays it out. Presented as a centered glass dialog.
 */
export function LibraryDialog({
  open,
  onClose,
  onLoad,
}: {
  open: boolean;
  onClose: () => void;
  onLoad: (graph: ArgGraph) => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-label="Argument library"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass fixed top-1/2 left-1/2 z-50 flex max-h-[80vh] w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius)]"
          >
            <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  Argument library
                </h2>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Load a classic argument — every node is editable.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] [&_svg]:size-5"
              >
                <X />
              </button>
            </header>
            <div className="grid gap-2 overflow-y-auto p-4 sm:grid-cols-2">
              {LIBRARY.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onLoad(p.build());
                    onClose();
                  }}
                  className="group rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-colors hover:border-[color:var(--color-primary)]"
                >
                  <h3 className="font-display text-sm font-semibold transition-colors group-hover:text-[var(--color-primary)]">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                    {p.blurb}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
