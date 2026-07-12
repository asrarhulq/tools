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
  Force,
  GeometryResult,
  LoadedModel,
  Material,
  PrintSettings,
  RawMesh,
  Support,
  Unit,
} from "../types";
import { parseStl } from "../lib/stl-parser";
import { inferFormat } from "../lib/format";
import { DEFAULT_MATERIAL_ID, getMaterial } from "../lib/materials";
import { DEFAULT_PRINT_SETTINGS } from "../lib/printing";
import type { AnalyzeRequest, AnalyzeResponse } from "../lib/worker-protocol";
import {
  DEFAULT_VIEWER_OPTIONS,
  type ViewerOptions,
} from "./viewer-options";

interface AnalyzerState {
  model: LoadedModel | null;
  mesh: RawMesh | null;
  geometry: GeometryResult | null;
  analyzing: boolean;
  material: Material;
  unit: Unit;
  forces: Force[];
  supports: Support[];
  print: PrintSettings;
  viewer: ViewerOptions;
}

interface AnalyzerContextValue extends AnalyzerState {
  loadFile: (file: File) => Promise<void>;
  clearModel: () => void;
  setMaterial: (material: Material) => void;
  setUnit: (unit: Unit) => void;
  addForce: (force: Omit<Force, "id">) => void;
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
    forces: [],
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
          forces: [],
          supports: [],
        }));
        toast.success("Analysis complete", {
          description: `${model.name} · ${geometry.quality.triangleCount.toLocaleString()} triangles`,
        });
      } catch (error) {
        setState((s) => ({ ...s, analyzing: false }));
        toast.error("Could not analyze file", {
          description:
            error instanceof Error ? error.message : "Unknown error",
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

  const addForce = useCallback((force: Omit<Force, "id">) => {
    setState((s) => ({
      ...s,
      forces: [...s.forces, { ...force, id: `f${Date.now()}${s.forces.length}` }],
    }));
  }, []);

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
      addForce,
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
      addForce,
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
