"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Copy,
  IndentIncrease,
  IndentDecrease,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useGantt } from "../state/store";

/** Right-click actions for a task row. */
export function ContextMenu({
  taskId,
  x,
  y,
  onClose,
  onEdit,
}: {
  taskId: string;
  x: number;
  y: number;
  onClose: () => void;
  onEdit: (id: string) => void;
}) {
  const {
    addTask,
    duplicateTasks,
    deleteTasks,
    indentTask,
    outdentTask,
    project,
  } = useGantt();
  const task = project.tasks.find((t) => t.id === taskId);

  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [onClose]);

  if (typeof document === "undefined" || !task) return null;

  const item = (
    icon: React.ReactNode,
    label: string,
    fn: () => void,
    danger = false,
  ) => (
    <button
      type="button"
      onClick={() => {
        fn();
        onClose();
      }}
      className={
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-muted)] " +
        (danger ? "text-rose-500" : "")
      }
    >
      {icon}
      {label}
    </button>
  );

  // Keep the menu on-screen.
  const left = Math.min(x, window.innerWidth - 210);
  const top = Math.min(y, window.innerHeight - 260);

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12 }}
      className="fixed z-[110] w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
    >
      {item(<Pencil className="size-4" />, "Edit…", () => onEdit(taskId))}
      {item(<Plus className="size-4" />, "Add subtask", () =>
        addTask({ parentId: taskId, name: "New subtask" }),
      )}
      {item(<Copy className="size-4" />, "Duplicate", () =>
        duplicateTasks([taskId]),
      )}
      <div className="my-1 h-px bg-[var(--color-border)]" />
      {item(<IndentIncrease className="size-4" />, "Indent", () =>
        indentTask(taskId),
      )}
      {item(<IndentDecrease className="size-4" />, "Outdent", () =>
        outdentTask(taskId),
      )}
      <div className="my-1 h-px bg-[var(--color-border)]" />
      {item(
        <Trash2 className="size-4" />,
        "Delete",
        () => deleteTasks([taskId]),
        true,
      )}
    </motion.div>,
    document.body,
  );
}
