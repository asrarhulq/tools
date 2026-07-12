import type {
  FeaResult,
  Force,
  GeometryResult,
  Material,
  PrintEstimate,
  PrintRecommendation,
  PrintSettings,
  StabilityResult,
  Support,
} from "../types";

/** Everything the PDF report needs — assembled by the dashboard at export time. */
export interface ReportData {
  modelName: string;
  geometry: GeometryResult;
  material: Material;
  stability: StabilityResult | null;
  fea: FeaResult | null;
  printEstimate: PrintEstimate | null;
  recommendation: PrintRecommendation | null;
  printSettings: PrintSettings;
  forces: readonly Force[];
  supports: readonly Support[];
  /** PNG data URL of the current viewport, embedded on the cover. */
  previewImage: string | null;
}
