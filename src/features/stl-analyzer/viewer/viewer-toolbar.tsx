"use client";

import {
  Box,
  Camera,
  Crosshair,
  Grid3x3,
  Layers,
  Maximize,
  Move3d,
  Ruler,
  Scissors,
  Spline,
} from "lucide-react";
import { toast } from "sonner";
import type { ViewerOptions } from "../state/viewer-options";
import { cn } from "@/lib/utils";

/** A single toggle button in the floating viewer toolbar. */
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

/**
 * Floating glass toolbar over the viewport. Groups view controls (camera,
 * wireframe, transparency, clipping), overlays (grid, axes, CoM, principal
 * axes, stress), and actions (screenshot, fullscreen, reset).
 */
export function ViewerToolbar({
  options,
  onChange,
  onScreenshot,
  onFullscreen,
  onReset,
  hasFea,
}: {
  options: ViewerOptions;
  onChange: (patch: Partial<ViewerOptions>) => void;
  onScreenshot: () => void;
  onFullscreen: () => void;
  onReset: () => void;
  hasFea: boolean;
}) {
  return (
    <div className="glass pointer-events-auto absolute left-3 top-3 z-10 flex flex-col gap-1 rounded-xl p-1.5">
      <ToolButton
        label={options.camera === "perspective" ? "Switch to orthographic" : "Switch to perspective"}
        active={options.camera === "orthographic"}
        onClick={() =>
          onChange({
            camera:
              options.camera === "perspective" ? "orthographic" : "perspective",
          })
        }
      >
        <Camera />
      </ToolButton>
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
        onClick={() => onChange({ clippingEnabled: !options.clippingEnabled })}
      >
        <Scissors />
      </ToolButton>

      <div className="my-0.5 h-px bg-[var(--color-border)]" />

      <ToolButton
        label="Grid"
        active={options.showGrid}
        onClick={() => onChange({ showGrid: !options.showGrid })}
      >
        <Grid3x3 />
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
            toast("Add a force or support first", {
              description: "The stress overlay needs a defined load case.",
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
        <Move3d />
      </ToolButton>
    </div>
  );
}
