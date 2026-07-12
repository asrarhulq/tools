"use client";

import { useMemo } from "react";
import { analyzeStability } from "../lib/stability";
import { analyzeFea } from "../lib/fea";
import { estimatePrint, recommendPrint } from "../lib/printing";
import { useAnalyzer } from "./analyzer-context";
import type {
  FeaResult,
  PrintEstimate,
  PrintRecommendation,
  StabilityResult,
} from "../types";

/**
 * Derives stability, FEA, and print estimates from the current model + inputs.
 * Each is memoized on its real dependencies so editing (say) print settings
 * doesn't recompute the FEA field, and vice-versa. Returns null until a model
 * is analyzed.
 */
export function useDerivedAnalysis(): {
  stability: StabilityResult | null;
  fea: FeaResult | null;
  print: PrintEstimate | null;
  recommendation: PrintRecommendation | null;
} {
  const { geometry, mesh, material, forces, supports, print } = useAnalyzer();

  const stability = useMemo(
    () =>
      geometry ? analyzeStability(geometry, material, forces) : null,
    [geometry, material, forces],
  );

  const fea = useMemo(
    () =>
      geometry && mesh && (forces.length > 0 || supports.length > 0)
        ? analyzeFea(mesh, geometry, material, forces, supports)
        : null,
    [geometry, mesh, material, forces, supports],
  );

  const printEstimate = useMemo(
    () => (geometry ? estimatePrint(geometry, material, print) : null),
    [geometry, material, print],
  );

  const recommendation = useMemo(
    () => (geometry ? recommendPrint(geometry) : null),
    [geometry],
  );

  return { stability, fea, print: printEstimate, recommendation };
}
