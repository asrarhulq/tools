import type { Color, PieceSymbol } from "chess.js";

/**
 * An original, minimalist geometric piece set — deliberately not Cburnett or
 * Merida (both carry CC BY-SA attribution/share-alike obligations). Each
 * piece is built from simple primitives (circles, polygons, rects) rather
 * than hand-drawn bezier art, which keeps every glyph legible at small board
 * sizes and fits the "study room" aesthetic better than a borrowed classic
 * set would.
 */

interface PieceIconProps {
  type: PieceSymbol;
  color: Color;
  size: number | string;
}

const LIGHT = { fill: "#f3e8d2", stroke: "#5b4630" };
const DARK = { fill: "#3a2a1c", stroke: "#e9dcc3" };

function Base() {
  return <rect x={22} y={82} width={56} height={8} rx={2} />;
}

function Shadow() {
  return <ellipse cx={50} cy={88} rx={24} ry={5} fill="black" opacity={0.22} />;
}

function Pawn() {
  return (
    <>
      <circle cx={50} cy={34} r={11} />
      <polygon points="44,46 56,46 63,80 37,80" />
      <Base />
    </>
  );
}

function Knight() {
  return (
    <>
      <polygon points="34,80 34,60 30,45 38,25 34,14 44,22 50,12 58,24 74,30 78,38 70,42 66,50 70,60 66,80" />
      <circle cx={56} cy={34} r={2.6} className="fill-current opacity-40" />
      <Base />
    </>
  );
}

function Bishop() {
  return (
    <>
      <circle cx={50} cy={20} r={6} />
      <path d="M50 28 C62 34 66 50 58 62 C66 66 70 74 70 80 L30 80 C30 74 34 66 42 62 C34 50 38 34 50 28 Z" />
      <line
        x1={43}
        y1={45}
        x2={57}
        y2={51}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Base />
    </>
  );
}

function Rook() {
  return (
    <>
      <rect x={32} y={26} width={8} height={20} />
      <rect x={46} y={26} width={8} height={20} />
      <rect x={60} y={26} width={8} height={20} />
      <rect x={32} y={40} width={36} height={42} />
      <Base />
    </>
  );
}

function Queen() {
  return (
    <>
      <polygon points="34,50 38,36 44,48 50,30 56,48 62,36 66,50" />
      <circle cx={38} cy={34} r={3} />
      <circle cx={50} cy={28} r={3.5} />
      <circle cx={62} cy={34} r={3} />
      <polygon points="38,82 62,82 56,50 44,50" />
      <Base />
    </>
  );
}

function King() {
  return (
    <>
      <rect x={48} y={18} width={4} height={16} />
      <rect x={42} y={24} width={16} height={4} />
      <rect x={34} y={44} width={32} height={8} rx={1} />
      <polygon points="38,82 62,82 58,52 42,52" />
      <Base />
    </>
  );
}

const PIECES: Record<PieceSymbol, () => React.JSX.Element> = {
  p: Pawn,
  n: Knight,
  b: Bishop,
  r: Rook,
  q: Queen,
  k: King,
};

export function PieceIcon({ type, color, size }: PieceIconProps) {
  const palette = color === "w" ? LIGHT : DARK;
  const Glyph = PIECES[type];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={palette.fill}
      stroke={palette.stroke}
      strokeWidth={2.5}
      strokeLinejoin="round"
      className="pointer-events-none drop-shadow-sm select-none"
      aria-hidden="true"
    >
      <Shadow />
      <Glyph />
    </svg>
  );
}
