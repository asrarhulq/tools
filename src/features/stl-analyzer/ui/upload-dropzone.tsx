"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileUp, Loader2, Shapes } from "lucide-react";
import { useAnalyzer } from "../state/analyzer-context";
import { Button } from "@/components/ui/button";
import { makeExampleStl } from "../lib/example";
import { cn } from "@/lib/utils";

/** Drag-and-drop STL upload with an "example model" shortcut. */
export function UploadDropzone() {
  const { loadFile, analyzing } = useAnalyzer();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const onFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) void loadFile(file);
    },
    [loadFile],
  );

  const loadExample = useCallback(() => {
    void loadFile(makeExampleStl());
  }, [loadFile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-5 rounded-[var(--radius)] border-2 border-dashed px-6 py-16 text-center transition-colors",
        dragging
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
          : "border-[var(--color-border)]",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".stl"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />

      <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
        {analyzing ? (
          <Loader2 className="size-7 animate-spin" aria-hidden="true" />
        ) : (
          <FileUp className="size-7" aria-hidden="true" />
        )}
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {analyzing ? "Analyzing model…" : "Drop an STL file to analyze"}
        </h2>
        <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
          Geometry, mass properties, stability, an approximate stress field, and
          a full 3D-printing cost breakdown — computed in your browser.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => inputRef.current?.click()} disabled={analyzing}>
          <FileUp className="size-4" /> Choose STL file
        </Button>
        <Button variant="outline" onClick={loadExample} disabled={analyzing}>
          <Shapes className="size-4" /> Load example
        </Button>
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        STL supported now · OBJ, GLTF/GLB, and STEP (via conversion) planned
      </p>
    </motion.div>
  );
}
