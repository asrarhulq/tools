"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useAnalyzer } from "../state/analyzer-context";
import { useDerivedAnalysis } from "../state/use-derived";
import { ViewerCanvas, type CameraView } from "./viewer-canvas";
import { ViewerToolbar } from "./viewer-toolbar";

/**
 * The CAD viewport container: hosts the R3F canvas + floating toolbar, the
 * cross-section slider, fullscreen handling, camera presets, and screenshot
 * download. Renders the oriented mesh so the viewport matches the analysis.
 */
export function ViewerPanel() {
  const {
    mesh,
    forces,
    viewer,
    setViewer,
    addForce,
    forceDraft,
    screenshotRef,
  } = useAnalyzer();
  const { geometry, orientedPositions, fea, stability } = useDerivedAnalysis();
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<((view: CameraView) => void) | null>(null);
  const [remountKey, setRemountKey] = useState(0);

  const registerScreenshot = useCallback(
    (fn: (() => string | null) | null) => {
      screenshotRef.current = fn;
    },
    [screenshotRef],
  );

  const registerCamera = useCallback(
    (fn: ((view: CameraView) => void) | null) => {
      cameraRef.current = fn;
    },
    [],
  );

  const takeScreenshot = useCallback(() => {
    const dataUrl = screenshotRef.current?.();
    if (!dataUrl) {
      toast.error("Screenshot failed");
      return;
    }
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "am-analyzer-view.png";
    a.click();
    toast.success("Screenshot saved");
  }, [screenshotRef]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  // Reset view by remounting the canvas (fresh camera + controls).
  const resetView = useCallback(() => setRemountKey((k) => k + 1), []);
  const setCamera = useCallback(
    (view: CameraView) => cameraRef.current?.(view),
    [],
  );

  if (!mesh || !geometry || !orientedPositions) return null;
  const renderMesh = { positions: orientedPositions };

  return (
    <div
      ref={containerRef}
      className="relative h-[440px] w-full overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-black shadow-lg sm:h-[600px]"
    >
      <ViewerCanvas
        key={remountKey}
        mesh={renderMesh}
        geometry={geometry}
        fea={fea}
        stability={stability}
        forces={forces}
        options={viewer}
        registerScreenshot={registerScreenshot}
        registerCamera={registerCamera}
        onSurfaceClick={(point) => {
          addForce({
            point,
            direction: forceDraft.direction,
            magnitude: forceDraft.magnitude,
          });
          toast("Force added", {
            description: `${forceDraft.magnitude} N — edit it in the Forces panel.`,
          });
        }}
      />

      <ViewerToolbar
        options={viewer}
        onChange={setViewer}
        onScreenshot={takeScreenshot}
        onFullscreen={toggleFullscreen}
        onReset={resetView}
        onCamera={setCamera}
        hasFea={!!fea}
      />

      {viewer.clippingEnabled ? (
        <div className="glass absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg px-3 py-2">
          <label htmlFor="clip" className="text-xs">
            Section
          </label>
          <input
            id="clip"
            type="range"
            min={-1}
            max={1}
            step={0.02}
            value={viewer.clipX}
            onChange={(e) => setViewer({ clipX: Number(e.target.value) })}
            className="w-40 accent-[var(--color-primary)]"
          />
        </div>
      ) : null}

      <p className="glass pointer-events-none absolute right-3 bottom-3 z-10 rounded-lg px-2.5 py-1 text-[11px] text-[var(--color-muted-foreground)]">
        Click the model to add a {forceDraft.magnitude} N force
      </p>
    </div>
  );
}
