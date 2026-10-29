"use client";
import React, { useMemo, useRef, useState } from "react";
import { ELIM_CRITS, clamp, fmt, num, uid } from "./types";
import type { Mark, ObjNode, State } from "./types";
import { PRELIM_TIPS, SENS_TIPS } from "./data";
import {
  codeOf,
  eliminated,
  leaves,
  meritOf,
  norm,
  ratingComplete,
  sensitivity,
  sibSum,
  survivors,
  vagueWords,
  weightsOf,
} from "./derive";
import { loadRig } from "./examples";
import { StepShell } from "./shell";
import { useLab } from "./store";
import { SCOL } from "./step4";
import {
  Btn,
  Callout,
  Chip,
  ConfirmBtn,
  CopyBtn,
  Empty,
  Meter,
  Panel,
  SlideRef,
  Tip,
} from "./ui";

const MERIT_MATHML =
  '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow><mi>Merit</mi><mo>=</mo><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><msub><mi>w</mi><mi>i</mi></msub><mo>·</mo><msub><mi>n</mi><mi>i</mi></msub></mrow></math>';
const TABS = [
  { id: "learn", label: "Learn it" },
  { id: "filter", label: "1 · Filter" },
  { id: "duel", label: "2 · Datum duel" },
  { id: "weights", label: "3 · Weights" },
  { id: "matrix", label: "4 · Matrix" },
  { id: "stress", label: "5 · Stress test" },
  { id: "quick", label: "Quick tools" },
];
const nameOf = (s: State, id: string) =>
  s.structures.find((x) => x.id === id)?.name || id;
const colorOf = (s: State, id: string) =>
  SCOL[
    Math.max(
      0,
      s.structures.findIndex((x) => x.id === id),
    ) % SCOL.length
  ];

function NeedStructs() {
  const { go } = useLab();
  return (
    <Callout tone="warn" title="No structures yet">
      Step 5 compares the working structures from Step 4.{" "}
      <Btn small onClick={() => go("s4", "weave")}>
        Go weave some
      </Btn>
    </Callout>
  );
}

function Normalizer() {
  const [pref, setPref] = useState<"H" | "L">("H");
  const [lo, setLo] = useState(0),
    [hi, setHi] = useState(10),
    [x, setX] = useState(7);
  const n = norm(
    { id: "x", name: "", rank: 1, weight: 1, pref, lo, hi, unit: "" },
    x,
  );
  return (
    <div className="l3-card">
      <div className="l3-row">
        <b>Normalizer</b>
        <Chip>
          n = {pref === "H" ? "(x − lo) / (hi − lo)" : "(hi − x) / (hi − lo)"}
        </Chip>
      </div>
      <div className="l3-g4" style={{ marginTop: 8 }}>
        <div className="l3-field">
          <label>Higher or lower better?</label>
          <select
            className="l3-select"
            value={pref}
            onChange={(e) => setPref(e.target.value as "H" | "L")}
          >
            <option value="H">H: higher is better</option>
            <option value="L">L: lower is better</option>
          </select>
        </div>
        <div className="l3-field">
          <label>lo (worst bound)</label>
          <input
            className="l3-input"
            type="number"
            value={lo}
            onChange={(e) => setLo(Number(e.target.value))}
          />
        </div>
        <div className="l3-field">
          <label>hi (best bound)</label>
          <input
            className="l3-input"
            type="number"
            value={hi}
            onChange={(e) => setHi(Number(e.target.value))}
          />
        </div>
        <div className="l3-field">
          <label>x (this concept’s value)</label>
          <input
            className="l3-input"
            type="number"
            value={x}
            onChange={(e) => setX(Number(e.target.value))}
          />
        </div>
      </div>
      <Meter
        value={n}
        tone="cyan"
        label="Normalized score n (0 = worst bound, 1 = best bound)"
        note={fmt(n)}
      />
      <p className="l3-hint">
        “Child” version: n says how far along the ruler from “bad” to “good”
        your concept is. Same ruler for every concept, so numbers become
        comparable.
      </p>
    </div>
  );
}

