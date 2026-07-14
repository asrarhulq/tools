"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Download,
  Expand,
  Flag,
  FolderCog,
  Maximize2,
  Minus,
  Plus,
  Redo2,
  Upload,
  Undo2,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useGantt } from "../state/store";
import { useSchedule } from "../state/use-schedule";
import { importFile } from "../lib/import";
import {
  downloadPayload,
  toCSV,
  toJSON,
  toMSProjectXML,
  toXML,
} from "../lib/export-data";
import { exportXLSX } from "../lib/export-xlsx";
import { buildGanttSVG, rasterize } from "../lib/export-image";
import { exportPDF } from "../lib/export-pdf";
import type { ZoomLevel } from "../types";
import { cn } from "@/lib/utils";

const ZOOMS: ZoomLevel[] = ["day", "week", "month", "quarter", "year"];

/** The command bar: project actions, undo/redo, zoom, timeline controls, I/O. */
export function Toolbar({
  onOpenProject,
  onFullscreen,
  onFit,
  onToday,
}: {
  onOpenProject: () => void;
  onFullscreen: () => void;
  onFit: () => void;
  onToday: () => void;
}) {
  const {
    project,
    zoom,
    setZoom,
    addTask,
    canUndo,
    canRedo,
    undo,
    redo,
    setAllCollapsed,
    loadProject,
    captureBaseline,
  } = useGantt();
  const schedule = useSchedule();
  const [menu, setMenu] = useState<"export" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const filename =
    project.meta.name.replace(/[^a-z0-9-_]+/gi, "-") || "project";

  const doExport = async (kind: string) => {
    setMenu(null);
    try {
      setBusy(true);
      if (kind === "csv") downloadPayload(toCSV(project), filename);
      else if (kind === "json") downloadPayload(toJSON(project), filename);
      else if (kind === "xml") downloadPayload(toXML(project), filename);
      else if (kind === "mpp")
        downloadPayload(
          toMSProjectXML(project, schedule.tasks),
          `${filename}-msproject`,
        );
      else if (kind === "xlsx") await exportXLSX(project, filename);
      else if (kind === "svg") {
        const { svg } = buildGanttSVG(project, schedule.tasks, zoom);
        downloadPayload(
          { content: svg, mime: "image/svg+xml", ext: "svg" },
          filename,
        );
      } else if (kind === "png" || kind === "jpeg") {
        const result = buildGanttSVG(project, schedule.tasks, zoom);
        // Yield to the event loop so the busy state paints (no frozen UI).
        await new Promise((r) => setTimeout(r, 0));
        const data = await rasterize(
          result,
          3,
          kind === "jpeg" ? "jpeg" : "png",
        );
        const a = document.createElement("a");
        a.href = data;
        a.download = `${filename}.${kind === "jpeg" ? "jpg" : "png"}`;
        a.click();
      } else if (kind === "pdf-a4" || kind === "pdf-letter") {
        await new Promise((r) => setTimeout(r, 0));
        exportPDF(
          project,
          schedule,
          { paper: kind === "pdf-a4" ? "a4" : "letter", zoom },
          filename,
        );
      }
      toast.success("Export ready");
    } catch (e) {
      toast.error("Export failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const onImport = async (file: File) => {
    try {
      setBusy(true);
      const imported = await importFile(file);
      loadProject(imported);
      toast.success("Project imported", {
        description: `${imported.tasks.length} tasks loaded.`,
      });
    } catch (e) {
      toast.error("Import failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
      {/* Primary actions */}
      <Button size="sm" onClick={() => addTask()}>
        <Plus className="size-4" /> Task
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => addTask({ isMilestone: true, name: "Milestone" })}
      >
        <Flag className="size-4" /> Milestone
      </Button>

      <Divider />

      <IconBtn label="Undo" disabled={!canUndo} onClick={undo}>
        <Undo2 className="size-4" />
      </IconBtn>
      <IconBtn label="Redo" disabled={!canRedo} onClick={redo}>
        <Redo2 className="size-4" />
      </IconBtn>

      <Divider />

      {/* Zoom */}
      <div className="flex items-center overflow-hidden rounded-lg border border-[var(--color-border)]">
        {ZOOMS.map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => setZoom(z)}
            className={cn(
              "px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              zoom === z
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
            )}
          >
            {z}
          </button>
        ))}
      </div>

      <IconBtn label="Fit to screen" onClick={onFit}>
        <ZoomIn className="size-4" />
      </IconBtn>
      <IconBtn label="Jump to today" onClick={onToday}>
        <span className="text-[11px] font-semibold">Today</span>
      </IconBtn>

      <Divider />

      <IconBtn label="Expand all" onClick={() => setAllCollapsed(false)}>
        <Expand className="size-4" />
      </IconBtn>
      <IconBtn label="Collapse all" onClick={() => setAllCollapsed(true)}>
        <Minus className="size-4" />
      </IconBtn>

      <span className="flex-1" />

      {/* Right cluster */}
      <IconBtn
        label="Set baseline"
        onClick={() => {
          captureBaseline();
          toast.success("Baseline captured");
        }}
      >
        <span className="text-[11px] font-semibold">Baseline</span>
      </IconBtn>
      <IconBtn label="Project settings" onClick={onOpenProject}>
        <FolderCog className="size-4" />
      </IconBtn>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.json,.xlsx,.xls,.xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onImport(f);
        }}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="size-4" /> Import
      </Button>

      <div className="relative">
        <Button
          size="sm"
          disabled={busy}
          onClick={() => setMenu((m) => (m === "export" ? null : "export"))}
        >
          <Download className="size-4" /> Export
          <ChevronDown className="size-3.5" />
        </Button>
        <AnimatePresence>
          {menu === "export" ? (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenu(null)}
              />
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl"
              >
                <MenuGroup label="Document" />
                <MenuItem onClick={() => doExport("pdf-a4")}>
                  PDF — A4 (with cover)
                </MenuItem>
                <MenuItem onClick={() => doExport("pdf-letter")}>
                  PDF — Letter (with cover)
                </MenuItem>
                <MenuGroup label="Image" />
                <MenuItem onClick={() => doExport("png")}>
                  PNG (high-res)
                </MenuItem>
                <MenuItem onClick={() => doExport("jpeg")}>
                  JPEG (high-res)
                </MenuItem>
                <MenuItem onClick={() => doExport("svg")}>
                  SVG (vector)
                </MenuItem>
                <MenuGroup label="Data" />
                <MenuItem onClick={() => doExport("xlsx")}>
                  Excel (.xlsx)
                </MenuItem>
                <MenuItem onClick={() => doExport("csv")}>CSV</MenuItem>
                <MenuItem onClick={() => doExport("json")}>JSON</MenuItem>
                <MenuItem onClick={() => doExport("mpp")}>
                  MS Project XML
                </MenuItem>
                <MenuItem onClick={() => doExport("xml")}>XML</MenuItem>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>

      <IconBtn label="Fullscreen" onClick={onFullscreen}>
        <Maximize2 className="size-4" />
      </IconBtn>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg px-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-[var(--color-border)]" />;
}

function MenuGroup({ label }: { label: string }) {
  return (
    <p className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-[var(--color-muted-foreground)] uppercase">
      {label}
    </p>
  );
}

function MenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-muted)]"
    >
      {children}
    </button>
  );
}
