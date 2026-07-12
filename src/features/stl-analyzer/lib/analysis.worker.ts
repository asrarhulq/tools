/// <reference lib="webworker" />

import { analyzeGeometry } from "./geometry";
import type { AnalyzeRequest, AnalyzeResponse } from "./worker-protocol";

/**
 * Analysis worker. Runs the (potentially heavy) geometry pipeline off the main
 * thread so the UI never janks on large STLs. Because `geometry.ts` is pure and
 * framework-free, this same call could later be swapped for a WASM kernel.
 */
self.onmessage = (event: MessageEvent<AnalyzeRequest>) => {
  const data = event.data;
  if (data.type !== "analyze") return;

  try {
    const geometry = analyzeGeometry({ positions: data.positions });
    const response: AnalyzeResponse = {
      type: "result",
      id: data.id,
      geometry,
    };
    (self as DedicatedWorkerGlobalScope).postMessage(response);
  } catch (error) {
    const response: AnalyzeResponse = {
      type: "error",
      id: data.id,
      message: error instanceof Error ? error.message : "Analysis failed",
    };
    (self as DedicatedWorkerGlobalScope).postMessage(response);
  }
};
