"use client";

import { STUDY_PALETTE } from "../config";
import { LENSES } from "../data/lenses";
import { useMmStore } from "../store";

export function LensSwitcher() {
  const activeLensId = useMmStore((s) => s.activeLensId);
  const setActiveLens = useMmStore((s) => s.setActiveLens);

  return (
    <div className="flex flex-wrap gap-1.5">
      {LENSES.map((lens) => {
        const active = activeLensId === lens.id;
        return (
          <button
            key={lens.id}
            type="button"
            onClick={() => setActiveLens(lens.id)}
            title={lens.frameworkTag}
            className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={{
              borderColor: active ? STUDY_PALETTE.brass : STUDY_PALETTE.border,
              backgroundColor: active ? STUDY_PALETTE.brass : "transparent",
              color: active ? STUDY_PALETTE.background : STUDY_PALETTE.muted,
            }}
          >
            {lens.name.split(" ").at(-1)}
          </button>
        );
      })}
    </div>
  );
}
