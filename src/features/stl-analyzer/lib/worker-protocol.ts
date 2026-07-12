import type { GeometryResult } from "../types";

/**
 * Message contract between the UI and the analysis worker. Kept in its own
 * module (no worker import) so both sides can type against it. Positions are
 * transferred (not copied) for zero-cost hand-off of large meshes.
 */

export interface AnalyzeRequest {
  type: "analyze";
  id: number;
  positions: Float32Array;
}

export type AnalyzeResponse =
  | { type: "result"; id: number; geometry: GeometryResult }
  | { type: "error"; id: number; message: string };
