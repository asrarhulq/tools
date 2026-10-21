import type { MoveLogEntry } from "../types";

interface MoveListProps {
  moves: MoveLogEntry[];
}

export function MoveList({ moves }: MoveListProps) {
  const pairs: { num: number; white?: string; black?: string }[] = [];
  for (const m of moves) {
    if (m.color === "w") {
      pairs.push({ num: Math.ceil((m.ply + 1) / 2), white: m.san });
    } else {
      const last = pairs[pairs.length - 1];
      if (last && last.black === undefined) last.black = m.san;
      else pairs.push({ num: Math.ceil((m.ply + 1) / 2), black: m.san });
    }
  }

  if (moves.length === 0) {
    return (
      <p className="text-xs text-[#9c7684]">
        No moves yet — go on, she&apos;s waiting. 🌸
      </p>
    );
  }

  return (
    <div className="grid max-h-40 grid-cols-[2rem_1fr_1fr] gap-y-1 overflow-y-auto text-xs">
      {pairs.map((p) => (
        <div key={p.num} className="contents">
          <span className="text-[#9c7684]">{p.num}.</span>
          <span className="text-[#4a2c3a]">{p.white ?? ""}</span>
          <span className="text-[#4a2c3a]">{p.black ?? ""}</span>
        </div>
      ))}
    </div>
  );
}
