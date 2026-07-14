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
import type {
  Load,
  Member,
  Node,
  SupportType,
  Truss,
  UnitSystem,
} from "../types";
import { DEFAULT_AREA, DEFAULT_MATERIAL_ID } from "../lib/materials";
import { warren } from "../lib/presets";

/**
 * Central store for the Truss Analyzer: the truss model (nodes/members/loads),
 * editing tool mode, selection, unit system, learning-mode + view toggles, an
 * undo/redo history of model snapshots, and localStorage save/load. Kept UI-free
 * so the solver, canvas, and report all read one source of truth.
 */

const STORAGE_KEY = "asrarul-tools:truss:v1";
const MAX_HISTORY = 60;

export type ToolMode =
  "select" | "add-node" | "add-member" | "add-support" | "add-load";

export interface ViewOptions {
  showOriginal: boolean;
  showDeformed: boolean;
  showForces: boolean; // force magnitude labels
  showStress: boolean; // color by stress vs. by T/C
  animate: boolean;
  deformScale: number; // visual exaggeration of displacements
}

let seq = 0;
function nid(prefix: string): string {
  seq += 1;
  return `${prefix}${seq}_${(performance.now() | 0).toString(36)}`;
}

interface StoreValue {
  truss: Truss;
  tool: ToolMode;
  units: UnitSystem;
  selectedNode: string | null;
  selectedMember: string | null;
  view: ViewOptions;
  learning: boolean;
  canUndo: boolean;
  canRedo: boolean;
  /** Snapshot of a design captured for A/B comparison (null = none). */
  compareSnapshot: Truss | null;
  captureCompare: () => void;
  clearCompare: () => void;

  setTool: (t: ToolMode) => void;
  setUnits: (u: UnitSystem) => void;
  selectNode: (id: string | null) => void;
  selectMember: (id: string | null) => void;
  setView: (patch: Partial<ViewOptions>) => void;
  setLearning: (v: boolean) => void;

