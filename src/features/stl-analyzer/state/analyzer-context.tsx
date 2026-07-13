"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import type {
  Constraint,
  Force,
  GeometryResult,
  LoadedModel,
  Material,
  Orientation,
  PrintSettings,
  RawMesh,
  Support,
  Unit,
  Vec3,
} from "../types";
import { IDENTITY_ORIENTATION } from "../types";
import { parseStl } from "../lib/stl-parser";
import { inferFormat } from "../lib/format";
import { DEFAULT_MATERIAL_ID, getMaterial } from "../lib/materials";
import { DEFAULT_PRINT_SETTINGS } from "../lib/printing";
import { bestFlatOrientation } from "../lib/orientation";
import type { AnalyzeRequest, AnalyzeResponse } from "../lib/worker-protocol";
import { DEFAULT_VIEWER_OPTIONS, type ViewerOptions } from "./viewer-options";

let forceSeq = 0;

interface AnalyzerState {
  model: LoadedModel | null;
  mesh: RawMesh | null;
  geometry: GeometryResult | null;
  analyzing: boolean;
  material: Material;
  unit: Unit;
  orientation: Orientation;
  constraint: Constraint;
  forces: Force[];
  /** Magnitude/direction used when placing a force by clicking the viewport. */
  forceDraft: { magnitude: number; direction: Vec3 };
  supports: Support[];
  print: PrintSettings;
  viewer: ViewerOptions;
}

interface AnalyzerContextValue extends AnalyzerState {
  loadFile: (file: File) => Promise<void>;
  clearModel: () => void;
  setMaterial: (material: Material) => void;
  setUnit: (unit: Unit) => void;
  setOrientation: (patch: Partial<Orientation>) => void;
  rotateBy: (axis: "rx" | "ry" | "rz", deltaDeg: number) => void;
  resetOrientation: () => void;
  layFlat: () => void;
  setConstraint: (constraint: Constraint) => void;
  addForce: (force: Omit<Force, "id" | "name"> & { name?: string }) => void;
  updateForce: (id: string, patch: Partial<Omit<Force, "id">>) => void;
  setForceDraft: (patch: Partial<AnalyzerState["forceDraft"]>) => void;
  removeForce: (id: string) => void;
  clearForces: () => void;
  addSupport: (point: Support["point"]) => void;
  clearSupports: () => void;
  setPrint: (patch: Partial<PrintSettings>) => void;
  setViewer: (patch: Partial<ViewerOptions>) => void;
  screenshotRef: React.RefObject<(() => string | null) | null>;
}

const AnalyzerContext = createContext<AnalyzerContextValue | null>(null);

let requestId = 0;

