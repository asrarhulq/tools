"use client";

import { addDays } from "date-fns";
import { Reorder } from "framer-motion";
import { Plus, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { PRIORITY_LABELS } from "../config";
import { dateKey } from "../lib/mood";
import { STORAGE_KEYS } from "../lib/storage-keys";
import type { Priority, Task } from "../types";
import { TaskItem } from "./task-item";

const EMPTY_TASKS: Task[] = [];

function makeId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The lightweight MBBS study planner the brief calls for: a daily task
 * list with priority/subject/estimated time, a "minimum viable day" filter
 * for hard days, and "make today easier" (pushes anything not already
 * marked high-priority to tomorrow, so today's list shrinks to what
 * actually has to happen).
 */
export function PlanWidget() {
  const [allTasks, setAllTasks] = useLocalStorage<Task[]>(
    STORAGE_KEYS.tasks,
    EMPTY_TASKS,
  );
  const [minimalMode, setMinimalMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftPriority, setDraftPriority] = useState<Priority>("medium");
  const [draftMinutes, setDraftMinutes] = useState("");

  const today = dateKey();
  const todayTasks = allTasks
    .filter((t) => t.date === today)
    .sort((a, b) => a.order - b.order);

  const visibleTasks = minimalMode
    ? todayTasks.filter((t) => t.essential || t.priority === "high").slice(0, 3)
    : todayTasks;

  const doneCount = todayTasks.filter((t) => t.done).length;

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!draftTitle.trim()) return;
    const newTask: Task = {
      id: makeId(),
      title: draftTitle.trim(),
      subject: draftSubject.trim(),
      priority: draftPriority,
      estimatedMinutes: draftMinutes ? Number(draftMinutes) : null,
      essential: false,
      done: false,
      date: today,
      order: todayTasks.length,
    };
    setAllTasks((prev) => [...prev, newTask]);
    setDraftTitle("");
    setDraftSubject("");
    setDraftMinutes("");
    setDraftPriority("medium");
    setShowForm(false);
  }

  function toggleDone(id: string) {
    setAllTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  function toggleEssential(id: string) {
    setAllTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, essential: !t.essential } : t)),
    );
  }

  function removeTask(id: string) {
    setAllTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function makeTodayEasier() {
    const tomorrow = dateKey(addDays(new Date(), 1));
    setAllTasks((prev) =>
      prev.map((t) =>
        t.date === today && !t.done && t.priority !== "high"
          ? { ...t, date: tomorrow }
          : t,
      ),
    );
  }

  function handleReorder(newOrder: Task[]) {
    setAllTasks((prev) => {
      const otherDays = prev.filter((t) => t.date !== today);
      return [...otherDays, ...newOrder.map((t, i) => ({ ...t, order: i }))];
    });
  }

  return (
    <div
      className="rounded-[24px] border p-4"
      style={{
        borderColor: "var(--bloomie-border)",
        backgroundColor: "var(--bloomie-panel)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--bloomie-text)" }}
        >
          Today&apos;s gentle plan
        </h3>
        {todayTasks.length > 0 && (
          <span className="text-xs" style={{ color: "var(--bloomie-muted)" }}>
            {doneCount}/{todayTasks.length} done
          </span>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMinimalMode((v) => !v)}
          className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
          style={{
            borderColor: "var(--bloomie-border)",
            color: minimalMode ? "white" : "var(--bloomie-text)",
            backgroundColor: minimalMode
              ? "var(--bloomie-accent)"
              : "transparent",
          }}
        >
          <Target className="size-3.5" />
          {minimalMode ? "Showing minimum viable day" : "Minimum viable day"}
        </button>
        <button
          type="button"
          onClick={makeTodayEasier}
          className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
          style={{
            borderColor: "var(--bloomie-border)",
            color: "var(--bloomie-text)",
          }}
        >
          <Sparkles className="size-3.5" />
          Make today easier
        </button>
      </div>

      {visibleTasks.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--bloomie-muted)" }}>
          Nothing on the list yet — add one little thing. 🌷
        </p>
      ) : minimalMode ? (
        <div className="space-y-1.5">
          {visibleTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleDone={() => toggleDone(task.id)}
              onToggleEssential={() => toggleEssential(task.id)}
              onRemove={() => removeTask(task.id)}
            />
          ))}
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={visibleTasks}
          onReorder={handleReorder}
          className="space-y-1.5"
        >
          {visibleTasks.map((task) => (
            <Reorder.Item key={task.id} value={task}>
              <TaskItem
                task={task}
                draggable
                onToggleDone={() => toggleDone(task.id)}
                onToggleEssential={() => toggleEssential(task.id)}
                onRemove={() => removeTask(task.id)}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {showForm ? (
        <form
          onSubmit={addTask}
          className="mt-3 space-y-2 rounded-xl border p-3"
          style={{ borderColor: "var(--bloomie-border)" }}
        >
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="What's the little task?"
            autoFocus
            className="w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none"
            style={{
              borderColor: "var(--bloomie-border)",
              color: "var(--bloomie-text)",
            }}
          />
          <div className="flex flex-wrap gap-2">
            <input
              value={draftSubject}
              onChange={(e) => setDraftSubject(e.target.value)}
              placeholder="Subject (optional)"
              className="min-w-0 flex-1 rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none"
              style={{
                borderColor: "var(--bloomie-border)",
                color: "var(--bloomie-text)",
              }}
            />
            <select
              value={draftPriority}
              onChange={(e) => setDraftPriority(e.target.value as Priority)}
              className="rounded-lg border bg-transparent px-2 py-1.5 text-sm outline-none"
              style={{
                borderColor: "var(--bloomie-border)",
                color: "var(--bloomie-text)",
              }}
            >
              {Object.entries(PRIORITY_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <input
              value={draftMinutes}
              onChange={(e) => setDraftMinutes(e.target.value)}
              type="number"
              min={0}
              placeholder="mins"
              className="w-16 rounded-lg border bg-transparent px-2 py-1.5 text-sm outline-none"
              style={{
                borderColor: "var(--bloomie-border)",
                color: "var(--bloomie-text)",
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-full px-3 py-1.5 text-xs font-medium text-white"
              style={{ backgroundColor: "var(--bloomie-accent)" }}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border px-3 py-1.5 text-xs font-medium"
              style={{
                borderColor: "var(--bloomie-border)",
                color: "var(--bloomie-muted)",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--bloomie-accent)" }}
        >
          <Plus className="size-3.5" /> Add a little task
        </button>
      )}
    </div>
  );
}