  loadTruss: (t: Truss) => void;
  setName: (name: string) => void;
  addNode: (x: number, y: number) => string;
  moveNode: (id: string, x: number, y: number) => void;
  updateNode: (id: string, patch: Partial<Node>) => void;
  setSupport: (id: string, support: SupportType) => void;
  deleteNode: (id: string) => void;
  addMember: (from: string, to: string) => void;
  updateMember: (id: string, patch: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addLoad: (nodeId: string, fx: number, fy: number) => void;
  updateLoad: (id: string, patch: Partial<Load>) => void;
  deleteLoad: (id: string) => void;
  setDefaults: (patch: { materialId?: string; area?: number }) => void;

  undo: () => void;
  redo: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

/**
 * A deterministic empty truss for the first render. It carries no generated IDs,
 * so the server-prerendered HTML and the first client render match exactly (the
 * preset generators use a module counter that isn't guaranteed identical across
 * the server/client boundary, which would otherwise cause a hydration mismatch).
 * The real starter model / persisted project is loaded in a post-mount effect.
 */
function emptyTruss(): Truss {
  return {
    schemaVersion: 1,
    name: "New Truss",
    nodes: [],
    members: [],
    loads: [],
    defaultMaterialId: DEFAULT_MATERIAL_ID,
    defaultArea: DEFAULT_AREA,
  };
}

export function TrussStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [truss, setTruss] = useState<Truss>(emptyTruss);
  const [past, setPast] = useState<Truss[]>([]);
  const [future, setFuture] = useState<Truss[]>([]);
  const [tool, setTool] = useState<ToolMode>("select");
  const [units, setUnits] = useState<UnitSystem>("si");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [learning, setLearning] = useState(false);
  const [compareSnapshot, setCompareSnapshot] = useState<Truss | null>(null);
  const [view, setViewState] = useState<ViewOptions>({
    showOriginal: true,
    showDeformed: false,
    showForces: true,
    showStress: false,
    animate: false,
    deformScale: 1,
  });
  const hydrated = useRef(false);

  // After mount (client only, never during render): load the persisted model,
  // or seed a small starter Warren truss so the canvas isn't empty.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Truss;
          if (parsed?.nodes && parsed?.members) {
            setTruss(parsed);
            hydrated.current = true;
            return;
          }
        }
      } catch {
        /* ignore corrupt storage */
      }
      setTruss(warren({ span: 8, height: 2, panels: 2, load: 10000 }));
      hydrated.current = true;
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Debounced autosave.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(truss));
      } catch {
        /* non-fatal */
      }
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [truss]);

  const commit = useCallback((next: Truss | ((t: Truss) => Truss)) => {
    setTruss((cur) => {
      const resolved = typeof next === "function" ? next(cur) : next;
      if (resolved === cur) return cur;
      setPast((p) => [...p.slice(-MAX_HISTORY + 1), cur]);
      setFuture([]);
      return resolved;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1]!;
      setTruss((cur) => {
        setFuture((f) => [cur, ...f]);
        return prev;
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0]!;
      setTruss((cur) => {
        setPast((p) => [...p, cur]);
        return next;
      });
      return f.slice(1);
    });
  }, []);

  const value = useMemo<StoreValue>(() => {
    return {
      truss,
      tool,
      units,
      selectedNode,
      selectedMember,
      view,
      learning,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      compareSnapshot,
      captureCompare: () => setCompareSnapshot(structuredClone(truss)),
      clearCompare: () => setCompareSnapshot(null),
      setTool,
      setUnits,
      selectNode: (id) => {
        setSelectedNode(id);
        setSelectedMember(null);
      },
      selectMember: (id) => {
        setSelectedMember(id);
        setSelectedNode(null);
      },
      setView: (patch) => setViewState((v) => ({ ...v, ...patch })),
      setLearning,
      loadTruss: (t) => {
        commit(() => t);
        setSelectedNode(null);
        setSelectedMember(null);
      },
      setName: (name) => commit((t) => ({ ...t, name })),
      addNode: (x, y) => {
        const id = nid("N");
        commit((t) => ({
          ...t,
          nodes: [...t.nodes, { id, x, y, support: "none" }],
        }));
        return id;
      },
      moveNode: (id, x, y) =>
        // Position drags update in place without spamming history (one entry
        // per drag is added by the caller committing on pointer-up).
        setTruss((t) => ({
          ...t,
          nodes: t.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
        })),
      updateNode: (id, patch) =>
        commit((t) => ({
          ...t,
          nodes: t.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      setSupport: (id, support) =>
        commit((t) => ({
          ...t,
          nodes: t.nodes.map((n) => (n.id === id ? { ...n, support } : n)),
        })),
      deleteNode: (id) =>
        commit((t) => ({
          ...t,
          nodes: t.nodes.filter((n) => n.id !== id),
          members: t.members.filter((m) => m.from !== id && m.to !== id),
          loads: t.loads.filter((l) => l.nodeId !== id),
        })),
      addMember: (from, to) => {
        if (from === to) return;
        commit((t) => {
          if (
            t.members.some(
              (m) =>
                (m.from === from && m.to === to) ||
                (m.from === to && m.to === from),
            )
          ) {
            return t;
          }
          return {
            ...t,
            members: [
              ...t.members,
              {
                id: nid("M"),
                from,
                to,
                area: t.defaultArea,
                materialId: t.defaultMaterialId,
              },
            ],
          };
        });
      },
      updateMember: (id, patch) =>
        commit((t) => ({
          ...t,
          members: t.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      deleteMember: (id) =>
        commit((t) => ({
          ...t,
          members: t.members.filter((m) => m.id !== id),
        })),
      addLoad: (nodeId, fx, fy) =>
        commit((t) => ({
          ...t,
          loads: [...t.loads, { id: nid("L"), nodeId, fx, fy }],
        })),
      updateLoad: (id, patch) =>
        commit((t) => ({
          ...t,
          loads: t.loads.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),
      deleteLoad: (id) =>
        commit((t) => ({ ...t, loads: t.loads.filter((l) => l.id !== id) })),
      setDefaults: (patch) =>
        commit((t) => ({
          ...t,
          defaultMaterialId: patch.materialId ?? t.defaultMaterialId,
          defaultArea: patch.area ?? t.defaultArea,
        })),
      undo,
      redo,
    };
  }, [
    truss,
    tool,
    units,
    selectedNode,
    selectedMember,
    view,
    learning,
    compareSnapshot,
    past.length,
    future.length,
    commit,
    undo,
    redo,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTruss(): StoreValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTruss must be used within TrussStoreProvider");
  return ctx;
}

export { DEFAULT_AREA, DEFAULT_MATERIAL_ID };
