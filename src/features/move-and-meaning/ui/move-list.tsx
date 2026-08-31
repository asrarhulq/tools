"use client";

import { Flag } from "lucide-react";
import { STUDY_PALETTE } from "../config";
import { useMmStore } from "../store";
import type { MoveRecord } from "../types";

export function MoveList() {
  const history = useMmStore((s) => s.history);
  const cursorPly = useMmStore((s) => s.cursorPly);
  const goToPly = useMmStore((s) => s.goToPly);

  const rows: { num: number; white?: MoveRecord; black?: MoveRecord }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ num: i / 2 + 1, white: history[i], black: history[i + 1] });
  }

  return (
    <div
      className="max-h-64 overflow-y-auto rounded-lg border p-2"
      style={{
        borderColor: STUDY_PALETTE.border,
        backgroundColor: STUDY_PALETTE.panel,
      }}
    >
      {rows.length === 0 && (
        <p className="p-2 text-sm" style={{ color: STUDY_PALETTE.muted }}>
          No moves yet — play or import a game to begin.
        </p>
      )}
      {rows.map((row) => (
        <div key={row.num} className="flex items-center gap-1.5 py-0.5">
          <span
            className="w-6 shrink-0 font-mono text-xs"
            style={{ color: STUDY_PALETTE.muted }}
          >
            {row.num}.
          </span>
          {[row.white, row.black].map(
            (move, i) =>
              move && (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToPly(move.ply)}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-sm"
                  style={{
                    backgroundColor:
                      cursorPly === move.ply
                        ? STUDY_PALETTE.brassDim
                        : "transparent",
                    color: STUDY_PALETTE.text,
                  }}
                >
                  {move.san}
                  {move.flagged && (
                    <Flag
                      className="h-3 w-3"
                      style={{ color: STUDY_PALETTE.brass }}
                    />
                  )}
                </button>
              ),
          )}
        </div>
      ))}
    </div>
  );
}
