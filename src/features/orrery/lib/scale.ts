import type { ScaleMode } from "../types";

/**
 * Scene-unit conversions. No single linear scale can show the solar system
 * AND keep every body visible: at the Sun's true size relative to its
 * distance from Earth, Mercury would sit inside the Sun's rendered disc, and
 * at Pluto's true distance relative to Earth's, the inner planets would be
 * indistinguishable from the Sun. Every serious orrery/solar-system app
 * (this one included) decouples three independent scales instead of
 * pretending one number can represent them all:
 *
 *  - orbit distance (`auToSceneUnits`) — sqrt-compressed in "visual" mode so
 *    all nine bodies fit in one comfortable view; true linear AU in
 *    "realistic" mode, which spreads the outer planets enormously far out
 *    on purpose (that IS the lesson — the solar system is mostly empty
 *    space, and "realistic" mode should feel like it).
 *  - body radius (`radiusToSceneUnits`) — sqrt-compressed in both modes,
 *    otherwise Mercury and Pluto round to sub-pixel dots. This keeps "the
 *    Sun dwarfs everything, gas giants dwarf terrestrials" legible without
 *    literally reproducing the ~100:1 true radius ratio from Sun to Pluto.
 *  - moon orbit distance (`moonDistanceToSceneUnits`) — always exaggerated,
 *    independent of `scaleMode`. A moon's true distance from its planet is
 *    thousands of times smaller than the planet's distance from the Sun;
 *    rendered at any planetary distance scale it would sit inside the
 *    planet's own sphere.
 */

const VISUAL_DISTANCE_SCALE = 6.5;
const REALISTIC_DISTANCE_SCALE = 4;
const RADIUS_SCALE = { visual: 0.00627, realistic: 0.0038 } as const;
const MOON_DISTANCE_SCALE = 42;
const MIN_MOON_CLEARANCE = 0.35;

export function auToSceneUnits(au: number, mode: ScaleMode): number {
  const sign = Math.sign(au) || 1;
  const magnitude = Math.abs(au);
  return mode === "realistic"
    ? magnitude * REALISTIC_DISTANCE_SCALE * sign
    : Math.sqrt(magnitude) * VISUAL_DISTANCE_SCALE * sign;
}

export function radiusToSceneUnits(radiusKm: number, mode: ScaleMode): number {
  return Math.sqrt(radiusKm) * RADIUS_SCALE[mode];
}

/** A moon's orbital radius around its (rendered) parent, always visible. */
export function moonDistanceToSceneUnits(auFromParent: number): number {
  return Math.max(
    MIN_MOON_CLEARANCE,
    Math.sqrt(Math.abs(auFromParent)) * MOON_DISTANCE_SCALE,
  );
}
