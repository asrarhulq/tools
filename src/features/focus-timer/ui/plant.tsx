"use client";

import { memo } from "react";
import type { PlantSpec } from "../lib/garden";

/**
 * A single SVG plant, drawn in a 0..24 (w) × 0..30 (h) box anchored at the
 * soil line (y=30). Stages add structure: a stem grows, leaves unfurl, then a
 * bud, then petals open into a bloom; a goal-met day gets a warm golden center.
 * Everything is derived from `spec` (deterministic) so it renders identically
 * on server and client; the container animates it rising from the soil.
 *
 * Colours use `currentColor` for foliage (so the parent can tint per-theme /
 * per-accent) and an explicit warm tone for blossoms.
 */
export const Plant = memo(function Plant({
  spec,
  bloomColor = "var(--color-primary)",
}: {
  spec: PlantSpec;
  bloomColor?: string;
}) {
  if (spec.stage === "empty") {
    // A bare tilled mound — a spot waiting to be grown.
    return (
      <svg viewBox="0 0 24 30" width="100%" height="100%" aria-hidden="true">
        <ellipse
          cx="12"
          cy="29"
          rx="6"
          ry="1.4"
          fill="currentColor"
          opacity="0.18"
        />
      </svg>
    );
  }

  const { growth, stage, goalMet, variety } = spec;
  const lean = (variety - 0.5) * 6; // -3..3 px sway at the tip
  const stemTopY = 30 - (8 + growth * 16); // taller with growth
  const tipX = 12 + lean;
  const petalColor = goalMet ? "var(--color-warn)" : bloomColor;

  const showLeaves = stage !== "sprout";
  const showBud = stage === "bud";
  const showBloom = stage === "bloom" || stage === "flourish";
  const petals = stage === "flourish" ? 6 : 5;

  return (
    <svg viewBox="0 0 24 30" width="100%" height="100%" aria-hidden="true">
      {/* soil */}
      <ellipse
        cx="12"
        cy="29"
        rx="6.5"
        ry="1.6"
        fill="currentColor"
        opacity="0.22"
      />

      {/* stem */}
      <path
        d={`M12 30 Q ${12 + lean * 0.4} ${(30 + stemTopY) / 2} ${tipX} ${stemTopY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />

      {/* leaves */}
      {showLeaves ? (
        <>
          <path
            d={`M12 24 q -7 -2 -8 -6 q 5 -1 8 4`}
            fill="currentColor"
            opacity="0.85"
          />
          <path
            d={`M12 20 q 7 -2 8 -6 q -5 -1 -8 4`}
            fill="currentColor"
            opacity="0.7"
          />
        </>
      ) : (
        // sprout: two tiny seed leaves
        <>
          <path d={`M12 26 q -4 -1 -5 -4 q 3 -1 5 2`} fill="currentColor" />
          <path
            d={`M12 26 q 4 -1 5 -4 q -3 -1 -5 2`}
            fill="currentColor"
            opacity="0.85"
          />
        </>
      )}

      {/* bud */}
      {showBud ? (
        <ellipse
          cx={tipX}
          cy={stemTopY}
          rx="2.4"
          ry="3.2"
          fill={petalColor}
          opacity="0.9"
        />
      ) : null}

      {/* bloom */}
      {showBloom ? (
        <g transform={`translate(${tipX} ${stemTopY})`}>
          {Array.from({ length: petals }).map((_, i) => {
            const a = (i / petals) * Math.PI * 2 + variety * Math.PI;
            const px = Math.cos(a) * 3.2;
            const py = Math.sin(a) * 3.2;
            return (
              <ellipse
                key={i}
                cx={px}
                cy={py}
                rx="2.3"
                ry="3.4"
                fill={petalColor}
                opacity={0.92}
                transform={`rotate(${(a * 180) / Math.PI} ${px} ${py})`}
              />
            );
          })}
          <circle
            r="2"
            fill={goalMet ? "var(--color-warn)" : "var(--color-surface)"}
            stroke={petalColor}
            strokeWidth="0.8"
          />
        </g>
      ) : null}
    </svg>
  );
});
