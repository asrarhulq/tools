/** Viewer display options — kept separate so the 3D canvas can subscribe narrowly. */
export interface ViewerOptions {
  camera: "perspective" | "orthographic";
  wireframe: boolean;
  transparent: boolean;
  showGrid: boolean;
  showAxes: boolean;
  /** Show the realistic virtual build plate under the part. */
  showBuildPlate: boolean;
  showCoM: boolean;
  showPrincipalAxes: boolean;
  showForces: boolean;
  showStress: boolean;
  /** Which FEA field the heat map visualizes. */
  feaField: "stress" | "displacement";
  /** Soft ground shadows under the part. */
  shadows: boolean;
  clippingEnabled: boolean;
  /** Clipping plane position along X, normalized [-1, 1] of the bbox. */
  clipX: number;
}

export const DEFAULT_VIEWER_OPTIONS: ViewerOptions = {
  camera: "perspective",
  wireframe: false,
  transparent: false,
  showGrid: true,
  showAxes: true,
  showBuildPlate: true,
  showCoM: false,
  showPrincipalAxes: false,
  showForces: true,
  showStress: false,
  feaField: "stress",
  shadows: true,
  clippingEnabled: false,
  clipX: 0,
};
