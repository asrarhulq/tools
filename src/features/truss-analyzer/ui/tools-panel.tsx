"use client";

import { useRef } from "react";
import {
  MousePointer2,
  CircleDot,
  Minus,
  Anchor,
  ArrowDown,
  Undo2,
  Redo2,
  Trash2,
  FolderOpen,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useTruss, type ToolMode } from "../state/store";
import { Panel } from "./primitives";
import { buildPreset, EXAMPLES, type PresetId } from "../lib/presets";
import {
  parseProject,
  toJSON,
  downloadText,
  sanitize,
} from "../lib/export-data";
import { cn } from "@/lib/utils";

const TOOLS: Array<{
  id: ToolMode;
  label: string;
  icon: typeof MousePointer2;
  hint: string;
}> = [
  {
    id: "select",
    label: "Select",
    icon: MousePointer2,
    hint: "Select & drag joints",
  },
  {
    id: "add-node",
    label: "Joint",
    icon: CircleDot,
    hint: "Click canvas to add a joint",
  },
  {
    id: "add-member",
    label: "Member",
    icon: Minus,
    hint: "Click two joints to connect",
  },
  {
    id: "add-support",
    label: "Support",
    icon: Anchor,
    hint: "Click a joint to cycle support",
  },
  {
    id: "add-load",
    label: "Load",
    icon: ArrowDown,
    hint: "Click a joint to add a load",
  },
];

const PRESETS: Array<{ id: PresetId; label: string }> = [
  { id: "warren", label: "Warren" },
  { id: "pratt", label: "Pratt" },
  { id: "howe", label: "Howe" },
  { id: "king-post", label: "King-post" },
];

/** Left panel: creation tools, presets, example library, project I/O. */
export function ToolsPanel() {
  const {
    tool,
    setTool,
    loadTruss,
    canUndo,
    canRedo,
    undo,
    redo,
    truss,
    selectedNode,
    selectedMember,
    deleteNode,
    deleteMember,
  } = useTruss();
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = async (file: File) => {
    try {
      const t = parseProject(await file.text());
      loadTruss(t);
      toast.success("Project loaded", {
        description: `${t.nodes.length} joints, ${t.members.length} members.`,
      });
    } catch (e) {
      toast.error("Import failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <div className="space-y-3">
      <Panel title="Tools">
        <div className="grid grid-cols-5 gap-1.5">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.hint}
              onClick={() => setTool(t.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors [&_svg]:size-4",
                tool === t.id
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
              )}
            >
              <t.icon />
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
          {TOOLS.find((t) => t.id === tool)?.hint}
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          <IconBtn label="Undo" disabled={!canUndo} onClick={undo}>
            <Undo2 />
          </IconBtn>
          <IconBtn label="Redo" disabled={!canRedo} onClick={redo}>
            <Redo2 />
          </IconBtn>
          <span className="flex-1" />
          <IconBtn
            label="Delete selected"
            disabled={!selectedNode && !selectedMember}
            onClick={() => {
              if (selectedNode) deleteNode(selectedNode);
              else if (selectedMember) deleteMember(selectedMember);
            }}
          >
            <Trash2 />
          </IconBtn>
        </div>
      </Panel>

      <Panel title="Templates">
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                loadTruss(buildPreset(p.id));
                toast.success(`${p.label} truss loaded`);
              }}
              className="rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs font-medium transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              {p.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        title="Example library"
        action={<Sparkles className="size-4 text-[var(--color-primary)]" />}
      >
        <div className="space-y-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => {
                loadTruss(ex.build());
                toast.success(`${ex.name} loaded`);
              }}
              className="group w-full rounded-lg border border-[var(--color-border)] p-2 text-left transition-colors hover:border-[var(--color-primary)]"
            >
              <span className="block text-xs font-semibold">{ex.name}</span>
              <span className="mt-0.5 block text-[11px] text-[var(--color-muted-foreground)]">
                {ex.description}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Project">
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = "";
          }}
        />
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)] [&_svg]:size-3.5"
          >
            <FolderOpen /> Open
          </button>
          <button
            type="button"
            onClick={() => {
              downloadText(
                toJSON(truss),
                "application/json",
                `${sanitize(truss.name)}.json`,
              );
              toast.success("Project saved");
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)] [&_svg]:size-3.5"
          >
            <Save /> Save
          </button>
        </div>
      </Panel>
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
      className="flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-40 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}