export function AnalyzerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AnalyzerState>({
    model: null,
    mesh: null,
    geometry: null,
    analyzing: false,
    material: getMaterial(DEFAULT_MATERIAL_ID),
    unit: "mm",
    orientation: IDENTITY_ORIENTATION,
    constraint: { mode: "build-plate" },
    forces: [],
    forceDraft: { magnitude: 50, direction: [0, 0, -1] },
    supports: [],
    print: DEFAULT_PRINT_SETTINGS,
    viewer: DEFAULT_VIEWER_OPTIONS,
  });

  const workerRef = useRef<Worker | null>(null);
  // The 3D canvas registers a screenshot function here.
  const screenshotRef = useRef<(() => string | null) | null>(null);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../lib/analysis.worker.ts", import.meta.url),
        { type: "module" },
      );
    }
    return workerRef.current;
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      const format = inferFormat(file.name);
      if (format !== "stl") {
        toast.error("Unsupported file", {
          description:
            format === null
              ? "Please upload an .stl file."
              : `${format.toUpperCase()} support is coming soon — upload STL for full analysis.`,
        });
        return;
      }

      setState((s) => {
        if (s.model?.url.startsWith("blob:")) URL.revokeObjectURL(s.model.url);
        return { ...s, analyzing: true };
      });

      try {
        const buffer = await file.arrayBuffer();
        const mesh = parseStl(buffer);
        if (mesh.positions.length === 0) {
          throw new Error("No triangles found in file.");
        }
        const url = URL.createObjectURL(file);
        const model: LoadedModel = {
          name: file.name,
          format: "stl",
          url,
          sizeBytes: file.size,
        };

        // Analyze in the worker. Transfer a copy so the main thread keeps its
        // positions for rendering.
        const id = ++requestId;
        const worker = getWorker();
        const positionsCopy = mesh.positions.slice();

        const geometry = await new Promise<GeometryResult>(
          (resolve, reject) => {
            const onMessage = (event: MessageEvent<AnalyzeResponse>) => {
              const data = event.data;
              if (data.id !== id) return;
              worker.removeEventListener("message", onMessage);
              if (data.type === "result") resolve(data.geometry);
              else reject(new Error(data.message));
            };
            worker.addEventListener("message", onMessage);
            const request: AnalyzeRequest = {
              type: "analyze",
              id,
              positions: positionsCopy,
            };
            worker.postMessage(request, [positionsCopy.buffer]);
          },
        );

        setState((s) => ({
          ...s,
          model,
          mesh,
          geometry,
          analyzing: false,
          orientation: IDENTITY_ORIENTATION,
          constraint: { mode: "build-plate" },
          forces: [],
          supports: [],
        }));
        toast.success("Analysis complete", {
          description: `${model.name} · ${geometry.quality.triangleCount.toLocaleString()} triangles`,
        });
      } catch (error) {
        setState((s) => ({ ...s, analyzing: false }));
        toast.error("Could not analyze file", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [getWorker],
  );

  const clearModel = useCallback(() => {
    setState((s) => {
      if (s.model?.url.startsWith("blob:")) URL.revokeObjectURL(s.model.url);
      return {
        ...s,
        model: null,
        mesh: null,
        geometry: null,
        orientation: IDENTITY_ORIENTATION,
        constraint: { mode: "build-plate" },
        forces: [],
        supports: [],
      };
    });
  }, []);

  const setMaterial = useCallback((material: Material) => {
    setState((s) => ({ ...s, material }));
  }, []);

  const setUnit = useCallback((unit: Unit) => {
    setState((s) => ({ ...s, unit }));
  }, []);

  const setOrientation = useCallback((patch: Partial<Orientation>) => {
    setState((s) => ({ ...s, orientation: { ...s.orientation, ...patch } }));
  }, []);

  const rotateBy = useCallback((axis: "rx" | "ry" | "rz", deltaDeg: number) => {
    setState((s) => {
      const next = (((s.orientation[axis] + deltaDeg) % 360) + 360) % 360;
      return { ...s, orientation: { ...s.orientation, [axis]: next } };
    });
  }, []);

  const resetOrientation = useCallback(() => {
    setState((s) => ({ ...s, orientation: IDENTITY_ORIENTATION }));
  }, []);

  const layFlat = useCallback(() => {
    setState((s) => {
      if (!s.mesh) return s;
      return { ...s, orientation: bestFlatOrientation(s.mesh.positions) };
    });
  }, []);

  const setConstraint = useCallback((constraint: Constraint) => {
    setState((s) => ({ ...s, constraint }));
  }, []);

  const addForce = useCallback(
    (force: Omit<Force, "id" | "name"> & { name?: string }) => {
      setState((s) => {
        const id = `f${++forceSeq}`;
        const name =
          force.name ?? `Load ${String.fromCharCode(65 + s.forces.length)}`;
        return {
          ...s,
          forces: [...s.forces, { ...force, id, name }],
        };
      });
    },
    [],
  );

  const updateForce = useCallback(
    (id: string, patch: Partial<Omit<Force, "id">>) => {
      setState((s) => ({
        ...s,
        forces: s.forces.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      }));
    },
    [],
  );

  const setForceDraft = useCallback(
    (patch: Partial<AnalyzerState["forceDraft"]>) => {
      setState((s) => ({ ...s, forceDraft: { ...s.forceDraft, ...patch } }));
    },
    [],
  );

  const removeForce = useCallback((id: string) => {
    setState((s) => ({ ...s, forces: s.forces.filter((f) => f.id !== id) }));
  }, []);

  const clearForces = useCallback(() => {
    setState((s) => ({ ...s, forces: [] }));
  }, []);

  const addSupport = useCallback((point: Support["point"]) => {
    setState((s) => ({
      ...s,
      supports: [
        ...s.supports,
        { id: `s${Date.now()}${s.supports.length}`, point },
      ],
    }));
  }, []);

  const clearSupports = useCallback(() => {
    setState((s) => ({ ...s, supports: [] }));
  }, []);

  const setPrint = useCallback((patch: Partial<PrintSettings>) => {
    setState((s) => ({ ...s, print: { ...s.print, ...patch } }));
  }, []);

  const setViewer = useCallback((patch: Partial<ViewerOptions>) => {
    setState((s) => ({ ...s, viewer: { ...s.viewer, ...patch } }));
  }, []);

  const value = useMemo<AnalyzerContextValue>(
    () => ({
      ...state,
      loadFile,
      clearModel,
      setMaterial,
      setUnit,
      setOrientation,
      rotateBy,
      resetOrientation,
      layFlat,
      setConstraint,
      addForce,
      updateForce,
      setForceDraft,
      removeForce,
      clearForces,
      addSupport,
      clearSupports,
      setPrint,
      setViewer,
      screenshotRef,
    }),
    [
      state,
      loadFile,
      clearModel,
      setMaterial,
      setUnit,
      setOrientation,
      rotateBy,
      resetOrientation,
      layFlat,
      setConstraint,
      addForce,
      updateForce,
      setForceDraft,
      removeForce,
      clearForces,
      addSupport,
      clearSupports,
      setPrint,
      setViewer,
    ],
  );

  return (
    <AnalyzerContext.Provider value={value}>
      {children}
    </AnalyzerContext.Provider>
  );
}

export function useAnalyzer(): AnalyzerContextValue {
  const context = useContext(AnalyzerContext);
  if (!context) {
    throw new Error("useAnalyzer must be used within an AnalyzerProvider");
  }
  return context;
}
