"use client";

import { useState } from "react";
import { STUDY_PALETTE } from "../config";
import { useMmStore } from "../store";
import { AnnotationPanel } from "./annotation-panel";
import { AssistToggle } from "./assist-toggle";
import { BestLinePanel } from "./best-line-panel";
import { FlagButton } from "./flag-button";
import { LensPromptCard } from "./lens-prompt-card";
import { LensSwitcher } from "./lens-switcher";
import { MotifBadges } from "./motif-badges";
import { ReflectionDiff } from "./reflection-diff";

type Tab = "philosophy" | "analysis" | "annotate";

const TABS: { id: Tab; label: string }[] = [
  { id: "philosophy", label: "Philosophy" },
  { id: "analysis", label: "Analysis" },
  { id: "annotate", label: "Annotate" },
];

export function SidePanelTabs({
  fen,
  engineVisible,
}: {
  fen: string;
  engineVisible: boolean;
}) {
  const [tab, setTab] = useState<Tab>("philosophy");
  const engineInfo = useMmStore((s) => s.engineInfo);
  const currentMove = useMmStore((s) => s.history[s.cursorPly - 1]);

  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: STUDY_PALETTE.border,
        backgroundColor: STUDY_PALETTE.panel,
      }}
    >
      <div
        className="mb-3 flex gap-1 border-b"
        style={{ borderColor: STUDY_PALETTE.border }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="px-3 py-2 text-sm font-medium"
            style={{
              color: tab === t.id ? STUDY_PALETTE.brass : STUDY_PALETTE.muted,
              borderBottom: `2px solid ${tab === t.id ? STUDY_PALETTE.brass : "transparent"}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "analysis" && (
        <div className="space-y-3">
          <AssistToggle />
          <BestLinePanel fen={fen} info={engineInfo} visible={engineVisible} />
          {currentMove && <MotifBadges motifs={currentMove.motifs} />}
          <ReflectionDiff />
        </div>
      )}
      {tab === "philosophy" && (
        <div className="space-y-3">
          <LensSwitcher />
          <LensPromptCard />
        </div>
      )}
      {tab === "annotate" && (
        <div className="space-y-3">
          <FlagButton />
          <AnnotationPanel />
        </div>
      )}
    </div>
  );
}
