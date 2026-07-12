/** Viewer display options — kept separate so the 3D canvas can subscribe narrowly. */
export interface ViewerOptions {
  camera: "perspective" | "orthographic";
  wireframe: boolean;
  transparent: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showCoM: boolean;
  showPrincipalAxes: boolean;
  showForces: boolean;
  showStress: boolean;
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
  showCoM: false,
  showPrincipalAxes: false,
  showForces: true,
  showStress: false,
  clippingEnabled: false,
  clipX: 0,
};
