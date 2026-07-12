"use client";

import { useEffect, useState } from "react";

/**
 * Returns document scroll progress in [0, 1] and whether the page is scrolled
 * past a threshold (for the back-to-top button). Uses a passive listener and
 * rAF batching to stay off the main-thread critical path.
 */
export function useScrollProgress(threshold = 400) {
  const [progress, setProgress] = useState(0);
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    let frame = 0;

    function update() {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const top = el.scrollTop;
      setProgress(max > 0 ? Math.min(1, Math.max(0, top / max)) : 0);
      setScrolledPast(top > threshold);
      frame = 0;
    }

    function onScroll() {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return { progress, scrolledPast } as const;
}
