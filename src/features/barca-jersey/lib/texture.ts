import * as THREE from "three";
import { V_CHEST, V_SHOULDER, V_UPPER_CHEST } from "./geometry";

/**
 * Paints one seamless, cylinder-wrapped jersey texture on a canvas: the
 * blaugrana vertical stripe pattern, collar/hem trim, a crest badge on the
 * front, and the wearer's name and number on the back. Drawn once per
 * name/number/palette change and handed to `JerseyModel` as a `CanvasTexture`
 * — no network fetch, no image assets, just 2D canvas drawing.
 *
 * The torso geometry (`lib/geometry.ts`) puts its texture seam (u=0/1) at
 * the body's side, so in this texture's own u/v space the front (where the
 * neckline dips, see `geometry.ts`) sits at `FRONT_U` and the back at
 * `BACK_U`, each a quarter-turn from the seam.
 */

export interface JerseyPalette {
  readonly stripeA: string;
  readonly stripeB: string;
  readonly trim: string;
  readonly crestShield: string;
  readonly crestGold: string;
  readonly ink: string;
}

export const BLAUGRANA: JerseyPalette = {
  stripeA: "#163f78",
  stripeB: "#9c1b4c",
  trim: "#f0b429",
  crestShield: "#f6f1e0",
  crestGold: "#f0b429",
  ink: "#0b1120",
};

const CANVAS_W = 2048;
const CANVAS_H = 1024;
const STRIPE_COUNT = 32;
const FRONT_U = 0.25;
const BACK_U = 0.75;

// Arc-length v (0 = hem, 1 = collar) for where the crest and the back print
// sit, translated to a canvas-y fraction below (`toCanvasY`). Flat body
// shading comes entirely from the mesh's own lighting — the texture itself
// stays flat-colored, so the stripes read as cloth, not a fluted column.
function toCanvasY(v: number): number {
  return (1 - v) * CANVAS_H;
}
const CREST_Y = toCanvasY(V_CHEST + (V_UPPER_CHEST - V_CHEST) * 0.45);
const NAME_Y = toCanvasY(V_UPPER_CHEST + (V_SHOULDER - V_UPPER_CHEST) * 0.35);
const NUMBER_Y = toCanvasY(V_CHEST * 0.98);

function drawStripes(ctx: CanvasRenderingContext2D, palette: JerseyPalette) {
  const stripeW = CANVAS_W / STRIPE_COUNT;
  for (let i = 0; i < STRIPE_COUNT; i++) {
    const x = i * stripeW;
    ctx.fillStyle = i % 2 === 0 ? palette.stripeA : palette.stripeB;
    ctx.fillRect(x, 0, stripeW + 0.5, CANVAS_H);
  }

  // A faint diagonal sheen across the chest only (front print region), echoing
  // the gradient panel on the current kit without disturbing the seam.
  const fx = FRONT_U * CANVAS_W;
  const sheen = ctx.createLinearGradient(fx - 260, 0, fx + 260, CANVAS_H);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0.06)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(fx - 300, 0, 600, CANVAS_H);
}

function drawTrimBands(ctx: CanvasRenderingContext2D, palette: JerseyPalette) {
  ctx.fillStyle = palette.trim;
  ctx.fillRect(0, CANVAS_H * 0.955, CANVAS_W, CANVAS_H * 0.045);
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H * 0.02);
}

function drawKnitNoise(ctx: CanvasRenderingContext2D) {
  // A faint, cheap "woven fabric" texture — small random flecks, additive.
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * CANVAS_W;
    const y = Math.random() * CANVAS_H;
    ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#000000";
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.restore();
}

