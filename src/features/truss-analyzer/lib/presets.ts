import type { Member, Truss } from "../types";
import { DEFAULT_AREA, DEFAULT_MATERIAL_ID } from "./materials";

/**
 * Parametric truss generators (Warren, Pratt, Howe, King-post) plus a curated
 * example library of textbook/real-world structures. All coordinates in metres,
 * loads in newtons. Each generator returns a ready-to-analyze `Truss`.
 */

let seq = 0;
function id(prefix: string): string {
  seq += 1;
  return `${prefix}${seq}`;
}

function base(name: string): Truss {
  return {
    schemaVersion: 1,
    name,
    nodes: [],
    members: [],
    loads: [],
    defaultMaterialId: DEFAULT_MATERIAL_ID,
    defaultArea: DEFAULT_AREA,
  };
}

const mat = DEFAULT_MATERIAL_ID;
const A = DEFAULT_AREA;
const member = (from: string, to: string): Member => ({
  id: id("M"),
  from,
  to,
  area: A,
  materialId: mat,
});

export interface PresetParams {
  span: number; // m
  height: number; // m
  panels: number; // number of bays
  load: number; // N, downward per loaded joint
}

const DEFAULTS: PresetParams = {
  span: 12,
  height: 2.5,
  panels: 4,
  load: 10000,
};

/**
 * Parallel-chord truss with verticals at every interior panel and one diagonal
 * per bay. `diagDir` sets the diagonal sense: "pratt" diagonals descend toward
 * the centre (web diagonals in tension), "howe" ascend toward the centre
 * (diagonals in compression) — the two are mirror images.
 */
function parallelChord(
  name: string,
  diagDir: "pratt" | "howe",
  p: PresetParams,
): Truss {
  const t = base(name);
  const { span, height, panels, load } = p;
  const dx = span / panels;
  const bottom: string[] = [];
  const top: string[] = [];
  // Top chord node above EVERY bottom node (full parallel chords) — this is the
  // topology that is guaranteed stable and statically determinate.
  for (let i = 0; i <= panels; i++) {
    const b = id("N");
    t.nodes.push({
      id: b,
      x: i * dx,
      y: 0,
      support: i === 0 ? "pin" : i === panels ? "roller-x" : "none",
    });
    bottom.push(b);
    const u = id("N");
    t.nodes.push({ id: u, x: i * dx, y: height, support: "none" });
    top.push(u);
  }
  // Chords.
  for (let i = 0; i < panels; i++) {
    t.members.push(member(bottom[i]!, bottom[i + 1]!));
    t.members.push(member(top[i]!, top[i + 1]!));
  }
  // Verticals at every node (including the two end posts).
  for (let i = 0; i <= panels; i++) t.members.push(member(bottom[i]!, top[i]!));
  // One diagonal per bay, direction depending on the type and which half.
  const mid = panels / 2;
  for (let i = 0; i < panels; i++) {
    const leftHalf = i < mid;
    // Pratt: descend toward centre; Howe: ascend toward centre.
    const descend = diagDir === "pratt" ? leftHalf : !leftHalf;
    if (descend) t.members.push(member(top[i]!, bottom[i + 1]!));
    else t.members.push(member(bottom[i]!, top[i + 1]!));
  }
  loadTopOrBottom(t, bottom, load);
  return t;
}

/** Pratt truss: web diagonals slope down toward the centre (tension diagonals). */
export function pratt(p: PresetParams = DEFAULTS): Truss {
  return parallelChord("Pratt Truss", "pratt", p);
}

/** Howe truss: web diagonals slope up toward the centre (compression diagonals). */
export function howe(p: PresetParams = DEFAULTS): Truss {
  return parallelChord("Howe Truss", "howe", p);
}