function Learn() {
  const { s, up, go } = useLab();
  return (
    <>
      <Panel
        title="How a decision is made"
        sub="Slides p.73–96. Four gates, each cheaper than the next. Do not skip the cheap ones."
        tag="GATES"
      >
        <div className="l3-g4">
          {[
            [
              "1 · Filter",
              "Kill what cannot work (+ − ? !).",
              "filter",
              "p.95",
            ],
            [
              "2 · Datum duel",
              "Compare each to a reference concept. +/0/−.",
              "duel",
              "p.81–86",
            ],
            [
              "3 · Weighted matrix",
              "Weights × normalized ratings = merit.",
              "matrix",
              "p.87–93",
            ],
            [
              "4 · Stress test",
              "±5% and weight swings. Is the winner real?",
              "stress",
              "p.94",
            ],
          ].map(([t, d, tab, p]) => (
            <button
              key={t}
              className="l3-card"
              style={{ textAlign: "left" }}
              onClick={() => go("s5", tab)}
            >
              <b>{t}</b>
              <p className="l3-small l3-mute">{d}</p>
              <SlideRef p={p!.replace("p.", "")} />
            </button>
          ))}
        </div>
        <Tip>
          Short on time? Filter, then straight to the weighted matrix and stress
          test. Appendix E must <b>state the method</b>: scale, weights,
          formula.
        </Tip>
      </Panel>
      <Panel
        title="Merit function, in plain words"
        sub="Slides p.91–93."
        tag="MATH"
      >
        <div style={{ fontSize: 18, textAlign: "center", padding: 12 }}>
          <span dangerouslySetInnerHTML={{ __html: MERIT_MATHML }} />
        </div>
        <ul className="l3-small" style={{ paddingLeft: 18 }}>
          <li>
            <b>wᵢ</b> = weight of criterion i (how much it matters). All weights
            add up to 1.
          </li>
          <li>
            <b>nᵢ</b> = normalized score of the concept on criterion i (0 worst,
            1 best).
          </li>
          <li>
            <b>Merit</b> = total. Bigger wins. Kid version: “score each thing 0
            to 1, count the important things more, add up.”
          </li>
        </ul>
        <Normalizer />
        <div className="l3-row" style={{ marginTop: 12 }}>
          <ConfirmBtn
            small
            label="Load the slide’s test-rig example"
            confirm="Replace my work?"
            onConfirm={() => {
              up((d) => loadRig(d));
              go("s5", "matrix");
            }}
          />
          <span className="l3-small l3-mute">
            Expected on the slide (p.115): V1 0.38 · V2 0.68 · V3 0.64 · V4 0.54
          </span>
        </div>
        {s.structures.length === 0 && (
          <p className="l3-hint">
            Tip: load the example to watch every tab with real numbers.
          </p>
        )}
      </Panel>
    </>
  );
}

