"use client";

import { FlipHorizontal2, RotateCcw, Undo2 } from "lucide-react";
import { BOARD_PALETTES, type BoardPalette } from "../config";

interface ControlsBarProps {
  onNewGame: () => void;
  onFlip: () => void;
  onUndo: () => void;
  canUndo: boolean;
  palette: BoardPalette;
  onPaletteChange: (palette: BoardPalette) => void;
}

export function ControlsBar({
  onNewGame,
  onFlip,
  onUndo,
  canUndo,
  palette,
  onPaletteChange,
}: ControlsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onNewGame}
        className="flex items-center gap-1.5 rounded-md bg-[#d9748f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#c9607d]"
      >
        <RotateCcw className="size-3.5" /> New game
      </button>
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex items-center gap-1.5 rounded-md border border-[#f3d3dc] px-3 py-1.5 text-xs font-medium text-[#4a2c3a] hover:bg-[#fff0f3] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Undo2 className="size-3.5" /> Undo
      </button>
      <button
        type="button"
        onClick={onFlip}
        className="flex items-center gap-1.5 rounded-md border border-[#f3d3dc] px-3 py-1.5 text-xs font-medium text-[#4a2c3a] hover:bg-[#fff0f3]"
      >
        <FlipHorizontal2 className="size-3.5" /> Flip board
      </button>
      <label className="ml-auto flex items-center gap-1.5 text-xs text-[#9c7684]">
        Polish
        <select
          value={palette.label}
          onChange={(e) => {
            const next = BOARD_PALETTES.find((p) => p.label === e.target.value);
            if (next) onPaletteChange(next);
          }}
          className="rounded-md border border-[#f3d3dc] bg-white px-2 py-1 text-[#4a2c3a]"
        >
          {BOARD_PALETTES.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
