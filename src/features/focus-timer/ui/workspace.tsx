"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Expand, Keyboard, SlidersHorizontal } from "lucide-react";
import { useFocus } from "../state/store";
import { ACCENTS } from "../lib/config";
import { quoteAt } from "../data/quotes";
import { TimerRing } from "./timer-ring";
import { Controls, ModeSwitcher } from "./controls";
import { SettingsPanel } from "./settings-panel";
import { StatsDashboard } from "./stats-dashboard";
import { FocusMode } from "./focus-mode";

/**
 * The composed Pomodoro workspace: ambient aura → mode switcher → animated ring
 * → controls → rotating quote, with a stats dashboard below. Global keyboard
 * shortcuts (Space/R/S/F) are bound here; typing in a field is respected.
 * A milestone celebration fires a brief confetti-free glow burst.
 */
export function Workspace() {
  const {
    mode,
    phase,
    settings,
    start,
    pause,
    resume,
    restart,
    skip,
    celebration,
    hydrated,
    cycleCount,
  } = useFocus();
  const reduce = useReducedMotion();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [burst, setBurst] = useState(0);

  const aura =
    mode === "focus" ? ACCENTS[settings.accent].color : "oklch(0.66 0.14 165)"; // calm green wash on breaks

  // The quote is derived — it rotates with each completed session (cycleCount)
  // and mode change, so no effect/state is needed to advance it.
  const quote = quoteAt(cycleCount + (mode === "focus" ? 0 : 1));

  // Celebrate milestones (long break earned): a brief glow burst keyed off the
  // store's celebration counter. Responding to an external signal change with a
  // one-shot animation is the intended use of an effect here.
  const lastCelebrationRef = useRef(0);
  useEffect(() => {
    if (celebration === lastCelebrationRef.current) return;
    lastCelebrationRef.current = celebration;
    if (celebration === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot burst on signal
    setBurst((b) => b + 1);
  }, [celebration]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (phase === "running") pause();
    else if (phase === "paused") resume();
    else start();
  }, [phase, pause, resume, start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const k = e.key?.toLowerCase();
      if (e.code === "Space" || k === " ") {
        e.preventDefault();
        togglePlay();
      } else if (k === "r") {
        restart();
      } else if (k === "s") {
        skip();
      } else if (k === "f") {
        setFocusModeOpen((v) => !v);
      } else if (k === "?") {
        setShowShortcuts((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, restart, skip]);

  return (
    <div className="relative">
      {/* Timer stage */}
      <section className="relative overflow-hidden rounded-[calc(var(--radius)+6px)] border border-[var(--color-border)] px-6 py-12 shadow-[var(--shadow-glow)] sm:py-16">
        {/* Layered atmospheric backdrop (behind the aura) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% -10%, color-mix(in oklch, var(--aura) 16%, var(--color-surface)) 0%, var(--color-surface) 55%, var(--color-surface-2) 100%)",
            ["--aura" as string]: aura,
            transition: "background 700ms ease",
          }}
        />
        {/* Fine top hairline highlight for a glassy edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in oklch, var(--color-foreground) 18%, transparent), transparent)",
          }}
        />
        <div
          className="focus-aura"
          style={{ "--aura": aura } as React.CSSProperties}
          aria-hidden="true"
        />

        {/* milestone burst */}
        <AnimatePresence>
          {burst > 0 ? (
            <motion.div
              key={burst}
              initial={{ opacity: 0.9, scale: 0.6 }}
              animate={{ opacity: 0, scale: 1.6 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              onAnimationComplete={() => setBurst(0)}
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                background: `radial-gradient(circle at 50% 42%, color-mix(in oklch, ${ACCENTS[settings.accent].color} 40%, transparent), transparent 55%)`,
              }}
              aria-hidden="true"
            />
          ) : null}
        </AnimatePresence>

        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="microlabel">
              Session {(cycleCount % settings.cycleLength) + 1} /{" "}
              {settings.cycleLength}
            </div>
            <div className="flex items-center gap-1.5">
              <IconButton
                label="Keyboard shortcuts"
                onClick={() => setShowShortcuts((v) => !v)}
              >
                <Keyboard />
              </IconButton>
              <IconButton
                label="Focus mode (F)"
                onClick={() => setFocusModeOpen(true)}
              >
                <Expand />
              </IconButton>
              <IconButton
                label="Settings"
                onClick={() => setSettingsOpen(true)}
              >
                <SlidersHorizontal />
              </IconButton>
            </div>
          </div>

          <ModeSwitcher />

          <TimerRing size={320} />

          <Controls />

          {/* Rotating quote */}
          <AnimatePresence mode="wait">
            <motion.figure
              key={quote.text}
              initial={reduce ? {} : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? {} : { opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="mt-2 max-w-md text-center"
            >
              <blockquote className="text-sm text-[var(--color-muted-foreground)] italic">
                &ldquo;{quote.text}&rdquo;
              </blockquote>
              <figcaption className="mt-1 text-xs text-[var(--color-muted-foreground)]/80">
                — {quote.author}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
      </section>

      {/* Stats */}
      <div className="mt-8">
        {hydrated ? (
          <StatsDashboard />
        ) : (
          <div className="h-40 animate-pulse rounded-[var(--radius)] bg-[var(--color-muted)]" />
        )}
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <FocusMode
        open={focusModeOpen}
        quote={quote}
        onClose={() => setFocusModeOpen(false)}
      />
      <ShortcutSheet
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] [&_svg]:size-[18px]"
    >
      {children}
    </button>
  );
}

function ShortcutSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const rows = [
    { keys: ["Space"], desc: "Start / pause / resume" },
    { keys: ["R"], desc: "Restart current session" },
    { keys: ["S"], desc: "Skip to next session" },
    { keys: ["F"], desc: "Toggle focus mode" },
    { keys: ["Esc"], desc: "Exit focus mode" },
    { keys: ["?"], desc: "Toggle this sheet" },
  ];
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
            aria-label="Keyboard shortcuts"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl"
          >
            <h2 className="font-display text-lg font-semibold">
              Keyboard shortcuts
            </h2>
            <ul className="mt-4 space-y-2.5">
              {rows.map((r) => (
                <li
                  key={r.desc}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-[var(--color-muted-foreground)]">
                    {r.desc}
                  </span>
                  <span className="flex gap-1">
                    {r.keys.map((k) => (
                      <kbd
                        key={k}
                        className="rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 font-mono text-xs"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
