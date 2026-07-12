"use client";

import { useTheme } from "next-themes";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Animated light/dark toggle. Renders a stable placeholder until mounted to
 * avoid a hydration mismatch (the server can't know the persisted theme).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const reduce = useReducedMotion();

  const isDark = mounted && resolvedTheme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        mounted
          ? `Switch to ${isDark ? "light" : "dark"} theme`
          : "Toggle theme"
      }
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={reduce ? false : { rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={reduce ? undefined : { rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex"
        >
          <Icon aria-hidden="true" />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
