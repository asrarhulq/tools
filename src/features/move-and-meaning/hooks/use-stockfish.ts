"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_ENGINE_DEPTH, ENGINE_WORKER_PATH } from "../config";
import { parseBestMoveLine, parseInfoLine } from "../lib/stockfish/uci-parser";
import type { EngineStatus, UciInfo } from "../types";

export interface UseStockfishResult {
  status: EngineStatus;
  info: UciInfo | null;
  bestMoveUci: string | null;
  error: string | null;
  setPosition: (fen: string, moves?: string[]) => void;
  go: (opts?: { depth?: number; movetimeMs?: number }) => void;
  stop: () => void;
  terminate: () => void;
}

/**
 * A thin UCI text-protocol wrapper, not a typed postMessage protocol like the
 * STL analyzer's worker (see `analysis.worker.ts`/`worker-protocol.ts`) —
 * this vendored engine script speaks raw UCI lines over `postMessage(string)`
 * natively, so there's no id to correlate requests/responses against.
 *
 * The engine is created lazily on first `setPosition`/`go` call, not on
 * mount, so the ~7MB WASM binary never downloads for a student who stays in
 * unassisted mode the whole session.
 */
export function useStockfish(): UseStockfishResult {
  const workerRef = useRef<Worker | null>(null);
  const isSearchingRef = useRef(false);
  const ignoreNextBestMoveRef = useRef(false);

  const [status, setStatus] = useState<EngineStatus>("idle");
  const [info, setInfo] = useState<UciInfo | null>(null);
  const [bestMoveUci, setBestMoveUci] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          return;
        }
        setBestMoveUci(best.bestMoveUci);
        setStatus("ready");
      }
    };
    worker.onerror = () => {
      setStatus("error");
      setError("The chess engine failed to load in this browser.");
    };

    worker.postMessage("uci");
    workerRef.current = worker;
    return worker;
  }, []);

  const setPosition = useCallback(
    (fen: string, moves: string[] = []) => {
      const worker = ensureWorker();
      if (isSearchingRef.current) {
        ignoreNextBestMoveRef.current = true;
        worker.postMessage("stop");
        isSearchingRef.current = false;
      }
      setInfo(null);
      setBestMoveUci(null);
      const movesPart = moves.length ? ` moves ${moves.join(" ")}` : "";
      worker.postMessage(`position fen ${fen}${movesPart}`);
    },
    [ensureWorker],
  );

  const go = useCallback(
    (opts?: { depth?: number; movetimeMs?: number }) => {
      const worker = ensureWorker();
      isSearchingRef.current = true;
      setStatus("thinking");
      if (opts?.movetimeMs) {
        worker.postMessage(`go movetime ${opts.movetimeMs}`);
      } else {
        worker.postMessage(`go depth ${opts?.depth ?? DEFAULT_ENGINE_DEPTH}`);
      }
    },
    [ensureWorker],
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
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  return { status, info, bestMoveUci, error, setPosition, go, stop, terminate };
}
