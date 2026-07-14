import type { AnalysisResult, Truss, UnitSystem } from "../types";
import * as U from "./units";

/**
 * Lightweight, dependency-free exporters: JSON project file, CSV member/reaction
 * data, and SVG/PNG image capture of the canvas. The PDF calculation report
 * lives in `report.ts` (jsPDF).
 */

export function downloadText(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export function sanitize(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "truss";
}

/** Full project as JSON (re-importable). */
export function toJSON(truss: Truss): string {
  return JSON.stringify(truss, null, 2);
}

/** Member results + reactions as CSV. */
export function toCSV(
  truss: Truss,
  result: AnalysisResult,
  units: UnitSystem,
): string {
  const esc = (s: string) =>
    /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  const lines: string[] = [];

  lines.push("MEMBER RESULTS");
  lines.push(
    [
      "Member",
      "From",
      "To",
      `Length (${U.UNIT_LABELS[units].length})`,
      `Area (${U.UNIT_LABELS[units].area})`,
      `Axial (${U.UNIT_LABELS[units].force})`,
      "State",
      `Stress (${U.UNIT_LABELS[units].stress})`,
      "Utilization %",
      "FoS",
    ].join(","),
  );
  for (const m of truss.members) {
    const r = result.members.find((x) => x.memberId === m.id);
    if (!r) continue;
    lines.push(
      [
        m.id,
        m.from,
        m.to,
        stripUnit(U.fmtLength(r.length, units)),
        stripUnit(U.fmtArea(m.area, units)),
        r.axialForce.toFixed(1),
        r.state,
        stripUnit(U.fmtStress(r.stress, units)),
        (r.utilization * 100).toFixed(1),
        Number.isFinite(r.factorOfSafety) ? r.factorOfSafety.toFixed(2) : "inf",
      ]
        .map((v) => esc(String(v)))
        .join(","),
    );
  }

  lines.push("");
  lines.push("REACTIONS");
  lines.push(
    [
      "Joint",
      `Rx (${U.UNIT_LABELS[units].force})`,
      `Ry (${U.UNIT_LABELS[units].force})`,
    ].join(","),
  );
  for (const n of truss.nodes) {
    if (n.support === "none") continue;
    const nr = result.nodes.find((x) => x.nodeId === n.id);
    lines.push(
      [n.id, (nr?.rx ?? 0).toFixed(1), (nr?.ry ?? 0).toFixed(1)].join(","),
    );
  }

  lines.push("");
  lines.push("NODAL DISPLACEMENTS");
  lines.push(
    [
      "Joint",
      `ux (${U.UNIT_LABELS[units].length})`,
      `uy (${U.UNIT_LABELS[units].length})`,
    ].join(","),
  );
  for (const nr of result.nodes) {
    lines.push(
      [
        nr.nodeId,
        stripUnit(U.fmtLength(nr.ux, units, 3)),
        stripUnit(U.fmtLength(nr.uy, units, 3)),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function stripUnit(s: string): string {
  return s.replace(/[^0-9.eE+-].*$/, "").trim();
}

/** Serialize an SVG element to a standalone SVG string. */
export function svgElementToString(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // Inline a white background and resolve CSS var colors to concrete values so
  // the exported file renders standalone (outside the app's theme).
  const white = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const vbAttr = clone.getAttribute("viewBox")?.split(/\s+/).map(Number) ?? [
    0, 0, 100, 100,
  ];
  white.setAttribute("x", String(vbAttr[0]));
  white.setAttribute("y", String(vbAttr[1]));
  white.setAttribute("width", String(vbAttr[2]));
  white.setAttribute("height", String(vbAttr[3]));
  white.setAttribute("fill", "#ffffff");
  clone.insertBefore(white, clone.firstChild);
  resolveVars(clone);
  return new XMLSerializer().serializeToString(clone);
}

/** Replace var(--...) fills/strokes with resolved computed colors. */
function resolveVars(root: Element) {
  const styles = getComputedStyle(document.documentElement);
  const map: Record<string, string> = {
    "var(--color-primary)":
      styles.getPropertyValue("--color-primary").trim() || "#6366f1",
    "var(--color-border)": "#e2e8f0",
    "var(--color-muted-foreground)": "#64748b",
    "var(--color-surface)": "#ffffff",
    "var(--color-foreground)": "#0f172a",
  };
  const walk = (el: Element) => {
    for (const attr of ["fill", "stroke"]) {
      const v = el.getAttribute(attr);
      if (v && map[v]) el.setAttribute(attr, map[v]);
    }
    for (const child of Array.from(el.children)) walk(child);
  };
  walk(root);
}

/** Rasterize an SVG string to a PNG data URL at a DPI scale. */
export function svgToPng(
  svgString: string,
  width: number,
  height: number,
  scale = 3,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("no ctx"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("svg render failed"));
    };
    img.src = url;
  });
}

/** Parse a JSON project file back into a Truss (validated shape). */
export function parseProject(text: string): Truss {
  const data = JSON.parse(text) as Truss;
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.members)) {
    throw new Error("Not a valid truss project file.");
  }
  return {
    schemaVersion: 1,
    name: data.name || "Imported Truss",
    nodes: data.nodes,
    members: data.members,
    loads: Array.isArray(data.loads) ? data.loads : [],
    defaultMaterialId: data.defaultMaterialId || "steel-a36",
    defaultArea: data.defaultArea || 3.49e-4,
  };
}
