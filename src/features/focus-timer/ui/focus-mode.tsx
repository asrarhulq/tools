"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2 } from "lucide-react";
import { useFocus } from "../state/store";
import { TimerRing } from "./timer-ring";
import { Controls } from "./controls";
import { ACCENTS } from "../lib/config";
import type { Quote } from "../types";

/**
 * Distraction-free fullscreen overlay: just the ring, the current quote, and
 * minimal controls over a calm ambient wash. Esc exits. We portal into a fixed
 * layer above everything and lock body scroll while open.
 */
export function FocusMode({
  open,
  quote,
  onClose,
}: {
  open: boolean;
  quote: Quote;
  onClose: () => void;
}) {
  const { settings } = useFocus();
  const aura = ACCENTS[settings.accent].color;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-[var(--color-background)]"
          role="dialog"
          aria-label="Focus mode"
        >
          <div
            className="focus-aura"
            style={{ "--aura": aura } as React.CSSProperties}
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Exit focus mode (Esc)"
            title="Exit · Esc"
            className="absolute top-6 right-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1.5 text-sm text-[var(--color-muted-foreground)] backdrop-blur transition-colors hover:text-[var(--color-foreground)] [&_svg]:size-4"
          >
            <Minimize2 /> Exit
          </button>

          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 200,
              damping: 26,
            }}
            className="relative z-10 flex flex-col items-center gap-10"
          >
            <TimerRing size={380} />
            <Controls />
          </motion.div>

          <motion.figure
            key={quote.text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative z-10 mt-12 max-w-lg px-6 text-center"
          >
            <blockquote className="font-display text-lg text-[var(--color-foreground)]/80 italic">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              — {quote.author}
            </figcaption>
          </motion.figure>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
