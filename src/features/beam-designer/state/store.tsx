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
  Beam,
  Load,
  LoadType,
  Material,
  Section,
  Support,
  SupportType,
  UnitSystem,
} from "../types";
import {
  DEFAULT_MATERIAL_ID,
  getMaterial,
  defaultSection,
} from "../lib/sections";
import { buildPreset } from "../lib/presets";

/**
 * Central store for the Beam Designer: the beam model, editing tool, active
 * load case, unit system, diagram view toggles, undo/redo history, localStorage
 * autosave, and an A/B compare snapshot. UI-free so the solver, canvas, and
 * report share one source of truth.
 */

const STORAGE_KEY = "asrarul-tools:beam:v1";
const MAX_HISTORY = 60;

export type ToolMode = "select" | "add-support" | "add-load" | "add-hinge";

export interface ViewOptions {
  original: boolean;
  deflected: boolean;
  shear: boolean;
  moment: boolean;
  slope: boolean;
  stressMap: boolean;
  reactions: boolean;
  legend: boolean;
  deflScale: number;
}

let seq = 0;
const nid = (p: string) =>
  `${p}${(seq += 1)}_${(performance.now() | 0).toString(36)}`;

interface StoreValue {
  beam: Beam;
  tool: ToolMode;
  units: UnitSystem;
  activeCase: string;
  selectedSupport: string | null;
  selectedLoad: string | null;
  view: ViewOptions;
  learning: boolean;
  canUndo: boolean;
  canRedo: boolean;
  compareSnapshot: Beam | null;
  /** Transient roving point load (influence demo); not part of history. */
  movingLoadX: number | null;
  setMovingLoadX: (x: number | null) => void;

  setTool: (t: ToolMode) => void;
  setUnits: (u: UnitSystem) => void;
  setActiveCase: (id: string) => void;
  selectSupport: (id: string | null) => void;
  selectLoad: (id: string | null) => void;
  setView: (patch: Partial<ViewOptions>) => void;
  setLearning: (v: boolean) => void;

  loadBeam: (b: Beam) => void;
  setName: (name: string) => void;
  setLength: (len: number) => void;
  setMaterial: (m: Material) => void;
  setSection: (s: Section) => void;

  addSupport: (x: number, type?: SupportType) => void;
  updateSupport: (id: string, patch: Partial<Support>) => void;
  deleteSupport: (id: string) => void;
  addHinge: (x: number) => void;
  deleteHinge: (id: string) => void;
  addLoad: (partial: Partial<Load> & { type: LoadType; x: number }) => void;
  updateLoad: (id: string, patch: Partial<Load>) => void;
  deleteLoad: (id: string) => void;
  addLoadCase: () => void;
  deleteLoadCase: (id: string) => void;

