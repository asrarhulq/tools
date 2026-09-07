"use client";

import { useMemo } from "react";
import { SUN } from "../data/planets";
import { radiusToSceneUnits } from "../lib/scale";
import { getSunTexture } from "../lib/textures";
import { useOrrery } from "../state/orrery-context";

/**
 * The Sun sits fixed at the scene origin (everything else is heliocentric)
 * and doubles as the scene's only real light source. `decay={0}` is not
 * physically accurate — true inverse-square falloff would leave the outer
 * planets in near-total darkness at these distances — but a stylized,
 * always-legible solar system reads better here than a photometrically
 * correct one nobody can actually see past Mars.
 */
export function Sun() {
  const { scaleMode, selectBody } = useOrrery();
  const radius = useMemo(
    () => radiusToSceneUnits(SUN.physical.radiusKm, scaleMode),
    [scaleMode],
  );
  const texture = useMemo(() => getSunTexture(), []);

  return (
    <group>
      <pointLight color="#fff6e0" intensity={3.5} decay={0} />
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          selectBody("sun");
        }}
      >
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial
          map={texture}
          emissive="#ffb347"
          emissiveMap={texture}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
