import type { Truss } from "../types";
import { solveTruss } from "./solver";
import { getMaterial } from "./materials";

/**
 * Auto member sizing. For a target factor of safety, pick the smallest
 * cross-sectional area for each member that keeps it below yield AND (for
 * compression members) below Euler buckling. Because member forces barely
 * change when only areas change in a statically determinate truss — and change
 * only mildly in indeterminate ones — we iterate the solve→resize loop a few
 * times to converge on a consistent set of areas.
 */
export function autoSize(truss: Truss, targetFoS: number): Truss {
  let current = truss;
  for (let iter = 0; iter < 4; iter++) {
    const result = solveTruss(current);
    const nextMembers = current.members.map((m) => {
      const mr = result.members.find((r) => r.memberId === m.id);
      if (!mr || mr.state === "zero") {
        return { ...m, area: minArea() };
      }
      const mat = getMaterial(m.materialId);
      // Yield requirement: A ≥ |N|·FoS / yield.
      const areaYield = (Math.abs(mr.axialForce) * targetFoS) / mat.yield;
      let area = areaYield;
      // Buckling requirement for compression: Pcr = π²E·A·r²/L² ≥ |N|·FoS.
      // With r ≈ 0.35·√A, r² ≈ 0.1225·A, so Pcr ≈ π²E·0.1225·A²/L².
      // Solve for A: A ≥ sqrt(|N|·FoS·L² / (π²E·0.1225)).
      if (mr.state === "compression") {
        const L = mr.length;
        const areaBuckle = Math.sqrt(
          (Math.abs(mr.axialForce) * targetFoS * L * L) /
            (Math.PI ** 2 * mat.E * 0.1225),
        );
        area = Math.max(area, areaBuckle);
      }
      return { ...m, area: Math.max(minArea(), roundArea(area)) };
    });
    current = { ...current, members: nextMembers };
  }
  return current;
}

/** Minimum practical area (1 mm²) so unloaded members aren't zeroed out. */
function minArea(): number {
  return 1e-6;
}

/** Round area up to a tidy value (nearest 5 mm²) for realistic sections. */
function roundArea(area: number): number {
  const mm2 = area * 1e6;
  return (Math.ceil(mm2 / 5) * 5) / 1e6;
}
