"use client";
// Auto-layout renderer for function structures (slides p.19–25 style): main functions in a row,
// auxiliary functions above/below, thin arrow = energy, thick arrow = material, dashed = signal.
import type { FS, Flow, FlowType } from "./types";

export const esc = (t: string) =>
  t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function wrap(text: string, max: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  words.forEach((w) => {
    if ((cur + " " + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  });
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

interface Pal {
  ink: string;
  E: string;
  M: string;
  S: string;
  box: string;
  auxBox: string;
  bg: string;
  mute: string;
  hi: string;
}
const DARK: Pal = {
  ink: "#E8F3FF",
  E: "#FF8A4C",
  M: "#6CB6FF",
  S: "#4ADE80",
  box: "rgba(255,255,255,0.05)",
  auxBox: "rgba(255,255,255,0.02)",
  bg: "",
  mute: "#A9C4E4",
  hi: "#FFC145",
};
const LIGHT: Pal = {
  ink: "#111111",
  E: "#C2410C",
  M: "#1D4ED8",
  S: "#15803D",
  box: "#FFFFFF",
  auxBox: "#FFFFFF",
  bg: "#FFFFFF",
  mute: "#555555",
  hi: "#B45309",
};

const BW = 132,
  BH = 54,
  CW = 176,
  LM = 150,
  RM = 170;

interface N {
  id: string;
  name: string;
  aux: boolean;
  row: "t" | "m" | "b";
  col: number;
  x: number;
  y: number;
}
interface P {
  x: number;
  y: number;
}

function defs(p: Pal, id: string) {
  const m = (t: FlowType, w: number, h: number, fill: string) =>
    `<marker id="${id}${t}" markerUnits="userSpaceOnUse" markerWidth="${w}" markerHeight="${h}" refX="${w}" refY="${h / 2}" orient="auto"><polygon points="0,0 ${w},${h / 2} 0,${h}" fill="${fill}"/></marker>`;
  return `<defs>${m("E", 11, 10, p.E)}${m("M", 14, 14, p.M)}${m("S", 10, 9, p.S)}</defs>`;
}
const strokeOf = (t: FlowType, p: Pal) =>
  t === "E"
    ? `stroke="${p.E}" stroke-width="2.2"`
    : t === "M"
      ? `stroke="${p.M}" stroke-width="5"`
      : `stroke="${p.S}" stroke-width="1.9" stroke-dasharray="6 4"`;

function pathStr(pts: P[]) {
  return pts
    .map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)}`)
    .join(" ");
}

function labelAt(pts: P[]): {
  x: number;
  y: number;
  anchor: "middle" | "start" | "end";
} {
  let best = 0,
    bi = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d =
      Math.abs(pts[i + 1]!.x - pts[i]!.x) + Math.abs(pts[i + 1]!.y - pts[i]!.y);
    if (d > best) {
      best = d;
      bi = i;
    }
  }
  const a = pts[bi]!,
    b = pts[bi + 1]!;
  const mx = (a.x + b.x) / 2,
    my = (a.y + b.y) / 2;
  if (Math.abs(b.y - a.y) < 1) return { x: mx, y: my - 9, anchor: "middle" };
  return { x: mx + 8, y: my + 4, anchor: "start" };
}

export function buildFsSvg(
  fs: FS,
  opts: { light?: boolean; id?: string; legend?: boolean } = {},
): { svg: string; w: number; h: number } {
  const p = opts.light ? LIGHT : DARK;
  const id = opts.id || "fx";
  const fns = fs.fns;
  if (!fns.length) return { svg: "", w: 0, h: 0 };
  const mains = fns.filter((f) => !f.aux),
    auxs = fns.filter((f) => f.aux);
  const mIdx = new Map(mains.map((f, i) => [f.id, i]));
  const nodes = new Map<string, N>();
  mains.forEach((f, i) =>
    nodes.set(f.id, {
      id: f.id,
      name: f.name,
      aux: false,
      row: "m",
      col: i,
      x: 0,
      y: 0,
    }),
  );
  const occ: Record<"t" | "b", Set<number>> = { t: new Set(), b: new Set() };
  const flows = fs.flows.filter(
    (f) =>
      (f.from === "IN" ||
        nodes.has(f.from) ||
        auxs.some((a) => a.id === f.from)) &&
      (f.to === "OUT" || nodes.has(f.to) || auxs.some((a) => a.id === f.to)),
  );
  // place auxiliaries
  let extra = mains.length;
  auxs.forEach((a) => {
    const outs = flows.filter(
      (f) => f.from === a.id && f.to !== "OUT" && f.to !== a.id,
    );
    const ins = flows.filter((f) => f.to === a.id && f.from !== "IN");
    const side: "t" | "b" =
      outs.length >= ins.length && outs.length > 0
        ? "t"
        : outs.length === 0 && ins.length === 0
          ? "t"
          : "b";
    const neigh = [...outs.map((f) => f.to), ...ins.map((f) => f.from)]
      .map((x) => mIdx.get(x))
      .filter((x): x is number => x !== undefined);
    let col = neigh.length ? Math.min(...neigh) : extra++;
    while (occ[side].has(col)) col++;
    occ[side].add(col);
    nodes.set(a.id, {
      id: a.id,
      name: a.name,
      aux: true,
      row: side,
      col,
      x: 0,
      y: 0,
    });
  });
  const nCols = Math.max(
    mains.length,
    ...Array.from(nodes.values()).map((n) => n.col + 1),
    1,
  );
  const hasT = occ.t.size > 0,
    hasB = occ.b.size > 0;
  const TOPY = 78,
    MAINY = hasT ? TOPY + BH + 92 : 108,
    BOTY = MAINY + BH + 92;
  const H = (hasB ? BOTY + BH : MAINY + BH) + 78;
  const W = LM + (nCols - 1) * CW + BW + RM;
  nodes.forEach((n) => {
    n.x = LM + n.col * CW;
    n.y = n.row === "t" ? TOPY : n.row === "m" ? MAINY : BOTY;
  });

  // decide sides
  type Side = "t" | "b" | "l" | "r";
  interface Plan {
    f: Flow;
    sn?: N;
    tn?: N;
    ss?: Side;
    ts?: Side;
    kind: string;
  }
  const plans: Plan[] = flows
    .map((f) => {
      const sn = nodes.get(f.from),
        tn = nodes.get(f.to);
      const pl: Plan = { f, sn, tn, kind: "" };
      if (f.from === "IN" && tn) {
        pl.kind = "in";
        pl.ts =
          (!tn.aux && tn.col === 0) || (tn.aux && tn.row === "b") ? "l" : "t";
      } else if (f.to === "OUT" && sn) {
        pl.kind = "out";
        pl.ss =
          !sn.aux && sn.col === mains.length - 1
            ? "r"
            : sn.row === "t"
              ? "t"
              : "b";
      } else if (sn && tn && sn.id !== tn.id) {
        if (!sn.aux && !tn.aux) {
          const d = tn.col - sn.col;
          if (Math.abs(d) === 1) {
            pl.kind = "adj";
            pl.ss = d > 0 ? "r" : "l";
            pl.ts = d > 0 ? "l" : "r";
          } else {
            pl.kind = "arc";
            pl.ss = "t";
            pl.ts = "t";
          }
        } else if (sn.row === tn.row) {
          pl.kind = "adj";
          const right = tn.x > sn.x;
          pl.ss = right ? "r" : "l";
          pl.ts = right ? "l" : "r";
        } else {
          pl.kind = "elbow";
          const aux = sn.aux ? sn : tn;
          const other = sn.aux ? tn : sn;
          const above = aux.y < other.y; // aux above
          const auxSide: Side = above ? "b" : "t",
            otherSide: Side = above ? "t" : "b";
          if (sn.aux) {
            pl.ss = auxSide;
            pl.ts = otherSide;
          } else {
            pl.ss = otherSide;
            pl.ts = auxSide;
          }
        }
      }
      return pl;
    })
    .filter((pl) => pl.kind);

  // anchors with offsets
  const cnt = new Map<string, number>(),
    seen = new Map<string, number>();
  const key = (n: N, sd: Side) => `${n.id}|${sd}`;
  plans.forEach((pl) => {
    if (pl.sn && pl.ss)
      cnt.set(key(pl.sn, pl.ss), (cnt.get(key(pl.sn, pl.ss)) || 0) + 1);
    if (pl.tn && pl.ts)
      cnt.set(key(pl.tn, pl.ts), (cnt.get(key(pl.tn, pl.ts)) || 0) + 1);
  });
  const anchor = (n: N, sd: Side): P => {
    const k = key(n, sd),
      tot = cnt.get(k) || 1,
      i = seen.get(k) || 0;
    seen.set(k, i + 1);
    const off = (i - (tot - 1) / 2) * (sd === "t" || sd === "b" ? 20 : 15);
    if (sd === "t") return { x: n.x + BW / 2 + off, y: n.y };
    if (sd === "b") return { x: n.x + BW / 2 + off, y: n.y + BH };
    if (sd === "l") return { x: n.x, y: n.y + BH / 2 + off };
    return { x: n.x + BW, y: n.y + BH / 2 + off };
  };

  let arcSlot = 0,
    elbowSlot = 0;
  const parts: string[] = [];
  const labels: string[] = [];
  plans.forEach((pl) => {
    let pts: P[] = [];
    if (pl.kind === "in" && pl.tn && pl.ts) {
      const a = anchor(pl.tn, pl.ts);
      pts = pl.ts === "l" ? [{ x: 10, y: a.y }, a] : [{ x: a.x, y: 8 }, a];
    } else if (pl.kind === "out" && pl.sn && pl.ss) {
      const a = anchor(pl.sn, pl.ss);
      pts =
        pl.ss === "r"
          ? [a, { x: W - 10, y: a.y }]
          : pl.ss === "t"
            ? [a, { x: a.x, y: 8 }]
            : [a, { x: a.x, y: H - 10 }];
    } else if (pl.sn && pl.tn && pl.ss && pl.ts) {
      const a = anchor(pl.sn, pl.ss),
        b = anchor(pl.tn, pl.ts);
      if (pl.kind === "adj") {
        const mx = (a.x + b.x) / 2;
        pts =
          Math.abs(a.y - b.y) < 1
            ? [a, b]
            : [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b];
      } else if (pl.kind === "arc") {
        const ry = MAINY - 24 - 13 * (arcSlot++ % 5);
        pts = [a, { x: a.x, y: ry }, { x: b.x, y: ry }, b];
      } else {
        const my = (a.y + b.y) / 2 + ((elbowSlot++ % 3) - 1) * 9;
        pts =
          Math.abs(a.x - b.x) < 1
            ? [a, b]
            : [a, { x: a.x, y: my }, { x: b.x, y: my }, b];
      }
    }
    if (pts.length < 2) return;
    parts.push(
      `<path d="${pathStr(pts)}" fill="none" ${strokeOf(pl.f.type, p)} stroke-linejoin="round" marker-end="url(#${id}${pl.f.type})"/>`,
    );
    const lab = pl.f.label.trim();
    if (lab) {
      let L = labelAt(pts);
      if (pl.kind === "in" && pl.ts === "l")
        L = { x: 12, y: pts[0]!.y - 10, anchor: "start" };
      if (pl.kind === "in" && pl.ts === "t")
        L = { x: pts[0]!.x + 8, y: 24, anchor: "start" };
      if (pl.kind === "out" && pl.ss === "r")
        L = { x: W - 12, y: pts[0]!.y - 10, anchor: "end" };
      labels.push(
        `<text x="${L.x.toFixed(1)}" y="${L.y.toFixed(1)}" text-anchor="${L.anchor}" font-size="12" fill="${strokeOf(pl.f.type, p).match(/stroke="([^"]+)"/)![1]}" font-weight="600">${esc(lab)}</text>`,
      );
    }
  });

  const boxes: string[] = [];
  nodes.forEach((n) => {
    const ls = wrap(n.name || "(unnamed)", 16).slice(0, 3);
    const y0 = n.y + BH / 2 - (ls.length - 1) * 7.5 + 4;
    boxes.push(
      `<rect x="${n.x}" y="${n.y}" width="${BW}" height="${BH}" rx="3" fill="${n.aux ? p.auxBox : p.box}" stroke="${p.ink}" stroke-width="1.6"${n.aux ? ' stroke-dasharray="6 4"' : ""}/>`,
    );
    boxes.push(
      `<text text-anchor="middle" font-size="12.5" font-weight="600" fill="${p.ink}">${ls.map((l, i) => `<tspan x="${n.x + BW / 2}" y="${(y0 + i * 15).toFixed(1)}">${esc(l)}</tspan>`).join("")}</text>`,
    );
  });

  const bx = LM - 34,
    by = hasT ? TOPY - 30 : MAINY - 46,
    bw = (nCols - 1) * CW + BW + 68,
    bh = (hasB ? BOTY + BH + 30 : MAINY + BH + 34) - by;
  const boundary = fs.boundary
    ? `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="none" stroke="${p.mute}" stroke-width="1.5" stroke-dasharray="10 4 2 4"/><text x="${bx + bw - 8}" y="${by - 6}" text-anchor="end" font-size="10.5" fill="${p.mute}" letter-spacing="1.2">SYSTEM BOUNDARY</text>`
    : "";
  let leg = "";
  let HH = H;
  if (opts.legend !== false) {
    const ly = H + 4;
    HH = H + 34;
    leg = `<g font-size="11.5" fill="${p.ink}">
      <path d="M20 ${ly + 10}H64" fill="none" ${strokeOf("E", p)} marker-end="url(#${id}E)"/><text x="72" y="${ly + 14}">Energy</text>
      <path d="M150 ${ly + 10}H194" fill="none" ${strokeOf("M", p)} marker-end="url(#${id}M)"/><text x="204" y="${ly + 14}">Material</text>
      <path d="M290 ${ly + 10}H334" fill="none" ${strokeOf("S", p)} marker-end="url(#${id}S)"/><text x="344" y="${ly + 14}">Signal</text>
      <rect x="430" y="${ly + 2}" width="34" height="16" rx="2" fill="none" stroke="${p.ink}" stroke-width="1.4"/><text x="472" y="${ly + 14}">Main function</text>
      <rect x="580" y="${ly + 2}" width="34" height="16" rx="2" fill="none" stroke="${p.ink}" stroke-width="1.4" stroke-dasharray="5 3"/><text x="622" y="${ly + 14}">Auxiliary function</text>
    </g>`;
  }
  const bg = p.bg ? `<rect width="${W}" height="${HH}" fill="${p.bg}"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${HH}" width="${W}" height="${HH}" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif" role="img" aria-label="Function structure diagram">${defs(p, id)}${bg}${boundary}${parts.join("")}${boxes.join("")}${labels.join("")}${leg}</svg>`;
  return { svg, w: W, h: HH };
}

