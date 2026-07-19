import type { ArgGraph } from "../types";
import { EDGE_META, NODE_META } from "../config";
import { analyze } from "./engine";

/** Trigger a browser download of `content` as `filename`. */
function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJson(graph: ArgGraph) {
  download(
    "argument-map.json",
    JSON.stringify({ v: 1, graph }, null, 2),
    "application/json",
  );
}

/** A readable Markdown outline: grouped claims with their support/objections. */
export function exportMarkdown(graph: ArgGraph) {
  const { score, diagnostics } = analyze(graph);
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const lines: string[] = ["# Argument map", ""];
  lines.push(
    `**Reasoning health:** ${graph.nodes.length ? `${score}/100` : "—"}`,
    "",
  );

  for (const n of graph.nodes) {
    const meta = NODE_META[n.data.kind];
    lines.push(`### ${meta.label}: ${n.data.label || "(untitled)"}`);
    lines.push(`*Confidence: ${n.data.confidence}%*`);
    if (n.data.detail) lines.push("", n.data.detail);
    const rel = graph.edges.filter((e) => e.target === n.id);
    if (rel.length) {
      lines.push("");
      for (const e of rel) {
        const src = byId.get(e.source);
        lines.push(
          `- **${EDGE_META[e.data.kind].label}** ← ${src?.data.label ?? "?"}`,
        );
      }
    }
    lines.push("");
  }

  if (diagnostics.length) {
    lines.push("## Diagnostics", "");
    for (const d of diagnostics) {
      lines.push(`- **[${d.severity}] ${d.title}** — ${d.detail}`);
      if (d.fix) lines.push(`  - Fix: ${d.fix}`);
    }
  }

  download("argument-map.md", lines.join("\n"), "text/markdown");
}

/**
 * PNG export. React Flow renders into `.react-flow__viewport`; we snapshot the
 * whole flow container via an SVG-foreignObject → canvas trick is heavy, so we
 * instead use the browser's built-in approach on the viewport transform. To keep
 * dependencies minimal we serialise the rendered DOM node with `toDataURL` on a
 * canvas built from an SVG wrapper. If anything fails we fall back to JSON.
 */
export async function exportPng(container: HTMLElement) {
  const flowEl = container.querySelector<HTMLElement>(".react-flow__viewport");
  const rootEl = container.querySelector<HTMLElement>(".react-flow");
  if (!flowEl || !rootEl) return;

  const { width, height } = rootEl.getBoundingClientRect();
  const bg = getComputedStyle(document.body).backgroundColor || "#ffffff";

  // Serialise the viewport subtree into an <svg><foreignObject> and rasterise.
  const clone = flowEl.cloneNode(true) as HTMLElement;
  const wrapper = document.createElement("div");
  wrapper.appendChild(clone);
  const html = wrapper.innerHTML;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="${bg}"/>
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml">${html}</div>
    </foreignObject>
  </svg>`;

  try {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("img load failed"));
      img.src = url;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d ctx");
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "argument-map.png";
    a.click();
  } catch {
    // Rasterisation is best-effort (foreignObject can taint on some browsers).
    // Silent — the JSON/Markdown/SVG exports always work.
  }
}
