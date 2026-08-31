"use client";

import { STUDY_PALETTE } from "../config";
import { useMmStore } from "../store";

export function AnnotationPanel() {
  const cursorPly = useMmStore((s) => s.cursorPly);
  const move = useMmStore((s) => s.history[s.cursorPly - 1]);
  const setComment = useMmStore((s) => s.setComment);

  if (!move) {
    return (
      <p className="text-sm italic" style={{ color: STUDY_PALETTE.muted }}>
        Play or select a move to annotate it.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: STUDY_PALETTE.text }}>
        Note on {move.san} (move {move.ply})
      </p>
      <textarea
        value={move.comment}
        onChange={(e) => setComment(cursorPly, e.target.value)}
        placeholder="What's happening here? This becomes a PGN comment."
        rows={4}
        className="w-full rounded-md border bg-transparent p-2 text-sm outline-none"
        style={{ borderColor: STUDY_PALETTE.border, color: STUDY_PALETTE.text }}
      />
    </div>
  );
}
