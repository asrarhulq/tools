import type {
  ISODate,
  Project,
  ScheduleConflict,
  ScheduleResult,
  ScheduledTask,
  Task,
} from "../types";
import { addDaysISO, daysBetween, inclusiveDuration, todayISO } from "./dates";

/**
 * ── Scheduling / CPM engine ─────────────────────────────────────────────────
 *
 * Pure analysis over a project's tasks. Produces the flattened, ordered task
 * list the UI renders (respecting the tree + collapse state), plus a full
 * Critical Path Method pass: forward pass for early start/finish, backward pass
 * for late start/finish, total float (slack), and the critical path (zero
 * float). Also rolls up parent progress/dates from children, detects scheduling
 * conflicts and dependency-graph cycles, computes project stats, and emits
 * human-readable scheduling suggestions.
 *
 * All of this runs synchronously on every edit; it is O(tasks + dependencies)
 * with a topological ordering, comfortably fast for thousands of tasks.
 * ────────────────────────────────────────────────────────────────────────────
 */

export function computeSchedule(project: Project): ScheduleResult {
  const tasks = project.tasks;
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const conflicts: ScheduleConflict[] = [];

  // Children index for tree ops + parent roll-up.
  const childrenOf = new Map<string | null, Task[]>();
  for (const t of tasks) {
    const list = childrenOf.get(t.parentId) ?? [];
    list.push(t);
    childrenOf.set(t.parentId, list);
  }
  for (const list of childrenOf.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  const projectStart = project.meta.startDate;

  // ── Topological order over the dependency graph (Kahn's algorithm) ─────────
  const indegree = new Map<string, number>();
  const successors = new Map<string, string[]>();
  for (const t of tasks) indegree.set(t.id, 0);
  for (const t of tasks) {
    for (const dep of t.dependencies) {
      if (!byId.has(dep.from)) continue; // dangling predecessor — ignore
      indegree.set(t.id, (indegree.get(t.id) ?? 0) + 1);
      const succ = successors.get(dep.from) ?? [];
      succ.push(t.id);
      successors.set(dep.from, succ);
    }
  }
  const queue: string[] = [];
  for (const [id, deg] of indegree) if (deg === 0) queue.push(id);
  const topo: string[] = [];
  const indegreeWork = new Map(indegree);
  while (queue.length) {
    const id = queue.shift()!;
    topo.push(id);
    for (const s of successors.get(id) ?? []) {
      const d = (indegreeWork.get(s) ?? 0) - 1;
      indegreeWork.set(s, d);
      if (d === 0) queue.push(s);
    }
  }
  const hasCycle = topo.length !== tasks.length;
  if (hasCycle) {
    // Fall back to input order for the remaining (cyclic) tasks.
    for (const t of tasks) if (!topo.includes(t.id)) topo.push(t.id);
    for (const t of tasks) {
      if (t.dependencies.some((d) => inCycle(d.from, t.id, byId))) {
        conflicts.push({
          taskId: t.id,
          severity: "error",
          kind: "impossible-cycle",
          message: `"${t.name}" is part of a circular dependency and cannot be scheduled.`,
        });
      }
    }
  }

  // ── Forward pass: push successors to satisfy dependency constraints ────────
  // Work on mutable copies of start/end so we can auto-shift dependent tasks.
  const start = new Map<string, ISODate>();
  const end = new Map<string, ISODate>();
  for (const t of tasks) {
    start.set(t.id, t.startDate);
    end.set(t.id, t.endDate);
  }

  for (const id of topo) {
    const t = byId.get(id);
    if (!t || t.dependencies.length === 0) continue;
    let earliestStart = start.get(id)!;
    for (const dep of t.dependencies) {
      const pf = end.get(dep.from);
      const ps = start.get(dep.from);
      if (pf == null || ps == null) continue;
      let constraint: ISODate | null = null;
      switch (dep.type) {
        case "FS":
          constraint = addDaysISO(pf, 1 + dep.lag);
          break;
        case "SS":
          constraint = addDaysISO(ps, dep.lag);
          break;
        case "FF":
          constraint = addDaysISO(pf, dep.lag - durationOf(t) + 1);
          break;
        case "SF":
          constraint = addDaysISO(ps, dep.lag - durationOf(t) + 1);
          break;
      }
      if (constraint && daysBetween(earliestStart, constraint) > 0) {
        earliestStart = constraint;
      }
    }
    if (daysBetween(start.get(id)!, earliestStart) !== 0) {
      const dur = durationOf(t);
      start.set(id, earliestStart);
      end.set(id, addDaysISO(earliestStart, dur - 1));
    }
  }

  // ── Roll parent tasks up from their children (dates + progress) ────────────
  const rolledProgress = new Map<string, number>();
  const summaryIds = new Set<string>();
  // Process leaves→roots by depth so parents see final child values.
  const depthOf = computeDepths(tasks, byId);
  const byDepthDesc = [...tasks].sort(
    (a, b) => depthOf.get(b.id)! - depthOf.get(a.id)!,
  );
  for (const t of byDepthDesc) {
    const kids = childrenOf.get(t.id) ?? [];
    if (kids.length === 0) {
      rolledProgress.set(t.id, t.progress);
      continue;
    }
    summaryIds.add(t.id);
    // Parent spans its children.
    let s = start.get(kids[0]!.id)!;
    let e = end.get(kids[0]!.id)!;
    let weighted = 0;
    let totalDur = 0;
    for (const k of kids) {
      const ks = start.get(k.id)!;
      const ke = end.get(k.id)!;
      // s = earliest child start, e = latest child end.
      if (daysBetween(ks, s) > 0) s = ks;
      if (daysBetween(e, ke) > 0) e = ke;
      const kd = inclusiveDuration(ks, ke);
      weighted += (rolledProgress.get(k.id) ?? k.progress) * kd;
      totalDur += kd;
    }
    start.set(t.id, s);
    end.set(t.id, e);
    rolledProgress.set(
      t.id,
      totalDur > 0 ? Math.round(weighted / totalDur) : 0,
    );
  }

  // ── CPM early/late times (in day offsets from project start) ───────────────
  const early = new Map<string, { es: number; ef: number }>();
  for (const id of topo) {
    const t = byId.get(id);
    if (!t) continue;
    const es = Math.max(0, daysBetween(projectStart, start.get(id)!));
    const ef = es + durationOf(t);
    early.set(id, { es, ef });
  }
  const projectFinish = Math.max(1, ...[...early.values()].map((e) => e.ef));

  const late = new Map<string, { ls: number; lf: number }>();
  for (let i = topo.length - 1; i >= 0; i--) {
    const id = topo[i]!;
    const t = byId.get(id);
    if (!t) continue;
    const succ = successors.get(id) ?? [];
    let lf = projectFinish;
    if (succ.length) {
      lf = Math.min(
        ...succ.map((sId) => {
          const sl = late.get(sId);
          return sl ? sl.ls : projectFinish;
        }),
      );
    }
    const ls = lf - durationOf(t);
    late.set(id, { ls, lf });
  }

  // ── Conflict detection ─────────────────────────────────────────────────────
  for (const t of tasks) {
    const s = start.get(t.id)!;
    const e = end.get(t.id)!;
    if (daysBetween(s, e) < 0) {
      conflicts.push({
        taskId: t.id,
        severity: "error",
        kind: "end-before-start",
        message: `"${t.name}" ends before it starts.`,
      });
    }
    if (
      daysBetween(project.meta.startDate, s) < 0 ||
      daysBetween(e, project.meta.endDate) < 0
    ) {
      conflicts.push({
        taskId: t.id,
        severity: "warning",
        kind: "outside-project",
        message: `"${t.name}" falls outside the project window.`,
      });
    }
  }
  // Resource overlap: same assignee, overlapping dates (leaf tasks only).
  detectResourceOverlaps(tasks, start, end, summaryIds, conflicts);

  // ── Build the flattened, ordered, tree-aware scheduled task list ───────────
  const scheduled: ScheduledTask[] = [];
  const visit = (parentId: string | null, depth: number, hidden: boolean) => {
    const kids = childrenOf.get(parentId) ?? [];
    for (const t of kids) {
      const e = early.get(t.id) ?? { es: 0, ef: durationOf(t) };
      const l = late.get(t.id) ?? { ls: 0, lf: durationOf(t) };
      const slack = Math.max(0, l.ls - e.es);
      const hasChildren = (childrenOf.get(t.id) ?? []).length > 0;
      const s = start.get(t.id)!;
      const en = end.get(t.id)!;
      if (!hidden) {
        scheduled.push({
          ...t,
          startDate: s,
          endDate: en,
          duration: inclusiveDuration(s, en),
          depth,
          hasChildren,
          earlyStart: e.es,
          earlyFinish: e.ef,
          lateStart: l.ls,
          lateFinish: l.lf,
          slack,
          critical: !hasChildren && slack <= 0,
          rolledProgress: rolledProgress.get(t.id) ?? t.progress,
        });
      }
      visit(t.id, depth + 1, hidden || t.collapsed);
    }
  };
  visit(null, 0, false);

  const stats = computeStats(scheduled, start, end);
  const suggestions = buildSuggestions(scheduled, conflicts, stats);

  return { tasks: scheduled, conflicts, stats, suggestions, hasCycle };

  function durationOf(t: Task): number {
    if (t.isMilestone) return 1;
    return inclusiveDuration(
      start.get(t.id) ?? t.startDate,
      end.get(t.id) ?? t.endDate,
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeDepths(
  tasks: Task[],
  byId: Map<string, Task>,
): Map<string, number> {
  const depth = new Map<string, number>();
  const get = (id: string): number => {
    if (depth.has(id)) return depth.get(id)!;
    const t = byId.get(id);
    const d = t?.parentId ? get(t.parentId) + 1 : 0;
    depth.set(id, d);
    return d;
  };
  for (const t of tasks) get(t.id);
  return depth;
}

function inCycle(from: string, to: string, byId: Map<string, Task>): boolean {
  // Does `to` reach `from` through dependencies? (a back-edge = cycle)
  const seen = new Set<string>();
  const stack = [to];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === from) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    const t = byId.get(cur);
    if (t) for (const d of t.dependencies) stack.push(d.from);
  }
  return false;
}

function detectResourceOverlaps(
  tasks: Task[],
  start: Map<string, ISODate>,
  end: Map<string, ISODate>,
  summaryIds: Set<string>,
  conflicts: ScheduleConflict[],
) {
  const byAssignee = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.assignee.trim() || summaryIds.has(t.id) || t.isMilestone) continue;
    const list = byAssignee.get(t.assignee) ?? [];
    list.push(t);
    byAssignee.set(t.assignee, list);
  }
  for (const [assignee, list] of byAssignee) {
    const sorted = [...list].sort((a, b) =>
      daysBetween(start.get(b.id)!, start.get(a.id)!),
    );
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const cur = sorted[i]!;
      if (daysBetween(start.get(cur.id)!, end.get(prev.id)!) >= 0) {
        conflicts.push({
          taskId: cur.id,
          severity: "warning",
          kind: "resource-overlap",
          message: `${assignee} is double-booked: "${prev.name}" overlaps "${cur.name}".`,
        });
      }
    }
  }
}

