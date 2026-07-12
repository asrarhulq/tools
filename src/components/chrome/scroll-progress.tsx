"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Top-of-page reading progress bar. Uses framer-motion's `useScroll` +
 * `useSpring` so the fill is smoothed and driven off the compositor.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-[var(--color-primary)]"
    />
  );
}
