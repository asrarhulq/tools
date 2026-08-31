import { STUDY_PALETTE } from "../config";
import { uciLineToSan } from "../lib/stockfish/uci-to-san";
import { useMmStore } from "../store";
import type { UciInfo } from "../types";

interface BestLinePanelProps {
  fen: string;
  info: UciInfo | null;
  visible: boolean;
}

export function BestLinePanel({ fen, info, visible }: BestLinePanelProps) {
  const engineStatus = useMmStore((s) => s.engineStatus);

  if (!visible) {
    return (
      <p className="text-sm italic" style={{ color: STUDY_PALETTE.muted }}>
        Engine hidden — record your own read of the position first.
      </p>
    );
  }
  if (engineStatus === "loading") {
    return (
      <p className="text-sm" style={{ color: STUDY_PALETTE.muted }}>
        Loading the chess engine (~7MB, first time only)…
      </p>
    );
  }
  if (!info) {
    return (
      <p className="text-sm" style={{ color: STUDY_PALETTE.muted }}>
        Analyzing…
      </p>
    );
  }

  const sanLine = uciLineToSan(fen, info.pvUci, 6).join(" ");
  return (
    <div className="space-y-1">
      <p className="text-sm" style={{ color: STUDY_PALETTE.text }}>
        {sanLine || "—"}
      </p>
      <p className="font-mono text-xs" style={{ color: STUDY_PALETTE.muted }}>
        depth {info.depth}
      </p>
    </div>
  );
}
