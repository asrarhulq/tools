"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Compass,
  Quote,
  RefreshCw,
  Scale,
} from "lucide-react";
import { DILEMMAS } from "../data/dilemmas";
import {
  ZONE_LABELS,
  THEORY_PROFILES,
  applyChoice,
  dominantTheory,
  emptyScores,
} from "../lib/scoring";
import type { CompassZone, Judgment, MoralScores } from "../types";
import { cn } from "@/lib/utils";

type Phase = "intro" | "judgment" | "reasoning" | "result";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Screen-space drag → compass zone. Threshold in px past which a zone commits. */
const COMMIT_PX = 60;
const HINT_PX = 40;

/**
 * The Ethics Compass — an inline, page-native moral-philosophy instrument.
 * Two layers per dilemma: (1) judge the action right/wrong, then (2) place a
 * reasoning node on a four-way compass (Utility · Duty · Divine Command ·
 * Culture/Virtue) by drag OR keyboard. Choices score five theories; the
 * dominant one is revealed at the end. Fully themed and keyboard-operable.
 */
export function Workspace() {
  const reduce = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [judgment, setJudgment] = useState<Judgment | null>(null);
  const [scores, setScores] = useState<MoralScores>(emptyScores);
  const [hintZone, setHintZone] = useState<CompassZone | null>(null);

  const dilemma = DILEMMAS[index]!;
  const isLast = index === DILEMMAS.length - 1;

  // ── Drag state (screen-space offset of the node from centre) ────────────
  const nodeRef = useRef<HTMLButtonElement>(null);
  const dragging = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const offset = useRef({ x: 0, y: 0 });

  const resetNode = useCallback(() => {
    offset.current = { x: 0, y: 0 };
    if (nodeRef.current) nodeRef.current.style.transform = "translate(0px,0px)";
    setHintZone(null);
  }, []);

  const zoneFromOffset = useCallback(
    (x: number, y: number, threshold: number): CompassZone | null => {
      const ax = Math.abs(x);
      const ay = Math.abs(y);
      if (ax < threshold && ay < threshold) return null;
      if (ax >= ay) return x < 0 ? "zoneA" : "zoneB";
      return y < 0 ? "zoneC" : "zoneD";
    },
    [],
  );

  const commit = useCallback(
    (zone: CompassZone) => {
      if (!judgment) return;
      setScores((s) => applyChoice(s, index, judgment, zone));
      if (isLast) {
        setPhase("result");
      } else {
        setIndex((i) => i + 1);
        setJudgment(null);
        setPhase("judgment");
      }
      resetNode();
    },
    [judgment, index, isLast, resetNode],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    origin.current = {
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    };
    nodeRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const x = e.clientX - origin.current.x;
    const y = e.clientY - origin.current.y;
    offset.current = { x, y };
    if (nodeRef.current)
      nodeRef.current.style.transform = `translate(${x}px,${y}px)`;
    setHintZone(zoneFromOffset(x, y, HINT_PX));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    nodeRef.current?.releasePointerCapture(e.pointerId);
    const zone = zoneFromOffset(offset.current.x, offset.current.y, COMMIT_PX);
    if (zone) commit(zone);
    else resetNode();
  };

  const restart = () => {
    setIndex(0);
    setJudgment(null);
    setScores(emptyScores());
    setPhase("intro");
    resetNode();
  };

  const progress =
    ((index + (phase === "result" ? 1 : 0)) / DILEMMAS.length) * 100;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress rail */}
      {phase !== "intro" ? (
        <div className="mb-6 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-muted)]">
            <motion.div
              className="h-full rounded-full bg-[var(--color-primary)]"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={
                reduce ? { duration: 0 } : { duration: 0.4, ease: EASE }
              }
            />
          </div>
          <span className="readout shrink-0 text-xs text-[var(--color-muted-foreground)]">
            {phase === "result"
              ? "Complete"
              : `${index + 1} / ${DILEMMAS.length}`}
          </span>
        </div>
      ) : null}

      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-8">
        <AnimatePresence mode="wait">
          {phase === "intro" ? (
            <Panel key="intro" reduce={reduce}>
              <Intro onBegin={() => setPhase("judgment")} />
            </Panel>
          ) : phase === "judgment" ? (
            <Panel key={`judgment-${index}`} reduce={reduce}>
              <JudgmentLayer
                counter={`Reflection ${index + 1} of ${DILEMMAS.length}`}
                text={dilemma.text}
                actionText={dilemma.actionText}
                onJudge={(j) => {
                  setJudgment(j);
                  setPhase("reasoning");
                }}
              />
            </Panel>
          ) : phase === "reasoning" && judgment ? (
            <Panel key={`reasoning-${index}`} reduce={reduce}>
              <ReasoningLayer
                counter={`Reflection ${index + 1} of ${DILEMMAS.length}`}
                judgment={judgment}
                hintZone={hintZone}
                hintText={
                  hintZone
                    ? `${ZONE_LABELS[hintZone]}: “${dilemma.options[judgment][hintZone].text}”`
                    : null
                }
                nodeRef={nodeRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onCommit={commit}
                onRevise={() => {
                  setJudgment(null);
                  setPhase("judgment");
                  resetNode();
                }}
              />
            </Panel>
          ) : (
            <Panel key="result" reduce={reduce}>
              <ResultLayer scores={scores} onRestart={restart} />
            </Panel>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-4 text-center text-[11px] text-[var(--color-muted-foreground)]">
        A reflective instrument, not a verdict · A Product by Asrar ul Haq ·
        tools.asrarul.com
      </p>
    </div>
  );
}

// ── Phase transition wrapper ────────────────────────────────────────────────

function Panel({
  children,
  reduce,
}: {
  children: React.ReactNode;
  reduce: boolean | null;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ── Intro ───────────────────────────────────────────────────────────────────

const AXES: Array<{ zone: CompassZone; hint: string; icon: typeof ArrowLeft }> =
  [
    { zone: "zoneA", hint: "Drag left", icon: ArrowLeft },
    { zone: "zoneB", hint: "Drag right", icon: ArrowRight },
    { zone: "zoneC", hint: "Drag up", icon: ArrowUp },
    { zone: "zoneD", hint: "Drag down", icon: ArrowDown },
  ];

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[var(--color-primary)]">
        <span className="inline-block h-px w-6 bg-[var(--color-primary)]" />
        <span className="microlabel">Map your conscience</span>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          What shape is your <br className="hidden sm:block" />
          internal moral blueprint?
        </h2>
        <p className="max-w-xl text-pretty text-[var(--color-muted-foreground)]">
          Work through fifteen classic dilemmas in two layers. First judge
          whether an action is right or wrong; then place a reasoning node on
          the compass to register <em>why</em>. Your instincts are scored
          against five great ethical theories.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {AXES.map((a) => (
          <div
            key={a.zone}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3"
          >
            <div className="flex items-center gap-1.5 text-[var(--color-primary)]">
              <a.icon className="size-3.5" aria-hidden="true" />
              <span className="microlabel">{a.hint}</span>
            </div>
            <p className="mt-1.5 text-sm font-medium">{ZONE_LABELS[a.zone]}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onBegin}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-[var(--color-primary-foreground)] transition-transform active:scale-[0.99] sm:w-auto"
      >
        <Compass className="size-4" aria-hidden="true" />
        Begin reflection
      </button>
    </div>
  );
}

// ── Layer 1: Judgment ───────────────────────────────────────────────────────

function JudgmentLayer({
  counter,
  text,
  actionText,
  onJudge,
}: {
  counter: string;
  text: string;
  actionText: string;
  onJudge: (j: Judgment) => void;
}) {
  return (
    <div className="space-y-6">
      <LayerHead counter={counter} label="Layer 1 · Judgment" />

      <div className="space-y-4">
        <p className="text-lg leading-relaxed text-[var(--color-foreground)]">
          {text}
        </p>
        <div className="rounded-lg border-l-2 border-[var(--color-primary)] bg-[var(--color-surface-2)] py-2.5 pr-3 pl-4">
          <span className="microlabel">Proposed action</span>
          <p className="mt-1 text-sm font-medium italic">“{actionText}”</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-center text-sm text-[var(--color-muted-foreground)]">
          How do you judge the proposed action?
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onJudge("right")}
            className="flex-1 rounded-lg border border-[var(--color-ok)]/40 bg-[var(--color-ok)]/8 py-3 text-sm font-semibold text-[var(--color-ok)] transition-colors hover:border-[var(--color-ok)] hover:bg-[var(--color-ok)]/14"
          >
            Morally right
          </button>
          <button
            type="button"
            onClick={() => onJudge("wrong")}
            className="flex-1 rounded-lg border border-[var(--color-crit)]/40 bg-[var(--color-crit)]/8 py-3 text-sm font-semibold text-[var(--color-crit)] transition-colors hover:border-[var(--color-crit)] hover:bg-[var(--color-crit)]/14"
          >
            Morally wrong
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Layer 2: Reasoning (compass) ────────────────────────────────────────────

function ReasoningLayer({
  counter,
  judgment,
  hintZone,
  hintText,
  nodeRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onCommit,
  onRevise,
}: {
  counter: string;
  judgment: Judgment;
  hintZone: CompassZone | null;
  hintText: string | null;
  nodeRef: React.RefObject<HTMLButtonElement | null>;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onCommit: (zone: CompassZone) => void;
  onRevise: () => void;
}) {
  const right = judgment === "right";
  return (
    <div className="space-y-5">
      <LayerHead counter={counter} label="Layer 2 · Justification" />

      <div className="text-center">
        <span className="microlabel">Your declared verdict</span>
        <p
          className="font-display text-lg font-semibold tracking-wide"
          style={{
            color: right ? "var(--color-ok)" : "var(--color-crit)",
          }}
        >
          {right ? "Morally right" : "Morally wrong"}
        </p>
      </div>

      {/* Compass field */}
      <div className="relative mx-auto flex aspect-[3/2] w-full max-w-md touch-none items-center justify-center overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <ZoneFace side="left" active={hintZone === "zoneA"} />
        <ZoneFace side="right" active={hintZone === "zoneB"} />
        <ZoneFace side="top" active={hintZone === "zoneC"} />
        <ZoneFace side="bottom" active={hintZone === "zoneD"} />

        <button
          ref={nodeRef}
          type="button"
          aria-label="Reasoning node — drag toward a compass edge, or use the buttons below"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="absolute z-20 flex size-20 cursor-grab touch-none flex-col items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-center shadow-md transition-colors select-none hover:border-[var(--color-primary)] active:cursor-grabbing"
        >
          <span
            className="mb-1 size-2 rounded-full"
            style={{
              backgroundColor: right ? "var(--color-ok)" : "var(--color-crit)",
            }}
          />
          <span className="microlabel">Align</span>
        </button>
      </div>

      {/* Hint / live justification */}
      <p className="min-h-[40px] px-2 text-center text-[13px] leading-normal text-[var(--color-muted-foreground)] italic">
        {hintText ??
          "Draw the node toward the ideal that resonates closest to your conscience — by drag, or the buttons below."}
      </p>

      {/* Keyboard / touch fallback — full parity with dragging */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            { zone: "zoneA", icon: ArrowLeft },
            { zone: "zoneC", icon: ArrowUp },
            { zone: "zoneD", icon: ArrowDown },
            { zone: "zoneB", icon: ArrowRight },
          ] as const
        ).map(({ zone, icon: ZoneIcon }) => (
          <button
            key={zone}
            type="button"
            onClick={() => onCommit(zone)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 text-xs font-medium transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <ZoneIcon className="size-3.5" aria-hidden="true" />
            {ZONE_LABELS[zone]}
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onRevise}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Revise judgment
        </button>
      </div>
    </div>
  );
}

/** A tinted edge of the compass field; brightens when the node hovers it. */
function ZoneFace({
  side,
  active,
}: {
  side: "left" | "right" | "top" | "bottom";
  active: boolean;
}) {
  const zone: CompassZone =
    side === "left"
      ? "zoneA"
      : side === "right"
        ? "zoneB"
        : side === "top"
          ? "zoneC"
          : "zoneD";
  const pos = {
    left: "inset-y-0 left-0 w-14 border-r",
    right: "inset-y-0 right-0 w-14 border-l",
    top: "inset-x-14 top-0 h-9 border-b",
    bottom: "inset-x-14 bottom-0 h-9 border-t",
  }[side];
  const vertical = side === "left" || side === "right";
  return (
    <div
      className={cn(
        "absolute flex items-center justify-center border-[var(--color-border)] bg-[var(--color-primary)]/5 p-1 text-center transition-opacity",
        pos,
        active ? "opacity-100" : "opacity-50",
      )}
    >
      <span
        className="microlabel text-[var(--color-primary)]"
        style={vertical ? { writingMode: "vertical-rl" } : undefined}
      >
        {ZONE_LABELS[zone]}
      </span>
    </div>
  );
}

// ── Result ──────────────────────────────────────────────────────────────────

function ResultLayer({
  scores,
  onRestart,
}: {
  scores: MoralScores;
  onRestart: () => void;
}) {
  const top = useMemo(() => dominantTheory(scores), [scores]);
  const profile = THEORY_PROFILES[top];
  const maxScore = Math.max(1, ...Object.values(scores));
  const ranked = useMemo(
    () =>
      (Object.keys(scores) as (keyof MoralScores)[])
        .map((k) => ({ theory: k, value: scores[k] }))
        .sort((a, b) => b.value - a.value),
    [scores],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[var(--color-primary)]">
        <Scale className="size-4" aria-hidden="true" />
        <span className="microlabel">Your ethical core</span>
      </div>

      <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-primary)]">
        {profile.title}
      </h3>

      <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm leading-relaxed text-[var(--color-foreground)]/90">
        {profile.description}
      </p>

      <figure className="flex gap-3 border-l-2 border-[var(--color-primary)] pl-4">
        <Quote
          className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]"
          aria-hidden="true"
        />
        <blockquote className="text-sm text-[var(--color-muted-foreground)] italic">
          {profile.quote}
        </blockquote>
      </figure>

      {/* Score spectrum */}
      <div className="space-y-2">
        <span className="microlabel">Your reasoning spectrum</span>
        <div className="space-y-1.5">
          {ranked.map(({ theory, value }) => {
            const isTop = theory === top;
            return (
              <div key={theory} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-xs text-[var(--color-muted-foreground)] capitalize">
                  {THEORY_PROFILES[theory].title.split(" — ")[0]}
                </span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-muted)]">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      backgroundColor: isTop
                        ? "var(--color-primary)"
                        : "var(--color-muted-foreground)",
                      opacity: isTop ? 1 : 0.4,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / maxScore) * 100}%` }}
                    transition={{ duration: 0.6, ease: EASE }}
                  />
                </div>
                <span className="readout w-6 shrink-0 text-right text-xs text-[var(--color-muted-foreground)] tabular-nums">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] py-3 text-sm font-medium transition-colors hover:bg-[var(--color-muted)] sm:w-auto sm:px-6"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Re-evaluate
      </button>
    </div>
  );
}

// ── Shared ──────────────────────────────────────────────────────────────────

function LayerHead({ counter, label }: { counter: string; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--color-muted-foreground)] italic">
        {counter}
      </span>
      <span className="microlabel">{label}</span>
    </div>
  );
}
