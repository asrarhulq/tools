// Small browser helpers: file downloads, SVG → PNG, CSV.
export function download(
  name: string,
  data: string | Blob,
  mime = "text/plain",
) {
  try {
    const blob =
      typeof data === "string"
        ? new Blob([data], { type: mime + ";charset=utf-8" })
        : data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch {
    /* ignore */
  }
}

export function svgToPng(
  svg: string,
  w: number,
  h: number,
  name: string,
  scale = 2,
) {
  const img = new Image();
  const url = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = w * scale;
    c.height = h * scale;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    c.toBlob((b) => {
      if (b) download(name, b, "image/png");
      URL.revokeObjectURL(url);
    }, "image/png");
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

export const csvCell = (v: string | number) => {
  const t = String(v ?? "");
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
export const toCsv = (rows: (string | number)[][]) =>
  rows.map((r) => r.map(csvCell).join(",")).join("\n");
