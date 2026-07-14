import type { Project, Task } from "../types";
import { createProject, createTask } from "./factory";
import { inclusiveDuration } from "./dates";

/**
 * Importers for CSV, JSON, XLSX, and Microsoft Project XML. Each returns a
 * Project (or throws with a friendly message). Column matching is fuzzy/
 * case-insensitive so real-world spreadsheets import without hand-editing.
 */

export async function importFile(file: File): Promise<Project> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const text = await file.text().catch(() => "");
  if (ext === "json") return fromJSON(text);
  if (ext === "csv") return fromRows(parseCSV(text), file.name);
  if (ext === "xml") return fromMSProject(text, file.name);
  if (ext === "xlsx" || ext === "xls") return fromXLSX(file);
  throw new Error(`Unsupported file type: .${ext}`);
}

function fromJSON(text: string): Project {
  const data = JSON.parse(text);
  if (data && Array.isArray(data.tasks) && data.meta) {
    // Native project export — trust its shape but re-seal defaults.
    return {
      ...createProject(data.meta),
      ...data,
      schemaVersion: 1,
    } as Project;
  }
  if (Array.isArray(data)) {
    return fromObjects(data, "Imported project");
  }
  throw new Error("JSON does not look like a project or task list.");
}

async function fromXLSX(file: File): Promise<Project> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  // Prefer a sheet named "Tasks", else the first with data.
  const sheetName =
    wb.SheetNames.find((n) => /task/i.test(n)) ?? wb.SheetNames[0];
  if (!sheetName) throw new Error("Workbook has no sheets.");
  const sheet = wb.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  return fromRows(
    rows.map((r) => r.map((c) => (c == null ? "" : String(c)))),
    file.name,
  );
}

/** Build a project from a header row + data rows. */
function fromRows(rows: string[][], filename: string): Project {
  if (rows.length < 2) throw new Error("No data rows found.");
  const header = rows[0]!.map((h) => h.toLowerCase().trim());
  const find = (...names: string[]) =>
    header.findIndex((h) => names.some((n) => h.includes(n)));

  const col = {
    name: find("task", "name", "title"),
    start: find("start"),
    end: find("end", "finish"),
    duration: find("duration", "days"),
    progress: find("progress", "% complete", "percent"),
    status: find("status"),
    assignee: find("assignee", "owner", "resource"),
    department: find("department", "dept"),
    category: find("category", "phase", "group"),
    notes: find("notes", "description"),
  };
  if (col.name < 0) throw new Error("Could not find a task-name column.");

  const objects = rows.slice(1).map((r) => ({
    name: r[col.name] ?? "",
    startDate: col.start >= 0 ? normalizeDate(r[col.start]) : undefined,
    endDate: col.end >= 0 ? normalizeDate(r[col.end]) : undefined,
    duration:
      col.duration >= 0 ? Number(r[col.duration]) || undefined : undefined,
    progress: col.progress >= 0 ? clampPct(r[col.progress]) : 0,
    status: col.status >= 0 ? normalizeStatus(r[col.status]) : "not-started",
    assignee: col.assignee >= 0 ? (r[col.assignee] ?? "") : "",
    department: col.department >= 0 ? (r[col.department] ?? "") : "",
    category: col.category >= 0 ? (r[col.category] ?? "") : "",
    notes: col.notes >= 0 ? (r[col.notes] ?? "") : "",
  }));
  return fromObjects(objects, filename);
}

function fromObjects(
  objects: Array<Record<string, unknown>>,
  name: string,
): Project {
  const project = createProject({ name: stripExt(name) });
  const tasks: Task[] = [];
  let order = 0;
  for (const o of objects) {
    const taskName = String(o.name ?? o.Name ?? "").trim();
    if (!taskName) continue;
    const start = (o.startDate as string) || project.meta.startDate;
    const dur = (o.duration as number) || 5;
    const t = createTask({
      name: taskName,
      order: order++,
      startDate: start,
      endDate: (o.endDate as string) || undefined,
      duration: dur,
      progress: (o.progress as number) || 0,
      status: (o.status as Task["status"]) || "not-started",
      assignee: (o.assignee as string) || "",
      department: (o.department as string) || "",
      category: (o.category as string) || "",
      notes: (o.notes as string) || "",
    });
    if (o.endDate) t.duration = inclusiveDuration(t.startDate, t.endDate);
    tasks.push(t);
  }
  if (tasks.length === 0) throw new Error("No valid tasks found in the file.");
  project.tasks = tasks;
  return project;
}

function fromMSProject(text: string, filename: string): Project {
  const parser = new DOMParser();
  const dom = parser.parseFromString(text, "application/xml");
  if (dom.querySelector("parsererror")) throw new Error("Malformed XML.");
  const taskNodes = Array.from(dom.getElementsByTagName("Task"));
  const project = createProject({
    name:
      dom.getElementsByTagName("Name")[0]?.textContent?.trim() ||
      stripExt(filename),
  });
  const tasks: Task[] = [];
  let order = 0;
  for (const node of taskNodes) {
    const get = (tag: string) =>
      node.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
    const nm = get("Name");
    if (!nm) continue;
    const start = (get("Start") || project.meta.startDate).slice(0, 10);
    const finish = (get("Finish") || start).slice(0, 10);
    const t = createTask({
      name: nm,
      order: order++,
      startDate: start,
      endDate: finish,
      progress: Number(get("PercentComplete")) || 0,
      isMilestone: get("Milestone") === "1",
    });
    t.duration = inclusiveDuration(t.startDate, t.endDate);
    tasks.push(t);
  }
  if (tasks.length === 0)
    throw new Error("No tasks found in the MS Project file.");
  project.tasks = tasks;
  return project;
}

// ── parsing helpers ──────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function normalizeDate(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const trimmed = v.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return undefined;
}

function clampPct(v: string | undefined): number {
  const n = Number(String(v ?? "").replace("%", ""));
  return isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
}

function normalizeStatus(v: string | undefined): Task["status"] {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("complete") || s.includes("done")) return "completed";
  if (s.includes("progress") || s.includes("active")) return "in-progress";
  if (s.includes("hold") || s.includes("block")) return "on-hold";
  if (s.includes("cancel")) return "cancelled";
  return "not-started";
}

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}
