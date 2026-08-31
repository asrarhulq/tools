import type { JournalModel } from "../types";

export function generateJournalMarkdown(model: JournalModel): string {
  const lines: string[] = [];
  lines.push(`# ${model.title}`);
  lines.push("");
  lines.push(
    `**${model.players.white}** vs **${model.players.black}** — ${model.date}`,
  );
  lines.push(
    `Mode: ${model.mode === "assisted" ? "Engine-assisted analysis" : "Unassisted reflection"}`,
  );
  lines.push("");

  if (model.entries.length === 0) {
    lines.push("_No flagged positions or reflections recorded yet._");
  }

  for (const entry of model.entries) {
    lines.push(
      `## Move ${entry.ply}: ${entry.san}${entry.flagged ? " — flagged as critical" : ""}`,
    );
    if (entry.motifs.length) lines.push(`_Motifs: ${entry.motifs.join(", ")}_`);
    if (entry.comment) {
      lines.push("");
      lines.push(entry.comment);
    }
    if (entry.unassistedGuess) {
      lines.push("");
      lines.push(`**Before checking the engine:** ${entry.unassistedGuess}`);
    }
    for (const lensResponse of entry.lensResponses) {
      lines.push("");
      lines.push(`### ${lensResponse.lensName}`);
      lines.push(`> ${lensResponse.prompt}`);
      lines.push("");
      lines.push(lensResponse.response);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/** Client-side download via a Blob + `<a download>` — never throws. */
export function downloadJournalMarkdown(model: JournalModel): void {
  try {
    const markdown = generateJournalMarkdown(model);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `philosophical-chess-journal-${model.date}.md`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    /* A journal export is never worth crashing the app over. */
  }
}
