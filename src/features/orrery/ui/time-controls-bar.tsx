"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { SPEED_PRESETS } from "../config";
import { formatDateTime } from "../lib/format";
import { julianDateToDate } from "../lib/julian-date";
import { useOrrery } from "../state/orrery-context";
import { SegmentedControl } from "./primitives";

export function TimeControlsBar() {
  const {
    playing,
    togglePlay,
    speedIndex,
    setSpeedIndex,
    displayJd,
    jumpToNow,
    jumpToDate,
    scaleMode,
    setScaleMode,
    cameraMode,
    setCameraMode,
  } = useOrrery();
  const date = julianDateToDate(displayJd);

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] p-3">
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>

      <div className="flex flex-col">
        <span className="text-sm font-medium tabular-nums">
          {formatDateTime(date)}
        </span>
        <span className="text-[11px] text-[var(--color-muted-foreground)]">
          Simulated date
        </span>
      </div>

      <input
        type="date"
        value={date.toISOString().slice(0, 10)}
        onChange={(e) => {
          if (e.target.value)
            jumpToDate(new Date(`${e.target.value}T12:00:00`));
        }}
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-xs"
      />

      <button
        type="button"
        onClick={jumpToNow}
        className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)]"
      >
        <RotateCcw className="size-3.5" /> Now
      </button>

      <label className="flex items-center gap-1.5 text-xs">
        <span className="text-[var(--color-muted-foreground)]">Speed</span>
        <select
          value={speedIndex}
          onChange={(e) => setSpeedIndex(Number(e.target.value))}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5"
        >
          {SPEED_PRESETS.map((p, i) => (
            <option key={p.label} value={i}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <SegmentedControl
          options={[
            { value: "visual" as const, label: "Visual scale" },
            { value: "realistic" as const, label: "True scale" },
          ]}
          value={scaleMode}
          onChange={setScaleMode}
        />
        <SegmentedControl
          options={[
            { value: "free" as const, label: "Free" },
            { value: "follow" as const, label: "Follow" },
            { value: "top-down" as const, label: "Top-down" },
          ]}
          value={cameraMode}
          onChange={setCameraMode}
        />
      </div>
    </div>
  );
}
