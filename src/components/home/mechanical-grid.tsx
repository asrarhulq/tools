"use client";

import { useEffect, useRef } from "react";

type Node = {
  hx: number; // home (resting) position
  hy: number;
  x: number; // current rendered position (eased)
  y: number;
  seed: number; // per-node phase so shimmer isn't synchronized
};

/**
 * Lightweight interactive "constellation" hero backdrop.
 *
 * A drifting lattice of dots + nearest-neighbour links. The pointer gently
 * brightens and nudges nearby nodes. Deliberately cheap: no per-node
 * shadowBlur, no O(n²) work, capped DPR, and it skips frames on small screens.
 *
 * Theme handling: the light/dark state is re-read from the <html> class **every
 * frame** (a trivial `classList.contains` check). That fixes the refresh bug
 * where the canvas mounted before next-themes applied the theme class — and it
 * also makes the grid recolour instantly when the user toggles the theme.
 * Dark → white dots; light → black dots.
 *
 * Decorative and `aria-hidden`.
 */
export function MechanicalGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ptr = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const vptr = useRef({ x: 0, y: 0, has: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const root = document.documentElement;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const REACH = 200; // px radius the pointer influences
    let raf = 0;
    let time = 0;
    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let cols = 0;

    const build = () => {
      // Coarser grid on small screens keeps node count (and cost) low.
      const spacing = width < 640 ? 74 : 66;
      nodes = [];
      cols = 0;
      let row = 0;
      for (let y = -spacing; y <= height + spacing; y += spacing) {
        let c = 0;
        for (let x = -spacing; x <= width + spacing; x += spacing) {
          nodes.push({
            hx: x,
            hy: y,
            x,
            y,
            seed: Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1,
          });
          c++;
        }
        if (row === 0) cols = c;
        row++;
      }
    };

    const setSize = () => {
      // Cap DPR at 1.5 — 2× on a high-density phone doubles fill cost for no
      // visible gain on a soft backdrop, and is a common cause of jank.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!vptr.current.has) {
        ptr.current.x = ptr.current.sx = width * 0.32;
        ptr.current.y = ptr.current.sy = height * 0.42;
      }
      build();
    };

    const syncPointer = () => {
      if (!vptr.current.has) return;
      const rect = canvas.getBoundingClientRect();
      ptr.current.x = vptr.current.x - rect.left;
      ptr.current.y = vptr.current.y - rect.top;
    };

    const onMove = (e: PointerEvent) => {
      vptr.current.x = e.clientX;
      vptr.current.y = e.clientY;
      vptr.current.has = true;
      syncPointer();
    };

    setSize();
    window.addEventListener("resize", setSize);
    window.addEventListener("scroll", syncPointer, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });

    const draw = () => {
      // Re-read theme each frame (cheap) so refresh + theme-toggle are correct.
      const isLight = root.classList.contains("dark")
        ? false
        : root.classList.contains("light")
          ? true
          : !window.matchMedia("(prefers-color-scheme: dark)").matches;
      const dot = isLight ? "0,0,0" : "255,255,255";

      ctx.clearRect(0, 0, width, height);

      ptr.current.sx += (ptr.current.x - ptr.current.sx) * 0.1;
      ptr.current.sy += (ptr.current.y - ptr.current.sy) * 0.1;
      const px = ptr.current.sx;
      const py = ptr.current.sy;

      // ── Update positions + energy (one pass, no shadow, no O(n²)) ─────────
      const energy = new Float32Array(nodes.length);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        const driftX = Math.sin(time * 0.6 + n.hy * 0.02) * 4;
        const driftY = Math.cos(time * 0.5 + n.hx * 0.018) * 4;
        let tx = n.hx + driftX;
        let ty = n.hy + driftY;

        const dx = tx - px;
        const dy = ty - py;
        const distSq = dx * dx + dy * dy;
        let e = 0;
        if (distSq < REACH * REACH) {
          const f = 1 - Math.sqrt(distSq) / REACH;
          e = f * f;
          const push = e * 12;
          const dist = Math.sqrt(distSq) || 1;
          tx += (dx / dist) * push;
          ty += (dy / dist) * push;
        }
        const shimmer =
          0.16 + Math.max(0, Math.sin(time * 1.1 + n.seed * 6.28)) * 0.12;
        energy[i] = e > shimmer ? e : shimmer;

        n.x += (tx - n.x) * 0.16;
        n.y += (ty - n.y) * 0.16;
      }

      // ── Links to right + down neighbours only (linear cost) ───────────────
      const linkBase = isLight ? 0.28 : 0.18;
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!;
        const ea = energy[i]!;
        // right
        if ((i + 1) % cols !== 0) {
          const b = nodes[i + 1];
          if (b) {
            const e = (ea + energy[i + 1]!) / 2;
            ctx.strokeStyle = `rgba(${dot},${e * linkBase + 0.025})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        // down
        const d = nodes[i + cols];
        if (d) {
          const e = (ea + energy[i + cols]!) / 2;
          ctx.strokeStyle = `rgba(${dot},${e * linkBase + 0.025})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }
      }

      // ── Nodes: flat filled dots, no shadowBlur ────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        const e = energy[i]!;
        const r = 1.4 + e * 3;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isLight
          ? `rgba(0,0,0,${0.65 + e * 0.35})`
          : `rgba(255,255,255,${0.5 + e * 0.5})`;
        ctx.fill();
      }

      time += 0.016;
      if (!prefersReduced) raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", setSize);
      window.removeEventListener("scroll", syncPointer);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 size-full"
    />
  );
}
