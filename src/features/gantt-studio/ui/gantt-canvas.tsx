"use client";

import { useMemo, useState } from "react";
import { useGantt } from "../state/store";
import { buildTimeline, pxToDays } from "../lib/timeline";
import { addDaysISO, daysBetween, todayISO } from "../lib/dates";
import { colorForCategory } from "../lib/factory";
import { ROW_HEIGHT, HEADER_HEIGHT } from "./task-tree";
import type { ScheduledTask } from "../types";
import { cn } from "@/lib/utils";

/**
 * The interactive Gantt chart body. Draws (in one scroll-synced surface):
 *   • a two-tier timeline header (major + minor ticks)
 *   • weekend and holiday shading, and a "today" indicator line
 *   • one row per task with a color-coded bar, progress overlay, baseline ghost,
 *     milestone diamonds, and a resource label
 *   • an SVG dependency-arrow layer routed between predecessor→successor bars
 *   • critical-path highlighting
 * Bars are draggable to reschedule (whole-day snapping); edges resize duration.
 */
export function GanttCanvas({
  tasks,
  scrollRef,
  onScroll,
}: {
  tasks: ScheduledTask[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll?: () => void;
}) {
  const { project, zoom, selectedIds, toggleSelect, updateTask } = useGantt();
  const stats = useMemo(
    () => rangeOf(tasks, project.meta.startDate, project.meta.endDate),
    [tasks, project.meta.startDate, project.meta.endDate],
  );

  const timeline = useMemo(
    () => buildTimeline(stats.start, stats.end, zoom, project.meta.weekendDays),
    [stats.start, stats.end, zoom, project.meta.weekendDays],
  );

  const today = todayISO();
  const rowIndex = useMemo(() => {
    const m = new Map<string, number>();
    tasks.forEach((t, i) => m.set(t.id, i));
    return m;
  }, [tasks]);

  const bodyHeight = tasks.length * ROW_HEIGHT;

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="relative h-full overflow-auto"
    >
      <div style={{ width: timeline.width, minWidth: "100%" }}>
        {/* Timeline header */}
        <div
          className="sticky top-0 z-20 bg-[var(--color-surface-2)]"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="relative h-7 border-b border-[var(--color-border)]">
            {timeline.majorTicks.map((t, i) => (
              <div
                key={i}
                className="absolute top-0 flex h-full items-center border-l border-[var(--color-border)] px-2 text-[11px] font-semibold text-[var(--color-foreground)]"
                style={{ left: t.x, width: t.width }}
              >
                <span className="truncate">{t.label}</span>
              </div>
            ))}
          </div>
          <div className="relative h-7 border-b border-[var(--color-border)]">
            {timeline.minorTicks.map((t, i) => (
              <div
                key={i}
                className={cn(
                  "absolute top-0 flex h-full items-center justify-center border-l border-[var(--color-border)] text-[10px] text-[var(--color-muted-foreground)]",
                  t.isWeekendCol && "bg-[var(--color-muted)]/40",
                )}
                style={{ left: t.x, width: t.width }}
              >
                {timeline.pxPerDay > 12 || i % 1 === 0 ? (
                  <span className="truncate px-0.5">{t.label}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="relative" style={{ height: bodyHeight }}>
          {/* Column shading: weekends + holidays (day/week zoom only) */}
          {(zoom === "day" || zoom === "week") &&
            timeline.minorTicks.map((t, i) =>
              t.isWeekendCol || project.meta.holidays.includes(t.date) ? (
                <div
                  key={i}
                  className={cn(
                    "absolute top-0 bottom-0",
                    project.meta.holidays.includes(t.date)
                      ? "bg-rose-500/8"
                      : "bg-[var(--color-muted)]/30",
                  )}
                  style={{ left: t.x, width: t.width }}
                />
              ) : null,
            )}

          {/* Row separators */}
          {tasks.map((_, i) => (
            <div
              key={i}
              className="absolute right-0 left-0 border-b border-[var(--color-border)]/60"
              style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
            />
          ))}

          {/* Today line */}
          {daysBetween(timeline.start, today) >= 0 &&
          daysBetween(today, timeline.end) >= 0 ? (
            <div
              data-today
              className="absolute top-0 z-10 w-px bg-rose-500"
              style={{ left: timeline.xFor(today), height: bodyHeight }}
            >
              <span className="absolute -top-1 -left-1 size-2 rounded-full bg-rose-500" />
            </div>
          ) : null}

          {/* Dependency arrows */}
          <DependencyArrows
            tasks={tasks}
            timeline={timeline}
            rowIndex={rowIndex}
          />

          {/* Bars */}
          {tasks.map((t, i) => (
            <TaskBar
              key={t.id}
              task={t}
              y={i * ROW_HEIGHT}
              timeline={timeline}
              hasBaseline={project.hasBaseline}
              selected={selectedIds.includes(t.id)}
              onSelect={(additive) => toggleSelect(t.id, additive)}
              onReschedule={(newStart) => {
                const dur = t.duration;
                updateTask(t.id, {
                  startDate: newStart,
                  endDate: addDaysISO(newStart, dur - 1),
                });
              }}
              onResize={(newEnd) => updateTask(t.id, { endDate: newEnd })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function rangeOf(tasks: ScheduledTask[], metaStart: string, metaEnd: string) {
  let start = metaStart;
  let end = metaEnd;
  for (const t of tasks) {
    if (daysBetween(t.startDate, start) > 0) start = t.startDate;
    if (daysBetween(end, t.endDate) > 0) end = t.endDate;
  }
  return { start, end };
}

const BAR_HEIGHT = 20;
const BAR_TOP = (ROW_HEIGHT - BAR_HEIGHT) / 2;

function TaskBar({
  task,
  y,
  timeline,
  hasBaseline,
  selected,
  onSelect,
  onReschedule,
  onResize,
}: {
  task: ScheduledTask;
  y: number;
  timeline: ReturnType<typeof buildTimeline>;
  hasBaseline: boolean;
  selected: boolean;
  onSelect: (additive: boolean) => void;
  onReschedule: (newStart: string) => void;
  onResize: (newEnd: string) => void;
}) {
  const [drag, setDrag] = useState<{
    mode: "move" | "resize";
    startX: number;
    dx: number;
  } | null>(null);
  const color = task.color || colorForCategory(task.category);
  const x = timeline.xFor(task.startDate);
  const w = Math.max(
    timeline.pxPerDay,
    (daysBetween(task.startDate, task.endDate) + 1) * timeline.pxPerDay,
  );

  const dxDays = drag ? pxToDays(drag.dx, timeline.pxPerDay) : 0;
  const previewX = drag?.mode === "move" ? x + dxDays * timeline.pxPerDay : x;
  const previewW =
    drag?.mode === "resize"
      ? Math.max(timeline.pxPerDay, w + dxDays * timeline.pxPerDay)
      : w;

  const startDrag = (mode: "move" | "resize") => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const move = (ev: PointerEvent) =>
      setDrag({ mode, startX, dx: ev.clientX - startX });
    const up = (ev: PointerEvent) => {
      const days = pxToDays(ev.clientX - startX, timeline.pxPerDay);
      if (days !== 0) {
        if (mode === "move") onReschedule(addDaysISO(task.startDate, days));
        else onResize(addDaysISO(task.endDate, days));
      }
      setDrag(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  if (task.isMilestone) {
    const cx = timeline.xFor(task.startDate) + timeline.pxPerDay / 2;
    return (
      <div
        className="absolute z-[5] flex items-center"
        style={{ top: y + BAR_TOP, left: cx - 9, height: BAR_HEIGHT }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(e.metaKey || e.ctrlKey);
        }}
      >
        <svg
          width={18}
          height={18}
          viewBox="0 0 18 18"
          className="cursor-pointer"
        >
          <rect
            x="9"
            y="1"
            width="11"
            height="11"
            transform="rotate(45 9 9)"
            fill={color}
            stroke={selected ? "var(--color-foreground)" : "transparent"}
            strokeWidth={1.5}
          />
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* Baseline ghost */}
      {hasBaseline && task.baselineStart && task.baselineEnd ? (
        <div
          className="absolute z-[3] rounded-sm border border-dashed border-[var(--color-muted-foreground)]/50"
          style={{
            top: y + BAR_TOP + BAR_HEIGHT - 3,
            left: timeline.xFor(task.baselineStart),
            width: Math.max(
              timeline.pxPerDay,
              (daysBetween(task.baselineStart, task.baselineEnd) + 1) *
                timeline.pxPerDay,
            ),
            height: 5,
          }}
          title="Baseline"
        />
      ) : null}

      <div
        className={cn(
          "group absolute z-[5] flex items-center rounded-md shadow-sm transition-shadow",
          selected &&
            "ring-2 ring-[var(--color-foreground)] ring-offset-1 ring-offset-[var(--color-surface)]",
          task.hasChildren && "opacity-95",
        )}
        style={{
          top: y + BAR_TOP,
          left: previewX,
          width: previewW,
          height: BAR_HEIGHT,
          backgroundColor: task.hasChildren ? "transparent" : `${color}33`,
          border: `1.5px solid ${color}`,
          cursor: drag ? "grabbing" : "grab",
        }}
        onPointerDown={startDrag("move")}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(e.metaKey || e.ctrlKey);
        }}
        title={`${task.name} · ${task.duration}d · ${task.rolledProgress}%`}
      >
        {/* Progress overlay */}
        <div
          className="absolute top-0 bottom-0 left-0 rounded-l-md"
          style={{
            width: `${task.rolledProgress}%`,
            backgroundColor: color,
            opacity: task.hasChildren ? 0.5 : 0.85,
          }}
        />
        {task.critical ? (
          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-rose-500" />
        ) : null}
        {/* Resource label */}
        {task.assignee && timeline.pxPerDay > 8 ? (
          <span className="pointer-events-none absolute top-1/2 left-[calc(100%+6px)] -translate-y-1/2 text-[10px] whitespace-nowrap text-[var(--color-muted-foreground)]">
            {task.assignee}
          </span>
        ) : null}
        {/* Resize handle */}
        {!task.hasChildren ? (
          <span
            onPointerDown={startDrag("resize")}
            className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
            style={{ backgroundColor: color }}
          />
        ) : null}
      </div>
    </>
  );
}

function DependencyArrows({
  tasks,
  timeline,
  rowIndex,
}: {
  tasks: ScheduledTask[];
  timeline: ReturnType<typeof buildTimeline>;
  rowIndex: Map<string, number>;
}) {
  const paths = useMemo(() => {
    const out: { d: string; critical: boolean }[] = [];
    const byId = new Map(tasks.map((t) => [t.id, t]));
    for (const t of tasks) {
      const toRow = rowIndex.get(t.id);
      if (toRow == null) continue;
      for (const dep of t.dependencies) {
        const from = byId.get(dep.from);
        const fromRow = rowIndex.get(dep.from);
        if (!from || fromRow == null) continue;
        const x1 = timeline.xFor(from.endDate) + timeline.pxPerDay;
        const y1 = fromRow * ROW_HEIGHT + ROW_HEIGHT / 2;
        const x2 = timeline.xFor(t.startDate);
        const y2 = toRow * ROW_HEIGHT + ROW_HEIGHT / 2;
        const midX = Math.max(x1 + 8, x2 - 8);
        out.push({
          d: `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`,
          critical: from.critical && t.critical,
        });
      }
    }
    return out;
  }, [tasks, timeline, rowIndex]);

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[4] overflow-visible"
      width="100%"
      height="100%"
    >
      <defs>
        <marker
          id="gantt-arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-muted-foreground)" />
        </marker>
        <marker
          id="gantt-arrow-crit"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#f43f5e" />
        </marker>
      </defs>
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={p.critical ? "#f43f5e" : "var(--color-muted-foreground)"}
          strokeWidth={p.critical ? 1.6 : 1.2}
          strokeOpacity={0.7}
          markerEnd={`url(#${p.critical ? "gantt-arrow-crit" : "gantt-arrow"})`}
        />
      ))}
    </svg>
  );
}
