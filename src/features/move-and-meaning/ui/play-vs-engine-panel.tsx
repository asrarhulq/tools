"use client";

import { useState } from "react";
import { DIFFICULTY_PRESETS, STUDY_PALETTE } from "../config";
import { isGameOver } from "../lib/chess-engine-adapter";
import { currentFen, useMmStore } from "../store";
import type { Color } from "../types";
import { FlagButton } from "./flag-button";
import { JournalExportBar } from "./journal-export-bar";
import { LensPromptCard } from "./lens-prompt-card";
import { LensSwitcher } from "./lens-switcher";

export function PlayVsEnginePanel() {
  const vsEngine = useMmStore((s) => s.vsEngine);
  const startEngineGame = useMmStore((s) => s.startEngineGame);
  const stopEngineGame = useMmStore((s) => s.stopEngineGame);
  const engineStatus = useMmStore((s) => s.engineStatus);
  const history = useMmStore((s) => s.history);
  const cursorPly = useMmStore((s) => s.cursorPly);
  const [color, setColor] = useState<Color>("w");
  const [difficultyIdx, setDifficultyIdx] = useState(1);

  const buttonBase =
    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors";

  if (vsEngine) {
    const fen = currentFen({ history, cursorPly });
    const gameOver = isGameOver(fen);
    return (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: STUDY_PALETTE.text }}>
          Playing as {vsEngine.humanColor === "w" ? "White" : "Black"} vs. the
          engine ({vsEngine.label}).
        </p>
        {gameOver.over ? (
          <p
            className="text-sm font-medium"
            style={{ color: STUDY_PALETTE.brass }}
          >
            Game over — {gameOver.reason}.
          </p>
        ) : engineStatus === "loading" ? (
          <p className="text-xs italic" style={{ color: STUDY_PALETTE.muted }}>
            Loading the chess engine (~7MB, first time only)…
          </p>
        ) : engineStatus === "thinking" ? (
          <p className="text-xs italic" style={{ color: STUDY_PALETTE.muted }}>
            Engine is thinking…
          </p>
        ) : engineStatus === "error" ? (
          <p className="text-xs" style={{ color: STUDY_PALETTE.danger }}>
            The engine hit an error. End the game and try again.
          </p>
        ) : null}
        <button
          type="button"
          onClick={stopEngineGame}
          className={buttonBase}
          style={{
            borderColor: STUDY_PALETTE.border,
            color: STUDY_PALETTE.text,
          }}
        >
          End game — back to free play
        </button>

        {history.length > 0 && (
          <div
            className="space-y-3 border-t pt-3"
            style={{ borderColor: STUDY_PALETTE.border }}
          >
            <p
              className="text-xs font-semibold tracking-wide uppercase"
              style={{ color: STUDY_PALETTE.muted }}
            >
              Reflect on this position
            </p>
            <FlagButton />
            <LensSwitcher />
            <LensPromptCard />
            <JournalExportBar />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p
          className="mb-1.5 text-xs font-medium"
          style={{ color: STUDY_PALETTE.muted }}
        >
          Play as
        </p>
        <div className="flex gap-1.5">
          {(["w", "b"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={buttonBase}
              style={{
                borderColor:
                  color === c ? STUDY_PALETTE.brass : STUDY_PALETTE.border,
                backgroundColor:
                  color === c ? STUDY_PALETTE.brass : "transparent",
                color:
                  color === c ? STUDY_PALETTE.background : STUDY_PALETTE.text,
              }}
            >
              {c === "w" ? "White" : "Black"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p
          className="mb-1.5 text-xs font-medium"
          style={{ color: STUDY_PALETTE.muted }}
        >
          Difficulty
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTY_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setDifficultyIdx(i)}
              className={buttonBase}
              style={{
                borderColor:
                  difficultyIdx === i
                    ? STUDY_PALETTE.brass
                    : STUDY_PALETTE.border,
                backgroundColor:
                  difficultyIdx === i ? STUDY_PALETTE.brass : "transparent",
                color:
                  difficultyIdx === i
                    ? STUDY_PALETTE.background
                    : STUDY_PALETTE.text,
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          const preset = DIFFICULTY_PRESETS[difficultyIdx]!;
          startEngineGame({
            humanColor: color,
            label: preset.label,
            skillLevel: preset.skillLevel,
            movetimeMs: preset.movetimeMs,
          });
        }}
        className={buttonBase}
        style={{
          borderColor: STUDY_PALETTE.brassDim,
          color: STUDY_PALETTE.brass,
        }}
      >
        Start game vs. Engine
      </button>
    </div>
  );
}
