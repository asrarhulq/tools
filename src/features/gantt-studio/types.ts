/**
 * ── Project Timeline & Gantt Studio — domain model ──────────────────────────
 * Framework-free, serializable types. The whole project state is a plain object
 * so it can be persisted to localStorage today and synced to a backend for
 * collaboration later without touching the UI. All dates are ISO date strings
 * (YYYY-MM-DD) at day granularity — the unit project schedules actually use.
 * ────────────────────────────────────────────────────────────────────────────
 */

/** ISO date string, day granularity: "2026-07-13". */
export type ISODate = string;

export type TaskStatus =
  "not-started" | "in-progress" | "on-hold" | "completed" | "cancelled";

export type Priority = "low" | "medium" | "high" | "critical";

/** Finish-to-start is the common default; the others complete the PM set. */
export type DependencyType = "FS" | "SS" | "FF" | "SF";

export interface Dependency {
  /** Predecessor task id. */
  from: string;
  /** Successor task id (this task). */
  to: string;
  type: DependencyType;
  /** Lag in days (may be negative for lead). */
  lag: number;
}

export interface Task {
  id: string;
  name: string;
  /** Parent task id for nesting; null at the root. */
  parentId: string | null;
  /** Order among siblings. */
  order: number;
  startDate: ISODate;
  endDate: ISODate;
  /** Duration in working/calendar days (derived, but stored for milestones). */
  duration: number;
  isMilestone: boolean;
  progress: number; // 0–100
  status: TaskStatus;
  priority: Priority;
  /** Dependencies where this task is the successor. */
  dependencies: Dependency[];
  assignee: string;
  department: string;
  category: string;
  notes: string;
  /** Hex color for the bar; empty = derive from category/priority. */
  color: string;
  collapsed: boolean;
  /** Baseline snapshot for variance comparison. */
  baselineStart?: ISODate;
  baselineEnd?: ISODate;
}

export interface ProjectMeta {
  name: string;
  client: string;
  organization: string;
  projectManager: string;
  team: string;
  description: string;
  version: string;
  revision: string;
  documentNumber: string;
  startDate: ISODate;
  endDate: ISODate;
  /** Data URLs for logos (embedded so exports are self-contained). */
  projectLogo: string | null;
  organizationLogo: string | null;
  /** Non-working weekday indices (0 = Sunday … 6 = Saturday). */
  weekendDays: number[];
  /** Holiday ISO dates highlighted on the timeline. */
  holidays: ISODate[];
}

/** A tracked change, for the version-history / audit architecture. */
export interface ChangeRecord {
  id: string;
  timestamp: number;
  /** Short human summary, e.g. "Added task 'Design review'". */
  summary: string;
  /** Author id/name — ready for multi-user attribution. */
  author: string;
}

/** A comment thread anchored to a task, for future collaboration. */
export interface Comment {
  id: string;
  taskId: string;
  author: string;
  timestamp: number;
  body: string;
  /** Resolved threads stay in history but collapse in the UI. */
  resolved: boolean;
}

export interface Project {
  /** Schema version, so persisted projects can be migrated. */
  schemaVersion: number;
  id: string;
  meta: ProjectMeta;
  tasks: Task[];
  /** Collaboration scaffolding (unused by V1 UI, wired for later). */
  comments: Comment[];
  history: ChangeRecord[];
  /** Whether a baseline has been captured. */
  hasBaseline: boolean;
}

export type ZoomLevel = "day" | "week" | "month" | "quarter" | "year";

// ── Derived / computed analysis (never persisted) ────────────────────────────

export interface ScheduledTask extends Task {
  /** Depth in the task tree (0 = root). */
  depth: number;
  /** True if this task has children. */
  hasChildren: boolean;
  /** Earliest/latest start & finish (CPM), day offsets from project start. */
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  /** Total float / slack in days. */
  slack: number;
  /** On the critical path (zero slack). */
  critical: boolean;
  /** Rolled-up progress for summary (parent) tasks. */
  rolledProgress: number;
}

export interface ScheduleConflict {
  taskId: string;
  severity: "warning" | "error";
  kind:
    | "end-before-start"
    | "dependency-violation"
    | "outside-project"
    | "resource-overlap"
    | "impossible-cycle";
  message: string;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  overallProgress: number;
  totalDurationDays: number;
  projectStart: ISODate | null;
  projectEnd: ISODate | null;
  criticalTaskCount: number;
  delayedTasks: number;
  upcomingMilestones: ScheduledTask[];
  criticalTasks: ScheduledTask[];
}

export interface ScheduleResult {
  tasks: ScheduledTask[];
  conflicts: ScheduleConflict[];
  stats: ProjectStats;
  suggestions: string[];
  /** Whether the dependency graph has a cycle (schedule is then best-effort). */
  hasCycle: boolean;
}
