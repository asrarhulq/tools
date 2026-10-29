"use client";
// Printable appendices A–F (white "paper" sheets) and Markdown generators for the report.
import { ELIM_CRITS, fmt } from "./types";
import type { State } from "./types";
import { STEPS } from "./data";
import {
  codeOf,
  eliminated,
  meritOf,
  principlesOf,
  ratingComplete,
  sensitivity,
  survivors,
  weightsOf,
  structDiff,
} from "./derive";
import { Diagram, buildBlackBoxSvg, buildFsSvg } from "./fsdiagram";

export const APP_IDS = ["A", "B", "C", "D", "E", "F"] as const;
export type AppId = (typeof APP_IDS)[number];
const nm = (s: State, id: string) =>
  s.structures.find((x) => x.id === id)?.name || id;
const pText = (p: { text: string; effect: string; geometry: string }) =>
  [p.text, p.effect && `[${p.effect}]`, p.geometry && `(${p.geometry})`]
    .filter(Boolean)
    .join(" ");

export function Paper({ id, s }: { id: AppId; s: State }) {
  const meta = STEPS[APP_IDS.indexOf(id)]!;
  const head = (
    <>
      <h2>
        Appendix {id}: {meta.name}
      </h2>
      <div className="meta">
        ME 36400 · Lab 3 · Conceptual design · {meta.pts} points
      </div>
    </>
  );

  if (id === "A") {
    const verdict = (v: string) =>
      v === "keep"
        ? "kept"
        : v === "pref"
          ? "deleted: preference (op 1)"
          : v === "nofunc"
            ? "deleted: no function (op 2)"
            : "unclassified";
    return (
      <div className="l3-paper">
        {head}
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Requirement (Lab 2)</th>
              <th>Ops 1–2</th>
              <th>Op 3: qualitative</th>
              <th>Op 4: generalized</th>
            </tr>
          </thead>
          <tbody>
            {s.abs.reqs.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>{r.text}</td>
                <td>{verdict(r.verdict)}</td>
                <td>{r.essence}</td>
                <td>{r.general}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Op 5: Solution-neutral problem statement</h3>
        <p>
          <b>{s.abs.statement || "(not written yet)"}</b>
        </p>
      </div>
    );
  }
  if (id === "B") {
    const fx = buildFsSvg(s.fs, { light: true, id: "pbf" }),
      bb = buildBlackBoxSvg(s.fs, { light: true, id: "pbb" });
    return (
      <div className="l3-paper">
        {head}
        <h3>Overall function (black box)</h3>
        {bb.svg ? (
          <div className="svgw">
            <Diagram markup={bb.svg} />
          </div>
        ) : (
          <p>(not drawn)</p>
        )}
        <h3>Function structure</h3>
        {fx.svg ? (
          <div className="svgw">
            <Diagram markup={fx.svg} />
          </div>
        ) : (
          <p>(not drawn)</p>
        )}
      </div>
    );
  }
  if (id === "C") {
    const maxc = Math.max(
      1,
      ...s.fs.fns.map((f) => principlesOf(s, f.id).length),
    );
    return (
      <div className="l3-paper">
        {head}
        <table>
          <thead>
            <tr>
              <th>Function</th>
              {Array.from({ length: maxc }, (_, i) => (
                <th key={i}>{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.fs.fns.map((f, r) => {
              const ps = principlesOf(s, f.id);
              return (
                <tr key={f.id}>
                  <td>
                    <b>
                      {r + 1}. {f.name}
                    </b>
                  </td>
                  {Array.from({ length: maxc }, (_, i) => (
                    <td key={i}>
                      {ps[i] ? (
                        <>
                          <b>
                            {r + 1}.{i + 1}
                          </b>{" "}
                          {pText(ps[i])}
                        </>
                      ) : (
                        ""
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <h3>Sketches</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 8,
          }}
        >
          {s.fs.fns.flatMap((f, r) =>
            principlesOf(s, f.id).map((p, i) => (
              <figure key={p.id} style={{ margin: 0 }}>
                {p.sketch ? (
                  <img src={p.sketch} alt={`Sketch ${r + 1}.${i + 1}`} />
                ) : (
                  <div
                    style={{
                      border: "1px dashed #999",
                      height: 90,
                      display: "grid",
                      placeItems: "center",
                      color: "#888",
                    }}
                  >
                    {p.sketched ? "sketched on paper" : "no sketch"}
                  </div>
                )}
                <figcaption style={{ fontSize: 10.5 }}>
                  {r + 1}.{i + 1} {p.effect}
                </figcaption>
              </figure>
            )),
          )}
        </div>
      </div>
    );
  }
  if (id === "D") {
    return (
      <div className="l3-paper">
        {head}
        <table>
          <thead>
            <tr>
              <th>Structure</th>
              <th>Path</th>
              {s.fs.fns.map((f) => (
                <th key={f.id}>{f.name}</th>
              ))}
              <th>Compatibility</th>
            </tr>
          </thead>
          <tbody>
            {s.structures.map((st) => (
              <tr key={st.id}>
                <td>
                  <b>{st.name}</b>
                </td>
                <td>{codeOf(s, st)}</td>
                {s.fs.fns.map((f) => {
                  const ps = principlesOf(s, f.id).filter((p) =>
                    (st.picks[f.id] || []).includes(p.id),
                  );
                  return (
                    <td key={f.id}>
                      {ps
                        .map((p) => p.effect || p.text.slice(0, 30))
                        .join(" → ")}
                    </td>
                  );
                })}
                <td>
                  {st.checks.phys ? "physical ✓" : "physical ✗"},{" "}
                  {st.checks.geom ? "geometric ✓" : "geometric ✗"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {s.structures.some((x) => x.note) && (
          <>
            <h3>Notes</h3>
            <ul>
              {s.structures
                .filter((x) => x.note)
                .map((x) => (
                  <li key={x.id}>
                    <b>{x.name}:</b> {x.note}
                  </li>
                ))}
            </ul>
          </>
        )}
        {s.structures.length > 1 && (
          <p style={{ fontSize: 11 }}>
            Smallest difference between any two structures:{" "}
            {Math.min(
              ...s.structures.flatMap((a, i) =>
                s.structures.slice(i + 1).map((b) => structDiff(s, a, b)),
              ),
            )}{" "}
            function(s).
          </p>
        )}
      </div>
    );
  }
  if (id === "E") {
    const surv = survivors(s),
      ids = surv.map((x) => x.id),
      w = weightsOf(s),
      rows = meritOf(s, ids, w);
    const sens = ratingComplete(s, ids) ? sensitivity(s, ids) : null;
    return (
      <div className="l3-paper">
        {head}
        <h3>1. Filter</h3>
        <table>
          <thead>
            <tr>
              <th>Structure</th>
              {ELIM_CRITS.filter((c) => s.elimCrit.includes(c.id)).map((c) => (
                <th key={c.id}>{c.label}</th>
              ))}
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {s.structures.map((st) => (
              <tr key={st.id} className={eliminated(s, st.id) ? "out" : ""}>
                <td>{st.name}</td>
                {ELIM_CRITS.filter((c) => s.elimCrit.includes(c.id)).map(
                  (c) => (
                    <td key={c.id}>{s.elim[st.id]?.[c.id] || ""}</td>
                  ),
                )}
                <td>{eliminated(s, st.id) ? "eliminated" : "kept"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>2. Weighted decision matrix</h3>
        <table>
          <thead>
            <tr>
              <th>Criterion</th>
              <th>H/L</th>
              <th>lo–hi</th>
              <th>w</th>
              {surv.map((x) => (
                <th key={x.id}>{x.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.crit.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.pref}</td>
                <td>
                  {c.lo}–{c.hi} {c.unit}
                </td>
                <td>{fmt(w[c.id] || 0)}</td>
                {surv.map((x) => (
                  <td key={x.id}>{String(s.ratings[x.id]?.[c.id] ?? "")}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td colSpan={4}>
                <b>Merit Σ wᵢ·nᵢ</b>
              </td>
              {surv.map((x) => (
                <td key={x.id}>
                  <b>{fmt(rows.find((r) => r.id === x.id)?.merit ?? 0)}</b>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <h3>3. Stress test</h3>
        {sens ? (
          <p>
            Winner: <b>{nm(s, sens.winner || "")}</b> (merit {fmt(sens.wMerit)}
            ). ±5% error bars{" "}
            {sens.overlap
              ? "overlap the runner-up’s"
              : "do not overlap the runner-up’s"}
            ; {sens.flips} of {sens.total} weight swings change the winner; the
            largest single contribution comes from “{sens.topCrit}” (
            {Math.round(sens.topShare * 100)}%).
          </p>
        ) : (
          <p>(matrix incomplete)</p>
        )}
        <p style={{ fontSize: 11 }}>
          <b>Method.</b> Ratings normalized to 0–1 with stated bounds; weights
          by the {s.weightMode === "rank" ? "ranking method" : "direct method"};
          merit = Σ wᵢ·nᵢ.
        </p>
      </div>
    );
  }
  const st = s.structures.find((x) => x.id === s.final.structId);
  return (
    <div className="l3-paper">
      {head}
      <h3>
        Principal solution: {st?.name || "(not chosen)"}{" "}
        {st && <span style={{ fontWeight: 400 }}>· path {codeOf(s, st)}</span>}
      </h3>
      <p>{s.final.summary || "(summary not written)"}</p>
      {s.final.sketch ? (
        <img
          src={s.final.sketch}
          alt="Principal solution sketch"
          style={{ maxHeight: 320 }}
        />
      ) : (
        <p style={{ color: "#888" }}>(sketch is on paper or not drawn)</p>
      )}
      <h3>How it works, function by function</h3>
      <ol>
        {s.fs.fns.map((f) => (
          <li key={f.id}>
            <b>{f.name}.</b> {s.final.walk[f.id] || ""}
          </li>
        ))}
      </ol>
      {s.final.numbers && (
        <>
          <h3>Rough numbers</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
            {s.final.numbers}
          </pre>
        </>
      )}
      {s.final.demands && (
        <>
          <h3>Demands</h3>
          <p>{s.final.demands}</p>
        </>
      )}
      {s.final.weak && (
        <>
          <h3>Weak points to address in embodiment design</h3>
          <p>{s.final.weak}</p>
        </>
      )}
    </div>
  );
}

/* ---------------- markdown ---------------- */
export function appendixMd(s: State, id: AppId): string {
  const meta = STEPS[APP_IDS.indexOf(id)]!;
  const h = `## Appendix ${id}: ${meta.name}\n\n`;
  if (id === "A")
    return (
      h +
      `| # | Requirement | Ops 1–2 | Op 3 | Op 4 |\n|---|---|---|---|---|\n${s.abs.reqs.map((r, i) => `| ${i + 1} | ${r.text} | ${r.verdict || "?"} | ${r.essence} | ${r.general} |`).join("\n")}\n\n**Problem statement:** ${s.abs.statement}\n`
    );
  if (id === "B")
    return (
      h +
      `**Overall function:** ${s.fs.overall}\n\n${s.fs.fns.map((f, i) => `${i + 1}. ${f.name}${f.aux ? " (auxiliary)" : ""}`).join("\n")}\n\nFlows:\n${s.fs.flows.map((f) => `- ${f.from === "IN" ? "IN" : s.fs.fns.find((x) => x.id === f.from)?.name} → ${f.to === "OUT" ? "OUT" : s.fs.fns.find((x) => x.id === f.to)?.name} [${f.type === "E" ? "energy" : f.type === "M" ? "material" : "signal"}] ${f.label}`).join("\n")}\n\n_(Attach the exported SVG/PNG figure.)_\n`
    );
  if (id === "C")
    return (
      h +
      s.fs.fns
        .map(
          (f, r) =>
            `**${r + 1}. ${f.name}**\n${principlesOf(s, f.id)
              .map((p, i) => `- ${r + 1}.${i + 1} ${pText(p)}`)
              .join("\n")}`,
        )
        .join("\n\n") +
      "\n"
    );
  if (id === "D")
    return (
      h +
      `| Structure | Path | Note |\n|---|---|---|\n${s.structures.map((x) => `| ${x.name} | ${codeOf(s, x)} | ${x.note} |`).join("\n")}\n`
    );
  if (id === "E") {
    const surv = survivors(s),
      ids = surv.map((x) => x.id),
      w = weightsOf(s),
      rows = meritOf(s, ids, w);
    return (
      h +
      `Survivors: ${surv.map((x) => x.name).join(", ")}\n\n| Criterion | w | ${surv.map((x) => x.name).join(" | ")} |\n|---|---|${surv.map(() => "---").join("|")}|\n${s.crit.map((c) => `| ${c.name} | ${fmt(w[c.id] || 0)} | ${surv.map((x) => String(s.ratings[x.id]?.[c.id] ?? "")).join(" | ")} |`).join("\n")}\n| **Merit** | | ${surv.map((x) => fmt(rows.find((r) => r.id === x.id)?.merit ?? 0)).join(" | ")} |\n`
    );
  }
  const st = s.structures.find((x) => x.id === s.final.structId);
  return (
    h +
    `**Principal solution:** ${st?.name || "—"}\n\n${s.final.summary}\n\n${s.fs.fns.map((f) => `- **${f.name}:** ${s.final.walk[f.id] || ""}`).join("\n")}\n\n**Numbers:** ${s.final.numbers}\n\n**Weak points:** ${s.final.weak}\n`
  );
}

export function mainBodyMd(s: State): string {
  const surv = survivors(s),
    ids = surv.map((x) => x.id);
  const rows = meritOf(s, ids, weightsOf(s)).sort((a, b) => b.merit - a.merit);
  const win =
    s.structures.find((x) => x.id === s.final.structId) ||
    s.structures.find((x) => x.id === rows[0]?.id);
  const effects = Array.from(
    new Set(s.principles.map((p) => p.effect).filter(Boolean)),
  );
  return `# Lab 3: Conceptual Design (draft main body)

## 1. Problem and abstraction (Appendix A)
The Lab 2 requirements list was reduced by five abstraction operations: ${s.abs.reqs.filter((r) => r.verdict === "keep").length} of ${s.abs.reqs.length} requirements were kept. The solution-neutral problem statement is: “${s.abs.statement || "…"}”.

## 2. Function structure (Appendix B)
The overall function is “${s.fs.overall || "…"}”. It was decomposed into ${s.fs.fns.length} sub-functions (${s.fs.fns.filter((f) => f.aux).length} auxiliary): ${s.fs.fns.map((f) => f.name).join("; ") || "…"}.

## 3. Working principles (Appendix C)
${s.principles.length} working principles were generated (${effects.length} distinct physical effects, for example ${effects.slice(0, 4).join(", ") || "…"}) using [name your techniques: e.g. brainstorming, SCAMPER, nature analogies].

## 4. Working structures and selection (Appendices D and E)
${s.structures.length} working structures were combined (${s.structures.map((x) => `${x.name}: ${codeOf(s, x)}`).join("; ")}). ${s.structures.length - surv.length} were eliminated by the filter. The ${surv.length} survivors were scored on ${s.crit.length} weighted criteria using a normalized merit function; ${win ? `${win.name} ranked first${rows[0] ? ` (merit ${fmt(rows[0].merit)})` : ""}` : "the winner was…"}. A ±5% and weight-swing stress test was run: [state what changed].

## 5. Principal solution (Appendix F)
${s.final.summary || "…"}

Known weak points: ${s.final.weak || "…"}
`;
}
