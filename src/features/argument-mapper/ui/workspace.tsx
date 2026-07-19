"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { ArgGraph, LayoutKind } from "../types";
import { useAmStore } from "../store";
import { runLayout } from "../lib/layout";
import { loadGraph, saveGraph } from "../lib/persist";
import { exportJson, exportMarkdown, exportPng } from "../lib/export";
import { Canvas } from "./canvas";
import { Toolbar } from "./toolbar";
import { Inspector } from "./inspector";
import { HealthPanel } from "./health-panel";
import { LibraryDialog } from "./library-dialog";
import { CommandPalette } from "./command-palette";
import { EmptyState } from "./empty-state";

/**
 * The composed Argument Mapper workspace. Left/main: the infinite canvas with
 * floating toolbar + inspector. Right: the reasoning report (collapsible on
 * mobile). Owns cross-cutting concerns: post-mount hydration from localStorage,
 * debounced autosave, async ELK layout runs (which set positions then let the
 * canvas animate/fit), global keyboard shortcuts, and the library/export/command
 * surfaces.
 */
export function Workspace() {
  const {
    nodes,
    hydrated,
    hydrate,
    setLayout,
    applyPositions,
    setGraph,
    snapshot,
    zen,
    setFocus,
    undo,
    redo,
    selectedNodeId,
    deleteNode,
    select,
    requestFit,
  } = useAmStore(
    useShallow((s) => ({
      nodes: s.nodes,
      hydrated: s.hydrated,
      hydrate: s.hydrate,
      setLayout: s.setLayout,
      applyPositions: s.applyPositions,
      setGraph: s.setGraph,
      snapshot: s.snapshot,
      zen: s.zen,
      setFocus: s.setFocus,
      undo: s.undo,
      redo: s.redo,
      selectedNodeId: s.selectedNodeId,
      deleteNode: s.deleteNode,
      select: s.select,
      requestFit: s.requestFit,
    })),
  );

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Hydrate from localStorage after mount (SSR-safe) ──
  useEffect(() => {
    const stored = loadGraph();
    hydrate(stored ?? { nodes: [], edges: [] });
  }, [hydrate]);

  // ── Debounced autosave ──
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => saveGraph(snapshot()), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, hydrated]);

  // Clear the diagnostic focus highlight shortly after it's set.
  useEffect(() => {
    const id = setTimeout(() => setFocus(null), 2600);
    return () => clearTimeout(id);
  }, [setFocus]);

  // ── Async ELK layout → animate to new positions ──
  const onRunLayout = useCallback(
    async (kind: LayoutKind) => {
      setLayout(kind);
      const graph = snapshot();
      if (graph.nodes.length === 0) return;
      try {
        const positions = await runLayout(graph, kind);
        applyPositions(positions);
        requestFit();
      } catch {
        /* layout best-effort */
      }
    },
    [setLayout, snapshot, applyPositions, requestFit],
  );

  const onLoadGraph = useCallback(
    async (graph: ArgGraph) => {
      setGraph(graph);
      // Auto-layout freshly loaded library graphs (they ship without positions).
      try {
        const positions = await runLayout(graph, "tree");
        applyPositions(positions);
        requestFit();
      } catch {
        /* ignore */
      }
    },
    [setGraph, applyPositions, requestFit],
  );

  const onExport = useCallback(
    (fmt: "png" | "json" | "markdown") => {
      const graph = snapshot();
      if (fmt === "json") exportJson(graph);
      else if (fmt === "markdown") exportMarkdown(graph);
      else if (fmt === "png" && containerRef.current) {
        void exportPng(containerRef.current);
      }
    },
    [snapshot],
  );

  // ── Global keyboard shortcuts (ignored while typing) ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const k = e.key?.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;
      if (mod && k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (k === "y" || (k === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if ((k === "delete" || k === "backspace") && selectedNodeId) {
        e.preventDefault();
        deleteNode(selectedNodeId);
        select(null, null);
      } else if (k === "l") {
        setLibraryOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, selectedNodeId, deleteNode, select]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-[calc(100vh-9rem)] min-h-[560px] w-full overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)]"
    >
      {/* Canvas region */}
      <div className="relative flex-1">
        <Canvas />
        {hydrated && nodes.length === 0 ? (
          <EmptyState onOpenLibrary={() => setLibraryOpen(true)} />
        ) : null}
        <Toolbar
          onRunLayout={onRunLayout}
          onOpenLibrary={() => setLibraryOpen(true)}
          onExport={onExport}
        />
        <Inspector />
      </div>

      {/* Reasoning report */}
      {!zen ? (
        <aside
          className={`hidden shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] lg:flex lg:flex-col ${
            reportOpen ? "lg:w-[320px]" : "lg:w-0"
          }`}
        >
          <HealthPanel />
        </aside>
      ) : null}

      <LibraryDialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onLoad={onLoadGraph}
      />
      <CommandPalette
        onRunLayout={onRunLayout}
        onOpenLibrary={() => setLibraryOpen(true)}
        onExport={onExport}
      />

      {/* Mobile report toggle */}
      <button
        type="button"
        onClick={() => setReportOpen((o) => !o)}
        className="sr-only"
        aria-hidden="true"
      />
    </div>
  );
}
