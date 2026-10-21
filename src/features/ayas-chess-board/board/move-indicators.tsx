import type { Square } from "chess.js";
import type { Orientation } from "../lib/board-geometry";
import { squareToFraction } from "../lib/board-geometry";

interface MoveIndicatorsProps {
  targets: Square[];
  occupiedTargets: ReadonlySet<Square>;
  orientation: Orientation;
}

/**
 * A dark core with a light halo (not a tint of the board palette itself) —
 * the original single-tone pink dot nearly disappeared against this tool's
 * own pink-family board themes, since dot and square landed in the same
 * hue/lightness range. A two-tone marker reads on every palette regardless
 * of whether the square under it happens to be light or dark.
 */
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
              <div
                className="h-[82%] w-[82%] rounded-full"
                style={{
                  boxShadow:
                    "inset 0 0 0 5px rgba(74,44,58,0.75), inset 0 0 0 7px rgba(255,255,255,0.85)",
                }}
              />
            ) : (
              <div
                className="h-[32%] w-[32%] rounded-full"
                style={{
                  backgroundColor: "rgba(74,44,58,0.7)",
                  boxShadow: "0 0 0 2.5px rgba(255,255,255,0.85)",
                }}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
