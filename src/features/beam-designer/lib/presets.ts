import type { Beam } from "../types";
import { DEFAULT_MATERIAL_ID, getMaterial, defaultSection } from "./sections";

/**
 * Beam presets — common configurations to start from. Lengths in metres, loads
 * in newtons (down = negative). Each returns a ready-to-solve Beam with a
 * default steel rectangular section and one gravity load case.
 */

let seq = 0;
const id = (p: string) => `${p}${(seq += 1)}`;

function base(name: string, length: number): Beam {
  return {
    schemaVersion: 1,
    name,
    length,
    supports: [],
    hinges: [],
    loads: [],
    loadCases: [{ id: "case1", name: "Load Case 1" }],
    material: getMaterial(DEFAULT_MATERIAL_ID),
    section: defaultSection(),
  };
}

export type PresetId =
  | "simply-supported"
  | "cantilever"
  | "fixed-fixed"
  | "continuous"
  | "overhanging"
  | "propped-cantilever";

export function buildPreset(kind: PresetId): Beam {
  switch (kind) {
    case "simply-supported": {
      const b = base("Simply Supported Beam", 6);
      b.supports = [
        { id: id("S"), x: 0, type: "pin" },
        { id: id("S"), x: 6, type: "roller" },
      ];
      b.loads = [
        {
          id: id("L"),
          type: "point",
          x: 3,
          length: 0,
          magnitude: -20000,
          caseId: "case1",
        },
      ];
      return b;
    }
    case "cantilever": {
      const b = base("Cantilever Beam", 4);
      b.supports = [{ id: id("S"), x: 0, type: "fixed" }];
      b.loads = [
        {
          id: id("L"),
          type: "point",
          x: 4,
          length: 0,
          magnitude: -10000,
          caseId: "case1",
        },
      ];
      return b;
    }
    case "fixed-fixed": {
      const b = base("Fixed-Fixed Beam", 6);
      b.supports = [
        { id: id("S"), x: 0, type: "fixed" },
        { id: id("S"), x: 6, type: "fixed" },
      ];
      b.loads = [
        {
          id: id("L"),
          type: "udl",
          x: 0,
          length: 6,
          magnitude: -8000,
          caseId: "case1",
        },
      ];
      return b;
    }
    case "continuous": {
      const b = base("Continuous Beam (2-span)", 12);
      b.supports = [
        { id: id("S"), x: 0, type: "pin" },
        { id: id("S"), x: 6, type: "roller" },
        { id: id("S"), x: 12, type: "roller" },
      ];
      b.loads = [
        {
          id: id("L"),
          type: "udl",
          x: 0,
          length: 12,
          magnitude: -10000,
          caseId: "case1",
        },
      ];
      return b;
    }
    case "overhanging": {
      const b = base("Overhanging Beam", 8);
      b.supports = [
        { id: id("S"), x: 1.5, type: "pin" },
        { id: id("S"), x: 6, type: "roller" },
      ];
      b.loads = [
        {
          id: id("L"),
          type: "udl",
          x: 0,
          length: 8,
          magnitude: -6000,
          caseId: "case1",
        },
        {
          id: id("L"),
          type: "point",
          x: 8,
          length: 0,
          magnitude: -12000,
          caseId: "case1",
        },
      ];
      return b;
    }
    case "propped-cantilever": {
      const b = base("Propped Cantilever", 6);
      b.supports = [
        { id: id("S"), x: 0, type: "fixed" },
        { id: id("S"), x: 6, type: "roller" },
      ];
      b.loads = [
        {
          id: id("L"),
          type: "udl",
          x: 0,
          length: 6,
          magnitude: -9000,
          caseId: "case1",
        },
      ];
      return b;
    }
  }
}

export const PRESETS: Array<{ id: PresetId; label: string; hint: string }> = [
  {
    id: "simply-supported",
    label: "Simply Supported",
    hint: "Pin + roller, central load",
  },
  { id: "cantilever", label: "Cantilever", hint: "Fixed one end, tip load" },
  { id: "fixed-fixed", label: "Fixed-Fixed", hint: "Both ends fixed, UDL" },
  { id: "continuous", label: "Continuous", hint: "Two-span, three supports" },
  { id: "overhanging", label: "Overhanging", hint: "Supports inboard of ends" },
  {
    id: "propped-cantilever",
    label: "Propped Cantilever",
    hint: "Fixed + roller prop",
  },
];
