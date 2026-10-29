"use client";
import { useState } from "react";
import { RIG } from "./data";
import {
  codeOf,
  comboCount,
  principlesOf,
  structComplete,
  structDiff,
} from "./derive";
import { StepShell } from "./shell";
import { useLab } from "./store";
import { uid } from "./types";
import {
  Btn,
  Callout,
  Chip,
  ConfirmBtn,
  Empty,
  Panel,
  SlideRef,
  Tip,
} from "./ui";

const TABS = [
  { id: "learn", label: "Learn it" },
  { id: "weave", label: "The Weave" },
];
export const SCOL = [
  "#5CE1E6",
  "#FFC145",
  "#FF6B9A",
  "#7BD88F",
  "#B38CFF",
  "#FF8A4C",
  "#6CB6FF",
  "#E879F9",
];

function Learn() {
  const { s, go } = useLab();
  const n = comboCount(s);
  return (
    <>
      <Panel
        title="From chart to working structures"
        sub="Slides p.65–67. A working structure is one principle per function, joined into a path that works together."
        tag="WEAVE"
      >
        <div className="l3-g3">
          <div className="l3-card tc" style={{ textAlign: "center" }}>
            <div className="l3-eyebrow">YOUR CHART HAS</div>
            <div className="l3-timer">
              {s.fs.fns.length ? n.toLocaleString() : "–"}
            </div>
            <p className="l3-small l3-mute">
              possible paths. You only need to weave 4 good ones.
            </p>
          </div>
          <div className="l3-card">
            <h4 className="l3-h4">Rule 1 · compatible</h4>
            <p className="l3-small l3-mute">
              Physically (energy and signals can pass between them) and
              geometrically (they fit together).
            </p>
          </div>
          <div className="l3-card">
            <h4 className="l3-h4">Rule 2 · different</h4>
            <p className="l3-small l3-mute">
              Any two structures should differ in at least two functions. Four
              copies of one idea is one concept.
            </p>
          </div>
        </div>
        <Callout tone="info" title="Series is allowed">
          A function can take two principles in a chain, as the slides’ V1–V3 do
          with 3.4 and 3.7. Select more than one chip in a row.
        </Callout>
        <Btn variant="primary" onClick={() => go("s4", "weave")}>
          Open the Weave
        </Btn>
      </Panel>
      <Panel
        title="Worked example: impulse-loading test rig"
        sub="Slides p.99–113. Codes read row.column on the morphological chart."
        tag="V1–V4"
      >
        <div className="l3-tablewrap">
          <table className="l3-table">
            <thead>
              <tr>
                <th>Variant</th>
                <th>Path</th>
              </tr>
            </thead>
            <tbody>
              {RIG.variants.map((v) => (
                <tr key={v.name}>
                  <td>
                    <b>{v.name}</b>
                  </td>
                  <td className="l3-mono">
                    {v.codes.join(" – ")}
                    {v.note && <div className="l3-hint">{v.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="l3-small l3-mute" style={{ marginTop: 8 }}>
          Load the whole example from Step 3 → Morph chart to explore it here.
        </p>
        <SlideRef p="99–113" />
      </Panel>
      <Tip>
        The slides call this phase <b>iterative</b>. If nothing combines, go
        back and add principles to the blocking row. That is expected, not
        failure.
      </Tip>
    </>
  );
}

function Weave() {
  const { s, up, go } = useLab();
  const [sel, setSel] = useState("");
  const st = s.structures.find((x) => x.id === sel) || s.structures[0];
  const idx = st ? s.structures.indexOf(st) : -1;
  const add = () => {
    const id = uid();
    up((d) => {
      d.structures.push({
        id,
        name: `Structure ${d.structures.length + 1}`,
        picks: {},
        checks: {
          phys: false,
          geom: false,
          energy: false,
          signal: false,
          material: false,
        },
        sketched: false,
        note: "",
      });
    });
    setSel(id);
  };
  const dup = () => {
    const id = uid();
    up((d) => {
      const x = d.structures[idx];
      if (!x) return;
      d.structures.push({
        ...JSON.parse(JSON.stringify(x)),
        id,
        name: x.name + " copy",
      });
    });
    setSel(id);
  };
  const toggle = (fnId: string, pid: string) =>
    up((d) => {
      const x = d.structures[idx]!;
      const a = x.picks[fnId] || [];
      x.picks[fnId] = a.includes(pid)
        ? a.filter((k) => k !== pid)
        : [...a, pid];
    });
  if (!s.fs.fns.length)
    return (
      <Callout tone="warn" title="No chart yet">
        Weaving needs functions and principles.{" "}
        <Btn small onClick={() => go("s3", "chart")}>
          Go to the chart
        </Btn>
      </Callout>
    );
  return (
    <>
      <Panel
        title="Your structures"
        sub="At least four. Pick one chip per row (more than one = series)."
        tag="PATHS"
        right={
          <div className="l3-row">
            <Btn small variant="primary" onClick={add}>
              + Structure
            </Btn>
            {st && (
              <Btn small onClick={dup}>
                Duplicate
              </Btn>
            )}
          </div>
        }
      >
        {!s.structures.length ? (
          <Empty>
            No structures yet. Add your first path through the chart.
          </Empty>
        ) : (
          <div className="l3-row">
            {s.structures.map((x, i) => (
              <button
                key={x.id}
                className={`l3-pill${st?.id === x.id ? "on" : ""}`}
                style={{ ["--accent" as string]: SCOL[i % SCOL.length] }}
                onClick={() => setSel(x.id)}
              >
                <i style={{ ["--c" as string]: SCOL[i % SCOL.length] }}>
                  {i + 1}
                </i>
                {x.name || `Structure ${i + 1}`}
                {structComplete(s, x) ? " ✓" : ""}
              </button>
            ))}
          </div>
        )}
      </Panel>

      {st && (
        <Panel
          title={`Editing: ${st.name || "Structure"}`}
          tag={`CODE ${codeOf(s, st)}`}
          right={
            <ConfirmBtn
              small
              label="Delete structure"
              onConfirm={() =>
                up((d) => {
                  d.structures.splice(idx, 1);
                  delete d.elim[st.id];
                  delete d.ratings[st.id];
                })
              }
            />
          }
        >
          <div className="l3-g2" style={{ marginBottom: 10 }}>
            <div className="l3-field">
              <label>Name</label>
              <input
                className="l3-input"
                value={st.name}
                onChange={(e) =>
                  up((d) => {
                    d.structures[idx]!.name = e.target.value;
                  })
                }
              />
            </div>
            <div className="l3-field">
              <label>Short note (how the path works, series chains)</label>
              <input
                className="l3-input"
                value={st.note}
                onChange={(e) =>
                  up((d) => {
                    d.structures[idx]!.note = e.target.value;
                  })
                }
              />
            </div>
          </div>
          {s.fs.fns.map((fn, ri) => {
            const ps = principlesOf(s, fn.id);
            const picks = st.picks[fn.id] || [];
            return (
              <div key={fn.id} className="l3-wvfn">
                <b>
                  {ri + 1}. {fn.name || "(unnamed)"}
                </b>
                <div className="l3-row">
                  {!ps.length && (
                    <span className="l3-warn l3-small">
                      No principles in this row.{" "}
                      <button
                        className="l3-btn l3-sm"
                        onClick={() => go("s3", "chart")}
                      >
                        Add some
                      </button>
                    </span>
                  )}
                  {ps.map((p, ci) => (
                    <button
                      key={p.id}
                      className={`l3-pick${picks.includes(p.id) ? "on" : ""}`}
                      aria-pressed={picks.includes(p.id)}
                      onClick={() => toggle(fn.id, p.id)}
                    >
                      <span className="l3-mono l3-mute">
                        {ri + 1}.{ci + 1}
                      </span>{" "}
                      {p.text.slice(0, 48) || p.effect || "(empty)"}
                      <span className="l3-dots">
                        {s.structures.map((o, oi) =>
                          (o.picks[fn.id] || []).includes(p.id) ? (
                            <i
                              key={o.id}
                              title={o.name}
                              style={{ background: SCOL[oi % SCOL.length] }}
                            />
                          ) : null,
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="l3-hr" />
          <div className="l3-lab">Compatibility checks</div>
          <div className="l3-row" style={{ margin: "8px 0" }}>
            {(
              [
                ["phys", "Physically compatible"],
                ["geom", "Geometrically compatible"],
                ["energy", "Energy flows connect"],
                ["signal", "Signals connect"],
                ["material", "Material flows connect"],
              ] as const
            ).map(([k, l]) => (
              <label key={k} className="l3-chip" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={st.checks[k]}
                  onChange={(e) =>
                    up((d) => {
                      d.structures[idx]!.checks[k] = e.target.checked;
                    })
                  }
                />
                {l}
              </label>
            ))}
            <label className="l3-chip" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={st.sketched}
                onChange={(e) =>
                  up((d) => {
                    d.structures[idx]!.sketched = e.target.checked;
                  })
                }
              />
              Rough sketch exists
            </label>
          </div>
          <p className="l3-small l3-mute">
            Energy / signal / material tick-boxes are for your own check. The
            two graded ones are physical and geometric.
          </p>
        </Panel>
      )}

      {s.structures.length >= 2 && (
        <Panel
          title="How different are they?"
          sub="Number of functions where two structures choose differently. Red = fewer than 2."
          tag="DIFF"
        >
          <div className="l3-tablewrap">
            <table className="l3-diffm">
              <thead>
                <tr>
                  <th />
                  {s.structures.map((x, i) => (
                    <th key={x.id} style={{ color: SCOL[i % SCOL.length] }}>
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.structures.map((a, i) => (
                  <tr key={a.id}>
                    <th style={{ color: SCOL[i % SCOL.length] }}>{i + 1}</th>
                    {s.structures.map((b, j) => {
                      if (i === j) return <td key={b.id}>–</td>;
                      const d = structDiff(s, a, b);
                      return (
                        <td key={b.id} className={d < 2 ? "lo" : "hi"}>
                          {d}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="l3-hint" style={{ marginTop: 6 }}>
            Legend:{" "}
            {s.structures.map((x, i) => (
              <Chip key={x.id}>
                <span style={{ color: SCOL[i % SCOL.length] }}>●</span> {i + 1}{" "}
                {x.name}
              </Chip>
            ))}
          </p>
        </Panel>
      )}
    </>
  );
}

export function Step4() {
  return (
    <StepShell n={4} tabs={TABS} defaultTab="learn">
      {(t) => (t === "weave" ? <Weave /> : <Learn />)}
    </StepShell>
  );
}
