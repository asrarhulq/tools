"use client";

import { Stars } from "@react-three/drei";

/** Procedural background stars — drei's built-in, no texture assets needed. */
export function Starfield() {
  return (
    <Stars
      radius={300}
      depth={80}
      count={6000}
      factor={3}
      saturation={0}
      fade
      speed={0.4}
    />
  );
}
