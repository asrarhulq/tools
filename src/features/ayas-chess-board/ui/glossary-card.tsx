import { GLOSSARY } from "../lib/arabic-glossary";

const FEATURED = ["chess", "king", "queen", "rook", "bishop", "knight", "pawn"];

/**
 * A standing reference, not just the per-move callouts — so there's always
 * somewhere to glance at the handful of words this board uses, while the
 * rest of the vocabulary stays Aya's to teach.
 */
export function GlossaryCard() {
  return (
    <div className="rounded-[var(--radius)] border border-[#f3d3dc] bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-[#4a2c3a]">
        Chess in Arabic
      </h3>
      <p className="mb-3 text-xs leading-relaxed text-[#9c7684]">
        A few words this board uses — everything else is your lesson to give.
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        {FEATURED.map((key) => {
          const term = GLOSSARY[key]!;
          return (
            <div
              key={key}
              className="flex items-baseline justify-between gap-2"
            >
              <span className="text-[#4a2c3a]">{term.english}</span>
              <span dir="rtl" className="font-semibold text-[#d9748f]">
                {term.arabic}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
