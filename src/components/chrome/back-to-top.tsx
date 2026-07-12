"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useScrollProgress } from "@/hooks/use-scroll-progress";

/** Floating button that appears after scrolling and returns to the top. */
export function BackToTop() {
  const { scrolledPast } = useScrollProgress(600);

  return (
    <AnimatePresence>
      {scrolledPast ? (
        <motion.button
          type="button"
          aria-label="Back to top"
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="glass fixed right-6 bottom-6 z-50 flex size-11 items-center justify-center rounded-full text-[var(--color-foreground)] shadow-lg"
        >
          <ArrowUp className="size-5" aria-hidden="true" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
