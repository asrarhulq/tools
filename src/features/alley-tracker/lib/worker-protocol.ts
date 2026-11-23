/**
 * Message types shared by the page and stats.worker.ts. No worker import here,
 * so both sides type against it (same pattern as the STL analyzer).
 */
import type { FieldSigResult } from "./stats";

export interface FieldSigJob {
  /** caller-chosen label, e.g. "ALL" or "DJF" */
  tag: string;
  values: Float64Array;
  idxA: number[];
  idxB: number[];
}

export interface FieldSigRequest {
  type: "fieldsig";
  id: number;
  jobs: FieldSigJob[];
  nBoot: number;
  block: number;
  alpha: number;
  seed: number;
}

export interface FieldSigResponse {
  type: "fieldsig-result";
  id: number;
  results: { tag: string; result: FieldSigResult }[];
  ms: number;
}
