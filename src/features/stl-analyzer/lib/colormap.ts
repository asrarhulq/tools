/**
 * Shared scientific color map for FEA fields. A perceptual blue → cyan → green
 * → yellow → red ramp (the "jet"-like scale engineers expect on stress plots),
 * used identically by the 3D heat map, the on-canvas legend, and the PDF report
 * so a color always means the same value everywhere.
 */

/** Map a normalized value t∈[0,1] to an RGB triple in [0,1]. */
export function rampColor(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t));
  // Five-stop ramp.
  const stops: Array<[number, [number, number, number]]> = [
    [0.0, [0.0, 0.1, 0.55]], // deep blue
    [0.25, [0.0, 0.55, 0.9]], // cyan-blue
    [0.5, [0.1, 0.75, 0.35]], // green
    [0.75, [0.95, 0.8, 0.1]], // yellow
    [1.0, [0.85, 0.12, 0.12]], // red
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i]!;
    const [t1, c1] = stops[i + 1]!;
    if (x <= t1) {
      const f = t1 > t0 ? (x - t0) / (t1 - t0) : 0;
      return [
        c0[0] + (c1[0] - c0[0]) * f,
        c0[1] + (c1[1] - c0[1]) * f,
        c0[2] + (c1[2] - c0[2]) * f,
      ];
    }
  }
  return stops[stops.length - 1]![1];
}

/**
 * Map a value against a maximum to an RGB triple in [0,1]. A mild gamma (< 1)
 * lifts low/mid values so the field reads across more of the part rather than
 * collapsing everything but the peak into blue.
 */
export function stressToColor(
  value: number,
  max: number,
): [number, number, number] {
  const t = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return rampColor(Math.pow(t, 0.7));
}

/** CSS `rgb(...)` string for a normalized value (for HTML legends). */
export function rampCss(t: number): string {
  const [r, g, b] = rampColor(t);
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}
