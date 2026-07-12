import type { RawMesh } from "../types";

/**
 * Framework-free STL parser (binary + ASCII). Returns flat position/normal
 * typed arrays suitable for both Three.js BufferGeometry and the analysis
 * worker. No DOM or Three dependency, so it can move to WASM/backend unchanged.
 */

export function parseStl(buffer: ArrayBuffer): RawMesh {
  return isBinaryStl(buffer) ? parseBinary(buffer) : parseAscii(buffer);
}

/**
 * Heuristic: a binary STL's header claims a triangle count whose implied byte
 * length matches the file. ASCII files begin with "solid" but so can some
 * binary ones, so we validate against the size rather than trusting the prefix.
 */
function isBinaryStl(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) return false;
  const view = new DataView(buffer);
  const triangles = view.getUint32(80, true);
  const expected = 84 + triangles * 50;
  return expected === buffer.byteLength;
}

function parseBinary(buffer: ArrayBuffer): RawMesh {
  const view = new DataView(buffer);
  const triangles = view.getUint32(80, true);
  const positions = new Float32Array(triangles * 9);
  const normals = new Float32Array(triangles * 9);

  let offset = 84;
  for (let i = 0; i < triangles; i++) {
    const nx = view.getFloat32(offset, true);
    const ny = view.getFloat32(offset + 4, true);
    const nz = view.getFloat32(offset + 8, true);
    offset += 12;

    for (let v = 0; v < 3; v++) {
      const p = i * 9 + v * 3;
      positions[p] = view.getFloat32(offset, true);
      positions[p + 1] = view.getFloat32(offset + 4, true);
      positions[p + 2] = view.getFloat32(offset + 8, true);
      normals[p] = nx;
      normals[p + 1] = ny;
      normals[p + 2] = nz;
      offset += 12;
    }
    offset += 2; // attribute byte count
  }

  return { positions, normals };
}

function parseAscii(buffer: ArrayBuffer): RawMesh {
  const text = new TextDecoder().decode(buffer);
  const positions: number[] = [];
  const normals: number[] = [];

  const vertexRe = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
  const normalRe = /facet\s+normal\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;

  const facetNormals: Array<[number, number, number]> = [];
  let nm: RegExpExecArray | null;
  while ((nm = normalRe.exec(text)) !== null) {
    facetNormals.push([Number(nm[1]), Number(nm[2]), Number(nm[3])]);
  }

  let vm: RegExpExecArray | null;
  let vIndex = 0;
  while ((vm = vertexRe.exec(text)) !== null) {
    positions.push(Number(vm[1]), Number(vm[2]), Number(vm[3]));
    const facet = facetNormals[Math.floor(vIndex / 3)] ?? [0, 0, 0];
    normals.push(facet[0], facet[1], facet[2]);
    vIndex++;
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
  };
}
