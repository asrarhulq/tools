import type { Color, PieceSymbol, Square } from "chess.js";
import type { Orientation } from "../lib/board-geometry";
import { squareToFraction } from "../lib/board-geometry";
import { PieceIcon } from "./piece-svg";

interface PromotionPickerProps {
  square: Square;
  color: Color;
  orientation: Orientation;
  onPick: (piece: "q" | "r" | "b" | "n") => void;
  onCancel: () => void;
}

const CHOICES: PieceSymbol[] = ["q", "n", "r", "b"];

export function PromotionPicker({
  square,
  color,
  orientation,
  onPick,
  onCancel,
}: PromotionPickerProps) {
  const { xFrac, yFrac } = squareToFraction(square, orientation);
  const dropsUp = yFrac > 0.5;

  return (
    <>
      <div
        className="absolute inset-0 z-20"
        role="presentation"
        onClick={onCancel}
      />
      <div
        className="absolute z-30 flex flex-col overflow-hidden rounded-md border border-[#5b4630] bg-[#f3e8d2] shadow-xl"
        style={{
          left: `${xFrac * 100}%`,
          top: dropsUp ? undefined : `${yFrac * 100}%`,
          bottom: dropsUp ? `${100 - yFrac * 100}%` : undefined,
          width: "12.5%",
        }}
      >
        {CHOICES.map((piece) => (
          <button
            key={piece}
            type="button"
            onClick={() => onPick(piece as "q" | "r" | "b" | "n")}
            className="aspect-square w-full p-1 transition-colors hover:bg-[#e9dcc3]"
            aria-label={`Promote to ${piece}`}
          >
            <PieceIcon type={piece} color={color} size="100%" />
          </button>
        ))}
      </div>
    </>
  );
}
