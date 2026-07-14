import type { Project, ScheduledTask, Task } from "../types";
import { STATUS_META } from "./factory";

/**
 * Data exporters (dependency-free): CSV, JSON, XML, and Microsoft Project XML.
 * XLSX lives in `export-xlsx.ts` (lazy SheetJS). Each returns a string + MIME so
 * the caller can trigger a download uniformly.
 */

export interface ExportPayload {
  content: string | Blob;
  mime: string;
  ext: string;
}

const COLUMNS: Array<{ key: keyof Task | "durationDays"; label: string }> = [
  { key: "id", label: "ID" },
  { key: "name", label: "Task" },
  { key: "startDate", label: "Start" },
  { key: "endDate", label: "End" },
  { key: "durationDays", label: "Duration" },
  { key: "progress", label: "Progress %" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "assignee", label: "Assignee" },
  { key: "department", label: "Department" },
  { key: "category", label: "Category" },
  { key: "notes", label: "Notes" },
];

export function tableRows(project: Project): string[][] {
  const header = COLUMNS.map((c) => c.label);
  const rows = project.tasks.map((t) =>
    COLUMNS.map((c) => {
      if (c.key === "durationDays") return String(t.duration);
      if (c.key === "status") return STATUS_META[t.status].label;
      const v = t[c.key as keyof Task];
      return v == null ? "" : String(v);
    }),
  );
  return [header, ...rows];
}

export function toCSV(project: Project): ExportPayload {
  const esc = (s: string) =>
    /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  const content = tableRows(project)
    .map((r) => r.map(esc).join(","))
    .join("\n");
  return { content, mime: "text/csv;charset=utf-8", ext: "csv" };
}

export function toJSON(project: Project): ExportPayload {
  return {
    content: JSON.stringify(project, null, 2),
    mime: "application/json",
    ext: "json",
  };
}

/** Generic, human-readable XML dump of the project. */
export function toXML(project: Project): ExportPayload {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const taskXml = project.tasks
    .map(
      (t) =>
        `    <task id="${esc(t.id)}" parent="${esc(t.parentId ?? "")}">\n` +
        `      <name>${esc(t.name)}</name>\n` +
        `      <start>${t.startDate}</start>\n` +
        `      <end>${t.endDate}</end>\n` +
        `      <duration>${t.duration}</duration>\n` +
        `      <progress>${t.progress}</progress>\n` +
        `      <status>${t.status}</status>\n` +
        `      <milestone>${t.isMilestone}</milestone>\n` +
        `      <assignee>${esc(t.assignee)}</assignee>\n` +
        t.dependencies
          .map(
            (d) =>
              `      <dependency from="${esc(d.from)}" type="${d.type}" lag="${d.lag}"/>`,
          )
          .join("\n") +
        (t.dependencies.length ? "\n" : "") +
        `    </task>`,
    )
    .join("\n");
  const content =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<project name="${esc(project.meta.name)}" version="${esc(project.meta.version)}">\n` +
    `  <tasks>\n${taskXml}\n  </tasks>\n</project>\n`;
  return { content, mime: "application/xml", ext: "xml" };
}

/**
 * Microsoft Project–compatible XML (MSPDI subset). Emits Project/Tasks with
 * outline levels from the tree depth and finish-to-start predecessor links —
 * enough for MS Project / compatible tools to import the schedule.
 */
export function toMSProjectXML(
  project: Project,
  scheduled: ScheduledTask[],
): ExportPayload {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const uidOf = new Map<string, number>();
  scheduled.forEach((t, i) => uidOf.set(t.id, i + 1));

  const iso = (d: string) => `${d}T08:00:00`;
  const tasks = scheduled
    .map((t) => {
      const uid = uidOf.get(t.id)!;
      const preds = t.dependencies
        .map((d) => {
          const puid = uidOf.get(d.from);
          if (!puid) return "";
          const typeCode = { FF: 0, FS: 1, SF: 2, SS: 3 }[d.type];
          return `      <PredecessorLink><PredecessorUID>${puid}</PredecessorUID><Type>${typeCode}</Type></PredecessorLink>`;
        })
        .filter(Boolean)
        .join("\n");
      return (
        `    <Task>\n` +
        `      <UID>${uid}</UID>\n` +
        `      <ID>${uid}</ID>\n` +
        `      <Name>${esc(t.name)}</Name>\n` +
        `      <OutlineLevel>${t.depth + 1}</OutlineLevel>\n` +
        `      <Start>${iso(t.startDate)}</Start>\n` +
        `      <Finish>${iso(t.endDate)}</Finish>\n` +
        `      <Duration>PT${t.duration * 8}H0M0S</Duration>\n` +
        `      <PercentComplete>${t.progress}</PercentComplete>\n` +
        `      <Milestone>${t.isMilestone ? 1 : 0}</Milestone>\n` +
        `      <Summary>${t.hasChildren ? 1 : 0}</Summary>\n` +
        (preds ? preds + "\n" : "") +
        `    </Task>`
      );
    })
    .join("\n");

  const content =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Project xmlns="http://schemas.microsoft.com/project">\n` +
    `  <Name>${esc(project.meta.name)}</Name>\n` +
    `  <Title>${esc(project.meta.name)}</Title>\n` +
    `  <Author>${esc(project.meta.projectManager || "Asrar ul Haq")}</Author>\n` +
    `  <StartDate>${iso(project.meta.startDate)}</StartDate>\n` +
    `  <Tasks>\n${tasks}\n  </Tasks>\n</Project>\n`;
  return { content, mime: "application/xml", ext: "xml" };
}

/** Trigger a browser download for an export payload. */
export function downloadPayload(payload: ExportPayload, filename: string) {
  const blob =
    payload.content instanceof Blob
      ? payload.content
      : new Blob([payload.content], { type: payload.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${payload.ext}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
