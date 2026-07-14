"use client";

import { useMemo } from "react";
import { solveBeam, sampleDiagrams } from "../lib/solver";
import { validateBeam } from "../lib/diagnostics";
import { useBeam } from "./store";
import type { BeamResult, Diagnostic, Envelope } from "../types";

/**
 * Memoized analysis. Solves the beam for the active load case (or all combined),
 * merges pre-solve diagnostics, and builds the multi-case envelope (max/min
 * shear & moment across every load case) for the envelope diagram.
 */
export function useBeamAnalysis(): {
  result: BeamResult;
  diagnostics: Diagnostic[];
  envelope: Envelope | null;
} {
  const { beam, activeCase, movingLoadX } = useBeam();

  const preDiag = useMemo(() => validateBeam(beam), [beam]);

  // When a moving load is active, append a transient point load at its position.
  const effectiveBeam = useMemo(() => {
    if (movingLoadX == null) return beam;
    return {
      ...beam,
      loads: [
        ...beam.loads,
        {
          id: "__moving__",
          type: "point" as const,
          x: movingLoadX,
          length: 0,
          magnitude: -10000,
          caseId: activeCase,
        },
      ],
    };
  }, [beam, movingLoadX, activeCase]);

  const result = useMemo(() => {
    const r = solveBeam(effectiveBeam, activeCase);
    return { ...r, diagnostics: [...preDiag, ...r.diagnostics] };
  }, [effectiveBeam, activeCase, preDiag]);

  // Envelope only meaningful with ≥ 2 load cases.
  const envelope = useMemo<Envelope | null>(() => {
    if (beam.loadCases.length < 2) return null;
    const per = beam.loadCases.map((c) => sampleDiagrams(beam, c.id));
    const ref = per[0];
    if (!ref) return null;
    const n = ref.x.length;
    const shearMax = new Array<number>(n).fill(-Infinity);
    const shearMin = new Array<number>(n).fill(Infinity);
    const momentMax = new Array<number>(n).fill(-Infinity);
    const momentMin = new Array<number>(n).fill(Infinity);
    for (const d of per) {
      for (let i = 0; i < n; i++) {
        const s = d.shear[i] ?? 0;
        const m = d.moment[i] ?? 0;
        shearMax[i] = Math.max(shearMax[i]!, s);
        shearMin[i] = Math.min(shearMin[i]!, s);
        momentMax[i] = Math.max(momentMax[i]!, m);
        momentMin[i] = Math.min(momentMin[i]!, m);
      }
    }
    return { x: ref.x, shearMax, shearMin, momentMax, momentMin };
  }, [beam]);

  return { result, diagnostics: result.diagnostics, envelope };
}
