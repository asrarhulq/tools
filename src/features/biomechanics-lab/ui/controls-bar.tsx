"use client";

import {
  ChevronLeft,
  ChevronRight,
  GitCompare,
  Pause,
  Play,
  Repeat,
  Square,
} from "lucide-react";
import { useBiomech } from "../state/store";
import { ACTIVITIES, VISUALIZATION_MODES } from "../lib/anthropometry";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  gait: "Gait",
  lifting: "Lifting",
  sport: "Sport",
};

/** Top control bar: activity selector, visualization-mode switch, comparison. */
export function ControlsBar() {
  const { activity, setActivity, mode, setMode, comparison, toggleComparison } =
    useBiomech();

  const grouped = ["gait", "lifting", "sport"].map((cat) => ({
    cat,
    items: ACTIVITIES.filter((a) => a.category === cat),
  }));

  return (
    <div className="space-y-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      {/* Activity */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {grouped.map((g) => (
          <div key={g.cat} className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold tracking-wide text-[var(--color-muted-foreground)] uppercase">
              {CATEGORY_LABELS[g.cat]}
            </span>
            {g.items.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setActivity(a.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  activity === a.id
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Mode + comparison */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)]">
          {VISUALIZATION_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              title={m.hint}
              className={cn(
                "px-2.5 py-1 text-xs font-medium transition-colors",
                mode === m.id
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleComparison}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors [&_svg]:size-3.5",
            comparison
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
          )}
        >
          <GitCompare /> Compare technique
        </button>
      </div>
    </div>
  );
}

/** Playback + motion timeline with phase scrubber and phase-label chips. */
export function Timeline({ phaseLabel }: { phaseLabel: string }) {
  const {
    phase,
    playing,
    togglePlay,
    setPhase,
    stepFrame,
    playbackSpeed,
    setPlaybackSpeed,
    loop,
    toggleLoop,
    stop,
  } = useBiomech();

  const SPEEDS = [0.25, 0.5, 1, 1.5];
  // 60-frame cycle → current frame index for the timeline read-out.
  const frameNo = Math.round(phase * 60) % 60;

  return (
    <div className="space-y-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => stepFrame(-1)}
          aria-label="Previous frame"
          className="flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] [&_svg]:size-4"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] [&_svg]:size-4"
        >
          {playing ? <Pause /> : <Play />}
        </button>
        <button
          type="button"
          onClick={() => stepFrame(1)}
          aria-label="Next frame"
          className="flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] [&_svg]:size-4"
        >
          <ChevronRight />
        </button>
        <button
          type="button"
          onClick={stop}
          aria-label="Stop"
          title="Stop and rewind"
          className="flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] [&_svg]:size-3.5"
        >
          <Square />
        </button>

        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={phase}
            onChange={(e) => setPhase(Number(e.target.value))}
            className="w-full accent-[var(--color-primary)]"
            aria-label="Movement phase"
          />
        </div>

        <span className="hidden w-24 shrink-0 text-right text-xs font-medium text-[var(--color-foreground)] sm:block">
          {phaseLabel}
        </span>
        <span className="hidden w-14 shrink-0 text-right text-[11px] text-[var(--color-muted-foreground)] tabular-nums md:block">
          f {frameNo}/60
        </span>

        <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)]">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPlaybackSpeed(s)}
              className={cn(
                "px-2 py-1 text-[11px] font-medium transition-colors",
                playbackSpeed === s
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
              )}
            >
              {s}×
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleLoop}
          aria-label="Toggle loop"
          aria-pressed={loop}
          title={loop ? "Looping on" : "Looping off"}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg transition-colors [&_svg]:size-4",
            loop
              ? "bg-[var(--color-primary)]/12 text-[var(--color-primary)]"
              : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
          )}
        >
          <Repeat />
        </button>
      </div>
    </div>
  );
}
