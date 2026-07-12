/**
 * Generates an example binary STL entirely in-memory so the tool is instantly
 * explorable without shipping a model asset. Produces a simple L-bracket — an
 * asymmetric shape that makes the center-of-mass, stability, and overhang
 * analyses visibly meaningful.
 */

type Tri = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

function boxTriangles(
  min: [number, number, number],
  max: [number, number, number],
): Tri[] {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const v = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ] as const;
  const faces: Array<[number, number, number, number]> = [
    [0, 1, 2, 3], // bottom
    [4, 7, 6, 5], // top
    [0, 4, 5, 1], // front
    [1, 5, 6, 2], // right
    [2, 6, 7, 3], // back
    [3, 7, 4, 0], // left
  ];
  const tris: Tri[] = [];
  for (const [a, b, c, d] of faces) {
    tris.push([v[a]!, v[b]!, v[c]!] as Tri);
    tris.push([v[a]!, v[c]!, v[d]!] as Tri);
  }
  return tris;
}

function normalOf(t: Tri): [number, number, number] {
  const [a, b, c] = t;
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

export function makeExampleStl(): File {
  // L-bracket: a vertical arm and a horizontal foot.
  const tris: Tri[] = [
    ...boxTriangles([0, 0, 0], [20, 40, 60]), // vertical arm
    ...boxTriangles([0, 0, 0], [60, 40, 20]), // horizontal foot
  ];

  const buffer = new ArrayBuffer(84 + tris.length * 50);
  const view = new DataView(buffer);
  view.setUint32(80, tris.length, true);

  let offset = 84;
  for (const t of tris) {
    const n = normalOf(t);
    view.setFloat32(offset, n[0], true);
    view.setFloat32(offset + 4, n[1], true);
    view.setFloat32(offset + 8, n[2], true);
    offset += 12;
    for (const vert of t) {
      view.setFloat32(offset, vert[0], true);
      view.setFloat32(offset + 4, vert[1], true);
      view.setFloat32(offset + 8, vert[2], true);
      offset += 12;
    }
    view.setUint16(offset, 0, true);
    offset += 2;
  }

  return new File([buffer], "example-bracket.stl", {
    type: "application/octet-stream",
  });
}
