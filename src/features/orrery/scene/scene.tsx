"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { CLOCK_UI_HZ } from "../config";
import { BODY_BY_ID, ORBITING_BODIES } from "../data";
import { currentSpeedDaysPerSecond, useOrrery } from "../state/orrery-context";
import { AsteroidBelt } from "./asteroid-belt";
import { CameraRig } from "./camera-rig";
import { CelestialBody } from "./celestial-body";
import { HabitableZone } from "./habitable-zone";
import { Starfield } from "./starfield";
import { Sun } from "./sun";

/**
 * Owns the simulation clock's per-frame advance (see
 * `state/orrery-context.tsx` for why this is split into a hot ref plus a
 * throttled reactive value) and composes the rest of the scene.
 */
export function OrreryScene() {
  const {
    jdRef,
    playing,
    speedIndex,
    showBelt,
    showMoons,
    showHabitableZone,
    commitDisplayJd,
    screenshotRef,
  } = useOrrery();
  const accum = useRef(0);
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const capture = () => {
      try {
        gl.render(scene, camera);
        return gl.domElement.toDataURL("image/png");
      } catch {
        return null;
      }
    };
    screenshotRef.current = capture;
    return () => {
      screenshotRef.current = null;
    };
  }, [gl, scene, camera, screenshotRef]);

  useFrame((_, delta) => {
    if (playing) {
      const dt = Math.min(delta, 1 / 20); // clamp long frames (tab refocus, GC)
      jdRef.current += dt * currentSpeedDaysPerSecond(speedIndex);
    }
    accum.current += delta;
    if (accum.current >= 1 / CLOCK_UI_HZ) {
      accum.current = 0;
      commitDisplayJd(jdRef.current);
    }
  });

  const bodies = showMoons
    ? ORBITING_BODIES
    : ORBITING_BODIES.filter((b) => b.kind !== "moon");

  return (
    <>
      <Starfield />
      <Sun />
      {showHabitableZone && <HabitableZone />}
      {bodies.map((body) => (
        <CelestialBody key={body.id} body={body} bodyById={BODY_BY_ID} />
      ))}
      {showBelt && <AsteroidBelt />}
      <CameraRig bodyById={BODY_BY_ID} />
    </>
  );
}
