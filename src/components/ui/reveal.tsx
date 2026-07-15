"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useAnimationControls,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { staggerContainer } from "@/lib/motion";

/**
 * Scroll-reveal container for the homepage sections.
 *
 * The bug this solves: after opening a tool and returning to the homepage, the
 * Featured cards were stuck visible and never re-animated. The declarative
 * `whileInView`/`useInView` path latched to "shown" from a stale, pre-layout
 * intersection reading taken during the App-Router return transition (the
 * section reported as on-screen for one frame while scroll was still 0), and
 * never re-evaluated.
 *
 * This drives the reveal from a hand-rolled IntersectionObserver so the state
 * is derived purely from real `entry.isIntersecting` changes: the container
 * starts `hidden` on every mount and only animates to `visible` when the
 * observer reports a genuine intersection, back to `hidden` when it leaves.
 * That replays on every return (Link, logo, breadcrumb, browser Back) and on
 * repeated scrolls, with no latched state. The observer is disconnected on
 * unmount, so nothing leaks or stacks across navigations.
 */
export function Reveal({
  children,
  className,
  as = "div",
  variants = staggerContainer,
  amount = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ol";
  variants?: Variants;
  amount?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const controls = useAnimationControls();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduce) {
      controls.set("visible");
      return;
    }

    // Start hidden every mount; the observer decides when to reveal.
    controls.set("hidden");

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        controls.start(entry.isIntersecting ? "visible" : "hidden");
      },
      { threshold: amount, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [amount, reduce, controls]);

  const MotionTag = as === "ol" ? motion.ol : motion.div;

  return (
    <MotionTag
      ref={
        ref as React.RefObject<HTMLElement & HTMLDivElement & HTMLOListElement>
      }
      variants={variants}
      initial={reduce ? "visible" : "hidden"}
      animate={controls}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
