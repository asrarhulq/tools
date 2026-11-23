/**
 * Colour scales. Sequential = one hue (blue) light→dark, with a separate dark-
 * mode direction so "near zero" always recedes into the surface. Diverging =
 * blue (decrease) ↔ red (increase) around a neutral grey midpoint. Steps come
 * from the hub's validated reference palette; categorical series use slot 1
 * (blue) and slot 2 (orange) in fixed order.
 */

type RGB = [number, number, number];
const hex = (h: string): RGB =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const toHex = (c: RGB) =>
  "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

function lerpStops(stops: string[], t: number): string {
  const x = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const a = hex(stops[i]!),
    b = hex(stops[i + 1]!),
    f = x - i;
  return toHex([0, 1, 2].map((k) => a[k]! + (b[k]! - a[k]!) * f) as RGB);
}

const SEQ_LIGHT = [
  "#eef4fc",
  "#cde2fb",
  "#9ec5f4",
  "#6da7ec",
  "#3987e5",
  "#256abf",
  "#184f95",
  "#0d366b",
];
const SEQ_DARK = [
  "#22262c",
  "#104281",
  "#184f95",
  "#256abf",
  "#3987e5",
  "#6da7ec",
  "#9ec5f4",
  "#cde2fb",
];
const DIV_LIGHT = {
  neg: ["#f0efec", "#9ec5f4", "#3987e5", "#1c5cab", "#0d366b"],
  pos: ["#f0efec", "#f4b3ac", "#e66767", "#c8322f", "#8a1c1c"],
};
const DIV_DARK = {
  neg: ["#383835", "#184f95", "#256abf", "#5598e7", "#9ec5f4"],
  pos: ["#383835", "#7d2424", "#b8302d", "#e66767", "#f4b3ac"],
};

export function sequential(v: number, max: number, dark: boolean): string {
  return lerpStops(
    dark ? SEQ_DARK : SEQ_LIGHT,
    max > 0 ? Math.sqrt(v / max) : 0,
  );
}

export function diverging(v: number, maxAbs: number, dark: boolean): string {
  const s = dark ? DIV_DARK : DIV_LIGHT;
  if (maxAbs <= 0) return s.pos[0]!;
  return lerpStops(v >= 0 ? s.pos : s.neg, Math.abs(v) / maxAbs);
}

export const SERIES = {
  light: { a: "#2a78d6", b: "#eb6834" },
  dark: { a: "#3987e5", b: "#d95926" },
} as const;

/** Print palette for the PDF (always light). */
export const PDF = {
  seq: SEQ_LIGHT,
  div: DIV_LIGHT,
  a: "#2a78d6",
  b: "#eb6834",
} as const;
export { lerpStops };
