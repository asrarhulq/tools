"use client";

import { AnimatePresence, motion } from "framer-motion";
import { STUDY_PALETTE } from "../config";
import { generateLensPrompt, LENSES } from "../data/lenses";
import { fontSerif } from "../fonts";
import { materialBalance } from "../lib/chess-engine-adapter";
import { useMmStore } from "../store";
import type { PromptContext } from "../types";

// No opening-book database — a coarse ply cutoff stands in for "still in
// known theory" so lenses like Ryle/Wittgenstein can distinguish book play
// from novel positions without a real ECO lookup.
const BOOK_MOVE_PLY_CUTOFF = 8;

export function LensPromptCard() {
  const activeLensId = useMmStore((s) => s.activeLensId);
  const cursorPly = useMmStore((s) => s.cursorPly);
  const move = useMmStore((s) => s.history[s.cursorPly - 1]);
  const guess = useMmStore((s) => s.unassistedGuesses[s.cursorPly]);
  const response = useMmStore(
    (s) => s.lensResponses[`${s.cursorPly}:${s.activeLensId}`] ?? "",
  );
  const setLensResponse = useMmStore((s) => s.setLensResponse);

  const lens = LENSES.find((l) => l.id === activeLensId)!;

  const ctx: PromptContext = {
    ply: cursorPly,
    sanMove: move?.san ?? "",
    isBookMove: cursorPly > 0 && cursorPly <= BOOK_MOVE_PLY_CUTOFF,
    materialSwingCp: move
      ? materialBalance(move.fenAfter) - materialBalance(move.fenBefore)
      : 0,
    isCheck: move?.isCheck ?? false,
    isCapture: move?.isCapture ?? false,
    flaggedReason: move?.flagged
      ? move.comment || "a critical moment"
      : undefined,
    studentGuess: guess,
  };

  const prompt = move
    ? generateLensPrompt(activeLensId, ctx)
    : lens.defaultPrompt;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLensId}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.22 }}
        >
          <p
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: STUDY_PALETTE.brass }}
          >
            {lens.name} · {lens.frameworkTag}
          </p>
          <p
            className={`${fontSerif.className} mt-2 text-base leading-relaxed italic`}
            style={{ color: STUDY_PALETTE.text }}
          >
            {prompt}
          </p>
        </motion.div>
      </AnimatePresence>
      <textarea
        value={response}
        onChange={(e) =>
          setLensResponse(cursorPly, activeLensId, e.target.value)
        }
        placeholder="Write your reflection…"
        rows={5}
        className={`${fontSerif.className} w-full rounded-md border bg-transparent p-2 text-sm outline-none`}
        style={{ borderColor: STUDY_PALETTE.border, color: STUDY_PALETTE.text }}
      />
    </div>
  );
}