  undo: () => void;
  redo: () => void;
  captureCompare: () => void;
  clearCompare: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

function emptyBeam(): Beam {
  // Deterministic (no generated ids) → server/first-client render match.
  return {
    schemaVersion: 1,
    name: "New Beam",
    length: 6,
    supports: [],
    hinges: [],
    loads: [],
    loadCases: [{ id: "case1", name: "Load Case 1" }],
    material: getMaterial(DEFAULT_MATERIAL_ID),
    section: defaultSection(),
  };
}

export function BeamStoreProvider({ children }: { children: React.ReactNode }) {
  const [beam, setBeam] = useState<Beam>(emptyBeam);
  const [past, setPast] = useState<Beam[]>([]);
  const [future, setFuture] = useState<Beam[]>([]);
  const [tool, setTool] = useState<ToolMode>("select");
  const [units, setUnits] = useState<UnitSystem>("si");
  const [activeCase, setActiveCase] = useState("case1");
  const [selectedSupport, setSelectedSupport] = useState<string | null>(null);
  const [selectedLoad, setSelectedLoad] = useState<string | null>(null);
  const [learning, setLearning] = useState(false);
  const [compareSnapshot, setCompareSnapshot] = useState<Beam | null>(null);
  const [movingLoadX, setMovingLoadX] = useState<number | null>(null);
  const [view, setViewState] = useState<ViewOptions>({
    original: true,
    deflected: true,
    shear: true,
    moment: true,
    slope: false,
    stressMap: false,
    reactions: true,
    legend: true,
    deflScale: 1,
  });
  const hydrated = useRef(false);

  // Post-mount hydration (SSR-safe). Load persisted beam or seed a preset.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Beam;
          if (
            parsed?.supports &&
            parsed?.loads &&
            typeof parsed.length === "number"
          ) {
            setBeam(parsed);
            setActiveCase(parsed.loadCases?.[0]?.id ?? "case1");
            hydrated.current = true;
            return;
          }
        }
      } catch {
        /* ignore */
      }
      setBeam(buildPreset("simply-supported"));
      hydrated.current = true;
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(beam));
      } catch {
        /* non-fatal */
      }
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [beam]);

  const commit = useCallback((next: Beam | ((b: Beam) => Beam)) => {
    setBeam((cur) => {
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
      setBeam((cur) => {
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
      setBeam((cur) => {
        setPast((p) => [...p, cur]);
        return next;
      });
      return f.slice(1);
    });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      beam,
      tool,
      units,
      activeCase,
      selectedSupport,
      selectedLoad,
      view,
      learning,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      compareSnapshot,
      movingLoadX,
      setMovingLoadX,
      setTool,
      setUnits,
      setActiveCase,
      selectSupport: (id) => {
        setSelectedSupport(id);
        setSelectedLoad(null);
      },
      selectLoad: (id) => {
        setSelectedLoad(id);
        setSelectedSupport(null);
      },
      setView: (patch) => setViewState((v) => ({ ...v, ...patch })),
      setLearning,
      loadBeam: (b) => {
        commit(() => b);
        setActiveCase(b.loadCases?.[0]?.id ?? "case1");
        setSelectedSupport(null);
        setSelectedLoad(null);
      },
      setName: (name) => commit((b) => ({ ...b, name })),
      setLength: (len) => commit((b) => ({ ...b, length: Math.max(0.1, len) })),
      setMaterial: (m) => commit((b) => ({ ...b, material: m })),
      setSection: (s) => commit((b) => ({ ...b, section: s })),
      addSupport: (x, type = "pin") =>
        commit((b) => ({
          ...b,
          supports: [
            ...b.supports,
            {
              id: nid("S"),
              x: clamp(x, 0, b.length),
              type,
              springK: type === "spring" ? 1e6 : undefined,
            },
          ],
        })),
      updateSupport: (id, patch) =>
        commit((b) => ({
          ...b,
          supports: b.supports.map((s) =>
            s.id === id ? { ...s, ...patch } : s,
          ),
        })),
      deleteSupport: (id) =>
        commit((b) => ({
          ...b,
          supports: b.supports.filter((s) => s.id !== id),
        })),
      addHinge: (x) =>
        commit((b) => ({
          ...b,
          hinges: [...b.hinges, { id: nid("H"), x: clamp(x, 0, b.length) }],
        })),
      deleteHinge: (id) =>
        commit((b) => ({ ...b, hinges: b.hinges.filter((h) => h.id !== id) })),
      addLoad: (partial) =>
        commit((b) => ({
          ...b,
          loads: [
            ...b.loads,
            {
              id: nid("L"),
              type: partial.type,
              x: clamp(partial.x, 0, b.length),
              length:
                partial.length ??
                (partial.type === "point" || partial.type === "moment"
                  ? 0
                  : Math.min(2, b.length)),
              magnitude:
                partial.magnitude ??
                (partial.type === "moment"
                  ? 10000
                  : partial.type === "point"
                    ? -10000
                    : -5000),
              magnitude2: partial.magnitude2,
              caseId: partial.caseId ?? activeCase,
            },
          ],
        })),
      updateLoad: (id, patch) =>
        commit((b) => ({
          ...b,
          loads: b.loads.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),
      deleteLoad: (id) =>
        commit((b) => ({ ...b, loads: b.loads.filter((l) => l.id !== id) })),
      addLoadCase: () =>
        commit((b) => {
          const newId = nid("case");
          return {
            ...b,
            loadCases: [
              ...b.loadCases,
              { id: newId, name: `Load Case ${b.loadCases.length + 1}` },
            ],
          };
        }),
      deleteLoadCase: (id) =>
        commit((b) => {
          if (b.loadCases.length <= 1) return b;
          return {
            ...b,
            loadCases: b.loadCases.filter((c) => c.id !== id),
            loads: b.loads.filter((l) => l.caseId !== id),
          };
        }),
      undo,
      redo,
      captureCompare: () => setCompareSnapshot(structuredClone(beam)),
      clearCompare: () => setCompareSnapshot(null),
    }),
    [
      beam,
      tool,
      units,
      activeCase,
      selectedSupport,
      selectedLoad,
      view,
      learning,
      compareSnapshot,
      movingLoadX,
      past.length,
      future.length,
      commit,
      undo,
      redo,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBeam(): StoreValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBeam must be used within BeamStoreProvider");
  return ctx;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
