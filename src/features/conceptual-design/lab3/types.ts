// Shared types, defaults and tiny helpers for the Lab 3 guide.

export const uid = () => Math.random().toString(36).slice(2, 8);

export type FlowType = "E" | "M" | "S";
export type View =
  | "home"
  | "s1"
  | "s2"
  | "s3"
  | "s4"
  | "s5"
  | "s6"
  | "vault"
  | "stuck"
  | "locator";

export interface Req {
  id: string;
  text: string;
  verdict: "" | "keep" | "pref" | "nofunc";
  essence: string;
  general: string;
}
export interface Abs {
  reqs: Req[];
  product: string;
  statement: string;
}

export interface Fn {
  id: string;
  name: string;
  aux: boolean;
}
export interface Flow {
  id: string;
  from: string;
  to: string;
  type: FlowType;
  label: string;
}
export interface FS {
  overall: string;
  fns: Fn[];
  flows: Flow[];
  boundary: boolean;
}

export interface Principle {
  id: string;
  fnId: string;
  text: string;
  effect: string;
  geometry: string;
  sketch: string;
  sketched: boolean;
}
export interface Structure {
  id: string;
  name: string;
  picks: Record<string, string[]>;
  checks: {
    phys: boolean;
    geom: boolean;
    energy: boolean;
    signal: boolean;
    material: boolean;
  };
  sketched: boolean;
  note: string;
}

export type Mark = "" | "+" | "-" | "?" | "!";
export type Elim = Record<string, Record<string, Mark>>;
export interface PCrit {
  id: string;
  name: string;
  group: string;
}
export interface Run {
  id: string;
  datum: string;
  r: Record<string, Record<string, number>>;
}
export interface Crit {
  id: string;
  name: string;
  rank: number;
  weight: number;
  pref: "H" | "L";
  lo: number;
  hi: number;
  unit: string;
}
export type Ratings = Record<string, Record<string, number | "">>;
export interface ObjNode {
  id: string;
  name: string;
  w: number;
  children: ObjNode[];
}

export interface Final {
  structId: string;
  summary: string;
  walk: Record<string, string>;
  numbers: string;
  demands: string;
  weak: string;
  sketch: string;
}

export interface State {
  v: 1;
  current: number;
  abs: Abs;
  fs: FS;
  principles: Principle[];
  pool: { id: string; text: string }[];
  structures: Structure[];
  elim: Elim;
  elimCrit: string[];
  pcrit: PCrit[];
  runs: Run[];
  crit: Crit[];
  ratings: Ratings;
  weightMode: "rank" | "direct";
  obj: ObjNode;
  quad: Record<string, { value: number; effort: number }>;
  dots: Record<string, number>;
  final: Final;
  checks: Record<string, boolean>;
}

export const ELIM_CRITS = [
  { id: "task", label: "Compatible with overall task?" },
  { id: "demands", label: "Fulfils demands in requirements list?" },
  { id: "perf", label: "Realizable in performance?" },
  { id: "cost", label: "Permissible in terms of cost?" },
  { id: "safety", label: "Incorporates direct safety measures?" },
  { id: "pref", label: "Preferred (e.g. by company / team)?" },
  { id: "info", label: "Accompanied by adequate information?" },
];

export const defaultState = (): State => ({
  v: 1,
  current: 1,
  abs: { reqs: [], product: "", statement: "" },
  fs: { overall: "", fns: [], flows: [], boundary: true },
  principles: [],
  pool: [],
  structures: [],
  elim: {},
  elimCrit: ["task", "demands", "perf", "cost"],
  pcrit: [
    { id: "p1", name: "Safety", group: "Safety" },
    { id: "p2", name: "Performance", group: "Performance" },
    { id: "p3", name: "Cost", group: "Economics" },
    { id: "p4", name: "Ease of use", group: "User" },
  ],
  runs: [],
  crit: [],
  ratings: {},
  weightMode: "rank",
  obj: { id: "root", name: "Overall goal", w: 1, children: [] },
  quad: {},
  dots: {},
  final: {
    structId: "",
    summary: "",
    walk: {},
    numbers: "",
    demands: "",
    weak: "",
    sketch: "",
  },
  checks: {},
});

export const clamp = (x: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, x));
export const num = (v: number | "" | undefined): number | null =>
  v === "" || v === undefined || Number.isNaN(v as number)
    ? null
    : (v as number);
export const fmt = (x: number, d = 3) =>
  Number.isFinite(x) ? x.toFixed(d) : "–";
