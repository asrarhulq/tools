"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Diamond,
  GripVertical,
  Plus,
} from "lucide-react";
import { useGantt } from "../state/store";
import { STATUS_META } from "../lib/factory";
import { colorForCategory } from "../lib/factory";
import type { ScheduledTask } from "../types";
import { cn } from "@/lib/utils";

/**
 * The left-hand task table: the WBS. Renders the flattened, ordered scheduled
 * tasks with indentation, collapse toggles, inline name editing, selection,
 * a critical-path marker, and HTML5 drag-and-drop reordering. Row height is a
 * shared constant so it aligns pixel-perfect with the Gantt rows on the right.
 */

export const ROW_HEIGHT = 40;
export const HEADER_HEIGHT = 56;

export function TaskTree({
  tasks,
  onEditTask,
  onContextMenu,
}: {
  tasks: ScheduledTask[];
  onEditTask: (id: string) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
}) {
  const {
    selectedIds,
    toggleSelect,
    toggleCollapse,
    updateTask,
    moveTask,
    addTask,
  } = useGantt();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  return (
    <div className="select-none">
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-[11px] font-semibold tracking-wide text-[var(--color-muted-foreground)] uppercase"
        style={{ height: HEADER_HEIGHT }}
      >
        <span className="flex-1">Task</span>
        <span className="hidden w-16 text-right sm:block">Days</span>
        <span className="hidden w-20 text-right md:block">Progress</span>
      </div>

      {tasks.length === 0 ? (
        <div className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
          No tasks yet.
          <button
            type="button"
            onClick={() => addTask()}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--color-border)] py-2 text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
          >
            <Plus className="size-4" /> Add first task
          </button>
        </div>
      ) : null}

      {tasks.map((t) => {
        const selected = selectedIds.includes(t.id);
        const color = t.color || colorForCategory(t.category);
        return (
          <div
            key={t.id}
            draggable
            onDragStart={() => setDragId(t.id)}
            onDragEnd={() => {
              setDragId(null);
              setDropTarget(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragId && dragId !== t.id) setDropTarget(t.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId && dragId !== t.id) {
                // Drop as sibling directly before the target.
                moveTask(dragId, t.parentId, t.order);
              }
              setDragId(null);
              setDropTarget(null);
            }}
            onClick={(e) => toggleSelect(t.id, e.metaKey || e.ctrlKey)}
            onDoubleClick={() => onEditTask(t.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              onContextMenu(t.id, e.clientX, e.clientY);
            }}
            className={cn(
              "group flex items-center gap-1.5 border-b border-[var(--color-border)] px-2 transition-colors",
              selected
                ? "bg-[var(--color-primary)]/10"
                : "hover:bg-[var(--color-muted)]/50",
              dropTarget === t.id &&
                "border-t-2 border-t-[var(--color-primary)]",
            )}
            style={{ height: ROW_HEIGHT, paddingLeft: 8 + t.depth * 16 }}
          >
            <GripVertical className="size-3.5 shrink-0 cursor-grab text-[var(--color-muted-foreground)] opacity-0 transition-opacity group-hover:opacity-60" />

            {t.hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(t.id);
                }}
                aria-label={t.collapsed ? "Expand" : "Collapse"}
                className="shrink-0 rounded p-0.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                {t.collapsed ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}

            {t.isMilestone ? (
              <Diamond
                className="size-3 shrink-0 fill-current"
                style={{ color }}
              />
            ) : (
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: color }}
              />
            )}

            {editingId === t.id ? (
              <input
                autoFocus
                defaultValue={t.name}
                onBlur={(e) => {
                  updateTask(t.id, { name: e.target.value.trim() || t.name });
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="min-w-0 flex-1 rounded border border-[var(--color-primary)] bg-[var(--color-surface)] px-1.5 py-0.5 text-sm outline-none"
              />
            ) : (
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  t.hasChildren && "font-medium",
                  t.critical && "text-[var(--color-foreground)]",
                )}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingId(t.id);
                }}
                title={t.name}
              >
                {t.name}
                {t.critical ? (
                  <span
                    className="ml-1.5 align-middle text-[10px] font-semibold text-rose-500"
                    title="On the critical path"
                  >
                    ●
                  </span>
                ) : null}
              </span>
            )}

            <span className="hidden w-16 shrink-0 text-right text-xs text-[var(--color-muted-foreground)] tabular-nums sm:block">
              {t.isMilestone ? "—" : t.duration}
            </span>
            <span className="hidden w-20 shrink-0 items-center justify-end gap-1.5 md:flex">
              <span
                className="h-1.5 w-10 overflow-hidden rounded-full bg-[var(--color-muted)]"
                title={`${t.rolledProgress}%`}
              >
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${t.rolledProgress}%`,
                    backgroundColor: STATUS_META[t.status].color,
                  }}
                />
              </span>
              <span className="w-7 text-right text-[11px] text-[var(--color-muted-foreground)] tabular-nums">
                {t.rolledProgress}%
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
