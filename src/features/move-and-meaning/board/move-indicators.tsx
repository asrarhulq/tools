import type { Square } from "chess.js";
import type { Orientation } from "../lib/board-geometry";
import { squareToFraction } from "../lib/board-geometry";

interface MoveIndicatorsProps {
  targets: Square[];
  occupiedTargets: ReadonlySet<Square>;
  orientation: Orientation;
}

export function MoveIndicators({
  targets,
  occupiedTargets,
  orientation,
}: MoveIndicatorsProps) {
  return (
    <>
      {targets.map((square) => {
        const { xFrac, yFrac } = squareToFraction(square, orientation);
        const isCapture = occupiedTargets.has(square);
        return (
          <div
            key={square}
            className="pointer-events-none absolute flex items-center justify-center"
            style={{
              left: `${xFrac * 100}%`,
              top: `${yFrac * 100}%`,
              width: "12.5%",
              height: "12.5%",
            }}
          >
            {isCapture ? (
              <div className="h-[85%] w-[85%] rounded-full ring-[6px] ring-black/30 ring-inset" />
            ) : (
              <div className="h-[28%] w-[28%] rounded-full bg-black/30" />
            )}
          </div>
        );
      })}
    </>
  );
}
