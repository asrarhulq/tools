"use client";

import type { Square } from "chess.js";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";
import type { ToolWithHref } from "@/types/tool";
import { ChessBoard } from "./board/chess-board";
import { DEFAULT_ENGINE_DEPTH, STUDY_PALETTE } from "./config";
import { fontSerif } from "./fonts";
import { useStockfish } from "./hooks/use-stockfish";
import { isGameOver, turnOf } from "./lib/chess-engine-adapter";
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
  const vsEngine = useMmStore((s) => s.vsEngine);

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
    vsEngine,
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

  // Play vs. Engine and free-analysis mode share one Stockfish worker, so
  // only one of them drives it at a time: while a bot game is active, the
  // engine's own thinking IS the analysis (its `info` stream still updates
  // the eval bar), and analysis mode's separate auto-trigger is suppressed.
  const engineMoveFenRef = useRef<string | null>(null);
  useEffect(() => {
    if (vsEngine) {
      const engineColor = vsEngine.humanColor === "w" ? "b" : "w";
      if (
        turnOf(fen) === engineColor &&
        !isGameOver(fen).over &&
        engineMoveFenRef.current !== fen
      ) {
        engineMoveFenRef.current = fen;
        stockfish.setSkillLevel(vsEngine.skillLevel);
        stockfish.setPosition(fen);
        stockfish.go({ movetimeMs: vsEngine.movetimeMs });
      }
      return;
    }
    stockfish.setSkillLevel(20);
    if (mode !== "assisted") return;
    stockfish.setPosition(fen);
    stockfish.go({ depth: DEFAULT_ENGINE_DEPTH });
    // `stockfish` itself is stable (useCallback-memoized); re-run only on
    // mode/position/opponent changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fen, vsEngine]);

  // Applies the engine's chosen move once it's ready, but only if it's still
  // answering the position we asked about (a stale reply from a position the
  // student has since moved past is silently ignored).
  useEffect(() => {
    if (!vsEngine || !stockfish.bestMoveUci) return;
    if (engineMoveFenRef.current !== fen) return;
    const uci = stockfish.bestMoveUci;
    const from = uci.slice(0, 2) as Square;
    const to = uci.slice(2, 4) as Square;
    const promotion =
      uci.length > 4 ? (uci[4] as "q" | "r" | "b" | "n") : undefined;
    engineMoveFenRef.current = null;
    makeMoveAt(from, to, promotion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockfish.bestMoveUci]);

  const currentMove = history[cursorPly - 1];
  // Memoized on the move's own uci, not recreated as a fresh object every
  // render — ChessBoard is memoized and would otherwise see a "changed" prop
  // (and re-render, jittering its animated pieces) on every unrelated
  // re-render of this component (e.g. an engine "thinking" tick elsewhere).
  const lastMove = useMemo(
    () =>
      currentMove
        ? {
            from: currentMove.uci.slice(0, 2) as Square,
            to: currentMove.uci.slice(2, 4) as Square,
          }
        : null,
    [currentMove],
  );
  const handleMove = useCallback(
    (from: Square, to: Square, promotion?: "q" | "r" | "b" | "n") =>
      makeMoveAt(from, to, promotion),
    [makeMoveAt],
  );
  const engineVisible = mode === "assisted" || vsEngine !== null;
  const orientation = vsEngine?.humanColor === "b" ? "black" : "white";

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
              Philosophical Chess
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
              <EvalBar visible={engineVisible} />
              <div className="min-w-0 flex-1">
                <ChessBoard
                  fen={fen}
                  orientation={orientation}
                  lastMove={lastMove}
                  interactiveColor={vsEngine?.humanColor ?? null}
                  onMove={handleMove}
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