function computeStats(
  scheduled: ScheduledTask[],
  start: Map<string, ISODate>,
  end: Map<string, ISODate>,
) {
  const leaves = scheduled.filter((t) => !t.hasChildren);
  const total = leaves.length;
  const completed = leaves.filter((t) => t.status === "completed").length;
  const overall =
    total > 0
      ? Math.round(leaves.reduce((s, t) => s + t.progress, 0) / total)
      : 0;

  let projectStart: ISODate | null = null;
  let projectEnd: ISODate | null = null;
  for (const id of start.keys()) {
    const s = start.get(id)!;
    const e = end.get(id)!;
    if (!projectStart || daysBetween(s, projectStart) > 0) projectStart = s;
    if (!projectEnd || daysBetween(projectEnd, e) > 0) projectEnd = e;
  }

  const today = todayISO();
  const delayed = leaves.filter(
    (t) =>
      t.status !== "completed" &&
      t.status !== "cancelled" &&
      daysBetween(t.endDate, today) > 0,
  ).length;

  const upcomingMilestones = scheduled
    .filter((t) => t.isMilestone && daysBetween(today, t.startDate) >= 0)
    .sort((a, b) => daysBetween(b.startDate, a.startDate))
    .slice(0, 5);

  const criticalTasks = scheduled.filter((t) => t.critical);

  return {
    totalTasks: total,
    completedTasks: completed,
    remainingTasks: total - completed,
    overallProgress: overall,
    totalDurationDays:
      projectStart && projectEnd
        ? inclusiveDuration(projectStart, projectEnd)
        : 0,
    projectStart,
    projectEnd,
    criticalTaskCount: criticalTasks.length,
    delayedTasks: delayed,
    upcomingMilestones,
    criticalTasks,
  };
}

