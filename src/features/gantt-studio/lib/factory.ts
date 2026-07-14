import type {
  ISODate,
  Priority,
  Project,
  ProjectMeta,
  Task,
  TaskStatus,
} from "../types";
import { addDaysISO, endForDuration, todayISO } from "./dates";

/**
 * Factory helpers for creating projects and tasks with sensible defaults.
 * IDs are generated from a module counter (not Date.now/random) so repeated
 * creation is deterministic within a session and never collides.
 */

let seq = 0;
export function nextId(prefix = "t"): string {
  seq += 1;
  return `${prefix}_${seq.toString(36)}_${(performance.now() | 0).toString(36)}`;
}

export function emptyMeta(start?: ISODate): ProjectMeta {
  const s = start ?? todayISO();
  return {
    name: "Untitled Project",
    client: "",
    organization: "",
    projectManager: "",
    team: "",
    description: "",
    version: "1.0",
    revision: "A",
    documentNumber: "",
    startDate: s,
    endDate: addDaysISO(s, 90),
    projectLogo: null,
    organizationLogo: null,
    weekendDays: [0, 6],
    holidays: [],
  };
}

export function createTask(partial: Partial<Task> = {}): Task {
  const start = partial.startDate ?? todayISO();
  const duration = partial.duration ?? 5;
  return {
    id: partial.id ?? nextId(),
    name: partial.name ?? "New task",
    parentId: partial.parentId ?? null,
    order: partial.order ?? 0,
    startDate: start,
    endDate: partial.endDate ?? endForDuration(start, duration),
    duration,
    isMilestone: partial.isMilestone ?? false,
    progress: partial.progress ?? 0,
    status: partial.status ?? "not-started",
    priority: partial.priority ?? "medium",
    dependencies: partial.dependencies ?? [],
    assignee: partial.assignee ?? "",
    department: partial.department ?? "",
    category: partial.category ?? "",
    notes: partial.notes ?? "",
    color: partial.color ?? "",
    collapsed: partial.collapsed ?? false,
    baselineStart: partial.baselineStart,
    baselineEnd: partial.baselineEnd,
  };
}

export function createProject(meta?: Partial<ProjectMeta>): Project {
  return {
    schemaVersion: 1,
    id: nextId("p"),
    meta: { ...emptyMeta(), ...meta },
    tasks: [],
    comments: [],
    history: [],
    hasBaseline: false,
  };
}

/** Status/priority display metadata shared by the UI. */
export const STATUS_META: Record<TaskStatus, { label: string; color: string }> =
  {
    "not-started": { label: "Not started", color: "#94a3b8" },
    "in-progress": { label: "In progress", color: "#3b82f6" },
    "on-hold": { label: "On hold", color: "#f59e0b" },
    completed: { label: "Completed", color: "#22c55e" },
    cancelled: { label: "Cancelled", color: "#ef4444" },
  };

export const PRIORITY_META: Record<Priority, { label: string; color: string }> =
  {
    low: { label: "Low", color: "#64748b" },
    medium: { label: "Medium", color: "#3b82f6" },
    high: { label: "High", color: "#f59e0b" },
    critical: { label: "Critical", color: "#ef4444" },
  };

/** A palette of pleasant bar colors used when a task has no explicit color. */
export const BAR_PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
] as const;

/** Deterministic color for a task from its category (stable hashing). */
export function colorForCategory(category: string): string {
  if (!category) return BAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) | 0;
  }
  return BAR_PALETTE[Math.abs(hash) % BAR_PALETTE.length]!;
}
