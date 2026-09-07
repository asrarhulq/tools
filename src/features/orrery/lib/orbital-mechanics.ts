import type { CelestialBody, ScaleMode, ScenePosition } from "../types";
import { heliocentricPosition } from "./kepler";
import { auToSceneUnits, moonDistanceToSceneUnits } from "./scale";

export type { ScenePosition };

/**
 * A body's position in scene units at Julian Date `jd`, already run through
 * the nonlinear distance scale (see `lib/scale.ts`) and, for a moon, added
 * to its parent's own scene position so it orbits the parent's rendered
 * location rather than the origin.
 *
 * The nonlinear scale is applied radially — computed on the true AU
 * distance from the focus, then used to rescale the (x, y, z) vector — so a
 * body's orbital-plane angle is preserved exactly; only its distance from
 * the focus is compressed or stretched.
 */
export function computeScenePosition(
  body: CelestialBody,
  jd: number,
  scaleMode: ScaleMode,
  bodyById: ReadonlyMap<string, CelestialBody>,
): ScenePosition {
  const raw = heliocentricPosition(body.elements, jd);
  const isMoon = body.kind === "moon" && !!body.parentId;

  const sceneRadius = isMoon
    ? moonDistanceToSceneUnits(raw.radiusAu)
    : auToSceneUnits(raw.radiusAu, scaleMode);
  const factor = raw.radiusAu > 0 ? sceneRadius / raw.radiusAu : 0;
  const local: ScenePosition = {
    x: raw.x * factor,
    y: raw.y * factor,
    z: raw.z * factor,
    radiusAu: raw.radiusAu,
  };

  if (!isMoon || !body.parentId) return local;

  const parent = bodyById.get(body.parentId);
  if (!parent) return local;
  const parentPos = computeScenePosition(parent, jd, scaleMode, bodyById);
  return {
    x: local.x + parentPos.x,
    y: local.y + parentPos.y,
    z: local.z + parentPos.z,
    radiusAu: local.radiusAu,
  };
}
