"use client";

import type { ToolWithHref } from "@/types/tool";
import { AnalyzerProvider, useAnalyzer } from "./state/analyzer-context";
import { UploadDropzone } from "./ui/upload-dropzone";
import { Dashboard } from "./ui/dashboard";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareApplicationSchema } from "@/lib/json-ld";

/**
 * Entry point for the STL Engineering Analyzer, lazy-loaded by the tool router
 * so its Three.js/jsPDF payload never touches any other route. Shows the upload
 * dropzone until a model is analyzed, then the full dashboard.
 */
export function StlAnalyzerTool({ tool }: { tool: ToolWithHref }) {
  return (
    <AnalyzerProvider>
      <JsonLd data={softwareApplicationSchema(tool)} />
      <Workspace />
    </AnalyzerProvider>
  );
}

function Workspace() {
  const { model } = useAnalyzer();
  return model ? <Dashboard /> : <IntroWithUpload />;
}

function IntroWithUpload() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          STL Engineering Analyzer
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-[var(--color-muted-foreground)]">
          Upload an STL to inspect it in an interactive CAD viewport and get
          geometry, mass properties, stability, an approximate stress field, and
          a complete 3D-printing cost analysis — with a downloadable PDF report.
        </p>
      </div>
      <UploadDropzone />
    </div>
  );
}
