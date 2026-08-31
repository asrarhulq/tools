import { STUDY_PALETTE } from "../config";
import type { MotifTag } from "../types";

const LABELS: Record<MotifTag, string> = {
  pin: "Pin",
  skewer: "Skewer",
  fork: "Fork",
  "discovered-attack": "Discovered attack",
};

export function MotifBadges({ motifs }: { motifs: MotifTag[] }) {
  if (motifs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {motifs.map((motif) => (
        <span
          key={motif}
          className="rounded-full border px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase"
          style={{
            borderColor: STUDY_PALETTE.brassDim,
            color: STUDY_PALETTE.brass,
          }}
        >
          {LABELS[motif]}
        </span>
      ))}
    </div>
  );
}