/** Warren truss: alternating diagonals forming equilateral-ish triangles, no verticals. */
export function warren(p: PresetParams = DEFAULTS): Truss {
  const t = base("Warren Truss");
  const { span, height, panels, load } = p;
  const dx = span / panels;
  const bottom: string[] = [];
  const top: string[] = [];
  for (let i = 0; i <= panels; i++) {
    const b = id("N");
    t.nodes.push({
      id: b,
      x: i * dx,
      y: 0,
      support: i === 0 ? "pin" : i === panels ? "roller-x" : "none",
    });
    bottom.push(b);
  }
  for (let i = 0; i < panels; i++) {
    const u = id("N");
    t.nodes.push({ id: u, x: (i + 0.5) * dx, y: height, support: "none" });
    top.push(u);
  }
  for (let i = 0; i < panels; i++)
    t.members.push(member(bottom[i]!, bottom[i + 1]!));
  for (let i = 0; i < top.length - 1; i++)
    t.members.push(member(top[i]!, top[i + 1]!));
  for (let i = 0; i < panels; i++) {
    t.members.push(member(bottom[i]!, top[i]!)); // up-diagonal
    t.members.push(member(top[i]!, bottom[i + 1]!)); // down-diagonal
  }
  loadTopOrBottom(t, top, load);
  return t;
}

/** King-post truss: the simplest roof truss — two rafters, a tie, a king post. */
export function kingPost(p: PresetParams = DEFAULTS): Truss {
  const t = base("King-Post Truss");
  const { span, height, load } = p;
  const a = id("N"),
    b = id("N"),
    apex = id("N"),
    mid = id("N");
  t.nodes.push({ id: a, x: 0, y: 0, support: "pin" });
  t.nodes.push({ id: b, x: span, y: 0, support: "roller-x" });
  t.nodes.push({ id: apex, x: span / 2, y: height, support: "none" });
  t.nodes.push({ id: mid, x: span / 2, y: 0, support: "none" });
  t.members.push(member(a, apex)); // rafter
  t.members.push(member(b, apex)); // rafter
  t.members.push(member(a, mid)); // tie
  t.members.push(member(mid, b)); // tie
  t.members.push(member(mid, apex)); // king post
  t.loads.push({ id: id("L"), nodeId: apex, fx: 0, fy: -load });
  return t;
}

function loadTopOrBottom(t: Truss, chord: string[], load: number) {
  // Apply a downward load at each interior joint of the given chord.
  const interior = chord.slice(1, -1).length ? chord.slice(1, -1) : chord;
  for (const nId of interior) {
    t.loads.push({ id: id("L"), nodeId: nId, fx: 0, fy: -load });
  }
}

export type PresetId = "warren" | "pratt" | "howe" | "king-post";

export function buildPreset(kind: PresetId, params?: PresetParams): Truss {
  switch (kind) {
    case "warren":
      return warren(params);
    case "pratt":
      return pratt(params);
    case "howe":
      return howe(params);
    case "king-post":
      return kingPost(params);
  }
}

// ── Curated example library ──────────────────────────────────────────────────

export interface ExampleDef {
  id: string;
  name: string;
  description: string;
  build: () => Truss;
}

export const EXAMPLES: readonly ExampleDef[] = [
  {
    id: "warren-bridge",
    name: "Warren Bridge Deck",
    description:
      "6-panel Warren truss — the classic highway/railway bridge form.",
    build: () => warren({ span: 18, height: 3, panels: 6, load: 15000 }),
  },
  {
    id: "pratt-bridge",
    name: "Pratt Through-Truss",
    description: "Pratt truss with vertical web members carrying compression.",
    build: () => pratt({ span: 16, height: 3, panels: 4, load: 12000 }),
  },
  {
    id: "roof-king",
    name: "King-Post Roof",
    description: "Simple pitched-roof truss for a residential span.",
    build: () => kingPost({ span: 8, height: 2, panels: 2, load: 8000 }),
  },
  {
    id: "howe-roof",
    name: "Howe Roof Truss",
    description: "Howe configuration common in timber roof construction.",
    build: () => howe({ span: 14, height: 3.5, panels: 4, load: 9000 }),
  },
];
