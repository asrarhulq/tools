import type { Material, Section, SectionProps, SectionType } from "../types";

/**
 * Cross-section library. Computes area, second moment of area I (about the
 * horizontal bending axis), section modulus S = I/c, distance to extreme fibre
 * c, and radius of gyration r = √(I/A) — all in SI (m, m², m⁴, m³). Standard
 * strength-of-materials formulas; validated against textbook values.
 */

export const MATERIALS: readonly Material[] = [
  {
    id: "steel",
    name: "Structural Steel",
    E: 200e9,
    nu: 0.3,
    yield: 250e6,
    density: 7850,
    alpha: 12e-6,
    cost: 1.2,
  },
  {
    id: "aluminum",
    name: "Aluminum 6061-T6",
    E: 68.9e9,
    nu: 0.33,
    yield: 276e6,
    density: 2700,
    alpha: 23.6e-6,
    cost: 3.5,
  },
  {
    id: "titanium",
    name: "Titanium Ti-6Al-4V",
    E: 113.8e9,
    nu: 0.34,
    yield: 880e6,
    density: 4430,
    alpha: 8.6e-6,
    cost: 30,
  },
  {
    id: "cast-iron",
    name: "Cast Iron",
    E: 170e9,
    nu: 0.26,
    yield: 130e6,
    density: 7200,
    alpha: 10e-6,
    cost: 0.8,
  },
  {
    id: "wood",
    name: "Douglas Fir (timber)",
    E: 13.1e9,
    nu: 0.3,
    yield: 50e6,
    density: 530,
    alpha: 5e-6,
    cost: 0.9,
  },
  {
    id: "concrete",
    name: "Concrete (C30)",
    E: 30e9,
    nu: 0.2,
    yield: 30e6,
    density: 2400,
    alpha: 10e-6,
    cost: 0.15,
  },
  {
    id: "pla",
    name: "PLA",
    E: 3.5e9,
    nu: 0.36,
    yield: 50e6,
    density: 1240,
    alpha: 68e-6,
    cost: 22,
  },
  {
    id: "petg",
    name: "PETG",
    E: 2.1e9,
    nu: 0.4,
    yield: 50e6,
    density: 1270,
    alpha: 60e-6,
    cost: 26,
  },
  {
    id: "abs",
    name: "ABS",
    E: 2.0e9,
    nu: 0.35,
    yield: 40e6,
    density: 1040,
    alpha: 90e-6,
    cost: 24,
  },
  {
    id: "nylon",
    name: "Nylon (PA)",
    E: 1.7e9,
    nu: 0.39,
    yield: 48e6,
    density: 1140,
    alpha: 95e-6,
    cost: 40,
  },
  {
    id: "cfrp",
    name: "Carbon Fiber (CFRP)",
    E: 150e9,
    nu: 0.3,
    yield: 1500e6,
    density: 1600,
    alpha: 2e-6,
    cost: 48,
  },
] as const;

export const DEFAULT_MATERIAL_ID = "steel";
export function getMaterial(id: string): Material {
  return MATERIALS.find((m) => m.id === id) ?? MATERIALS[0]!;
}

/** Sensible default dimensions per section type (metres). */
export function defaultDims(type: SectionType): Record<string, number> {
  switch (type) {
    case "rectangle":
      return { b: 0.05, h: 0.1 };
    case "circle":
      return { d: 0.08 };
    case "tube":
      return { d: 0.08, t: 0.005 };
    case "i-beam":
      return { bf: 0.1, tf: 0.008, hw: 0.184, tw: 0.006 }; // ~ IPE/W flange+web
    case "channel":
      return { bf: 0.06, tf: 0.008, hw: 0.184, tw: 0.006 };
    case "angle":
      return { b: 0.06, t: 0.006 };
    case "t-beam":
      return { bf: 0.1, tf: 0.01, hw: 0.1, tw: 0.008 };
  }
}

export function defaultSection(): Section {
  return { type: "rectangle", dims: defaultDims("rectangle") };
}

