import dynamic from "next/dynamic";
import type { ToolWithHref } from "@/types/tool";
import { ComingSoon } from "./coming-soon";

/**
 * Per-tool content dispatcher. Placeholder tools render the shared ComingSoon
 * state; tools with a real implementation register a lazy-loaded renderer here.
 * Heavy renderers (e.g. the 3D viewer) are code-split so they never touch the
 * bundle of any other tool.
 */

const loadingSkeleton = (
  <div className="mx-auto aspect-video w-full max-w-3xl animate-pulse rounded-[var(--radius)] bg-[var(--color-muted)]" />
);

// The STL analyzer pulls in three/r3f/drei/jsPDF — load it only on its route.
const StlAnalyzerTool = dynamic(
  () =>
    import("@/features/stl-analyzer/stl-analyzer-tool").then(
      (m) => m.StlAnalyzerTool,
    ),
  { loading: () => loadingSkeleton },
);

// The Gantt studio pulls in date-fns/jsPDF (+ lazy xlsx) — load it only here.
const GanttStudioTool = dynamic(
  () =>
    import("@/features/gantt-studio/gantt-studio-tool").then(
      (m) => m.GanttStudioTool,
    ),
  { loading: () => loadingSkeleton },
);

// The biomechanics lab pulls in three/r3f/jsPDF — load it only on its route.
const BiomechanicsLabTool = dynamic(
  () =>
    import("@/features/biomechanics-lab/biomechanics-lab-tool").then(
      (m) => m.BiomechanicsLabTool,
    ),
  { loading: () => loadingSkeleton },
);

// The truss analyzer pulls in jsPDF — load it only on its route.
const TrussAnalyzerTool = dynamic(
  () =>
    import("@/features/truss-analyzer/truss-analyzer-tool").then(
      (m) => m.TrussAnalyzerTool,
    ),
  { loading: () => loadingSkeleton },
);

// The beam designer pulls in jsPDF — load it only on its route.
const BeamDesignerTool = dynamic(
  () =>
    import("@/features/beam-designer/beam-designer-tool").then(
      (m) => m.BeamDesignerTool,
    ),
  { loading: () => loadingSkeleton },
);

// The Ethics Compass is light (data + framer-motion) but lazy-loaded for parity.
const EthicsCompassTool = dynamic(
  () =>
    import("@/features/ethics-compass/ethics-compass-tool").then(
      (m) => m.EthicsCompassTool,
    ),
  { loading: () => loadingSkeleton },
);

// The focus timer (rAF engine + WebAudio + localStorage) — lazy-loaded so its
// client-only machinery stays off every other route's bundle.
const FocusTimerTool = dynamic(
  () =>
    import("@/features/focus-timer/focus-timer-tool").then(
      (m) => m.FocusTimerTool,
    ),
  { loading: () => loadingSkeleton },
);

// The Argument Mapper pulls in React Flow + elkjs + zustand — load it only here.
const ArgumentMapperTool = dynamic(
  () =>
    import("@/features/argument-mapper/argument-mapper-tool").then(
      (m) => m.ArgumentMapperTool,
    ),
  { loading: () => loadingSkeleton },
);

/** Map of tool id → live renderer. Add an entry when a tool ships. */
const renderers: Record<string, React.ComponentType<{ tool: ToolWithHref }>> = {
  "phil-tool-2": ArgumentMapperTool,
  "phil-tool-3": EthicsCompassTool,
  "general-tool-2": FocusTimerTool,
  "eng-tool-1": StlAnalyzerTool,
  "eng-tool-5": TrussAnalyzerTool,
  "eng-tool-6": BeamDesignerTool,
  "general-tool-5": GanttStudioTool,
  "general-tool-6": BiomechanicsLabTool,
};

export function ToolContent({ tool }: { tool: ToolWithHref }) {
  const LiveTool = renderers[tool.id];
  if (LiveTool && tool.status !== "coming-soon") {
    return <LiveTool tool={tool} />;
  }
  return <ComingSoon tool={tool} />;
}
