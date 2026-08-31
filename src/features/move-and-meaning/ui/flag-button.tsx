"use client";

import { Flag } from "lucide-react";
import { STUDY_PALETTE } from "../config";
import { useMmStore } from "../store";

export function FlagButton() {
  const cursorPly = useMmStore((s) => s.cursorPly);
  const move = useMmStore((s) => s.history[s.cursorPly - 1]);
  const toggleFlag = useMmStore((s) => s.toggleFlag);

  if (!move) return null;

  return (
    <button
      type="button"
      onClick={() => toggleFlag(cursorPly)}
      className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors"
      style={{
        borderColor: STUDY_PALETTE.border,
        backgroundColor: move.flagged ? STUDY_PALETTE.brassDim : "transparent",
        color: STUDY_PALETTE.text,
      }}
    >
      <Flag
        className="h-3.5 w-3.5"
        fill={move.flagged ? STUDY_PALETTE.brass : "none"}
        style={{ color: STUDY_PALETTE.brass }}
      />
      {move.flagged ? "Critical moment" : "Mark critical"}
    </button>
  );
}
