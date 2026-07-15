"use client";

import { useEffect, useRef } from "react";

type NodePoint = {
  x: number;
  y: number;
  intensity: number;
  tone: number;
};

/**
 * Animated "mechanical grid" hero backdrop: a drifting node network that lights
 * up around the pointer. Adapted to the site's design language —
 *
 *  - the canvas is fully **transparent** (no opaque fill), so it layers over the
 *    hero's own background and works in both light and dark themes;
 *  - colours are read from the live CSS theme tokens (drafting-blue primary +
 *    category accents) at mount, not hardcoded, so it recolours with the theme;
 *  - honours `prefers-reduced-motion` by rendering a single static frame;
 *  - listeners are cleaned up and the RAF cancelled on unmount.
 *
 * It is purely decorative and `aria-hidden`.
 */
export function MechanicalGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointer = useRef({ x: 0, y: 0, glow: 0.35 });
  const viewportPointer = useRef({ x: 0, y: 0, hasPointer: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolve theme colours to "r,g,b" strings from CSS custom properties so the
    // effect matches light/dark and the brand accent. Fallbacks cover SSR/parse.
    const readRGB = (value: string, fallback: string): string => {
      if (!value) return fallback;
      const probe = document.createElement("span");
      probe.style.color = value.trim();
      probe.style.display = "none";
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color; // → "rgb(r, g, b)"
      probe.remove();
      const m = resolved.match(/\d+(\.\d+)?/g);
      return m && m.length >= 3 ? `${m[0]},${m[1]},${m[2]}` : fallback;
    };

    const styles = getComputedStyle(document.documentElement);
    const palette = [
      readRGB(styles.getPropertyValue("--color-primary"), "56,189,248"),
      readRGB(styles.getPropertyValue("--color-accent"), "74,222,128"),
      readRGB(styles.getPropertyValue("--color-ok"), "34,197,94"),
    ];

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let animationFrameId = 0;
    let time = 0;
    let width = 0;
    let height = 0;

    const updatePointerFromViewport = () => {
      if (!viewportPointer.current.hasPointer) return;
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = viewportPointer.current.x - rect.left;
      pointer.current.y = viewportPointer.current.y - rect.top;
    };

    const setSize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      if (viewportPointer.current.hasPointer) updatePointerFromViewport();
      else {
        pointer.current.x = width / 2;
        pointer.current.y = height * 0.4;
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      viewportPointer.current.x = event.clientX;
      viewportPointer.current.y = event.clientY;
      viewportPointer.current.hasPointer = true;
      updatePointerFromViewport();
      pointer.current.glow = 1;
    };

    setSize();
    window.addEventListener("resize", setSize);
    window.addEventListener("scroll", updatePointerFromViewport, {
      passive: true,
    });
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    const drawGlow = () => {
      const gradient = ctx.createRadialGradient(
        pointer.current.x,
        pointer.current.y,
        0,
        pointer.current.x,
        pointer.current.y,
        Math.max(width, height) * 0.7,
      );
      gradient.addColorStop(
        0,
        `rgba(${palette[0]},${0.22 * pointer.current.glow})`,
      );
      gradient.addColorStop(0.5, `rgba(${palette[0]},0.04)`);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const draw = () => {
      const spacing = width < 640 ? 58 : 74;
      const radius = width < 640 ? 190 : 260;
      const nodes: NodePoint[] = [];

      ctx.clearRect(0, 0, width, height); // transparent — no opaque fill
      drawGlow();

      for (let x = -spacing; x <= width + spacing; x += spacing) {
        for (let y = -spacing; y <= height + spacing; y += spacing) {
          const wave = Math.sin(time + x * 0.012 + y * 0.006);
          const driftX = Math.sin(time * 0.8 + y * 0.02) * 4;
          const driftY = Math.cos(time * 0.7 + x * 0.018) * 4;
          const px = x + driftX;
          const py = y + driftY;
          const dx = pointer.current.x - px;
          const dy = pointer.current.y - py;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const pulse =
            Math.max(0, 1 - distance / radius) * pointer.current.glow;
          const ambient = 0.22 + Math.max(0, wave) * 0.18;
          nodes.push({
            x: px,
            y: py,
            intensity: Math.max(ambient, pulse),
            tone:
              Math.floor(Math.abs(x / spacing + y / spacing)) % palette.length,
          });
        }
      }

      // connections
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < spacing * 1.12) {
            const alpha =
              ((a.intensity + b.intensity) / 2) *
              (1 - distance / (spacing * 1.12));
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${palette[a.tone]},${0.12 + alpha * 0.5})`;
            ctx.lineWidth = 0.8 + alpha * 1.6;
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const node of nodes) {
        const color = palette[node.tone]!;
        const glow = node.intensity;
        const armAngle = time * 1.4 + (node.x + node.y) * 0.008;
        const nodeRadius = 2 + glow * 3;

        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color},${0.12 + glow * 0.32})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(
          node.x + Math.cos(armAngle) * (7 + glow * 8),
          node.y + Math.sin(armAngle) * (7 + glow * 8),
        );
        ctx.strokeStyle = `rgba(${color},${0.2 + glow * 0.6})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${0.5 + glow * 0.5})`;
        ctx.shadowBlur = 8 + glow * 26;
        ctx.shadowColor = `rgba(${color},0.85)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      pointer.current.glow = Math.max(0.5, pointer.current.glow * 0.94);
      time += 0.018;
      if (!prefersReduced) animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", setSize);
      window.removeEventListener("scroll", updatePointerFromViewport);
      window.removeEventListener("pointermove", handlePointerMove);
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
