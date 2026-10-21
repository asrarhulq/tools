import type { Color, PieceSymbol } from "chess.js";
import { PieceIcon } from "../board/piece-svg";

interface CapturedTrayProps {
  captured: Record<Color, PieceSymbol[]>;
}

/** Two small rows of captured pieces — missing White pieces on top (taken
 * by Black), missing Black pieces below (taken by White). */
export function CapturedTray({ captured }: CapturedTrayProps) {
  if (captured.w.length === 0 && captured.b.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-[#f3d3dc] bg-white px-3 py-2">
      <Row color="w" pieces={captured.w} />
      <Row color="b" pieces={captured.b} />
    </div>
  );
}

function Row({ color, pieces }: { color: Color; pieces: PieceSymbol[] }) {
  if (pieces.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {pieces.map((type, i) => (
        <div key={i} className="size-5 opacity-80">
          <PieceIcon type={type} color={color} size="100%" />
        </div>
      ))}
    </div>
  );
}
