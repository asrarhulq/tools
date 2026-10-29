"use client";
import { useMemo, useState } from "react";
import { FLOW_QUIZ, FN_QUIZ, GENERAL_FUNCS, SW_CLASSES } from "./data";
import { fsLint, lintFnName } from "./derive";
import { loadFsExample } from "./examples";
import { download, svgToPng } from "./export";
import { Diagram, buildBlackBoxSvg, buildFsSvg } from "./fsdiagram";
import { StepShell } from "./shell";
import { useLab } from "./store";
import { uid } from "./types";
import type { FlowType } from "./types";
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
  { id: "forge", label: "Function Forge" },
  { id: "play", label: "Flow game" },
];

function FlowKey() {
  return (
    <div className="l3-g3">
      <div className="l3-card">
        <span className="l3-ft E">
          <i />
          ENERGY
        </span>
        <p className="l3-small" style={{ marginTop: 6 }}>
          What makes it happen: force, torque, heat, electricity. Thin solid
          arrow.
        </p>
      </div>
      <div className="l3-card">
        <span className="l3-ft M">
          <i />
          MATERIAL
        </span>
        <p className="l3-small" style={{ marginTop: 6 }}>
          The thing being changed: a tile, a screw, water, a jar. Thick arrow.
        </p>
      </div>
      <div className="l3-card">
        <span className="l3-ft S">
          <i />
          SIGNAL
        </span>
        <p className="l3-small" style={{ marginTop: 6 }}>
          Information: on/off, a reading, a command. Dashed arrow.
        </p>
      </div>
    </div>
  );
}

