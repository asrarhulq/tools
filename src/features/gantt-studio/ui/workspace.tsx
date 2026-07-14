"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, GanttChartSquare } from "lucide-react";
import { toast } from "sonner";
import { useGantt } from "../state/store";
import { useSchedule } from "../state/use-schedule";
import { Toolbar } from "./toolbar";
import { TaskTree } from "./task-tree";
import { GanttCanvas } from "./gantt-canvas";
import { Dashboard } from "./dashboard";
import { TaskDialog } from "./task-dialog";
import { ProjectDialog } from "./project-dialog";
import { ContextMenu } from "./context-menu";
import { StartScreen } from "./start-screen";
import { cn } from "@/lib/utils";

/**
 * The main workspace: a synchronized split view (task tree left, Gantt right)
 * with a Plan / Dashboard tab switch, all dialogs, right-click menu, keyboard
 * shortcuts, autosave indicator, and the "Developed by Asrar ul Haq" footer.
 */
export function Workspace() {
  const {
    project,
    selectedIds,
    savedAt,
    addTask,
    duplicateTasks,
    deleteTasks,
    undo,
    redo,
    save,
    clearSelection,
  } = useGantt();
  const { tasks } = useSchedule();

  const [tab, setTab] = useState<"plan" | "dashboard">("plan");
  const [editId, setEditId] = useState<string | null>(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [ctx, setCtx] = useState<{ id: string; x: number; y: number } | null>(
    null,
  );

  const treeScroll = useRef<HTMLDivElement>(null);
  const ganttScroll = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<() => void>(() => {});

  // Vertical scroll sync between the two panes.
  const syncing = useRef(false);
  const onTreeScroll = () => {
    if (syncing.current || !ganttScroll.current || !treeScroll.current) return;
    syncing.current = true;
    ganttScroll.current.scrollTop = treeScroll.current.scrollTop;
    requestAnimationFrame(() => (syncing.current = false));
  };
  const onGanttScroll = () => {
    if (syncing.current || !ganttScroll.current || !treeScroll.current) return;
    syncing.current = true;
    treeScroll.current.scrollTop = ganttScroll.current.scrollTop;
    requestAnimationFrame(() => (syncing.current = false));
  };

  const fitToScreen = useCallback(() => {
    ganttScroll.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, []);

  const jumpToday = useCallback(() => {
    const el = ganttScroll.current?.querySelector<HTMLElement>("[data-today]");
    if (el && ganttScroll.current) {
      ganttScroll.current.scrollTo({
        left: el.offsetLeft - 200,
        behavior: "smooth",
      });
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        mod &&
        (e.key.toLowerCase() === "y" ||
          (e.shiftKey && e.key.toLowerCase() === "z"))
      ) {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
        toast.success("Saved");
      } else if (mod && e.key.toLowerCase() === "d" && selectedIds.length) {
        e.preventDefault();
        duplicateTasks(selectedIds);
      } else if (
        !typing &&
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIds.length
      ) {
        e.preventDefault();
        deleteTasks(selectedIds);
      } else if (!typing && e.key.toLowerCase() === "n" && !mod) {
        e.preventDefault();
        addTask();
      } else if (e.key === "Escape") {
        clearSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    undo,
    redo,
    save,
    duplicateTasks,
    deleteTasks,
    addTask,
    clearSelection,
    selectedIds,
  ]);

  const hasTasks = project.tasks.length > 0;

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-8rem)] min-h-[600px] flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] shadow-lg"
    >
      <Toolbar
        onOpenProject={() => setProjectOpen(true)}
        onFullscreen={toggleFullscreen}
        onFit={fitToScreen}
        onToday={jumpToday}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5">
        {(
          [
            { id: "plan", label: "Plan", icon: GanttChartSquare },
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors [&_svg]:size-4",
              tab === t.id
                ? "text-[var(--color-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
            )}
          >
            <t.icon />
            {t.label}
            {tab === t.id ? (
              <motion.span
                layoutId="gantt-tab"
                className="absolute inset-x-2 -bottom-1.5 h-0.5 rounded-full bg-[var(--color-primary)]"
              />
            ) : null}
          </button>
        ))}
        <span className="flex-1" />
        <span className="pr-1 text-[11px] text-[var(--color-muted-foreground)]">
          {savedAt ? "All changes saved" : "Autosave on"}
        </span>
      </div>

      {/* Body */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {tab === "plan" ? (
            <motion.div
              key="plan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full"
            >
              {hasTasks ? (
                <>
                  {/* Task tree (left) */}
                  <div
                    ref={treeScroll}
                    onScroll={onTreeScroll}
                    className="w-[300px] shrink-0 overflow-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] sm:w-[340px]"
                  >
                    <TaskTree
                      tasks={tasks}
                      onEditTask={setEditId}
                      onContextMenu={(id, x, y) => setCtx({ id, x, y })}
                    />
                  </div>
                  {/* Gantt (right) */}
                  <div className="min-w-0 flex-1 bg-[var(--color-background)]">
                    <GanttCanvas
                      tasks={tasks}
                      scrollRef={ganttScroll}
                      onScroll={onGanttScroll}
                    />
                  </div>
                </>
              ) : (
                <div className="h-full w-full overflow-auto">
                  <StartScreen onImport={() => importRef.current()} />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-auto p-5"
            >
              <Dashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[11px] text-[var(--color-muted-foreground)]">
        <span>
          {project.tasks.length} tasks · {project.meta.name}
        </span>
        <span className="font-medium">Developed by Asrar ul Haq</span>
      </div>

      {/* Overlays */}
      <TaskDialog
        taskId={editId}
        open={editId !== null}
        onClose={() => setEditId(null)}
      />
      <ProjectDialog open={projectOpen} onClose={() => setProjectOpen(false)} />
      {ctx ? (
        <ContextMenu
          taskId={ctx.id}
          x={ctx.x}
          y={ctx.y}
          onClose={() => setCtx(null)}
          onEdit={(id) => {
            setCtx(null);
            setEditId(id);
          }}
        />
      ) : null}

      {/* Bridge the Toolbar's import trigger to the StartScreen button. */}
      <ImportBridge onReady={(fn) => (importRef.current = fn)} />
    </div>
  );
}

/** Hidden file input the StartScreen "Import" button can trigger. */
function ImportBridge({ onReady }: { onReady: (fn: () => void) => void }) {
  const { loadProject } = useGantt();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    onReady(() => ref.current?.click());
  }, [onReady]);
  return (
    <input
      ref={ref}
      type="file"
      accept=".csv,.json,.xlsx,.xls,.xml"
      className="hidden"
      onChange={async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        try {
          const { importFile } = await import("../lib/import");
          const p = await importFile(f);
          loadProject(p);
          toast.success("Project imported", {
            description: `${p.tasks.length} tasks loaded.`,
          });
        } catch (err) {
          toast.error("Import failed", {
            description: err instanceof Error ? err.message : undefined,
          });
        } finally {
          if (ref.current) ref.current.value = "";
        }
      }}
    />
  );
}
