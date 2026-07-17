"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useFocus } from "../state/store";

/**
 * Primary transport controls with spring-based press feedback. The main
 * play/pause button is prominent (accent-filled); restart + skip are quiet
 * ghost buttons. All are keyboard-reachable with clear labels.
 */
export function Controls() {
  const { phase, start, pause, resume, restart, skip } = useFocus();
  const reduce = useReducedMotion();

  const primaryLabel =
    phase === "running" ? "Pause" : phase === "paused" ? "Resume" : "Start";
  const onPrimary =
    phase === "running" ? pause : phase === "paused" ? resume : start;
  const PrimaryIcon = phase === "running" ? Pause : Play;

  const press = reduce ? {} : { whileTap: { scale: 0.94 } };

  return (
    <div className="flex items-center justify-center gap-3">
      <motion.button
        type="button"
        {...press}
        onClick={restart}
        aria-label="Restart (R)"
        title="Restart · R"
        className="flex size-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] [&_svg]:size-5"
      >
        <RotateCcw />
      </motion.button>

      <motion.button
        type="button"
        {...press}
        onClick={onPrimary}
        aria-label={`${primaryLabel} (Space)`}
        title={`${primaryLabel} · Space`}
        className="flex h-16 min-w-[9rem] items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-8 text-base font-semibold text-[var(--color-primary-foreground)] shadow-lg transition-transform [&_svg]:size-6"
      >
        <PrimaryIcon />
        {primaryLabel}
      </motion.button>

      <motion.button
        type="button"
        {...press}
        onClick={skip}
        aria-label="Skip to next (S)"
        title="Skip · S"
        className="flex size-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] [&_svg]:size-5"
      >
        <SkipForward />
      </motion.button>
    </div>
  );
}

/** Segmented Focus / Short / Long switcher with a sliding indicator. */
export function ModeSwitcher() {
  const { mode, switchMode, settings } = useFocus();
  const reduce = useReducedMotion();
  const modes = [
    { id: "focus" as const, label: "Focus", min: settings.focusMin },
    { id: "short" as const, label: "Short", min: settings.shortMin },
    { id: "long" as const, label: "Long", min: settings.longMin },
  ];

  return (
    <div
      role="tablist"
      aria-label="Timer mode"
      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1"
    >
      {modes.map((m) => {
        const active = m.id === mode;
        return (
          <button
            key={m.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => switchMode(m.id)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "text-[var(--color-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {active ? (
              <motion.span
                layoutId={reduce ? undefined : "focus-mode-pill"}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-full bg-[var(--color-surface)] shadow-sm ring-1 ring-[var(--color-border)]"
              />
            ) : null}
            <span className="relative">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