function FnQuiz() {
  const [ans, setAns] = useState<Record<number, boolean>>({});
  return (
    <Panel
      title="Is it a proper function name?"
      sub="Verb + noun, describing an input→output change. Not a part, not “-ing”, not vague."
      tag="QUIZ"
    >
      <div className="l3-col">
        {FN_QUIZ.map((q, i) => (
          <div key={i} className="l3-card">
            <div className="l3-row">
              <b style={{ fontSize: 16 }}>“{q.s}”</b>
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  disabled={ans[i] !== undefined}
                  className={`l3-opt ${ans[i] === v ? (v === q.ok ? "right" : "wrong") : ""}`}
                  onClick={() => setAns((a) => ({ ...a, [i]: v }))}
                >
                  {v ? "Good function" : "Fix it"}
                </button>
              ))}
            </div>
            {ans[i] !== undefined && (
              <p
                className={`l3-small ${ans[i] === q.ok ? "l3-ok" : "l3-bad"}`}
                style={{ marginTop: 6 }}
              >
                {q.why}
                {q.fix ? ` Try: “${q.fix}”.` : ""}
              </p>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Learn() {
  const [open, setOpen] = useState("Branch");
  return (
    <>
      <Panel
        title="What is a function structure?"
        sub="Slides p.14–20. A map of WHAT the device does, before anyone decides HOW."
        tag="MAP"
      >
        <Callout tone="info" title="Recipe">
          Black box first (overall function: inputs on the left, outputs on the
          right). Then break it into sub-functions, join them with energy,
          material and signal flows, and draw a dashed line around the system.
        </Callout>
        <FlowKey />
        <div className="l3-g2" style={{ marginTop: 12 }}>
          <div className="l3-card">
            <h4 className="l3-h4">Main functions</h4>
            <p className="l3-small l3-mute">
              Sit in the main flow. Remove one and the device stops doing its
              job.
            </p>
          </div>
          <div className="l3-card">
            <h4 className="l3-h4">Auxiliary functions</h4>
            <p className="l3-small l3-mute">
              Support the main flow: supply packing material, remove offcuts,
              send a signal. Drawn dashed. Slides p.21–25.
            </p>
          </div>
        </div>
      </Panel>
      <Panel
        title="The five general functions"
        sub="Slide p.27. Every function changes one trait of the flow."
        tag="STONE · WOOD"
      >
        <div className="l3-tablewrap">
          <table className="l3-table">
            <thead>
              <tr>
                <th>Function</th>
                <th>What changes</th>
                <th>Example</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {GENERAL_FUNCS.map((g) => (
                <tr key={g.k}>
                  <td>
                    <b>{g.k}</b>
                  </td>
                  <td>{g.trait}</td>
                  <td>{g.ex}</td>
                  <td className="l3-mute">{g.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel
        title="Verb vocabulary (Stone & Wood)"
        sub="Slide p.28. Pick your verb from the class that matches. Tap a class."
        tag="VERBS"
      >
        <div className="l3-row" style={{ marginBottom: 10 }}>
          {SW_CLASSES.map((c) => (
            <Btn
              key={c.c}
              small
              pressed={open === c.c}
              onClick={() => setOpen(c.c)}
            >
              {c.c}
            </Btn>
          ))}
        </div>
        <div className="l3-col">
          {SW_CLASSES.filter((c) => c.c === open)
            .flatMap((c) => c.items)
            .map((b) => (
              <div key={b.b} className="l3-card">
                <b>{b.b}</b>
                {b.syn && <span className="l3-mute"> · {b.syn}</span>}
              </div>
            ))}
        </div>
      </Panel>
      <FnQuiz />
      <Tip>
        The slides’ screwdriver chain (p.20):{" "}
        <i>
          Store electricity → Supply → Transmit → Actuate → Regulate → Convert
          electricity to torque → Change torque → Transmit torque → Rotate solid
          → Dissipate torque
        </i>
        . Load it in the Forge and see where human force and the on/off signal
        enter.
      </Tip>
    </>
  );
}

function Forge() {
  const { s, up, toast } = useLab();
  const lint = fsLint(s.fs);
  const mk = useMemo(() => buildFsSvg(s.fs, { id: "fsa" }), [s.fs]);
  const bb = useMemo(() => buildBlackBoxSvg(s.fs, { id: "bba" }), [s.fs]);
  const ends = [
    { id: "IN", name: "⟶ IN (crosses boundary)" },
    ...s.fs.fns,
    { id: "OUT", name: "OUT (leaves boundary) ⟶" },
  ];
  const nameOf = (id: string) =>
    id === "IN"
      ? "IN"
      : id === "OUT"
        ? "OUT"
        : s.fs.fns.find((f) => f.id === id)?.name || "(unnamed)";
  const addFn = (aux: boolean) =>
    up((d) => {
      d.fs.fns.push({ id: uid(), name: "", aux });
    });
  const delFn = (i: number) =>
    up((d) => {
      const id = d.fs.fns[i]!.id;
      d.fs.fns.splice(i, 1);
      d.fs.flows = d.fs.flows.filter((f) => f.from !== id && f.to !== id);
      d.principles = d.principles.filter((p) => p.fnId !== id);
    });
  const move = (i: number, dir: number) =>
    up((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.fs.fns.length) return;
      const tmp = d.fs.fns[i]!;
      d.fs.fns[i] = d.fs.fns[j]!;
      d.fs.fns[j] = tmp;
    });
  const addFlow = () =>
    up((d) => {
      d.fs.flows.push({
        id: uid(),
        from: "IN",
        to: d.fs.fns[0]?.id || "OUT",
        type: "M",
        label: "",
      });
    });
  const exportSvg = () => {
    const l = buildFsSvg(s.fs, { light: true, id: "fxs" });
    download("function-structure.svg", l.svg, "image/svg+xml");
  };
  const exportPng = () => {
    const l = buildFsSvg(s.fs, { light: true, id: "fxp" });
    svgToPng(l.svg, l.w, l.h, "function-structure.png");
    toast("Exporting PNG…");
  };
  const hasData = s.fs.fns.length > 0;
  const load = (k: "carpet" | "jar" | "driver") =>
    up((d) => loadFsExample(d, k));
  return (
    <>
      <Panel
        title="Start from a slide example (optional)"
        sub="Load one to see what a good structure looks like, then edit it into your own."
        tag="EXAMPLES"
      >
        <div className="l3-row">
          {(["carpet", "jar", "driver"] as const).map((k) =>
            hasData ? (
              <ConfirmBtn
                key={k}
                label={
                  k === "carpet"
                    ? "Carpet tiles"
                    : k === "jar"
                      ? "Jar opener"
                      : "Power screwdriver"
                }
                confirm="Replace my structure?"
                onConfirm={() => load(k)}
              />
            ) : (
              <Btn key={k} onClick={() => load(k)}>
                {k === "carpet"
                  ? "Carpet tiles"
                  : k === "jar"
                    ? "Jar opener"
                    : "Power screwdriver"}
              </Btn>
            ),
          )}
          <SlideRef p="19–25" />
        </div>
      </Panel>

      <div className="l3-split">
        <div>
          <Panel title="1 · Overall function (the black box)" tag="BLACK BOX">
            <div className="l3-field">
              <label>Verb + noun from your problem statement</label>
              <input
                className="l3-input"
                value={s.fs.overall}
                placeholder="e.g. Release sealed closure"
                onChange={(e) =>
                  up((d) => {
                    d.fs.overall = e.target.value;
                  })
                }
              />
              {s.fs.overall.trim() &&
                lintFnName(s.fs.overall).level !== "ok" && (
                  <span className="l3-hint l3-warn">
                    {lintFnName(s.fs.overall).msg}
                  </span>
                )}
            </div>
            <label className="l3-row l3-small" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={s.fs.boundary}
                onChange={(e) =>
                  up((d) => {
                    d.fs.boundary = e.target.checked;
                  })
                }
              />{" "}
              Draw the system boundary
            </label>
          </Panel>

          <Panel
            title="2 · Functions"
            sub="Verb + noun. Tick “aux” for supporting functions."
            tag="BOXES"
            right={
              <div className="l3-row">
                <Btn small variant="primary" onClick={() => addFn(false)}>
                  + Function
                </Btn>
                <Btn small onClick={() => addFn(true)}>
                  + Auxiliary
                </Btn>
              </div>
            }
          >
            {!s.fs.fns.length ? (
              <Empty>
                No functions yet. Add your first one, or load an example above.
              </Empty>
            ) : (
              s.fs.fns.map((f, i) => {
                const l = lintFnName(f.name);
                return (
                  <div key={f.id} className="l3-fnrow">
                    <div>
                      <input
                        className="l3-input"
                        value={f.name}
                        aria-label={`Function ${i + 1}`}
                        placeholder={
                          f.aux ? "e.g. Remove offcuts" : "e.g. Amplify torque"
                        }
                        onChange={(e) =>
                          up((d) => {
                            d.fs.fns[i]!.name = e.target.value;
                          })
                        }
                      />
                      {f.name.trim() && l.level !== "ok" && (
                        <div
                          className={`l3-hint ${l.level === "bad" ? "l3-bad" : "l3-warn"}`}
                        >
                          {l.msg}
                        </div>
                      )}
                    </div>
                    <label className="l3-small l3-row" style={{ gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={f.aux}
                        onChange={(e) =>
                          up((d) => {
                            d.fs.fns[i]!.aux = e.target.checked;
                          })
                        }
                      />
                      aux
                    </label>
                    <div className="l3-row" style={{ gap: 2 }}>
                      <button
                        className="l3-x"
                        aria-label="Move up"
                        onClick={() => move(i, -1)}
                      >
                        ↑
                      </button>
                      <button
                        className="l3-x"
                        aria-label="Move down"
                        onClick={() => move(i, 1)}
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      className="l3-x"
                      aria-label="Delete function"
                      onClick={() => delFn(i)}
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </Panel>

          <Panel
            title="3 · Flows"
            sub="Each arrow: from → to, what type, what flows."
            tag="ARROWS"
            right={
              <Btn
                small
                variant="primary"
                onClick={addFlow}
                disabled={!hasData}
              >
                + Flow
              </Btn>
            }
          >
            {!s.fs.flows.length ? (
              <Empty>
                No flows yet. Add at least one flow IN and one flow OUT.
              </Empty>
            ) : (
              s.fs.flows.map((f, i) => (
                <div key={f.id} className="l3-flrow">
                  <select
                    className="l3-select"
                    aria-label="From"
                    value={f.from}
                    onChange={(e) =>
                      up((d) => {
                        d.fs.flows[i]!.from = e.target.value;
                      })
                    }
                  >
                    {ends
                      .filter((e) => e.id !== "OUT")
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.id === "IN" ? "IN" : e.name || "(unnamed)"}
                        </option>
                      ))}
                  </select>
                  <select
                    className="l3-select"
                    aria-label="To"
                    value={f.to}
                    onChange={(e) =>
                      up((d) => {
                        d.fs.flows[i]!.to = e.target.value;
                      })
                    }
                  >
                    {ends
                      .filter((e) => e.id !== "IN")
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.id === "OUT" ? "OUT" : e.name || "(unnamed)"}
                        </option>
                      ))}
                  </select>
                  <select
                    className="l3-select"
                    aria-label="Type"
                    value={f.type}
                    onChange={(e) =>
                      up((d) => {
                        d.fs.flows[i]!.type = e.target.value as FlowType;
                      })
                    }
                  >
                    <option value="E">Energy</option>
                    <option value="M">Material</option>
                    <option value="S">Signal</option>
                  </select>
                  <input
                    className="l3-input"
                    aria-label="Label"
                    placeholder="what flows?"
                    value={f.label}
                    onChange={(e) =>
                      up((d) => {
                        d.fs.flows[i]!.label = e.target.value;
                      })
                    }
                  />
                  <button
                    className="l3-x"
                    aria-label="Delete flow"
                    onClick={() =>
                      up((d) => {
                        d.fs.flows.splice(i, 1);
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              ))
            )}
            <p className="l3-hint">
              Flow summary:{" "}
              {s.fs.flows.length
                ? s.fs.flows
                    .map((f) => `${nameOf(f.from)} → ${nameOf(f.to)}`)
                    .slice(0, 4)
                    .join(" · ") + (s.fs.flows.length > 4 ? " …" : "")
                : "–"}
            </p>
          </Panel>
        </div>

        <div style={{ position: "sticky", top: 74 }}>
          <Panel
            title="Lint"
            sub="Live checks against the lab rubric."
            tag="CHECKS"
          >
            {lint.msgs.length === 0 ? (
              <p className="l3-mute">Add functions to see feedback.</p>
            ) : (
              lint.msgs.map((m, i) => (
                <div key={i} className="l3-lint">
                  <b
                    className={
                      m.level === "ok"
                        ? "l3-ok"
                        : m.level === "warn"
                          ? "l3-warn"
                          : "l3-bad"
                    }
                  >
                    {m.level === "ok" ? "✓" : m.level === "warn" ? "!" : "✗"}
                  </b>
                  <span>{m.text}</span>
                </div>
              ))
            )}
          </Panel>
        </div>
      </div>

      <Panel
        title="Live diagram"
        sub="Auto-laid out. Main functions in the row, auxiliaries above or below."
        tag="DRAWING"
        right={
          <div className="l3-row">
            <Btn small onClick={exportSvg} disabled={!mk.svg}>
              SVG
            </Btn>
            <Btn small onClick={exportPng} disabled={!mk.svg}>
              PNG
            </Btn>
          </div>
        }
      >
        {mk.svg ? (
          <Diagram markup={mk.svg} label="Function structure" />
        ) : (
          <Empty>Your diagram appears here as soon as you add functions.</Empty>
        )}
        {bb.svg && (
          <>
            <h4 className="l3-h4" style={{ margin: "14px 0 6px" }}>
              Black-box view (overall function)
            </h4>
            <Diagram markup={bb.svg} label="Black box" />
          </>
        )}
      </Panel>
    </>
  );
}

function Play() {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [pick, setPick] = useState<FlowType | null>(null);
  // Only dereferenced in the `!done` branch below, where i < FLOW_QUIZ.length always holds.
  const q = FLOW_QUIZ[i]!;
  const done = i >= FLOW_QUIZ.length;
  const choose = (t: FlowType) => {
    if (pick) return;
    setPick(t);
    if (t === q.a) setScore((x) => x + 1);
  };
  const next = () => {
    setPick(null);
    setI((x) => x + 1);
  };
  return (
    <Panel
      title="Energy, material or signal?"
      sub="Ten flows. Sort them."
      tag="GAME"
      right={
        <Chip tone="accent">
          {score}/{FLOW_QUIZ.length}
        </Chip>
      }
    >
      {done ? (
        <div className="l3-col">
          <Callout
            tone={score >= 8 ? "good" : "warn"}
            title={`${score} / ${FLOW_QUIZ.length}`}
          >
            {score >= 8
              ? "Strong. Go build your structure."
              : "Rule of thumb: material is the thing being changed, energy makes it happen, signal tells someone something."}
          </Callout>
          <div className="l3-row">
            <Btn
              onClick={() => {
                setI(0);
                setScore(0);
                setPick(null);
              }}
            >
              Play again
            </Btn>
          </div>
        </div>
      ) : (
        <div className="l3-col">
          <div
            className="l3-card tc"
            style={{ textAlign: "center", padding: 26 }}
          >
            <div className="l3-eyebrow">
              FLOW {i + 1} / {FLOW_QUIZ.length}
            </div>
            <div style={{ fontSize: 28, marginTop: 8 }}>“{q.t}”</div>
          </div>
          <div className="l3-row" style={{ justifyContent: "center" }}>
            {(["E", "M", "S"] as FlowType[]).map((t) => (
              <button
                key={t}
                disabled={!!pick}
                className={`l3-opt ${pick ? (t === q.a ? "right" : pick === t ? "wrong" : "") : ""}`}
                onClick={() => choose(t)}
              >
                {t === "E" ? "Energy" : t === "M" ? "Material" : "Signal"}
              </button>
            ))}
          </div>
          {pick && (
            <>
              <p className={pick === q.a ? "l3-ok" : "l3-bad"}>
                {pick === q.a ? "Correct. " : "Not quite. "}
                {q.why}
              </p>
              <Btn variant="primary" onClick={next}>
                {i === FLOW_QUIZ.length - 1 ? "Finish" : "Next"}
              </Btn>
            </>
          )}
        </div>
      )}
    </Panel>
  );
}

export function Step2() {
  return (
    <StepShell n={2} tabs={TABS} defaultTab="learn">
      {(t) => (t === "forge" ? <Forge /> : t === "play" ? <Play /> : <Learn />)}
    </StepShell>
  );
}
