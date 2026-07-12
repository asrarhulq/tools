import type { Variants, Transition } from "framer-motion";

/**
 * Shared motion primitives so animations feel like one system across the app.
 * All respect reduced-motion at the component level (via `useReducedMotion`).
 */

export const easeOutExpo: Transition["ease"] = [0.16, 1, 0.3, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutExpo },
  },
};

/** Parent that reveals children in sequence. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: easeOutExpo },
  },
};

export const springy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};
