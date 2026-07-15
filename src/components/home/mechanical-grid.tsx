"use client";

import { useEffect, useRef } from "react";

type Node = {
  /** Home position (the resting lattice point). */
  hx: number;
  hy: number;
  /** Current rendered position (eased toward home + parallax). */
  x: number;
  y: number;
  tone: number;
  /** Per-node phase so pulses aren't synchronized. */
  seed: number;
};

/**
 * Interactive "constellation" hero backdrop.
 *
 * A lattice of nodes rests on a grid and drifts gently. The pointer is a light
 * source: nearby nodes brighten, swell, sprout links to their neighbours, and
 * are gently pushed outward (parallax), so the cursor visibly *carves* a living
 * region through the field. Everything is drawn with `lighter` compositing for
 * a luminous, additive look — and crucially there is **no full-canvas colour
 * wash**, so the grid never gets muddied by a flat blue overlay.
 *
 * Design-system aware: fully transparent canvas, colours read from the live
 * theme tokens (so it recolours for light/dark and the brand accent), honours
 * `prefers-reduced-motion`, and cleans up all listeners + RAF on unmount.
 * Decorative and `aria-hidden`.
 */
export function MechanicalGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Pointer in canvas space + a smoothed copy for buttery trailing.
  const ptr = useRef({ x: 0, y: 0, sx: 0, sy: 0, active: false });
  const vptr = useRef({ x: 0, y: 0, has: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolve a CSS token to an "r,g,b" triple via a probe element.
    const readRGB = (value: string, fallback: string): string => {
      if (!value) return fallback;
      const probe = document.createElement("span");
      probe.style.color = value.trim();
      probe.style.display = "none";
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      const m = resolved.match(/\d+(\.\d+)?/g);
      return m && m.length >= 3 ? `${m[0]},${m[1]},${m[2]}` : fallback;
    };

    // A multi-hue palette from the four category accents (violet / blue / green
    // / amber) so the constellation reads as a varied, vivid field rather than a
    // monochrome blue wash. oklch() values resolve to rgb via the probe.
    const palette = [
      readRGB("oklch(0.62 0.19 300)", "168,85,247"), // philosophy · violet
      readRGB("oklch(0.62 0.17 240)", "56,189,248"), // engineering · blue
      readRGB("oklch(0.66 0.17 150)", "45,212,191"), // economics · green
      readRGB("oklch(0.68 0.16 60)", "245,158,11"), // general · amber
    ];
    // Detect light mode from the theme class on <html> (next-themes stamps
    // "light"/"dark"). NB: reading --color-background and parsing it fails here
    // because the token resolves to a `lab(...)` string, not `rgb(...)`.
    const root = document.documentElement;
    const isLight = root.classList.contains("light")
      ? true
      : root.classList.contains("dark")
        ? false
        : !window.matchMedia("(prefers-color-scheme: dark)").matches;

    // In light mode the whole network renders in black (ink) for a crisp
    // blueprint look; in dark mode each node keeps its category-accent hue.
    const strokeOf = (tone: number) => (isLight ? "0,0,0" : palette[tone]!);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const REACH = 220; // px radius the pointer influences
    let raf = 0;
    let time = 0;
    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let cols = 0;

    // Floating glowing particles (motes drifting upward).
    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      tone: number;
    };
    let particles: Particle[] = [];

    // Tiny engineering equations that fade in/out at random spots.
    type Formula = {
      text: string;
      x: number;
      y: number;
      tone: number;
      /** life 0→1→0 controls fade; born gives phase. */
      born: number;
      dur: number;
      /** per-formula phase for the sideways drift sway. */
      seed: number;
    };
    let formulas: Formula[] = [];
    const FORMULAE = [
      "σ = M·c / I",
      "F = ma",
      "∮ E·dl = −dΦ/dt",
      "∇·E = ρ/ε₀",
      "Δx·Δp ≥ ℏ/2",
      "EI·v'''' = w(x)",
      "V = IR",
      "e^{iπ} + 1 = 0",
      "τ = r × F",
      "Re = ρvL/μ",
      "PV = nRT",
      "λ = h/p",
      "∑F = 0",
      "f = 1/2π·√(k/m)",
      "a² + b² = c²",
    ];

    // Simple seeded-ish rng seeded once (client-only canvas, no SSR mismatch).
    const rand = () => Math.random();

    const build = () => {
      const spacing = width < 640 ? 52 : 66;
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
            tone: (row + c) % palette.length,
            seed: (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1,
          });
          c++;
        }
        if (row === 0) cols = c;
        row++;
      }
    };

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

      // Seed particles proportional to area (capped for perf).
      const count = Math.min(46, Math.round((width * height) / 26000));
      particles = Array.from({ length: count }, () => ({
        x: rand() * width,
        y: rand() * height,
        vx: (rand() - 0.5) * 0.25,
        vy: -0.15 - rand() * 0.35, // drift upward
        r: 0.6 + rand() * 1.8,
        tone: Math.floor(rand() * palette.length),
      }));

      // Seed a few formulas with staggered lifetimes.
      const fCount = width < 640 ? 3 : 6;
      // Staggered lifetimes so they don't all appear/vanish together.
      formulas = Array.from({ length: fCount }, () => ({
        text: FORMULAE[Math.floor(rand() * FORMULAE.length)]!,
        x: rand() * width,
        y: rand() * height,
        tone: Math.floor(rand() * palette.length),
        born: time - rand() * 6,
        dur: 5 + rand() * 5,
        seed: rand(),
      }));
    };

    const respawnFormula = (f: Formula) => {
      f.text = FORMULAE[Math.floor(rand() * FORMULAE.length)]!;
      f.x = rand() * width;
      f.y = rand() * height;
      f.tone = Math.floor(rand() * palette.length);
      f.born = time;
      f.dur = 5 + rand() * 5;
      f.seed = rand();
    };

    const syncPointer = () => {
      if (!vptr.current.has) return;
      const rect = canvas.getBoundingClientRect();
      ptr.current.x = vptr.current.x - rect.left;
      ptr.current.y = vptr.current.y - rect.top;
      ptr.current.active =
        ptr.current.x >= -REACH &&
        ptr.current.x <= width + REACH &&
        ptr.current.y >= -REACH &&
        ptr.current.y <= height + REACH;
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
      ctx.clearRect(0, 0, width, height);

      // Smooth (trail) the pointer for fluid motion.
      ptr.current.sx += (ptr.current.x - ptr.current.sx) * 0.12;
      ptr.current.sy += (ptr.current.y - ptr.current.sy) * 0.12;
      const px = ptr.current.sx;
      const py = ptr.current.sy;

      ctx.globalCompositeOperation = isLight ? "source-over" : "lighter";

      // ── Blueprint contour lines: slow-flowing horizontal isolines that
      //    ripple like a topographic / FEA field, drifting over time ─────────
      {
        const bands = 5;
        const step = 22;
        for (let b = 0; b < bands; b++) {
          const baseY = ((b + 0.5) / bands) * height;
          const tone = strokeOf(b % palette.length);
          const amp = 26 + (b % 3) * 10;
          const phase = time * 0.35 + b * 1.7;
          ctx.beginPath();
          for (let x = 0; x <= width; x += step) {
            const y =
              baseY +
              Math.sin(x * 0.006 + phase) * amp +
              Math.sin(x * 0.017 - phase * 1.3) * (amp * 0.35);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `rgba(${tone},${isLight ? 0.06 : 0.05})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // ── Update node positions + per-node energy ──────────────────────────
      const energy = new Float32Array(nodes.length);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        // Ambient drift.
        const driftX = Math.sin(time * 0.7 + n.hy * 0.02) * 5;
        const driftY = Math.cos(time * 0.6 + n.hx * 0.018) * 5;
        let tx = n.hx + driftX;
        let ty = n.hy + driftY;

        // Pointer influence: brighten + push outward (parallax).
        const dx = tx - px;
        const dy = ty - py;
        const dist = Math.hypot(dx, dy);
        let e = 0;
        if (dist < REACH) {
          const f = 1 - dist / REACH; // 1 at cursor → 0 at edge
          e = f * f; // ease
          const push = e * 16; // parallax displacement
          const inv = dist > 0.01 ? 1 / dist : 0;
          tx += dx * inv * push;
          ty += dy * inv * push;
        }
        // Ambient shimmer keeps the field alive even away from the pointer.
        const shimmer =
          0.2 + Math.max(0, Math.sin(time * 1.3 + n.seed * 6.28)) * 0.16;
        energy[i] = Math.max(shimmer, e);

        // Ease rendered position toward target.
        n.x += (tx - n.x) * 0.18;
        n.y += (ty - n.y) * 0.18;
      }

      // ── Connections (only to right + down neighbours: no O(n²)) ───────────
      const linkAlphaBase = isLight ? 0.35 : 0.22;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!;
        const ea = energy[i]!;
        const right = i + 1;
        const down = i + cols;
        for (const j of [right, down] as const) {
          const b = nodes[j];
          if (!b) continue;
          // Don't wrap rows for the "right" neighbour.
          if (j === right && (i + 1) % cols === 0) continue;
          const eb = energy[j]!;
          const e = (ea + eb) / 2;
          const alpha = e * linkAlphaBase + 0.03;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${strokeOf(a.tone)},${alpha})`;
          ctx.lineWidth = 0.6 + e * 1.4;
          ctx.stroke();
        }
      }

      // ── Bright cursor-linked constellation: link near-cursor nodes to each
      //    other so the pointer region reads as a dense, alive cluster ───────
      if (ptr.current.active) {
        const near: number[] = [];
        for (let i = 0; i < nodes.length; i++) {
          if (Math.hypot(nodes[i]!.x - px, nodes[i]!.y - py) < REACH * 0.55)
            near.push(i);
        }
        for (let m = 0; m < near.length; m++) {
          for (let k = m + 1; k < near.length; k++) {
            const a = nodes[near[m]!]!;
            const b = nodes[near[k]!]!;
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 120) {
              const alpha = (1 - d / 120) * (isLight ? 0.5 : 0.4);
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(${strokeOf(a.tone)},${alpha})`;
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }
          }
        }
      }

      // ── Nodes ─────────────────────────────────────────────────────────────
      // Same size + behaviour in both themes; only the colour differs.
      // Dark: glowing white dots. Light: solid black dots (no glow).
      const core = isLight ? "0,0,0" : "255,255,255";
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]!;
        const e = energy[i]!;
        const color = strokeOf(n.tone);
        const r = 1.4 + e * 3.6;

        if (!isLight && e > 0.2) {
          // Coloured glow halo (dark mode only) keeps the multi-hue identity.
          ctx.shadowBlur = 6 + e * 22;
          ctx.shadowColor = `rgba(${color},0.9)`;
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isLight
          ? "#000000"
          : `rgba(${core},${0.55 + e * 0.45})`;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Halo ring on energized nodes.
        if (e > 0.4) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 4 + e * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${color},${(e - 0.4) * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // ── Glowing particles: soft motes drifting upward, brightening near the
      //    pointer, wrapping when they leave the field ──────────────────────
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (!prefersReduced) {
          // wrap
          if (p.y < -10) {
            p.y = height + 10;
            p.x = rand() * width;
          }
          if (p.x < -10) p.x = width + 10;
          else if (p.x > width + 10) p.x = -10;
        }
        const near = 1 - Math.min(1, Math.hypot(p.x - px, p.y - py) / REACH);
        const glow = 0.3 + near * 0.7;
        const color = palette[p.tone]!;
        if (!isLight) {
          ctx.shadowBlur = 4 + near * 16;
          ctx.shadowColor = `rgba(${color},0.9)`;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + near * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${core},${(isLight ? 0.4 : 0.6) * glow})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Equations: fade in, hold, fade out — now larger and slowly
      //    drifting (upward + a gentle sideways sway) before respawning ───────
      ctx.textBaseline = "middle";
      const fontPx = isLight ? 20 : 15;
      for (const f of formulas) {
        const age = time - f.born;
        if (age > f.dur) {
          respawnFormula(f);
          continue;
        }
        const t = age / f.dur;
        // triangular fade: 0 → peak at 0.5 → 0
        const fade = Math.sin(Math.PI * t);
        // Slow drift: rise and sway over the formula's lifetime.
        const driftY = -age * 8;
        const driftX = Math.sin(age * 0.6 + f.seed * 6.28) * 10;
        const fx = f.x + driftX;
        const fy = f.y + driftY;
        const near =
          1 - Math.min(1, Math.hypot(fx - px, fy - py) / (REACH * 1.3));
        const alpha = fade * (0.22 + near * 0.5) * (isLight ? 1 : 0.9);
        const color = strokeOf(f.tone);
        ctx.font = `600 ${fontPx}px var(--font-mono, ui-monospace), "Geist Mono", monospace`;
        ctx.fillStyle = `rgba(${color},${alpha})`;
        ctx.fillText(f.text, fx, fy);
      }

      ctx.globalCompositeOperation = "source-over";
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
