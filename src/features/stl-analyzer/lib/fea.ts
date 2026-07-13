import type { Constraint, EffectiveMaterial, FeaResult, Force } from "../types";
import { solveFea } from "./fea-solver";

/**
 * Adapter over the voxel-hex FEM kernel (`fea-solver.ts`). Keeps the call site
 * in `use-derived` stable and maps the app's effective (as-printed) material and
 * load case onto the solver's inputs. The solver does the real work: voxelize
 * the oriented mesh, assemble a linear-elastic stiffness matrix, apply the
 * constraint + forces, and solve K·u = f with conjugate gradient.
 */
export function analyzeFea(
  orientedPositions: Float32Array,
  eff: EffectiveMaterial,
  forces: readonly Force[],
  constraint: Constraint,
  maxResolution = 20,
): FeaResult {
  // Use the in-plane strength as the yield reference for the safety factor,
  // knocked down toward the interlayer value when the dominant load is vertical
  // (loads that pull across layers see the weaker Z strength). A simple, honest
  // heuristic: weight by how axial-vertical the resultant force is.
  const yieldRef = effectiveYield(eff, forces);
  return solveFea(orientedPositions, eff, yieldRef, forces, constraint, {
    maxResolution,
  });
}

/** Blend XY/Z strength by how vertical the net load is (interlayer weakness). */
function effectiveYield(
  eff: EffectiveMaterial,
  forces: readonly Force[],
): number {
  if (forces.length === 0) return eff.strengthXY;
  let fx = 0,
    fy = 0,
    fz = 0;
  for (const f of forces) {
    const len = Math.hypot(f.direction[0], f.direction[1], f.direction[2]) || 1;
    fx += (f.direction[0] / len) * f.magnitude;
    fy += (f.direction[1] / len) * f.magnitude;
    fz += (f.direction[2] / len) * f.magnitude;
  }
  const mag = Math.hypot(fx, fy, fz) || 1;
  const verticality = Math.abs(fz) / mag; // 0 = in-plane, 1 = along build axis
  return eff.strengthXY * (1 - verticality) + eff.strengthZ * verticality;
}
