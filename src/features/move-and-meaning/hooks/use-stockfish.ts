"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_ENGINE_DEPTH, ENGINE_WORKER_PATH } from "../config";
import { parseBestMoveLine, parseInfoLine } from "../lib/stockfish/uci-parser";
import type { EngineStatus, UciInfo } from "../types";

export interface AnalyzeOptions {
  moves?: string[];
  depth?: number;
  movetimeMs?: number;
  skillLevel?: number;
}

export interface UseStockfishResult {
  status: EngineStatus;
  info: UciInfo | null;
  bestMoveUci: string | null;
  error: string | null;
  analyze: (fen: string, opts?: AnalyzeOptions) => void;
  stop: () => void;
  terminate: () => void;
}

/**
 * A thin UCI text-protocol wrapper, not a typed postMessage protocol like the
 * STL analyzer's worker (see `analysis.worker.ts`/`worker-protocol.ts`) —
 * this vendored engine script speaks raw UCI lines over `postMessage(string)`
 * natively, so there's no id to correlate requests/responses against.
 *
 * The engine is created lazily on first `analyze` call, not on mount, so the
 * ~7MB WASM binary never downloads for a student who stays in unassisted
 * mode the whole session.
 *
 * IMPORTANT: `analyze()` while a search is already running does NOT send
 * `stop` immediately followed by a new `position`/`go` — confirmed by direct
 * testing, sending those before the interrupted search's `bestmove` arrives
 * corrupts this WASM build's internal state under WebKit/Safari specifically
 * (it throws "Unreachable code should not be executed" partway into the next
 * search, mid-Asyncify-rewind by the look of the stack). It's also not
 * strictly correct UCI usage either way — engines expect you to wait for the
 * acknowledging `bestmove` after `stop` before sending anything else. So the
 * new request is queued and only dispatched once that `bestmove` (real or
 * from the stop) actually arrives.
 */
export function useStockfish(): UseStockfishResult {
  const workerRef = useRef<Worker | null>(null);
  const isSearchingRef = useRef(false);
  const ignoreNextBestMoveRef = useRef(false);
  const pendingRef = useRef<{ fen: string; opts: AnalyzeOptions } | null>(null);

  const [status, setStatus] = useState<EngineStatus>("idle");
  const [info, setInfo] = useState<UciInfo | null>(null);
  const [bestMoveUci, setBestMoveUci] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Sends setoption(s) + position + go — assumes the engine is idle. */
  const dispatch = useCallback((fen: string, opts: AnalyzeOptions) => {
    const worker = workerRef.current;
    if (!worker) return;
    if (opts.skillLevel !== undefined) {
      const level = Math.max(0, Math.min(20, opts.skillLevel));
      worker.postMessage(`setoption name Skill Level value ${level}`);
    }
    setInfo(null);
    setBestMoveUci(null);
    const movesPart = opts.moves?.length
      ? ` moves ${opts.moves.join(" ")}`
      : "";
    worker.postMessage(`position fen ${fen}${movesPart}`);

    isSearchingRef.current = true;
    setStatus("thinking");
    // Depth and movetime can both be given — Stockfish stops at whichever
    // limit it hits first. A depth-only search has no time bound at all,
    // which on a hard position with this single-threaded build can run for
    // many seconds; callers should generally pass a movetimeMs cap too.
    const parts = ["go"];
    if (opts.depth) parts.push(`depth ${opts.depth}`);
    if (opts.movetimeMs) parts.push(`movetime ${opts.movetimeMs}`);
    if (!opts.depth && !opts.movetimeMs)
      parts.push(`depth ${DEFAULT_ENGINE_DEPTH}`);
    worker.postMessage(parts.join(" "));
  }, []);

  const ensureWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;

    setStatus("loading");
    setError(null);

    const worker = new Worker(ENGINE_WORKER_PATH);
    worker.onmessage = (event: MessageEvent<string>) => {
      const line = typeof event.data === "string" ? event.data : "";
      if (line === "uciok") {
        worker.postMessage("isready");
        return;
      }
      if (line === "readyok") {
        setStatus("ready");
        return;
      }
      const infoLine = parseInfoLine(line);
      if (infoLine) {
        setInfo(infoLine);
        return;
      }
      const best = parseBestMoveLine(line);
      if (best) {
        isSearchingRef.current = false;
        if (ignoreNextBestMoveRef.current) {
          ignoreNextBestMoveRef.current = false;
          const pending = pendingRef.current;
          pendingRef.current = null;
          if (pending) dispatch(pending.fen, pending.opts);
          return;
        }
        setBestMoveUci(best.bestMoveUci);
        setStatus("ready");
      }
    };
    worker.onerror = (event) => {
      // Logged (not just surfaced in the UI) because the likely causes —
      // a CSP block, a host serving the .wasm file with the wrong
      // Content-Type, or the interrupted-search state corruption this file
      // otherwise guards against — are only diagnosable from the actual
      // browser console message.
      console.error(
        "Stockfish engine worker failed to load:",
        event.message,
        event,
      );
      setStatus("error");
      setError("The chess engine failed to load in this browser.");
    };

    worker.postMessage("uci");
    workerRef.current = worker;
    return worker;
  }, [dispatch]);

  const analyze = useCallback(
    (fen: string, opts: AnalyzeOptions = {}) => {
      ensureWorker();
      if (isSearchingRef.current) {
        pendingRef.current = { fen, opts };
        ignoreNextBestMoveRef.current = true;
        workerRef.current?.postMessage("stop");
        return;
      }
      dispatch(fen, opts);
    },
    [ensureWorker, dispatch],
  );

  const stop = useCallback(() => {
    if (!workerRef.current || !isSearchingRef.current) return;
    ignoreNextBestMoveRef.current = true;
    isSearchingRef.current = false;
    workerRef.current.postMessage("stop");
  }, []);

  const terminate = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    isSearchingRef.current = false;
    pendingRef.current = null;
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  return { status, info, bestMoveUci, error, analyze, stop, terminate };
}
