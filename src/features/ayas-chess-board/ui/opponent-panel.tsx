"use client";

import { BOT_DIFFICULTIES } from "../lib/bot";
import type { DifficultyRecord } from "../lib/record";
import type { OpponentMode } from "../types";

interface OpponentPanelProps {
  mode: OpponentMode;
  onModeChange: (mode: OpponentMode) => void;
  humanColor: "w" | "b";
  onHumanColorChange: (color: "w" | "b") => void;
  difficultyId: string;
  onDifficultyChange: (id: string) => void;
  botThinking: boolean;
  record: DifficultyRecord | undefined;
}

export function OpponentPanel({
  mode,
  onModeChange,
  humanColor,
  onHumanColorChange,
  difficultyId,
  onDifficultyChange,
  botThinking,
  record,
}: OpponentPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-[#f3d3dc] bg-white p-3">
      <div className="inline-flex rounded-lg border border-[#f3d3dc] bg-[#fff0f3] p-0.5 text-xs">
        {(["pass-and-play", "computer"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              mode === m
                ? "bg-white text-[#4a2c3a] shadow-sm"
                : "text-[#9c7684] hover:text-[#4a2c3a]"
            }`}
          >
            {m === "pass-and-play" ? "Pass & play" : "Vs. computer"}
          </button>
        ))}
      </div>

      {mode === "computer" && (
        <>
          <label className="flex items-center gap-1.5 text-xs text-[#9c7684]">
            You play
            <select
              value={humanColor}
              onChange={(e) => onHumanColorChange(e.target.value as "w" | "b")}
              className="rounded-md border border-[#f3d3dc] bg-white px-2 py-1 text-[#4a2c3a]"
            >
              <option value="w">White</option>
              <option value="b">Black</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-[#9c7684]">
            Difficulty
            <select
              value={difficultyId}
              onChange={(e) => onDifficultyChange(e.target.value)}
              className="rounded-md border border-[#f3d3dc] bg-white px-2 py-1 text-[#4a2c3a]"
            >
              {BOT_DIFFICULTIES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>

          {record && (record.w > 0 || record.l > 0 || record.d > 0) && (
            <span className="text-xs text-[#9c7684]">
              Record: {record.w}W {record.l}L {record.d}D
            </span>
          )}

          {botThinking && (
            <span className="text-xs text-[#9c7684] italic">thinking… 🤔</span>
          )}
        </>
      )}
    </div>
  );
}
