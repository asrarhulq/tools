/**
 * Map geometry for the 2.5° grid view. A plain equirectangular projection with
 * longitudes scaled by cos(40°) — at 30–50°N this keeps shapes honest without
 * pulling in a projection library, and the same function drives both the SVG
 * map and the vector map in the PDF report.
 */

export const FRAME = { w: -106, e: -79, s: 29, n: 51 } as const;
const KX = Math.cos((40 * Math.PI) / 180);

export const MAP_W = 1000;
export const MAP_H = Math.round(
  (MAP_W * (FRAME.n - FRAME.s)) / ((FRAME.e - FRAME.w) * KX),
);

export function project(lon: number, lat: number): [number, number] {
  return [
    ((lon - FRAME.w) / (FRAME.e - FRAME.w)) * MAP_W,
    ((FRAME.n - lat) / (FRAME.n - FRAME.s)) * MAP_H,
  ];
}

/** Geodesic circle (great-circle destination points) as projected [x, y] pairs. */
export function ringPolygon(
  lat: number,
  lon: number,
  radiusKm: number,
  steps = 144,
): [number, number][] {
  const R = 6371;
  const d = radiusKm / R;
  const p1 = (lat * Math.PI) / 180,
    l1 = (lon * Math.PI) / 180;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const th = (2 * Math.PI * i) / steps;
    const p2 = Math.asin(
      Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(th),
    );
    const l2 =
      l1 +
      Math.atan2(
        Math.sin(th) * Math.sin(d) * Math.cos(p1),
        Math.cos(d) - Math.sin(p1) * Math.sin(p2),
      );
    pts.push(project((l2 * 180) / Math.PI, (p2 * 180) / Math.PI));
  }
  return pts;
}

export function outlinePath(lines: number[][]): string {
  let s = "";
  for (const l of lines) {
    for (let i = 0; i < l.length; i += 2) {
      const [x, y] = project(l[i]!, l[i + 1]!);
      s += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  return s;
}