function drawCrest(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  palette: JerseyPalette,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Shield outline.
  const w = 100;
  const h = 128;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2 + 14);
  ctx.lineTo(w / 2, -h / 2 + 14);
  ctx.lineTo(w / 2, h / 2 - 34);
  ctx.quadraticCurveTo(w / 2, h / 2 + 10, 0, h / 2 + 24);
  ctx.quadraticCurveTo(-w / 2, h / 2 + 10, -w / 2, h / 2 - 34);
  ctx.closePath();

  ctx.fillStyle = palette.crestShield;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = palette.ink;
  ctx.stroke();

  // Inner blaugrana stripes, clipped to the shield.
  ctx.save();
  ctx.clip();
  const innerStripes = 5;
  const stripeW = w / innerStripes;
  for (let i = 0; i < innerStripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? palette.stripeA : palette.stripeB;
    ctx.fillRect(-w / 2 + i * stripeW, -h / 2, stripeW, h * 0.78);
  }
  ctx.restore();

  // A thin gold seam marking where the stripes give way to the shield point.
  ctx.strokeStyle = palette.crestGold;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2 + h * 0.78);
  ctx.lineTo(w / 2, -h / 2 + h * 0.78);
  ctx.stroke();

  // A single gold star above the shield for the "exceptional" finish.
  drawStar(ctx, 0, -h / 2 - 20, 11, palette.crestGold);

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    const ox = Math.cos(outerAngle) * r;
    const oy = Math.sin(outerAngle) * r;
    const ix = Math.cos(innerAngle) * r * 0.42;
    const iy = Math.sin(innerAngle) * r * 0.42;
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawBackPrint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  nameY: number,
  numberY: number,
  name: string,
  number: string,
  palette: JerseyPalette,
) {
  const printName = name.trim() === "" ? "AYA HAMOUCHE" : name.toUpperCase();
  const printNumber =
    number.trim() === "" ? "10" : number.replace(/\D/g, "").slice(0, 2) || "10";

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Name, slightly arched by drawing letter-by-letter along a shallow curve.
  const letters = printName.split("");
  const letterSpacing = Math.min(46, 620 / Math.max(letters.length, 1));
  const totalWidth = letterSpacing * (letters.length - 1);
  ctx.font = "700 72px 'Arial Narrow', Arial, sans-serif";
  letters.forEach((letter, i) => {
    const x = cx - totalWidth / 2 + i * letterSpacing;
    const curveLift =
      Math.sin((i / Math.max(letters.length - 1, 1)) * Math.PI) * 14;
    const y = nameY - curveLift;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 8;
    ctx.strokeStyle = palette.ink;
    ctx.strokeText(letter, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(letter, 0, 0);
    ctx.restore();
  });

  // Number, large and centered below the name.
  ctx.font = "800 340px Arial, sans-serif";
  ctx.lineWidth = 14;
  ctx.strokeStyle = palette.ink;
  ctx.strokeText(printNumber, cx, numberY);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(printNumber, cx, numberY);

  ctx.restore();
}

const SLEEVE_CANVAS = 256;

/**
 * The sleeve's own small texture — solid body color with a gold trim band
 * near the cuff. `CylinderGeometry`'s default UV puts `v=0` at the
 * `radiusBottom` end, which is the cuff here (see `buildSleeveGeometry`),
 * so the trim sits near the canvas bottom (same v=0→bottom convention as
 * the torso texture, since `flipY` is on by default).
 */
export function createSleeveTexture(
  palette: JerseyPalette = BLAUGRANA,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = SLEEVE_CANVAS;
  canvas.height = SLEEVE_CANVAS;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  ctx.fillStyle = palette.stripeA;
  ctx.fillRect(0, 0, SLEEVE_CANVAS, SLEEVE_CANVAS);
  ctx.fillStyle = palette.trim;
  ctx.fillRect(0, SLEEVE_CANVAS * 0.86, SLEEVE_CANVAS, SLEEVE_CANVAS * 0.05);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * A cheap, tileable "woven fabric" bump map: a 12×12 tile with two
 * perforations repeated across a larger canvas. Applied as `bumpMap` on the
 * torso material only, it catches the studio lights as a faint knit
 * texture instead of a flat-painted surface.
 */
export function createKnitBumpTexture(): THREE.CanvasTexture {
  const tile = document.createElement("canvas");
  tile.width = 12;
  tile.height = 12;
  const tctx = tile.getContext("2d");
  if (!tctx) throw new Error("2D canvas context unavailable");
  tctx.fillStyle = "#9a9a9a";
  tctx.fillRect(0, 0, 12, 12);
  tctx.fillStyle = "#3a3a3a";
  tctx.beginPath();
  tctx.arc(3, 3, 1.5, 0, Math.PI * 2);
  tctx.fill();
  tctx.beginPath();
  tctx.arc(9, 9, 1.5, 0, Math.PI * 2);
  tctx.fill();

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  const pattern = ctx.createPattern(tile, "repeat");
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export interface CreateJerseyTextureOptions {
  readonly name: string;
  readonly number: string;
  readonly palette?: JerseyPalette;
}

export function createJerseyTexture({
  name,
  number,
  palette = BLAUGRANA,
}: CreateJerseyTextureOptions): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  drawStripes(ctx, palette);
  drawTrimBands(ctx, palette);
  drawCrest(ctx, FRONT_U * CANVAS_W - 170, CREST_Y, 0.95, palette);
  drawBackPrint(
    ctx,
    BACK_U * CANVAS_W,
    NAME_Y,
    NUMBER_Y,
    name,
    number,
    palette,
  );
  drawKnitNoise(ctx);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
