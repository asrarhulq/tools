import type { Project, Task } from "../types";
import { createTask, nextId } from "./factory";
import { inclusiveDuration } from "./dates";

/**
 * Pure task-tree mutations. Each returns a new task array (never mutates input)
 * so the reducer can snapshot for undo/redo. Ordering is maintained per-parent
 * via the `order` field; helpers renormalize orders after structural changes.
 */

export function renormalizeOrders(tasks: Task[]): Task[] {
  const byParent = new Map<string | null, Task[]>();
  for (const t of tasks) {
    const list = byParent.get(t.parentId) ?? [];
    list.push(t);
    byParent.set(t.parentId, list);
  }
  const orderMap = new Map<string, number>();
  for (const list of byParent.values()) {
    list.sort((a, b) => a.order - b.order);
    list.forEach((t, i) => orderMap.set(t.id, i));
  }
  return tasks.map((t) => ({ ...t, order: orderMap.get(t.id) ?? t.order }));
}

export function addTask(tasks: Task[], partial: Partial<Task>): Task[] {
  const siblings = tasks.filter(
    (t) => t.parentId === (partial.parentId ?? null),
  );
  const order = siblings.length;
  return renormalizeOrders([...tasks, createTask({ ...partial, order })]);
}

export function updateTask(
  tasks: Task[],
  id: string,
  patch: Partial<Task>,
): Task[] {
  return tasks.map((t) => {
    if (t.id !== id) return t;
    const next = { ...t, ...patch };
    // Keep duration/endDate coherent when either changes.
    if (patch.startDate || patch.endDate) {
      next.duration = inclusiveDuration(next.startDate, next.endDate);
    }
    if (next.isMilestone) next.endDate = next.startDate;
    return next;
  });
}

/** Collect a task and all its descendants. */
export function descendantIds(tasks: Task[], id: string): Set<string> {
  const out = new Set<string>([id]);
  let added = true;
  while (added) {
    added = false;
    for (const t of tasks) {
      if (t.parentId && out.has(t.parentId) && !out.has(t.id)) {
        out.add(t.id);
        added = true;
      }
    }
  }
  return out;
}

export function deleteTasks(tasks: Task[], ids: string[]): Task[] {
  const toRemove = new Set<string>();
  for (const id of ids)
    for (const d of descendantIds(tasks, id)) toRemove.add(d);
  return renormalizeOrders(
    tasks
      .filter((t) => !toRemove.has(t.id))
      // Drop dependencies that referenced removed tasks.
      .map((t) => ({
        ...t,
        dependencies: t.dependencies.filter((d) => !toRemove.has(d.from)),
      })),
  );
}

export function duplicateTasks(tasks: Task[], ids: string[]): Task[] {
  let result = [...tasks];
  for (const id of ids) {
    const subtree = [...descendantIds(tasks, id)];
    const idMap = new Map<string, string>();
    for (const oldId of subtree) idMap.set(oldId, nextId());
    const clones: Task[] = [];
    for (const oldId of subtree) {
      const src = tasks.find((t) => t.id === oldId)!;
      clones.push({
        ...src,
        id: idMap.get(oldId)!,
        name: oldId === id ? `${src.name} (copy)` : src.name,
        parentId:
          src.parentId && idMap.has(src.parentId)
            ? idMap.get(src.parentId)!
            : src.parentId,
        order: oldId === id ? src.order + 0.5 : src.order,
        dependencies: src.dependencies
          .filter((d) => idMap.has(d.from))
          .map((d) => ({
            ...d,
            from: idMap.get(d.from)!,
            to: idMap.get(d.to)!,
          })),
      });
    }
    result = [...result, ...clones];
  }
  return renormalizeOrders(result);
}

/** Move a task to a new position among a target parent's children. */
export function moveTask(
  tasks: Task[],
  id: string,
  newParentId: string | null,
  targetIndex: number,
): Task[] {
  // Guard against moving a task into its own subtree.
  const subtree = descendantIds(tasks, id);
  if (newParentId && subtree.has(newParentId)) return tasks;

  const moving = tasks.find((t) => t.id === id);
  if (!moving) return tasks;

  const siblings = tasks
    .filter((t) => t.parentId === newParentId && t.id !== id)
    .sort((a, b) => a.order - b.order);

  const reordered = [...siblings];
  const clampedIndex = Math.max(0, Math.min(targetIndex, reordered.length));
  reordered.splice(clampedIndex, 0, { ...moving, parentId: newParentId });

  const orderMap = new Map<string, number>();
  reordered.forEach((t, i) => orderMap.set(t.id, i));

  return renormalizeOrders(
    tasks.map((t) => {
      if (t.id === id)
        return { ...t, parentId: newParentId, order: orderMap.get(id) ?? 0 };
      if (orderMap.has(t.id)) return { ...t, order: orderMap.get(t.id)! };
      return t;
    }),
  );
}

/** Indent a task under its previous sibling. */
export function indentTask(tasks: Task[], id: string): Task[] {
  const t = tasks.find((x) => x.id === id);
  if (!t) return tasks;
  const siblings = tasks
    .filter((x) => x.parentId === t.parentId)
    .sort((a, b) => a.order - b.order);
  const idx = siblings.findIndex((x) => x.id === id);
  if (idx <= 0) return tasks; // nothing to indent under
  const newParent = siblings[idx - 1]!;
  const newParentChildren = tasks.filter((x) => x.parentId === newParent.id);
  return moveTask(tasks, id, newParent.id, newParentChildren.length);
}

/** Outdent a task to its grandparent level. */
export function outdentTask(tasks: Task[], id: string): Task[] {
  const t = tasks.find((x) => x.id === id);
  if (!t || t.parentId == null) return tasks;
  const parent = tasks.find((x) => x.id === t.parentId);
  if (!parent) return tasks;
  const grandparentId = parent.parentId;
  const gpChildren = tasks
    .filter((x) => x.parentId === grandparentId)
    .sort((a, b) => a.order - b.order);
  const parentIdx = gpChildren.findIndex((x) => x.id === parent.id);
  return moveTask(tasks, id, grandparentId, parentIdx + 1);
}

/** Capture the current dates as the baseline on every task. */
export function captureBaseline(project: Project): Project {
  return {
    ...project,
    hasBaseline: true,
    tasks: project.tasks.map((t) => ({
      ...t,
      baselineStart: t.startDate,
      baselineEnd: t.endDate,
    })),
  };
}

export function clearBaseline(project: Project): Project {
  return {
    ...project,
    hasBaseline: false,
    tasks: project.tasks.map((t) => ({
      ...t,
      baselineStart: undefined,
      baselineEnd: undefined,
    })),
  };
}
