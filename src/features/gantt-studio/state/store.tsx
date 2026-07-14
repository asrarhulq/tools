"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Project, ProjectMeta, Task, ZoomLevel } from "../types";
import { createProject } from "../lib/factory";
import {
  addTask as addTaskFn,
  captureBaseline as captureBaselineFn,
  clearBaseline as clearBaselineFn,
  deleteTasks as deleteTasksFn,
  duplicateTasks as duplicateTasksFn,
  indentTask as indentTaskFn,
  moveTask as moveTaskFn,
  outdentTask as outdentTaskFn,
  updateTask as updateTaskFn,
} from "../lib/mutations";

/**
 * Central project store. Holds the current Project plus an undo/redo history of
 * snapshots and transient UI state (selection, zoom). All structural edits go
 * through `commit`, which pushes onto the undo stack; autosave persists the
 * live project to localStorage (debounced). The store is deliberately UI-free
 * so the scheduling engine and exporters can consume the same Project object.
 */

const STORAGE_KEY = "asrarul-tools:gantt-studio:v1";
const MAX_HISTORY = 100;

interface StoreValue {
  project: Project;
  canUndo: boolean;
  canRedo: boolean;
  zoom: ZoomLevel;
  selectedIds: string[];
  savedAt: number | null;

  setZoom: (z: ZoomLevel) => void;
  select: (ids: string[]) => void;
  toggleSelect: (id: string, additive: boolean) => void;
  clearSelection: () => void;

  // Project-level
  loadProject: (p: Project) => void;
  newProject: () => void;
  updateMeta: (patch: Partial<ProjectMeta>) => void;
  captureBaseline: () => void;
  clearBaseline: () => void;

  // Task-level (all commit to history)
  addTask: (partial?: Partial<Task>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  bulkUpdate: (ids: string[], patch: Partial<Task>) => void;
  deleteTasks: (ids: string[]) => void;
  duplicateTasks: (ids: string[]) => void;
  moveTask: (id: string, newParentId: string | null, index: number) => void;
  indentTask: (id: string) => void;
  outdentTask: (id: string) => void;
  toggleCollapse: (id: string) => void;
  setAllCollapsed: (collapsed: boolean) => void;

  undo: () => void;
  redo: () => void;
  save: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Read a persisted project from localStorage, if any and well-formed. */
function readPersisted(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Project;
      if (parsed?.tasks && parsed?.meta) return parsed;
    }
  } catch {
    // corrupt storage — ignore and start fresh
  }
  return null;
}

export function GanttStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Start from a deterministic fresh project so the FIRST client render matches
  // the server-prerendered HTML (this component is SSR-prerendered via PPR).
  // Persisted state is loaded from localStorage in a post-mount effect below —
  // reading it during render would cause a hydration mismatch.
  const [project, setProject] = useState<Project>(() => createProject());
  const [past, setPast] = useState<Project[]>([]);
  const [future, setFuture] = useState<Project[]>([]);
  const [zoom, setZoom] = useState<ZoomLevel>("week");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const hydrated = useRef(false);

  // Hydrate from localStorage after mount (client only) — never during render.
  // The swap is deferred to a microtask/timeout so it isn't a synchronous
  // setState in the effect body (avoids cascading-render lint + matches the
  // "sync from an external store after paint" pattern). Autosave is enabled
  // only after the swap, so the initial empty project never clobbers a save.
  useEffect(() => {
    const persisted = readPersisted();
    const t = setTimeout(() => {
      if (persisted) setProject(persisted);
      hydrated.current = true;
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Debounced autosave whenever the project changes. Skipped until hydration
  // has run, so we don't clobber a saved project with the initial empty one.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        setSavedAt(Date.now());
      } catch {
        // storage full / unavailable — non-fatal
      }
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [project]);

  /** Push the current project onto the undo stack, then apply `next`. */
  const commit = useCallback((next: Project | ((p: Project) => Project)) => {
    setProject((cur) => {
      const resolved = typeof next === "function" ? next(cur) : next;
      if (resolved === cur) return cur;
      setPast((p) => [...p.slice(-MAX_HISTORY + 1), cur]);
      setFuture([]);
      return resolved;
    });
  }, []);

  const commitTasks = useCallback(
    (fn: (tasks: Task[]) => Task[]) => {
      commit((p) => ({ ...p, tasks: fn(p.tasks) }));
    },
    [commit],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1]!;
      setProject((cur) => {
        setFuture((f) => [cur, ...f]);
        return prev;
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const nextP = f[0]!;
      setProject((cur) => {
        setPast((p) => [...p, cur]);
        return nextP;
      });
      return f.slice(1);
    });
  }, []);

  const save = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setSavedAt(Date.now());
    } catch {
      // ignore
    }
  }, [project]);

  const loadProject = useCallback(
    (p: Project) => {
      commit(() => p);
      setSelectedIds([]);
    },
    [commit],
  );

  const newProject = useCallback(() => {
    commit(() => createProject());
    setSelectedIds([]);
  }, [commit]);

  const value = useMemo<StoreValue>(
    () => ({
      project,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      zoom,
      selectedIds,
      savedAt,
      setZoom,
      select: setSelectedIds,
      toggleSelect: (id, additive) =>
        setSelectedIds((cur) =>
          additive
            ? cur.includes(id)
              ? cur.filter((x) => x !== id)
              : [...cur, id]
            : [id],
        ),
      clearSelection: () => setSelectedIds([]),
      loadProject,
      newProject,
      updateMeta: (patch) =>
        commit((p) => ({ ...p, meta: { ...p.meta, ...patch } })),
      captureBaseline: () => commit((p) => captureBaselineFn(p)),
      clearBaseline: () => commit((p) => clearBaselineFn(p)),
      addTask: (partial) => commitTasks((t) => addTaskFn(t, partial ?? {})),
      updateTask: (id, patch) => commitTasks((t) => updateTaskFn(t, id, patch)),
      bulkUpdate: (ids, patch) =>
        commitTasks((t) =>
          ids.reduce((acc, id) => updateTaskFn(acc, id, patch), t),
        ),
      deleteTasks: (ids) => {
        commitTasks((t) => deleteTasksFn(t, ids));
        setSelectedIds([]);
      },
      duplicateTasks: (ids) => commitTasks((t) => duplicateTasksFn(t, ids)),
      moveTask: (id, newParentId, index) =>
        commitTasks((t) => moveTaskFn(t, id, newParentId, index)),
      indentTask: (id) => commitTasks((t) => indentTaskFn(t, id)),
      outdentTask: (id) => commitTasks((t) => outdentTaskFn(t, id)),
      toggleCollapse: (id) =>
        // Collapse is a view change; still snapshot so undo restores it.
        commitTasks((t) =>
          t.map((x) => (x.id === id ? { ...x, collapsed: !x.collapsed } : x)),
        ),
      setAllCollapsed: (collapsed) =>
        commitTasks((t) => t.map((x) => ({ ...x, collapsed }))),
      undo,
      redo,
      save,
    }),
    [
      project,
      past.length,
      future.length,
      zoom,
      selectedIds,
      savedAt,
      commit,
      commitTasks,
      loadProject,
      newProject,
      undo,
      redo,
      save,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useGantt(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useGantt must be used within GanttStoreProvider");
  return ctx;
}
