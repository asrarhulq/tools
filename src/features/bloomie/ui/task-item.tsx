"use client";

import { motion } from "framer-motion";
import { GripVertical, Star, X } from "lucide-react";
import { PRIORITY_LABELS } from "../config";
import type { Task } from "../types";

interface TaskItemProps {
  task: Task;
  onToggleDone: () => void;
  onToggleEssential: () => void;
  onRemove: () => void;
  draggable?: boolean;
}

const PRIORITY_COLOR: Record<Task["priority"], string> = {
  high: "var(--bloomie-danger)",
  medium: "var(--bloomie-gold)",
  low: "var(--bloomie-muted)",
};

export function TaskItem({
  task,
  onToggleDone,
  onToggleEssential,
  onRemove,
  draggable = false,
}: TaskItemProps) {
  return (
    <motion.div
      layout
      className="flex items-center gap-2 rounded-xl border px-2.5 py-2"
      style={{
        borderColor: "var(--bloomie-border)",
        backgroundColor: task.done
          ? "var(--bloomie-panel-alt)"
          : "var(--bloomie-panel)",
        opacity: task.done ? 0.65 : 1,
      }}
    >
      {draggable && (
        <GripVertical
          className="size-3.5 shrink-0 cursor-grab opacity-40"
          style={{ color: "var(--bloomie-muted)" }}
        />
      )}
      <button
        type="button"
        onClick={onToggleDone}
        aria-label={task.done ? "Mark as not done" : "Mark as done"}
        className="flex size-5 shrink-0 items-center justify-center rounded-full border-2"
        style={{
          borderColor: "var(--bloomie-accent)",
          backgroundColor: task.done ? "var(--bloomie-accent)" : "transparent",
        }}
      >
        {task.done && <span className="text-[10px] text-white">✓</span>}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm"
          style={{
            color: "var(--bloomie-text)",
            textDecoration: task.done ? "line-through" : undefined,
          }}
        >
          {task.title}
        </p>
        <p
          className="flex items-center gap-1.5 text-[11px]"
          style={{ color: "var(--bloomie-muted)" }}
        >
          {task.subject && <span>{task.subject}</span>}
          <span style={{ color: PRIORITY_COLOR[task.priority] }}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.estimatedMinutes ? <span>{task.estimatedMinutes}m</span> : null}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggleEssential}
        aria-label={
          task.essential ? "Unmark as essential" : "Mark as essential"
        }
        className="shrink-0"
      >
        <Star
          className="size-4"
          style={{ color: "var(--bloomie-gold)" }}
          fill={task.essential ? "var(--bloomie-gold)" : "none"}
        />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove task"
        className="shrink-0 opacity-50 hover:opacity-100"
      >
        <X className="size-3.5" style={{ color: "var(--bloomie-muted)" }} />
      </button>
    </motion.div>
  );
}
