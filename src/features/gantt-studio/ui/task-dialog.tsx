"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Dialog } from "./dialog";
import { Field, TextInput, TextArea, Select, Pill } from "./primitives";
import { Button } from "@/components/ui/button";
import { useGantt } from "../state/store";
import { STATUS_META, PRIORITY_META } from "../lib/factory";
import { inclusiveDuration, endForDuration } from "../lib/dates";
import type { DependencyType, Priority, Task, TaskStatus } from "../types";

/** Full task editor: every field, plus dependency management. */
export function TaskDialog({
  taskId,
  open,
  onClose,
}: {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { project, updateTask, deleteTasks } = useGantt();
  const task = project.tasks.find((t) => t.id === taskId) ?? null;

  if (!task) return null;
  return (
    <TaskDialogInner
      key={task.id}
      task={task}
      open={open}
      onClose={onClose}
      updateTask={updateTask}
      deleteTasks={deleteTasks}
      allTasks={project.tasks}
    />
  );
}

function TaskDialogInner({
  task,
  open,
  onClose,
  updateTask,
  deleteTasks,
  allTasks,
}: {
  task: Task;
  open: boolean;
  onClose: () => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTasks: (ids: string[]) => void;
  allTasks: Task[];
}) {
  const [draft, setDraft] = useState<Task>(task);
  const set = <K extends keyof Task>(key: K, value: Task[K]) =>
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (key === "startDate" || key === "endDate") {
        next.duration = inclusiveDuration(next.startDate, next.endDate);
      }
      if (key === "duration") {
        next.endDate = endForDuration(next.startDate, value as number);
      }
      return next;
    });

  const save = () => {
    updateTask(task.id, draft);
    onClose();
  };

  const candidates = allTasks.filter((t) => t.id !== task.id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit task"
      description="Configure schedule, ownership, and dependencies."
      size="lg"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              deleteTasks([task.id]);
              onClose();
            }}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
          <span className="flex-1" />
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Task name">
          <TextInput
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Start date">
            <TextInput
              type="date"
              value={draft.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </Field>
          <Field label="End date">
            <TextInput
              type="date"
              value={draft.endDate}
              disabled={draft.isMilestone}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </Field>
          <Field label="Duration (days)">
            <TextInput
              type="number"
              min={1}
              value={draft.duration}
              disabled={draft.isMilestone}
              onChange={(e) => set("duration", Number(e.target.value))}
            />
          </Field>
          <Field label="Progress %">
            <TextInput
              type="number"
              min={0}
              max={100}
              value={draft.progress}
              onChange={(e) =>
                set(
                  "progress",
                  Math.max(0, Math.min(100, Number(e.target.value))),
                )
              }
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(e) => set("status", e.target.value as TaskStatus)}
            >
              {Object.entries(STATUS_META).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select
              value={draft.priority}
              onChange={(e) => set("priority", e.target.value as Priority)}
            >
              {Object.entries(PRIORITY_META).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Bar color">
            <input
              type="color"
              value={draft.color || "#6366f1"}
              onChange={(e) => set("color", e.target.value)}
              className="h-9 w-full cursor-pointer rounded-lg border border-[var(--color-border)] bg-transparent"
            />
          </Field>
          <Field label="Milestone">
            <label className="flex h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isMilestone}
                onChange={(e) => {
                  const on = e.target.checked;
                  setDraft((d) => ({
                    ...d,
                    isMilestone: on,
                    endDate: on ? d.startDate : d.endDate,
                    duration: on ? 1 : d.duration,
                  }));
                }}
                className="size-4 accent-[var(--color-primary)]"
              />
              Mark as milestone
            </label>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Assignee">
            <TextInput
              value={draft.assignee}
              onChange={(e) => set("assignee", e.target.value)}
              placeholder="Name"
            />
          </Field>
          <Field label="Department">
            <TextInput
              value={draft.department}
              onChange={(e) => set("department", e.target.value)}
              placeholder="e.g. Design"
            />
          </Field>
          <Field label="Category">
            <TextInput
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="e.g. Phase 1"
            />
          </Field>
        </div>

        <Field label="Notes">
          <TextArea
            rows={3}
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Context, acceptance criteria, links…"
          />
        </Field>

        {/* Dependencies */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Dependencies (predecessors)
            </span>
          </div>
          <div className="space-y-2">
            {draft.dependencies.map((dep, i) => {
              const pred = allTasks.find((t) => t.id === dep.from);
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] p-2"
                >
                  <Pill color="#6366f1">{dep.type}</Pill>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {pred?.name ?? "Unknown task"}
                  </span>
                  <Select
                    value={dep.type}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        dependencies: d.dependencies.map((x, j) =>
                          j === i
                            ? { ...x, type: e.target.value as DependencyType }
                            : x,
                        ),
                      }))
                    }
                    className="w-20 py-1"
                  >
                    <option value="FS">FS</option>
                    <option value="SS">SS</option>
                    <option value="FF">FF</option>
                    <option value="SF">SF</option>
                  </Select>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        dependencies: d.dependencies.filter((_, j) => j !== i),
                      }))
                    }
                    className="rounded p-1 text-[var(--color-muted-foreground)] hover:text-rose-500"
                    aria-label="Remove dependency"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
            <AddDependency
              candidates={candidates.filter(
                (c) => !draft.dependencies.some((d) => d.from === c.id),
              )}
              onAdd={(fromId) =>
                setDraft((d) => ({
                  ...d,
                  dependencies: [
                    ...d.dependencies,
                    { from: fromId, to: d.id, type: "FS", lag: 0 },
                  ],
                }))
              }
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function AddDependency({
  candidates,
  onAdd,
}: {
  candidates: Task[];
  onAdd: (id: string) => void;
}) {
  const [value, setValue] = useState("");
  if (candidates.length === 0) {
    return (
      <p className="text-xs text-[var(--color-muted-foreground)]">
        No other tasks available to link.
      </p>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1"
      >
        <option value="">Select a predecessor…</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Button
        variant="outline"
        size="sm"
        disabled={!value}
        onClick={() => {
          if (value) {
            onAdd(value);
            setValue("");
          }
        }}
      >
        <Plus className="size-4" /> Link
      </Button>
    </div>
  );
}
