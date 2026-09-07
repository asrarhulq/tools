"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { HABITABLE_ZONE_AU } from "../config";
import { auToSceneUnits } from "../lib/scale";
import { useOrrery } from "../state/orrery-context";

/**
 * A translucent flat band between the Sun's conservative habitable-zone
 * bounds (see `config.ts`), in the ecliptic plane. Purely informational —
 * off by default, toggled from the Display panel — answering "why does
 * Earth's orbit sit where it does?" at a glance.
 */
export function HabitableZone() {
  const { scaleMode } = useOrrery();
  const inner = useMemo(
    () => auToSceneUnits(HABITABLE_ZONE_AU.inner, scaleMode),
    [scaleMode],
  );
  const outer = useMemo(
    () => auToSceneUnits(HABITABLE_ZONE_AU.outer, scaleMode),
    [scaleMode],
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[inner, outer, 128]} />
      <meshBasicMaterial
        color="#3ddc84"
        transparent
        opacity={0.1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
