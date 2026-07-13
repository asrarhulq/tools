"use client";

import {
  Box,
  Camera,
  Crosshair,
  Grid3x3,
  Layers,
  Maximize,
  Move3d,
  RefreshCw,
  Ruler,
  Scissors,
  Spline,
  Sun,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import type { ViewerOptions } from "../state/viewer-options";
import type { CameraView } from "./viewer-canvas";
import { cn } from "@/lib/utils";

/** A single toggle/action button in the floating viewer toolbar. */
function ToolButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg transition-colors [&_svg]:size-4",
        active
          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
      )}
    >
      {children}
    </button>
  );
}

const CAM_PRESETS: Array<{ view: CameraView; label: string }> = [
  { view: "iso", label: "Iso" },
  { view: "front", label: "Front" },
  { view: "top", label: "Top" },
  { view: "right", label: "Right" },
];

/**
 * Floating glass toolbars over the viewport. The left column groups display and
 * overlay toggles + actions; a top-centre pill offers camera presets.
 */
export function ViewerToolbar({
  options,
  onChange,
  onScreenshot,
  onFullscreen,
  onReset,
  onCamera,
  hasFea,
}: {
  options: ViewerOptions;
  onChange: (patch: Partial<ViewerOptions>) => void;
  onScreenshot: () => void;
  onFullscreen: () => void;
  onReset: () => void;
  onCamera: (view: CameraView) => void;
  hasFea: boolean;
}) {
  return (
    <>
      {/* Camera presets */}
      <div className="glass pointer-events-auto absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full p-1 text-xs">
        {CAM_PRESETS.map((c) => (
          <button
            key={c.view}
            type="button"
            onClick={() => onCamera(c.view)}
            className="rounded-full px-2.5 py-1 font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            {c.label}
          </button>
        ))}
        <div className="mx-0.5 h-4 w-px bg-[var(--color-border)]" />
        <ToolButton
          label={
            options.camera === "orthographic" ? "Perspective" : "Orthographic"
          }
          active={options.camera === "orthographic"}
          onClick={() =>
            onChange({
              camera:
                options.camera === "perspective"
                  ? "orthographic"
                  : "perspective",
            })
          }
        >
          <Camera />
        </ToolButton>
      </div>

      {/* Left toolbar */}
      <div className="glass pointer-events-auto absolute top-3 left-3 z-10 flex flex-col gap-1 rounded-xl p-1.5">
        <ToolButton
          label="Wireframe"
          active={options.wireframe}
          onClick={() => onChange({ wireframe: !options.wireframe })}
        >
          <Box />
        </ToolButton>
        <ToolButton
          label="Transparency"
          active={options.transparent}
          onClick={() => onChange({ transparent: !options.transparent })}
        >
          <Layers />
        </ToolButton>
        <ToolButton
          label="Cross-section"
          active={options.clippingEnabled}
          onClick={() =>
            onChange({ clippingEnabled: !options.clippingEnabled })
          }
        >
          <Scissors />
        </ToolButton>

        <div className="my-0.5 h-px bg-[var(--color-border)]" />

        <ToolButton
          label="Build plate"
          active={options.showBuildPlate}
          onClick={() => onChange({ showBuildPlate: !options.showBuildPlate })}
        >
          <Square />
        </ToolButton>
        <ToolButton
          label="Grid"
          active={options.showGrid}
          onClick={() => onChange({ showGrid: !options.showGrid })}
        >
          <Grid3x3 />
        </ToolButton>
        <ToolButton
          label="Soft shadows"
          active={options.shadows}
          onClick={() => onChange({ shadows: !options.shadows })}
        >
          <Sun />
        </ToolButton>
        <ToolButton
          label="Axes gizmo"
          active={options.showAxes}
          onClick={() => onChange({ showAxes: !options.showAxes })}
        >
          <Move3d />
        </ToolButton>
        <ToolButton
          label="Center of mass"
          active={options.showCoM}
          onClick={() => onChange({ showCoM: !options.showCoM })}
        >
          <Crosshair />
        </ToolButton>
        <ToolButton
          label="Principal axes"
          active={options.showPrincipalAxes}
          onClick={() =>
            onChange({ showPrincipalAxes: !options.showPrincipalAxes })
          }
        >
          <Spline />
        </ToolButton>
        <ToolButton
          label="Stress heat-map"
          active={options.showStress}
          onClick={() => {
            if (!hasFea) {
              toast("Add a force first", {
                description: "The heat map needs a defined load case.",
              });
              return;
            }
            onChange({ showStress: !options.showStress });
          }}
        >
          <Ruler />
        </ToolButton>

        <div className="my-0.5 h-px bg-[var(--color-border)]" />

        <ToolButton label="Screenshot" onClick={onScreenshot}>
          <Camera />
        </ToolButton>
        <ToolButton label="Fullscreen" onClick={onFullscreen}>
          <Maximize />
        </ToolButton>
        <ToolButton label="Reset view" onClick={onReset}>
          <RefreshCw />
        </ToolButton>
      </div>
    </>
  );
}
