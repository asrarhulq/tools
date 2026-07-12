"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useAnalyzer } from "../state/analyzer-context";
import { useDerivedAnalysis } from "../state/use-derived";
import { ViewerCanvas } from "./viewer-canvas";
import { ViewerToolbar } from "./viewer-toolbar";

/**
 * The CAD viewport container: hosts the R3F canvas + floating toolbar, the
 * cross-section slider, fullscreen handling, and screenshot download. Reads all
 * model/viewer state from the analyzer context.
 */
export function ViewerPanel() {
  const {
    mesh,
    geometry,
    forces,
    supports,
    viewer,
    setViewer,
    addForce,
    screenshotRef,
  } = useAnalyzer();
  const { fea, stability } = useDerivedAnalysis();
  const containerRef = useRef<HTMLDivElement>(null);
  const [remountKey, setRemountKey] = useState(0);

  const registerScreenshot = useCallback(
    (fn: (() => string | null) | null) => {
      screenshotRef.current = fn;
    },
    [screenshotRef],
  );

  const takeScreenshot = useCallback(() => {
    const dataUrl = screenshotRef.current?.();
    if (!dataUrl) {
      toast.error("Screenshot failed");
      return;
    }
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "stl-analyzer-view.png";
    a.click();
    toast.success("Screenshot saved");
  }, [screenshotRef]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  }, []);

  // Reset view by remounting the canvas (fresh camera + controls).
  const resetView = useCallback(() => setRemountKey((k) => k + 1), []);

  if (!mesh || !geometry) return null;

  return (
    <div
      ref={containerRef}
      className="relative h-[420px] w-full overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-black sm:h-[560px]"
    >
      <ViewerCanvas
        key={remountKey}
        mesh={mesh}
        geometry={geometry}
        fea={fea}
        stability={stability}
        forces={forces}
        supports={supports}
        options={viewer}
        registerScreenshot={registerScreenshot}
        onSurfaceClick={(point) => {
          // Click-to-place a default downward 50 N force.
          addForce({ point, direction: [0, 0, -1], magnitude: 50 });
          toast("Force added", {
            description: "50 N downward. Edit it in the Forces panel.",
          });
        }}
      />

      <ViewerToolbar
        options={viewer}
        onChange={setViewer}
        onScreenshot={takeScreenshot}
        onFullscreen={toggleFullscreen}
        onReset={resetView}
        hasFea={forces.length > 0 || supports.length > 0}
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

      <p className="glass pointer-events-none absolute bottom-3 right-3 z-10 rounded-lg px-2.5 py-1 text-[11px] text-[var(--color-muted-foreground)]">
        Click the model to add a force
      </p>
    </div>
  );
}
