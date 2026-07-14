/**
 * Shared stress/activation color ramp: green (low) → yellow (moderate) → red
 * (high). Used by the 3D model coloring, the on-screen legends, and the report,
 * so a color always means the same load/activation level everywhere.
 */

export function rampColor(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t));
  const stops: Array<[number, [number, number, number]]> = [
    [0.0, [0.13, 0.7, 0.4]], // green
    [0.5, [0.95, 0.77, 0.15]], // amber
    [1.0, [0.9, 0.18, 0.2]], // red
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

export function rampCss(t: number): string {
  const [r, g, b] = rampColor(t);
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}
