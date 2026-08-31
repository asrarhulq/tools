"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { STUDY_PALETTE, SWING_THRESHOLD_CP } from "../config";
import { useMmStore } from "../store";
import type { UciInfo } from "../types";

interface EvalBarProps {
  visible: boolean;
}

function evalToWhiteFraction(info: UciInfo | null): number {
  if (!info) return 0.5;
  if (info.scoreMate !== null) return info.scoreMate > 0 ? 0.97 : 0.03;
  const cp = info.scoreCp ?? 0;
  const clamped = Math.max(-800, Math.min(800, cp));
  return 0.5 + clamped / 1600;
}

function formatEvalLabel(info: UciInfo): string {
  if (info.scoreMate !== null) return `M${Math.abs(info.scoreMate)}`;
  const pawns = (info.scoreCp ?? 0) / 100;
  return `${pawns > 0 ? "+" : ""}${pawns.toFixed(1)}`;
}

/**
 * A vertical eval bar with a brief amber glow on a significant swing. Reads
 * `engineInfo` straight from the store (rather than as a prop) so its rapid
 * updates during "thinking" only re-render this bar, not the whole tool —
 * ChessBoard sits as a sibling and would otherwise re-render (and visibly
 * jitter its `layout`-animated pieces) on every one of those ticks.
 */
export function EvalBar({ visible }: EvalBarProps) {
  const info = useMmStore((s) => s.engineInfo);
  const [glow, setGlow] = useState(false);
  const prevCpRef = useRef<number | null>(null);

  useEffect(() => {
    const cp = info?.scoreCp ?? null;
    if (cp === null) return;
    const prev = prevCpRef.current;
    prevCpRef.current = cp;
    if (prev !== null && Math.abs(cp - prev) >= SWING_THRESHOLD_CP) {
      setGlow(true);
      const timer = setTimeout(() => setGlow(false), 900);
      return () => clearTimeout(timer);
    }
  }, [info?.scoreCp]);

  const whiteFrac = evalToWhiteFraction(info);
  const label = !visible ? "•" : info ? formatEvalLabel(info) : "…";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative h-56 w-6 overflow-hidden rounded-full border"
        style={{
          borderColor: STUDY_PALETTE.border,
          backgroundColor: "#241708",
        }}
      >
        {visible && (
          <motion.div
            className="absolute bottom-0 left-0 w-full"
            style={{
              backgroundColor: "#f3e8d2",
              boxShadow: glow
                ? `0 0 18px 4px ${STUDY_PALETTE.amberGlow}`
                : undefined,
            }}
            animate={{ height: `${whiteFrac * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        )}
      </div>
      <span
        className="font-mono text-xs"
        style={{ color: STUDY_PALETTE.muted }}
      >
        {label}
      </span>
    </div>
  );
}