function buildSuggestions(
  scheduled: ScheduledTask[],
  conflicts: ScheduleConflict[],
  stats: ReturnType<typeof computeStats>,
): string[] {
  const out: string[] = [];
  if (conflicts.some((c) => c.kind === "impossible-cycle")) {
    out.push(
      "Break the circular dependency — a task ultimately depends on itself.",
    );
  }
  if (stats.delayedTasks > 0) {
    out.push(
      `${stats.delayedTasks} task${stats.delayedTasks === 1 ? "" : "s"} are past due — update status or reschedule.`,
    );
  }
  if (conflicts.some((c) => c.kind === "resource-overlap")) {
    out.push(
      "Some team members are double-booked — level resources or stagger tasks.",
    );
  }
  if (stats.criticalTaskCount > 0) {
    out.push(
      `${stats.criticalTaskCount} tasks are on the critical path — any slip here delays the whole project.`,
    );
  }
  const noDeps = scheduled.filter(
    (t) => !t.hasChildren && t.dependencies.length === 0 && !t.isMilestone,
  ).length;
  if (scheduled.length > 4 && noDeps > scheduled.length * 0.7) {
    out.push(
      "Most tasks have no dependencies — add links so the schedule adapts automatically.",
    );
  }
  if (out.length === 0) {
    out.push("Schedule looks healthy — no conflicts detected.");
  }
  return out;
}
