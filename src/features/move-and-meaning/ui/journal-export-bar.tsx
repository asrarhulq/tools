"use client";

import { useShallow } from "zustand/react/shallow";
import { STUDY_PALETTE } from "../config";
import { buildJournalModel } from "../report/journal-model";
import { downloadJournalMarkdown } from "../report/journal-markdown";
import { generateJournalReport } from "../report/journal-pdf";
import { useMmStore } from "../store";

export function JournalExportBar() {
  const state = useMmStore(
    useShallow((s) => ({
      pgnHeaders: s.pgnHeaders,
      history: s.history,
      mode: s.mode,
      unassistedGuesses: s.unassistedGuesses,
      lensResponses: s.lensResponses,
    })),
  );

  const buttonStyle = {
    borderColor: STUDY_PALETTE.brassDim,
    color: STUDY_PALETTE.brass,
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => downloadJournalMarkdown(buildJournalModel(state))}
        className="rounded-md border px-2.5 py-1.5 text-xs font-medium"
        style={buttonStyle}
      >
        Export journal (Markdown)
      </button>
      <button
        type="button"
        onClick={() => generateJournalReport(buildJournalModel(state))}
        className="rounded-md border px-2.5 py-1.5 text-xs font-medium"
        style={buttonStyle}
      >
        Export journal (PDF)
      </button>
    </div>
  );
}
