"use client";

import { STUDY_PALETTE } from "../config";
import { useMmStore } from "../store";

export function AssistToggle() {
  const mode = useMmStore((s) => s.mode);
  const setMode = useMmStore((s) => s.setMode);
  const cursorPly = useMmStore((s) => s.cursorPly);
  const guess = useMmStore((s) => s.unassistedGuesses[s.cursorPly] ?? "");
  const setUnassistedGuess = useMmStore((s) => s.setUnassistedGuess);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={mode === "assisted"}
          aria-label="Toggle engine analysis"
          onClick={() =>
            setMode(mode === "assisted" ? "unassisted" : "assisted")
          }
          className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
          style={{
            backgroundColor:
              mode === "assisted" ? STUDY_PALETTE.brass : STUDY_PALETTE.border,
          }}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full transition-transform"
            style={{
              backgroundColor: STUDY_PALETTE.background,
              transform:
                mode === "assisted" ? "translateX(22px)" : "translateX(2px)",
            }}
          />
        </button>
        <span className="text-sm" style={{ color: STUDY_PALETTE.text }}>
          {mode === "assisted"
            ? "Analyze with engine"
            : "Analyze without engine"}
        </span>
      </div>

      {mode === "unassisted" && cursorPly > 0 && (
        <div className="space-y-1">
          <label className="text-xs" style={{ color: STUDY_PALETTE.muted }}>
            What do you think is happening here, before checking?
          </label>
          <textarea
            value={guess}
            onChange={(e) => setUnassistedGuess(cursorPly, e.target.value)}
            rows={3}
            className="w-full rounded-md border bg-transparent p-2 text-sm outline-none"
            style={{
              borderColor: STUDY_PALETTE.border,
              color: STUDY_PALETTE.text,
            }}
          />
        </div>
      )}
    </div>
  );
}