/** Compute section properties for the given section. */
export function sectionProps(section: Section): SectionProps {
  const d = section.dims;
  switch (section.type) {
    case "rectangle": {
      const b = pos(d.b),
        h = pos(d.h);
      const area = b * h;
      const I = (b * h ** 3) / 12;
      const c = h / 2;
      return finalize(area, I, c);
    }
    case "circle": {
      const dia = pos(d.d);
      const rad = dia / 2;
      const area = Math.PI * rad ** 2;
      const I = (Math.PI * rad ** 4) / 4;
      return finalize(area, I, rad);
    }
    case "tube": {
      const ro = pos(d.d) / 2;
      const ri = Math.max(0, ro - pos(d.t));
      const area = Math.PI * (ro ** 2 - ri ** 2);
      const I = (Math.PI / 4) * (ro ** 4 - ri ** 4);
      return finalize(area, I, ro);
    }
    case "i-beam": {
      // Symmetric I: two flanges + web. I about the strong (horizontal) axis.
      const bf = pos(d.bf),
        tf = pos(d.tf),
        hw = pos(d.hw),
        tw = pos(d.tw);
      const H = hw + 2 * tf;
      const area = 2 * bf * tf + hw * tw;
      // I = web + flanges (parallel axis).
      const Iweb = (tw * hw ** 3) / 12;
      const dFlange = hw / 2 + tf / 2;
      const Iflange = 2 * ((bf * tf ** 3) / 12 + bf * tf * dFlange ** 2);
      return finalize(area, Iweb + Iflange, H / 2);
    }
    case "channel": {
      // Approximate as an I-beam's half for strong-axis bending purposes.
      const bf = pos(d.bf),
        tf = pos(d.tf),
        hw = pos(d.hw),
        tw = pos(d.tw);
      const H = hw + 2 * tf;
      const area = 2 * bf * tf + hw * tw;
      const Iweb = (tw * hw ** 3) / 12;
      const dFlange = hw / 2 + tf / 2;
      const Iflange = 2 * ((bf * tf ** 3) / 12 + bf * tf * dFlange ** 2);
      return finalize(area, Iweb + Iflange, H / 2);
    }
    case "t-beam": {
      const bf = pos(d.bf),
        tf = pos(d.tf),
        hw = pos(d.hw),
        tw = pos(d.tw);
      const H = tf + hw;
      const aF = bf * tf,
        aW = tw * hw;
      const area = aF + aW;
      // Centroid from top.
      const yF = tf / 2,
        yW = tf + hw / 2;
      const yc = (aF * yF + aW * yW) / area;
      const IF = (bf * tf ** 3) / 12 + aF * (yc - yF) ** 2;
      const IW = (tw * hw ** 3) / 12 + aW * (yc - yW) ** 2;
      const c = Math.max(yc, H - yc);
      return finalize(area, IF + IW, c);
    }
    case "angle": {
      // Equal-leg angle; approximate I about horizontal centroidal axis.
      const b = pos(d.b),
        t = pos(d.t);
      const a1 = b * t,
        a2 = (b - t) * t;
      const area = a1 + a2;
      const y1 = t / 2,
        y2 = t + (b - t) / 2;
      const yc = (a1 * y1 + a2 * y2) / area;
      const I1 = (b * t ** 3) / 12 + a1 * (yc - y1) ** 2;
      const I2 = (t * (b - t) ** 3) / 12 + a2 * (yc - y2) ** 2;
      const c = Math.max(yc, b - yc);
      return finalize(area, I1 + I2, c);
    }
  }
}

function finalize(area: number, I: number, c: number): SectionProps {
  const A = Math.max(area, 1e-12);
  return {
    area: A,
    I: Math.max(I, 1e-15),
    S: I / Math.max(c, 1e-9),
    c: Math.max(c, 1e-9),
    r: Math.sqrt(Math.max(I, 1e-15) / A),
  };
}

function pos(v: number | undefined): number {
  return Math.max(1e-6, v ?? 1e-6);
}

export const SECTION_LABELS: Record<SectionType, string> = {
  rectangle: "Rectangle",
  circle: "Circle",
  tube: "Circular Tube",
  "i-beam": "I-Beam",
  channel: "Channel",
  angle: "Angle",
  "t-beam": "T-Beam",
};

/** Dimension field labels per section (keys → human label). */
export const SECTION_DIM_LABELS: Record<SectionType, Record<string, string>> = {
  rectangle: { b: "Width b", h: "Height h" },
  circle: { d: "Diameter d" },
  tube: { d: "Outer ⌀ d", t: "Wall t" },
  "i-beam": {
    bf: "Flange width",
    tf: "Flange thick",
    hw: "Web height",
    tw: "Web thick",
  },
  channel: {
    bf: "Flange width",
    tf: "Flange thick",
    hw: "Web height",
    tw: "Web thick",
  },
  angle: { b: "Leg length", t: "Thickness" },
  "t-beam": {
    bf: "Flange width",
    tf: "Flange thick",
    hw: "Stem height",
    tw: "Stem thick",
  },
};