/** Black-box view (slides p.19 and p.102): grouped inputs on the left, outputs on the right. */
export function buildBlackBoxSvg(
  fs: FS,
  opts: { light?: boolean; id?: string } = {},
): { svg: string; w: number; h: number } {
  const p = opts.light ? LIGHT : DARK;
  const id = opts.id || "bb";
  const types: FlowType[] = ["E", "M", "S"];
  const ins = fs.flows.filter((f) => f.from === "IN"),
    outs = fs.flows.filter((f) => f.to === "OUT");
  const rows = types.filter(
    (t) => ins.some((f) => f.type === t) || outs.some((f) => f.type === t),
  );
  if (!rows.length && !fs.overall.trim()) return { svg: "", w: 0, h: 0 };
  const rh = 78,
    W = 900,
    boxX = 330,
    boxW = 240;
  const used = rows.length ? rows : (["E"] as FlowType[]);
  const H = Math.max(160, used.length * rh + 50);
  const lab = (t: FlowType, list: Flow[], x: number, anchor: string) => {
    const ls = Array.from(
      new Set(
        list
          .filter((f) => f.type === t)
          .map((f) => f.label.trim())
          .filter(Boolean),
      ),
    ).join(", ");
    return wrap(ls || "", 26)
      .slice(0, 3)
      .map(
        (l, i) =>
          `<text x="${x}" y="${0 + i * 14}" text-anchor="${anchor}" font-size="12" fill="${p[t]}" font-weight="600" data-i="${i}">${esc(l)}</text>`,
      )
      .join("");
  };
  let g = "";
  used.forEach((t, i) => {
    const y = 56 + i * rh;
    const lines = (list: Flow[], x: number, anchor: string) =>
      wrap(
        Array.from(
          new Set(
            list
              .filter((f) => f.type === t)
              .map((f) => f.label.trim())
              .filter(Boolean),
          ),
        ).join(", "),
        28,
      )
        .slice(0, 3)
        .map(
          (l, k, arr) =>
            `<text x="${x}" y="${(y - 12 - (arr.length - 1 - k) * 14).toFixed(1)}" text-anchor="${anchor}" font-size="12" fill="${p[t]}" font-weight="600">${esc(l)}</text>`,
        )
        .join("");
    g += `<path d="M ${boxX - 120} ${y} H ${boxX}" fill="none" ${strokeOf(t, p)} marker-end="url(#${id}${t})"/>${lines(ins, boxX - 126, "end")}`;
    g += `<path d="M ${boxX + boxW} ${y} H ${boxX + boxW + 120}" fill="none" ${strokeOf(t, p)} marker-end="url(#${id}${t})"/>${lines(outs, boxX + boxW + 126, "start")}`;
  });
  void lab;
  const ov = wrap(fs.overall.trim() || "Overall function", 22).slice(0, 5);
  const oy = H / 2 - (ov.length - 1) * 11;
  g += `<rect x="${boxX}" y="10" width="${boxW}" height="${H - 20}" rx="4" fill="${p.box}" stroke="${p.ink}" stroke-width="2"/>`;
  g += `<text text-anchor="middle" font-size="16" font-weight="700" fill="${p.ink}">${ov.map((l, i) => `<tspan x="${boxX + boxW / 2}" y="${(oy + i * 22).toFixed(1)}">${esc(l)}</tspan>`).join("")}</text>`;
  g += `<rect x="${boxX - 40}" y="2" width="${boxW + 80}" height="${H - 4}" rx="6" fill="none" stroke="${p.mute}" stroke-width="1.5" stroke-dasharray="10 4 2 4"/>`;
  const bg = p.bg ? `<rect width="${W}" height="${H}" fill="${p.bg}"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif" role="img" aria-label="Black-box overall function">${defs(p, id)}${bg}${g}</svg>`;
  return { svg, w: W, h: H };
}

export function Diagram({ markup, label }: { markup: string; label?: string }) {
  if (!markup) return null;
  return (
    <div
      className="l3-diagram"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
