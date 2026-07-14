"use client";

import { useMemo } from "react";
import { solveTruss } from "../lib/solver";
import { validateTruss } from "../lib/diagnostics";
import { useTruss } from "./store";
import type { AnalysisResult, Diagnostic } from "../types";

/** Memoized diagnostics + stiffness solve of the current truss. */
export function useAnalysis(): {
  result: AnalysisResult;
  diagnostics: Diagnostic[];
} {
  const { truss } = useTruss();

  const diagnostics = useMemo(() => validateTruss(truss), [truss]);
  const result = useMemo(() => {
    const r = solveTruss(truss);
    // Merge pre-solve diagnostics with any the solver produced.
    return { ...r, diagnostics: [...diagnostics, ...r.diagnostics] };
  }, [truss, diagnostics]);

  return { result, diagnostics: result.diagnostics };
}
