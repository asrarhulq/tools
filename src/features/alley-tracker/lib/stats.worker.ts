/// <reference lib="webworker" />

import { fieldSignificance } from "./stats";
import { NCELLS } from "./data";
import type { FieldSigRequest, FieldSigResponse } from "./worker-protocol";

/**
 * Runs the 10 000-resample block bootstrap + Monte Carlo field-significance
 * test off the main thread (~0.3–1 s per job), so the sliders never stall.
 */
self.onmessage = (event: MessageEvent<FieldSigRequest>) => {
  const req = event.data;
  if (req.type !== "fieldsig") return;
  const t0 = performance.now();
  const results = req.jobs.map((job) => ({
    tag: job.tag,
    result: fieldSignificance({
      values: job.values,
      nCells: NCELLS,
      idxA: job.idxA,
      idxB: job.idxB,
      nBoot: req.nBoot,
      block: req.block,
      alpha: req.alpha,
      seed: req.seed,
    }),
  }));
  const res: FieldSigResponse = {
    type: "fieldsig-result",
    id: req.id,
    results,
    ms: performance.now() - t0,
  };
  (self as unknown as Worker).postMessage(res);
};
