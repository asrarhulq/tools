import type {
  Constraint,
  EffectiveMaterial,
  FeaResult,
  Force,
  GeometryResult,
  Material,
  Orientation,
  PrintEstimate,
  PrintRecommendation,
  PrintSettings,
  StabilityResult,
} from "../types";

/** Everything the PDF report needs — assembled by the dashboard at export time. */
export interface ReportData {
  modelName: string;
  geometry: GeometryResult;
  material: Material;
  /** As-printed (effective) properties from material + print settings. */
  effective: EffectiveMaterial | null;
  orientation: Orientation;
  constraint: Constraint;
  stability: StabilityResult | null;
  fea: FeaResult | null;
  printEstimate: PrintEstimate | null;
  recommendation: PrintRecommendation | null;
  printSettings: PrintSettings;
  forces: readonly Force[];
  /** PNG data URL of the current viewport, embedded on the cover. */
  previewImage: string | null;
  /** PNG data URL of the FEA heat-map view, embedded in the simulation section. */
  feaImage: string | null;
}
