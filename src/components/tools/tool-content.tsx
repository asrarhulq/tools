import dynamic from "next/dynamic";
import type { ToolWithHref } from "@/types/tool";
import { ComingSoon } from "./coming-soon";

/**
 * Per-tool content dispatcher. Placeholder tools render the shared ComingSoon
 * state; tools with a real implementation register a lazy-loaded renderer here.
 * Heavy renderers (e.g. the 3D viewer) are code-split so they never touch the
 * bundle of any other tool.
 */

// The STL analyzer pulls in three/r3f/drei/jsPDF — load it only on its route.
const StlAnalyzerTool = dynamic(
  () =>
    import("@/features/stl-analyzer/stl-analyzer-tool").then(
      (m) => m.StlAnalyzerTool,
    ),
  {
    loading: () => (
      <div className="mx-auto aspect-video w-full max-w-3xl animate-pulse rounded-[var(--radius)] bg-[var(--color-muted)]" />
    ),
  },
);

/** Map of tool id → live renderer. Add an entry when a tool ships. */
const renderers: Record<string, React.ComponentType<{ tool: ToolWithHref }>> = {
  "eng-tool-1": StlAnalyzerTool,
};

export function ToolContent({ tool }: { tool: ToolWithHref }) {
  const LiveTool = renderers[tool.id];
  if (LiveTool && tool.status !== "coming-soon") {
    return <LiveTool tool={tool} />;
  }
  return <ComingSoon tool={tool} />;
}
