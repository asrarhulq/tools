import type { Project } from "../types";
import { tableRows } from "./export-data";
import { addDaysISO, daysBetween, formatShort } from "./dates";

/**
 * XLSX export via SheetJS, dynamically imported so the payload only loads when
 * the user actually exports to Excel. Produces a real .xlsx workbook with three
 * sheets: Project (info), Tasks (structured data), and Timeline (a spreadsheet
 * Gantt grid — task rows × week columns with span markers and milestone glyphs).
 */
export async function exportXLSX(
  project: Project,
  filename: string,
): Promise<void> {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  // Project info sheet.
  const m = project.meta;
  const info: string[][] = [
    ["Project", m.name],
    ["Client", m.client],
    ["Organization", m.organization],
    ["Project Manager", m.projectManager],
    ["Team", m.team],
    ["Version", m.version],
    ["Revision", m.revision],
    ["Document Number", m.documentNumber],
    ["Start", m.startDate],
    ["End", m.endDate],
    ["Description", m.description],
  ];
  const infoSheet = XLSX.utils.aoa_to_sheet(info);
  infoSheet["!cols"] = [{ wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, infoSheet, "Project");

  // Tasks sheet.
  const rows = tableRows(project);
  const tasksSheet = XLSX.utils.aoa_to_sheet(rows);
  tasksSheet["!cols"] = [
    { wch: 14 },
    { wch: 34 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 11 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, tasksSheet, "Tasks");

  // Timeline sheet: a spreadsheet Gantt grid (task rows × week columns).
  const timeline = buildTimelineGrid(project);
  const tlSheet = XLSX.utils.aoa_to_sheet(timeline.aoa);
  tlSheet["!cols"] = [
    { wch: 40 },
    ...(timeline.weekCount ? Array(timeline.weekCount).fill({ wch: 5 }) : []),
  ];
  XLSX.utils.book_append_sheet(wb, tlSheet, "Timeline");

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** Build a task × week grid with span/milestone glyphs for the Timeline sheet. */
function buildTimelineGrid(project: Project): {
  aoa: string[][];
  weekCount: number;
} {
  const tasks = project.tasks;
  if (tasks.length === 0) return { aoa: [["Task"]], weekCount: 0 };

  let start = project.meta.startDate;
  let end = project.meta.endDate;
  for (const t of tasks) {
    if (daysBetween(t.startDate, start) > 0) start = t.startDate;
    if (daysBetween(end, t.endDate) > 0) end = t.endDate;
  }
  const totalDays = Math.max(1, daysBetween(start, end) + 1);
  const weekCount = Math.ceil(totalDays / 7);
  const weekStarts: string[] = [];
  for (let w = 0; w < weekCount; w++) weekStarts.push(addDaysISO(start, w * 7));

  const header = ["Task", ...weekStarts.map((d) => formatShort(d))];
  const aoa: string[][] = [header];

  for (const t of tasks) {
    const row: string[] = [
      `${"  ".repeat(0)}${t.isMilestone ? "◆ " : ""}${t.name}`,
    ];
    for (let w = 0; w < weekCount; w++) {
      const ws = weekStarts[w]!;
      const we = addDaysISO(ws, 6);
      // Milestone: mark the week containing its date.
      if (t.isMilestone) {
        row.push(
          daysBetween(ws, t.startDate) >= 0 && daysBetween(t.startDate, we) >= 0
            ? "◆"
            : "",
        );
        continue;
      }
      // Bar: mark weeks that overlap [start,end].
      const overlaps =
        daysBetween(t.startDate, we) >= 0 && daysBetween(ws, t.endDate) >= 0;
      row.push(overlaps ? "█" : "");
    }
    aoa.push(row);
  }
  return { aoa, weekCount };
}
