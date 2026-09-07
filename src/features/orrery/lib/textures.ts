import * as THREE from "three";

/**
 * Small procedural canvas textures, generated once and cached — no external
 * image assets (no texture map to source/license/embed, and it keeps the
 * CSP simple: everything is generated client-side from `<canvas>`, nothing
 * fetched). Gas giants get a banded gradient; the Sun gets a speckled glow.
 * This is a deliberate stylistic choice over photorealistic textures, in
 * keeping with the rest of the site's illustrated-rather-than-photographic
 * visual language.
 */

const cache = new Map<string, THREE.CanvasTexture>();

export function getBandedTexture(
  id: string,
  stops: readonly string[],
): THREE.CanvasTexture {
  const cached = cache.get(id);
  if (cached) return cached;

  const width = 8;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  stops.forEach((color, i) =>
    gradient.addColorStop(i / (stops.length - 1), color),
  );
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.14;
  for (let i = 0; i < 50; i++) {
    const y = Math.random() * height;
    const bandHeight = 1 + Math.random() * 4;
    ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#000000";
    ctx.fillRect(0, y, width, bandHeight);
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(id, texture);
  return texture;
}

export function getSunTexture(): THREE.CanvasTexture {
  const cached = cache.get("sun-surface");
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  ctx.fillStyle = "#ffdf8a";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.6;
    ctx.fillStyle =
      Math.random() > 0.5 ? "rgba(255,225,150,0.5)" : "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set("sun-surface", texture);
  return texture;
}

/** A simple mottled/speckled surface for rocky bodies. */
export function getRockyTexture(
  id: string,
  baseColor: string,
): THREE.CanvasTexture {
  const cached = cache.get(id);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 5;
    ctx.fillStyle = Math.random() > 0.5 ? "#000000" : "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(id, texture);
  return texture;
}