const CYCLE: Mark[] = ["", "+", "-", "?", "!"];
function Filter() {
  const { s, up } = useLab();
  if (!s.structures.length) return <NeedStructs />;
  const surv = survivors(s);
  return (
    <>
      <Panel
        title="Filter"
        sub="Click a cell to cycle: blank → + (yes) → − (no, eliminates) → ? (need info) → ! (check the requirement)."
        tag="SCREEN"
        right={
          <Chip tone={surv.length >= 2 ? "good" : "bad"}>
            {surv.length} survive
          </Chip>
        }
      >
        <div className="l3-row" style={{ marginBottom: 10 }}>
          {ELIM_CRITS.map((c) => (
            <label key={c.id} className="l3-chip" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={s.elimCrit.includes(c.id)}
                onChange={(e) =>
                  up((d) => {
                    d.elimCrit = e.target.checked
                      ? [...d.elimCrit, c.id]
                      : d.elimCrit.filter((x) => x !== c.id);
                  })
                }
              />
              {c.label}
            </label>
          ))}
        </div>
        <div className="l3-tablewrap">
          <table className="l3-table">
            <thead>
              <tr>
                <th>Structure</th>
                {ELIM_CRITS.filter((c) => s.elimCrit.includes(c.id)).map(
                  (c) => (
                    <th key={c.id} title={c.label}>
                      {c.label.replace("?", "")}
                    </th>
                  ),
                )}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {s.structures.map((st) => {
                const out = eliminated(s, st.id);
                return (
                  <tr key={st.id} className={out ? "l3-out" : ""}>
                    <td>
                      <b style={{ color: colorOf(s, st.id) }}>●</b> {st.name}{" "}
                      <span className="l3-mono l3-mute">{codeOf(s, st)}</span>
                    </td>
                    {ELIM_CRITS.filter((c) => s.elimCrit.includes(c.id)).map(
                      (c) => {
                        const v = s.elim[st.id]?.[c.id] || "";
                        return (
                          <td key={c.id}>
                            <button
                              className="l3-mk"
                              data-v={v}
                              aria-label={`${st.name} ${c.label}: ${v || "blank"}`}
                              onClick={() =>
                                up((d) => {
                                  (d.elim[st.id] ||= {})[c.id] =
                                    CYCLE[
                                      (CYCLE.indexOf(v) + 1) % CYCLE.length
                                    ]!;
                                })
                              }
                            >
                              {v || "·"}
                            </button>
                          </td>
                        );
                      },
                    )}
                    <td>
                      {out ? (
                        <Chip tone="bad">out</Chip>
                      ) : (
                        <Chip tone="good">in</Chip>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="l3-hint" style={{ marginTop: 8 }}>
          Keep a one-line reason for every “−” in your report. Eliminated rows
          are greyed and drop out of Steps 2–5.
        </p>
      </Panel>
    </>
  );
}

function Duel() {
  const { s, up } = useLab();
  const [runId, setRunId] = useState("");
  if (!s.structures.length) return <NeedStructs />;
  const pool = survivors(s).length >= 2 ? survivors(s) : s.structures;
  const run = s.runs.find((r) => r.id === runId) || s.runs[0];
  const ri = run ? s.runs.indexOf(run) : -1;
  const addRun = (datum: string) => {
    const id = uid();
    up((d) => {
      d.runs.push({ id, datum, r: {} });
    });
    setRunId(id);
  };
  const val = (sid: string, cid: string) => run?.r[sid]?.[cid] ?? 0;
  const net = (sid: string) => s.pcrit.reduce((a, c) => a + val(sid, c.id), 0);
  const total: Record<string, number> = {};
  pool.forEach((p) => {
    total[p.id] = 0;
    s.runs.forEach((r) => {
      if (r.datum !== p.id)
        total[p.id] =
          total[p.id]! +
          s.pcrit.reduce((a, c) => a + (r.r[p.id]?.[c.id] ?? 0), 0);
    });
  });
  const maxAbs = Math.max(1, ...Object.values(total).map(Math.abs));
  return (
    <>
      <Panel
        title="Datum duel (preliminary selection)"
        sub="Pick a datum. Compare every other concept to it, criterion by criterion: better (+), same (0), worse (−)."
        tag="PUGH"
        right={<SlideRef p="81–86" />}
      >
        <div className="l3-g2">
          <ul className="l3-small l3-mute" style={{ paddingLeft: 18 }}>
            {PRELIM_TIPS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div>
            <div className="l3-lab">Comparison criteria</div>
            {s.pcrit.map((c, i) => (
              <div key={c.id} className="l3-row" style={{ marginBottom: 4 }}>
                <input
                  className="l3-input l3-s l3-grow"
                  aria-label="Criterion"
                  value={c.name}
                  onChange={(e) =>
                    up((d) => {
                      d.pcrit[i]!.name = e.target.value;
                    })
                  }
                />
                <button
                  className="l3-x"
                  aria-label="Delete criterion"
                  onClick={() =>
                    up((d) => {
                      d.pcrit.splice(i, 1);
                    })
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <Btn
              small
              onClick={() =>
                up((d) => {
                  d.pcrit.push({ id: uid(), name: "", group: "" });
                })
              }
            >
              + Criterion
            </Btn>
          </div>
        </div>
      </Panel>
      <Panel
        title="Runs"
        tag="DATUMS"
        right={
          <Btn
            small
            variant="primary"
            onClick={() =>
              addRun(pool[Math.min(s.runs.length, pool.length - 1)]!.id)
            }
          >
            + New run
          </Btn>
        }
      >
        {!s.runs.length ? (
          <Empty>
            No runs yet. The slides suggest running more than one datum.
          </Empty>
        ) : (
          <>
            <div className="l3-row" style={{ marginBottom: 10 }}>
              {s.runs.map((r, i) => (
                <button
                  key={r.id}
                  className={`l3-pill ${run?.id === r.id ? "on" : ""}`}
                  onClick={() => setRunId(r.id)}
                >
                  Run {i + 1} · datum {nameOf(s, r.datum)}
                </button>
              ))}
            </div>
            {run && (
              <>
                <div className="l3-row" style={{ marginBottom: 8 }}>
                  <span className="l3-small l3-mute">Datum for this run:</span>
                  <select
                    className="l3-select"
                    style={{ width: 220 }}
                    value={run.datum}
                    onChange={(e) =>
                      up((d) => {
                        d.runs[ri]!.datum = e.target.value;
                      })
                    }
                  >
                    {pool.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ConfirmBtn
                    small
                    label="Delete run"
                    onConfirm={() =>
                      up((d) => {
                        d.runs.splice(ri, 1);
                      })
                    }
                  />
                </div>
                <div className="l3-tablewrap">
                  <table className="l3-table">
                    <thead>
                      <tr>
                        <th>Criterion</th>
                        {pool.map((p) => (
                          <th key={p.id} style={{ color: colorOf(s, p.id) }}>
                            {p.name}
                            {p.id === run.datum ? " (D)" : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.pcrit.map((c) => (
                        <tr key={c.id}>
                          <td>{c.name || "(unnamed)"}</td>
                          {pool.map((p) =>
                            p.id === run.datum ? (
                              <td key={p.id} className="l3-mute l3-mono">
                                D
                              </td>
                            ) : (
                              <td key={p.id}>
                                <button
                                  className="l3-mk"
                                  data-v={
                                    val(p.id, c.id) > 0
                                      ? "+"
                                      : val(p.id, c.id) < 0
                                        ? "-"
                                        : ""
                                  }
                                  aria-label={`${p.name} vs datum on ${c.name}`}
                                  onClick={() =>
                                    up((d) => {
                                      const cur =
                                        d.runs[ri]!.r[p.id]?.[c.id] ?? 0;
                                      (d.runs[ri]!.r[p.id] ||= {})[c.id] =
                                        cur === 0 ? 1 : cur === 1 ? -1 : 0;
                                    })
                                  }
                                >
                                  {val(p.id, c.id) > 0
                                    ? "+"
                                    : val(p.id, c.id) < 0
                                      ? "−"
                                      : "0"}
                                </button>
                              </td>
                            ),
                          )}
                        </tr>
                      ))}
                      <tr>
                        <td>
                          <b>Net score</b>
                        </td>
                        {pool.map((p) => (
                          <td key={p.id} className="l3-mono">
                            <b
                              className={
                                p.id === run.datum
                                  ? "l3-mute"
                                  : net(p.id) > 0
                                    ? "l3-ok"
                                    : net(p.id) < 0
                                      ? "l3-bad"
                                      : ""
                              }
                            >
                              {p.id === run.datum
                                ? "–"
                                : (net(p.id) > 0 ? "+" : "") + net(p.id)}
                            </b>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </Panel>
      {s.runs.length > 0 && (
        <Panel
          title="Across all runs"
          sub="Total net score, datum runs excluded. Keep the ones rising to the top."
          tag="TALLY"
        >
          {pool.map((p) => (
            <div key={p.id} className="l3-row" style={{ marginBottom: 4 }}>
              <span style={{ width: 150 }}>{p.name}</span>
              <div className="l3-grow">
                <div
                  className="l3-bar"
                  style={{
                    width: `${(Math.abs(total[p.id]!) / maxAbs) * 100}%`,
                    background:
                      total[p.id]! >= 0 ? colorOf(s, p.id) : "var(--bad)",
                  }}
                />
              </div>
              <b className="l3-mono">
                {total[p.id]! > 0 ? "+" : ""}
                {total[p.id]}
              </b>
            </div>
          ))}
          <p className="l3-hint">
            This finds the concepts most likely to succeed, not necessarily the
            best. Use the result to filter, then go weigh.
          </p>
        </Panel>
      )}
    </>
  );
}

const nodeAt = (root: ObjNode, path: number[]) =>
  path.reduce((n, i) => n.children[i]!, root);
function Tree({ n, path }: { n: ObjNode; path: number[] }) {
  const { up } = useLab();
  const sum = sibSum(n);
  return (
    <ul>
      {n.children.map((c, i) => {
        const p = [...path, i];
        return (
          <li key={c.id}>
            <div className="l3-tn">
              <input
                className="l3-input l3-s"
                style={{ width: 240 }}
                aria-label="Objective"
                value={c.name}
                onChange={(e) =>
                  up((d) => {
                    nodeAt(d.obj, p).name = e.target.value;
                  })
                }
              />
              <input
                className="l3-input l3-s l3-num"
                style={{ width: 70 }}
                type="number"
                step="0.05"
                min="0"
                max="1"
                aria-label="Weight among siblings"
                value={c.w}
                onChange={(e) =>
                  up((d) => {
                    nodeAt(d.obj, p).w = Number(e.target.value);
                  })
                }
              />
              <Btn
                small
                onClick={() =>
                  up((d) => {
                    nodeAt(d.obj, p).children.push({
                      id: uid(),
                      name: "",
                      w: 0,
                      children: [],
                    });
                  })
                }
              >
                + sub
              </Btn>
              <button
                className="l3-x"
                aria-label="Delete objective"
                onClick={() =>
                  up((d) => {
                    nodeAt(d.obj, path).children.splice(i, 1);
                  })
                }
              >
                ×
              </button>
            </div>
            {c.children.length > 0 && <Tree n={c} path={p} />}
          </li>
        );
      })}
      {n.children.length > 0 && (
        <li
          className="l3-small"
          style={{
            color: Math.abs(sum - 1) < 0.001 ? "var(--green)" : "var(--amber)",
          }}
        >
          Siblings sum to {fmt(sum, 2)}{" "}
          {Math.abs(sum - 1) < 0.001 ? "✓" : "(should be 1.00)"}
        </li>
      )}
    </ul>
  );
}

function Weights() {
  const { s, up, toast } = useLab();
  const w = weightsOf(s);
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  const lv = leaves(s.obj);
  const useLeaves = () =>
    up((d) => {
      const L = leaves(d.obj);
      d.crit = L.map((l, i) => {
        const old = d.crit.find((c) => c.id === l.id);
        return old
          ? { ...old, name: l.name, weight: l.w }
          : {
              id: l.id,
              name: l.name,
              rank: i + 1,
              weight: l.w,
              pref: "H",
              lo: 0,
              hi: 10,
              unit: "score",
            };
      });
      d.weightMode = "direct";
      toast("Leaves applied as criteria");
    });
  return (
    <>
      <Panel
        title="Criteria and weights"
        sub="At least five measurable criteria. Weights by ranking (1 = least important … n = most important, divided by the sum) or entered directly."
        tag="WEIGHTS"
        right={<SlideRef p="91–93" />}
      >
        <div className="l3-row" style={{ marginBottom: 10 }}>
          <Btn
            small
            pressed={s.weightMode === "rank"}
            onClick={() =>
              up((d) => {
                d.weightMode = "rank";
              })
            }
          >
            Ranking method
          </Btn>
          <Btn
            small
            pressed={s.weightMode === "direct"}
            onClick={() =>
              up((d) => {
                d.weightMode = "direct";
              })
            }
          >
            Direct weights
          </Btn>
          <Btn
            small
            onClick={() =>
              up((d) => {
                d.crit.push({
                  id: uid(),
                  name: "",
                  rank: d.crit.length + 1,
                  weight: 0.1,
                  pref: "H",
                  lo: 0,
                  hi: 10,
                  unit: "score",
                });
              })
            }
          >
            + Criterion
          </Btn>
          {s.pcrit.some((p) => p.name.trim()) && (
            <Btn
              small
              onClick={() =>
                up((d) => {
                  d.pcrit
                    .filter((p) => p.name.trim())
                    .forEach((p) => {
                      if (!d.crit.some((c) => c.name === p.name))
                        d.crit.push({
                          id: uid(),
                          name: p.name,
                          rank: d.crit.length + 1,
                          weight: 0.1,
                          pref: "H",
                          lo: 0,
                          hi: 10,
                          unit: "score",
                        });
                    });
                })
              }
            >
              Import duel criteria
            </Btn>
          )}
        </div>
        {!s.crit.length ? (
          <Empty>
            No criteria yet. Add one, import your duel criteria, or build the
            hierarchy below.
          </Empty>
        ) : (
          <div className="l3-tablewrap">
            <table className="l3-table">
              <thead>
                <tr>
                  <th>Criterion (measurable)</th>
                  <th>H / L</th>
                  <th>lo (worst)</th>
                  <th>hi (best)</th>
                  <th>unit</th>
                  <th>{s.weightMode === "rank" ? "Rank" : "Weight"}</th>
                  <th>Normalized w</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {s.crit.map((c, i) => {
                  const v = vagueWords(c.name);
                  return (
                    <tr key={c.id}>
                      <td>
                        <input
                          className="l3-input l3-s"
                          value={c.name}
                          aria-label="Criterion name"
                          onChange={(e) =>
                            up((d) => {
                              d.crit[i]!.name = e.target.value;
                            })
                          }
                        />
                        {v.length > 0 && (
                          <div className="l3-hint l3-warn">
                            “{v[0]}” is vague. Add a number or measurable scale.
                          </div>
                        )}
                      </td>
                      <td>
                        <select
                          className="l3-select l3-s"
                          value={c.pref}
                          aria-label="Preference"
                          onChange={(e) =>
                            up((d) => {
                              d.crit[i]!.pref = e.target.value as "H" | "L";
                            })
                          }
                        >
                          <option value="H">H</option>
                          <option value="L">L</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="l3-input l3-s l3-num"
                          type="number"
                          value={c.lo}
                          aria-label="Lower bound"
                          onChange={(e) =>
                            up((d) => {
                              d.crit[i]!.lo = Number(e.target.value);
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="l3-input l3-s l3-num"
                          type="number"
                          value={c.hi}
                          aria-label="Upper bound"
                          onChange={(e) =>
                            up((d) => {
                              d.crit[i]!.hi = Number(e.target.value);
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="l3-input l3-s"
                          style={{ width: 70 }}
                          value={c.unit}
                          aria-label="Unit"
                          onChange={(e) =>
                            up((d) => {
                              d.crit[i]!.unit = e.target.value;
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="l3-input l3-s l3-num"
                          type="number"
                          step={s.weightMode === "rank" ? 1 : 0.01}
                          value={s.weightMode === "rank" ? c.rank : c.weight}
                          aria-label="Weight input"
                          onChange={(e) =>
                            up((d) => {
                              if (d.weightMode === "rank")
                                d.crit[i]!.rank = Number(e.target.value);
                              else d.crit[i]!.weight = Number(e.target.value);
                            })
                          }
                        />
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div className="l3-row" style={{ gap: 6 }}>
                          <div className="l3-grow l3-mt" style={{ height: 6 }}>
                            <i
                              className="l3-fill l3-f-cyan"
                              style={{ width: `${(w[c.id] || 0) * 100}%` }}
                            />
                          </div>
                          <span className="l3-mono">{fmt(w[c.id] || 0)}</span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="l3-x"
                          aria-label="Delete criterion"
                          onClick={() =>
                            up((d) => {
                              const id = d.crit[i]!.id;
                              d.crit.splice(i, 1);
                              Object.values(d.ratings).forEach((r) => {
                                delete r[id];
                              });
                            })
                          }
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={6} className="r">
                    <b>Sum of weights</b>
                  </td>
                  <td className="l3-mono">
                    <b
                      className={
                        Math.abs(total - 1) < 0.001 ? "l3-ok" : "l3-warn"
                      }
                    >
                      {fmt(total)}
                    </b>
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="l3-hint" style={{ marginTop: 6 }}>
          H: bigger is better (payload). L: smaller is better (cost). lo/hi set
          the ruler used to normalize.
        </p>
      </Panel>

      <Panel
        title="Objectives hierarchy (optional)"
        sub="Child weights multiply down the tree. Slides p.114: leaf weight = product of the weights on its path."
        tag="TREE"
      >
        <div className="l3-tree">
          <div className="l3-tn" style={{ marginBottom: 6 }}>
            <b>Goal:</b>
            <input
              className="l3-input l3-s"
              style={{ width: 280 }}
              aria-label="Goal"
              value={s.obj.name}
              onChange={(e) =>
                up((d) => {
                  d.obj.name = e.target.value;
                })
              }
            />
            <Btn
              small
              onClick={() =>
                up((d) => {
                  d.obj.children.push({
                    id: uid(),
                    name: "",
                    w: 0,
                    children: [],
                  });
                })
              }
            >
              + objective
            </Btn>
          </div>
          {s.obj.children.length ? (
            <Tree n={s.obj} path={[]} />
          ) : (
            <p className="l3-hint">
              Empty. Add objectives such as “High safety” 0.3, then break each
              into measurable leaves.
            </p>
          )}
        </div>
        {lv.length > 0 && (
          <>
            <div className="l3-tablewrap" style={{ marginTop: 10 }}>
              <table className="l3-table">
                <thead>
                  <tr>
                    <th>Leaf</th>
                    <th className="r">Combined weight</th>
                  </tr>
                </thead>
                <tbody>
                  {lv.map((l) => (
                    <tr key={l.id}>
                      <td>{l.path}</td>
                      <td className="r">{fmt(l.w)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="r">
                      <b>Total</b>
                    </td>
                    <td className="r">
                      <b>{fmt(lv.reduce((a, l) => a + l.w, 0))}</b>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="l3-row" style={{ marginTop: 8 }}>
              <Btn variant="primary" onClick={useLeaves}>
                Use leaves as criteria
              </Btn>
            </div>
          </>
        )}
      </Panel>
    </>
  );
}

function methodText(s: State, ids: string[]) {
  return `Method. The ${ids.length} surviving structures (${ids.map((i) => nameOf(s, i)).join(", ")}) were compared on ${s.crit.length} criteria. Each rating x was normalized to 0–1 against stated bounds (n = (x − lo)/(hi − lo) when higher is better, n = (hi − x)/(hi − lo) when lower is better). Weights were assigned by the ${s.weightMode === "rank" ? "ranking method (least important = 1, most important = n, each divided by the sum)" : "direct-weighting method (weights normalized to sum to 1)"}. Merit = Σ wᵢ·nᵢ. The highest merit was then stress-tested by moving every rating ±5% and swinging each weight by ×0.5 and ×1.5.`;
}

function Matrix() {
  const { s, up, go } = useLab();
  if (!s.structures.length) return <NeedStructs />;
  const surv = survivors(s);
  const ids = surv.map((x) => x.id);
  const w = weightsOf(s);
  const rows = meritOf(s, ids, w);
  const sorted = [...rows].sort((a, b) => b.merit - a.merit);
  const best = sorted[0];
  if (!s.crit.length)
    return (
      <Callout tone="warn" title="No criteria yet">
        Define criteria and weights first.{" "}
        <Btn small onClick={() => go("s5", "weights")}>
          Open Weights
        </Btn>
      </Callout>
    );
  if (!surv.length)
    return (
      <Callout tone="warn" title="Everything was eliminated">
        Revisit the filter.{" "}
        <Btn small onClick={() => go("s5", "filter")}>
          Open Filter
        </Btn>
      </Callout>
    );
  return (
    <>
      <Panel
        title="Decision matrix"
        sub="Rate each surviving structure on every criterion, in that criterion’s own unit."
        tag="MATRIX"
        right={
          <Chip tone={ratingComplete(s, ids) ? "good" : "warn"}>
            {ratingComplete(s, ids) ? "complete" : "incomplete"}
          </Chip>
        }
      >
        <div className="l3-tablewrap">
          <table className="l3-table">
            <thead>
              <tr>
                <th>Criterion</th>
                <th className="r">w</th>
                {surv.map((x) => (
                  <th key={x.id} style={{ color: colorOf(s, x.id) }}>
                    {x.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.crit.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.name || "(unnamed)"}{" "}
                    <span className="l3-hint">
                      ({c.pref} · {c.lo}–{c.hi} {c.unit})
                    </span>
                  </td>
                  <td className="r">{fmt(w[c.id] || 0)}</td>
                  {surv.map((x) => {
                    const raw = s.ratings[x.id]?.[c.id] ?? "";
                    const nv = num(raw);
                    return (
                      <td key={x.id}>
                        <input
                          className="l3-input l3-s l3-num"
                          type="number"
                          aria-label={`${x.name} on ${c.name}`}
                          value={raw}
                          onChange={(e) =>
                            up((d) => {
                              (d.ratings[x.id] ||= {})[c.id] =
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value);
                            })
                          }
                        />
                        {nv !== null && (
                          <div className="l3-hint l3-mono">
                            n = {fmt(norm(c, nv))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="r">
                  <b>Merit</b>
                </td>
                {surv.map((x) => {
                  const r = rows.find((y) => y.id === x.id)!;
                  return (
                    <td key={x.id} className="l3-mono">
                      <b style={{ fontSize: 16 }}>{fmt(r.merit)}</b>
                      {r.missing > 0 && (
                        <div className="l3-hint l3-warn">
                          {r.missing} missing
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Ranking" tag="RESULT">
        {sorted.map((r, i) => (
          <div key={r.id} className="l3-row" style={{ marginBottom: 6 }}>
            <b className="l3-mono" style={{ width: 24 }}>
              {i + 1}
            </b>
            <span style={{ width: 170 }}>{nameOf(s, r.id)}</span>
            <div className="l3-grow">
              <div
                className="l3-bar"
                style={{
                  width: `${Math.max(1, r.merit * 100)}%`,
                  background: colorOf(s, r.id),
                }}
              />
            </div>
            <b className="l3-mono">{fmt(r.merit)}</b>
          </div>
        ))}
        {best && best.merit > 0 && (
          <div className="l3-row" style={{ marginTop: 10 }}>
            <Btn
              variant="primary"
              onClick={() => {
                up((d) => {
                  d.final.structId = best.id;
                });
                go("s5", "stress");
              }}
            >
              Stress-test {nameOf(s, best.id)}
            </Btn>
            <CopyBtn
              text={methodText(s, ids)}
              label="Copy Appendix E method paragraph"
            />
          </div>
        )}
      </Panel>
    </>
  );
}

function Stress() {
  const { s, go, up } = useLab();
  const surv = survivors(s);
  const ids = surv.map((x) => x.id);
  if (!s.crit.length || !surv.length || !ratingComplete(s, ids))
    return (
      <Callout tone="warn" title="Matrix not complete">
        The stress test needs a complete matrix.{" "}
        <Btn small onClick={() => go("s5", "matrix")}>
          Finish the matrix
        </Btn>
      </Callout>
    );
  const r = sensitivity(s, ids);
  const sorted = [...r.base].sort((a, b) => b.merit - a.merit);
  return (
    <>
      <Panel
        title="±5% test"
        sub="Slide p.94. Every rating 5% better, then 5% worse. Do the winner’s error bars overlap the runner-up’s?"
        tag="BARS"
      >
        <div className="l3-tablewrap">
          <table className="l3-table">
            <thead>
              <tr>
                <th>Structure</th>
                <th className="r">5% worse</th>
                <th className="r">Base</th>
                <th className="r">5% better</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => (
                <tr key={b.id} className={b.id === r.winner ? "l3-win" : ""}>
                  <td>{nameOf(s, b.id)}</td>
                  <td className="r">
                    {fmt(r.worse.find((x) => x.id === b.id)!.merit)}
                  </td>
                  <td className="r">
                    <b>{fmt(b.merit)}</b>
                  </td>
                  <td className="r">
                    {fmt(r.better.find((x) => x.id === b.id)!.merit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {r.runner ? (
          r.overlap ? (
            <Callout tone="warn" title="Overlap">
              {nameOf(s, r.winner!)}’s worst case (
              {fmt(r.worse.find((x) => x.id === r.winner)!.merit)}) is not above{" "}
              {nameOf(s, r.runner)}’s best case. You cannot honestly call a
              clear winner. Compare risk, unknowns, or combine strengths.
            </Callout>
          ) : (
            <Callout tone="good" title="Clear gap">
              {nameOf(s, r.winner!)} stays ahead even in its worst case. Margin{" "}
              {fmt(r.margin)}.
            </Callout>
          )
        ) : null}
      </Panel>
      <Panel title="Is one attribute carrying the winner?" tag="DOMINANCE">
        <Meter
          label={`Share of ${nameOf(s, r.winner || "")}’s merit from “${r.topCrit}”`}
          value={r.topShare}
          tone={r.topShare > 0.4 ? "amber" : "green"}
        />
        <p className="l3-small l3-mute">
          {r.topShare > 0.4
            ? "One criterion supplies a large part of the win. Ask what happens if that criterion matters less."
            : "Spread across several criteria. Healthy."}
        </p>
      </Panel>
      <Panel
        title="Weight swings"
        sub="Each weight ×1.5 and ×0.5, renormalized."
        tag="WEIGHTS"
      >
        <Callout
          tone={r.flips ? "warn" : "good"}
          title={`${r.flips} of ${r.total} swings change the winner`}
        >
          {r.flips ? (
            <ul style={{ paddingLeft: 18 }}>
              {r.flipList.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          ) : (
            "The winner survives every swing. Strong evidence."
          )}
        </Callout>
        <ul className="l3-small l3-mute" style={{ paddingLeft: 18 }}>
          {SENS_TIPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <div className="l3-row" style={{ marginTop: 10 }}>
          {r.winner && (
            <Btn
              variant="primary"
              onClick={() => {
                up((d) => {
                  d.final.structId = r.winner!;
                  d.checks["m-e1"] = true;
                });
                go("s6", "studio");
              }}
            >
              Take {nameOf(s, r.winner)} to the Concept Studio
            </Btn>
          )}
          <span className="l3-hint">
            Marks the “ran the stress test” checkbox for you.
          </span>
        </div>
      </Panel>
    </>
  );
}

function Quick() {
  const { s, up } = useLab();
  const box = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState("");
  const pool = useMemo(
    () => (survivors(s).length ? survivors(s) : s.structures),
    [s],
  );
  if (!pool.length) return <NeedStructs />;
  const pos = (id: string, i: number) =>
    s.quad[id] || {
      effort: 0.15 + (i % 4) * 0.2,
      value: 0.8 - Math.floor(i / 4) * 0.15,
    };
  const mv = (e: React.PointerEvent) => {
    if (!drag || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const effort = clamp((e.clientX - r.left) / r.width, 0, 1),
      value = clamp(1 - (e.clientY - r.top) / r.height, 0, 1);
    up((d) => {
      d.quad[drag] = { effort, value };
    });
  };
  const used = Object.values(s.dots).reduce((a, b) => a + b, 0);
  return (
    <>
      <Panel
        title="2×2 value / effort"
        sub="Drag each dot. Top-left (high value, low effort) is where winners live. Slides p.77–78."
        tag="2×2"
      >
        <div className="l3-row" style={{ alignItems: "flex-start" }}>
          <div
            ref={box}
            className="l3-quad l3-grow"
            onPointerMove={mv}
            onPointerUp={() => setDrag("")}
            onPointerLeave={() => setDrag("")}
          >
            <span className="l3-qlab" style={{ left: 8, top: 6 }}>
              QUICK WINS
            </span>
            <span className="l3-qlab" style={{ right: 8, top: 6 }}>
              BIG BETS
            </span>
            <span className="l3-qlab" style={{ left: 8, bottom: 6 }}>
              FILL-INS
            </span>
            <span className="l3-qlab" style={{ right: 8, bottom: 6 }}>
              MONEY PITS
            </span>
            {pool.map((st, i) => {
              const p = pos(st.id, i);
              return (
                <div
                  key={st.id}
                  role="slider"
                  aria-label={`${st.name}: drag`}
                  aria-valuenow={Math.round(p.value * 100)}
                  tabIndex={0}
                  className="l3-qd"
                  title={st.name}
                  style={{
                    left: `${p.effort * 100}%`,
                    top: `${(1 - p.value) * 100}%`,
                    background: colorOf(s, st.id),
                  }}
                  onPointerDown={(e) => {
                    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                    setDrag(st.id);
                  }}
                >
                  {s.structures.indexOf(st) + 1}
                </div>
              );
            })}
          </div>
          <div className="l3-col" style={{ minWidth: 150 }}>
            <span className="l3-hint">
              x: effort →<br />
              y: value ↑
            </span>
            {pool.map((st) => (
              <Chip key={st.id}>
                <span style={{ color: colorOf(s, st.id) }}>●</span>{" "}
                {s.structures.indexOf(st) + 1} {st.name}
              </Chip>
            ))}
          </div>
        </div>
      </Panel>
      <Panel
        title="Dot voting"
        sub="Each teammate gets a few dots. Put them where you believe. Slide p.79."
        tag="DOTS"
        right={<Chip>{used} dots placed</Chip>}
      >
        {pool.map((st) => (
          <div key={st.id} className="l3-row" style={{ marginBottom: 6 }}>
            <span style={{ width: 180 }}>
              <b style={{ color: colorOf(s, st.id) }}>●</b> {st.name}
            </span>
            <Btn
              small
              onClick={() =>
                up((d) => {
                  d.dots[st.id] = Math.max(0, (d.dots[st.id] || 0) - 1);
                })
              }
            >
              −
            </Btn>
            <b className="l3-mono" style={{ width: 28, textAlign: "center" }}>
              {s.dots[st.id] || 0}
            </b>
            <Btn
              small
              onClick={() =>
                up((d) => {
                  d.dots[st.id] = (d.dots[st.id] || 0) + 1;
                })
              }
            >
              +
            </Btn>
            <div className="l3-grow">
              <div
                className="l3-bar"
                style={{
                  width: `${used ? ((s.dots[st.id] || 0) / Math.max(1, ...Object.values(s.dots))) * 100 : 0}%`,
                  background: colorOf(s, st.id),
                }}
              />
            </div>
          </div>
        ))}
        <p className="l3-hint">
          Quick tools are fine for screening and for discussion, but Appendix E
          still needs the weighted matrix.
        </p>
      </Panel>
    </>
  );
}

export function Step5() {
  return (
    <StepShell n={5} tabs={TABS} defaultTab="learn">
      {(t) =>
        t === "filter" ? (
          <Filter />
        ) : t === "duel" ? (
          <Duel />
        ) : t === "weights" ? (
          <Weights />
        ) : t === "matrix" ? (
          <Matrix />
        ) : t === "stress" ? (
          <Stress />
        ) : t === "quick" ? (
          <Quick />
        ) : (
          <Learn />
        )
      }
    </StepShell>
  );
}
