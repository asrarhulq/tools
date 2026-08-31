"use client";

import type { Square } from "chess.js";
import { useEffect } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import type { ToolWithHref } from "@/types/tool";
import { ChessBoard } from "./board/chess-board";
import { DEFAULT_ENGINE_DEPTH, STUDY_PALETTE } from "./config";
import { fontSerif } from "./fonts";
import { useStockfish } from "./hooks/use-stockfish";
import { loadGame, saveGame } from "./lib/persist";
import { currentFen, useMmStore } from "./store";
import { JournalExportBar } from "./ui/journal-export-bar";
import { MoveList } from "./ui/move-list";
import { PgnIoBar } from "./ui/pgn-io-bar";
import { SidePanelTabs } from "./ui/side-panel-tabs";
import { StudyRoomShell } from "./ui/study-room-shell";
import { EvalBar } from "./ui/eval-bar";

/**
 * Entry point mounted by the tool-content dispatcher. Wires three things
 * together that the rest of the feature keeps deliberately decoupled: the
 * zustand store, localStorage persistence (hydrate-on-mount + debounced
 * save, mirrored from argument-mapper's pattern), and the lazily-created
 * Stockfish worker (only ever started once the student switches to assisted
 * mode — see `hooks/use-stockfish.ts`).
 */
export function MoveAndMeaningTool({ tool }: { tool: ToolWithHref }) {
  const hydrated = useMmStore((s) => s.hydrated);
  const hydrate = useMmStore((s) => s.hydrate);
  const snapshot = useMmStore((s) => s.snapshot);
  const history = useMmStore((s) => s.history);
  const cursorPly = useMmStore((s) => s.cursorPly);
  const mode = useMmStore((s) => s.mode);
  const unassistedGuesses = useMmStore((s) => s.unassistedGuesses);
  const activeLensId = useMmStore((s) => s.activeLensId);
  const lensResponses = useMmStore((s) => s.lensResponses);
  const flags = useMmStore((s) => s.flags);
  const pgnHeaders = useMmStore((s) => s.pgnHeaders);
  const makeMoveAt = useMmStore((s) => s.makeMoveAt);
  const setEngineStatus = useMmStore((s) => s.setEngineStatus);
  const setEngineInfo = useMmStore((s) => s.setEngineInfo);
  const engineInfo = useMmStore((s) => s.engineInfo);

  useEffect(() => {
    const persisted = loadGame();
    if (persisted) hydrate(persisted);
    else useMmStore.setState({ hydrated: true });
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => saveGame(snapshot()), 600);
    return () => clearTimeout(timer);
  }, [
    hydrated,
    history,
    cursorPly,
    mode,
    unassistedGuesses,
    activeLensId,
    lensResponses,
    flags,
    pgnHeaders,
    snapshot,
  ]);

  const fen = currentFen({ history, cursorPly });
  const stockfish = useStockfish();

  useEffect(() => {
    setEngineStatus(stockfish.status);
  }, [stockfish.status, setEngineStatus]);

  useEffect(() => {
    if (stockfish.info) setEngineInfo(fen, stockfish.info);
    // Only the info payload should re-trigger this — `fen` is read at fire time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockfish.info]);

  useEffect(() => {
    if (mode !== "assisted") return;
    stockfish.setPosition(fen);
    stockfish.go({ depth: DEFAULT_ENGINE_DEPTH });
    // `stockfish` itself is stable (useCallback-memoized); re-run only on
    // mode/position changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fen]);

  const currentMove = history[cursorPly - 1];
  const lastMove = currentMove
    ? {
        from: currentMove.uci.slice(0, 2) as Square,
        to: currentMove.uci.slice(2, 4) as Square,
      }
    : null;
  const engineVisible = mode === "assisted";

  if (!hydrated) return null;

  return (
    <>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <StudyRoomShell>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1
              className={`${fontSerif.className} text-2xl font-semibold`}
              style={{ color: STUDY_PALETTE.brass }}
            >
              Move &amp; Meaning
            </h1>
            <p className="text-xs" style={{ color: STUDY_PALETTE.muted }}>
              PHIL 29300 — chess analysis meets philosophical reflection
            </p>
          </div>
          <PgnIoBar />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex items-start gap-3">
              <EvalBar info={engineInfo} visible={engineVisible} />
              <div className="min-w-0 flex-1">
                <ChessBoard
                  fen={fen}
                  lastMove={lastMove}
                  onMove={(from, to, promotion) =>
                    makeMoveAt(from, to, promotion)
                  }
                />
              </div>
            </div>
            <div className="mt-3">
              <MoveList />
            </div>
          </div>

          <SidePanelTabs fen={fen} engineVisible={engineVisible} />
        </div>

        <div
          className="mt-6 border-t pt-4"
          style={{ borderColor: STUDY_PALETTE.border }}
        >
          <JournalExportBar />
        </div>
      </StudyRoomShell>
    </>
  );
}
