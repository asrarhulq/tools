"use client";

import { STUDY_PALETTE } from "../config";
import { fontSerif } from "../fonts";
import { materialBalance } from "../lib/chess-engine-adapter";
import { generateReflectiveDiff } from "../lib/reflective-diff";
import { useMmStore } from "../store";

/** Only appears once the student has switched back to assisted mode after guessing. */
export function ReflectionDiff() {
  const mode = useMmStore((s) => s.mode);
  const cursorPly = useMmStore((s) => s.cursorPly);
  const guess = useMmStore((s) => s.unassistedGuesses[s.cursorPly] ?? "");
  const info = useMmStore((s) => s.engineInfo);
  const move = useMmStore((s) => s.history[s.cursorPly - 1]);

  if (mode !== "assisted" || !guess.trim() || !move) return null;

  const diffText = generateReflectiveDiff({
    studentGuess: guess,
    info: info?.fen === move.fenAfter ? info : null,
    materialSwingCp:
      materialBalance(move.fenAfter) - materialBalance(move.fenBefore),
    isCapture: move.isCapture,
    isCheck: move.isCheck,
  });

  return (
    <div
      className="rounded-lg border p-3"
      style={{
        borderColor: STUDY_PALETTE.brassDim,
        backgroundColor: STUDY_PALETTE.panelAlt,
      }}
      key={cursorPly}
    >
      <p
        className="mb-1.5 text-xs font-semibold tracking-wide uppercase"
        style={{ color: STUDY_PALETTE.brass }}
      >
        Reflective diff
      </p>
      <p
        className={`${fontSerif.className} text-sm leading-relaxed italic`}
        style={{ color: STUDY_PALETTE.text }}
      >
        {diffText}
      </p>
    </div>
  );
}
