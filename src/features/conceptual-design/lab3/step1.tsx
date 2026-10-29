"use client";
import React, { useState } from "react";
import { ABS_OPS, LADDER, MATCH, NEUTRAL_QUIZ } from "./data";
import { findNumbers, lintStatement } from "./derive";
import { StepShell } from "./shell";
import { useLab } from "./store";
import { uid } from "./types";
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

const TABS = [
  { id: "learn", label: "Learn it" },
  { id: "bench", label: "Workbench" },
];

function Elevator() {
  const [lv, setLv] = useState(2);
  const top = (7 - lv) / 7;
  const tag =
    lv <= 1
      ? "Too narrow: you are still describing one machine."
      : lv >= 7
        ? "Broadest: probably too vague to design anything."
        : lv >= 5
          ? "Getting broad. Is this still the real task?"
          : "In the useful zone: the crux of the problem.";
  return (
    <Panel
      title="The Abstraction Elevator"
      sub="Slides p.6–8. Slide the car up: each floor drops one detail and names a bigger problem."
      tag="LADDER"
    >
      <div className="l3-lad">
        <div className="l3-rail" aria-hidden="true">
          <div className="l3-car" style={{ top: `${top * 88 + 2}%` }}>
            {lv + 1}
          </div>
        </div>
        <div className="l3-col">
          <input
            type="range"
            min={0}
            max={7}
            value={lv}
            onChange={(e) => setLv(Number(e.target.value))}
            aria-label="Floor of abstraction"
          />
          <div className="l3-card">
            <div className="l3-eyebrow">FLOOR {lv + 1} OF 8</div>
            <p style={{ fontSize: 17, margin: "6px 0" }}>{LADDER[lv]}</p>
            <p className="l3-small l3-mute">{tag}</p>
          </div>
          <p className="l3-small l3-mute">
            The slides’ rule: go up until further broadening would change the
            real task, then stop. Here the crux is “transferring feed”.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function Match() {
  const [a, setA] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const order = React.useMemo(
    () =>
      MATCH.map((_, i) => i).sort(
        (x, y) => ((x * 7 + 3) % 6) - ((y * 7 + 3) % 6),
      ),
    [],
  );
  const pickB = (j: number) => {
    if (a === null) return;
    if (a === j) {
      setDone((d) => [...d, j]);
      setA(null);
      setWrong(false);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 700);
    }
  };
  return (
    <Panel
      title="Match the problem to its abstraction"
      sub="Slide p.13. Tap a left card, then the right card that says the same thing without naming the product."
      tag="GAME"
    >
      <div className="l3-match">
        <div>
          {MATCH.map((m, i) => (
            <button
              key={i}
              disabled={done.includes(i)}
              className={`l3-mi ${a === i ? "sel" : ""} ${done.includes(i) ? "done" : ""}`}
              onClick={() => setA(i)}
            >
              {m.a}
            </button>
          ))}
        </div>
        <div>
          {order.map((j) => (
            <button
              key={j}
              disabled={done.includes(j)}
              className={`l3-mi ${done.includes(j) ? "done" : ""}`}
              onClick={() => pickB(j)}
            >
              {MATCH[j]!.b}
            </button>
          ))}
        </div>
      </div>
      {wrong && (
        <Callout tone="bad">
          Not that one. Which sentence could be satisfied by a completely
          different machine?
        </Callout>
      )}
      {done.length === MATCH.length && (
        <Callout tone="good" title="All matched.">
          Notice how each right-hand card names what happens to what, never the
          part.
        </Callout>
      )}
    </Panel>
  );
}

function NeutralQuiz() {
  const [ans, setAns] = useState<Record<number, boolean>>({});
  const score = NEUTRAL_QUIZ.filter((q, i) => ans[i] === q.neutral).length;
  return (
    <Panel
      title="Solution-neutral or not?"
      sub="One sentence is solution-neutral when a totally different machine could satisfy it."
      tag="QUIZ"
      right={
        <Chip tone="accent">
          {score}/{Object.keys(ans).length || 0}
        </Chip>
      }
    >
      <div className="l3-col">
        {NEUTRAL_QUIZ.map((q, i) => {
          const a = ans[i];
          return (
            <div key={i} className="l3-card">
              <p>“{q.s}”</p>
              <div className="l3-quiz-btns" style={{ marginTop: 8 }}>
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    disabled={a !== undefined}
                    className={`l3-opt ${a === v ? (v === q.neutral ? "right" : "wrong") : ""}`}
                    onClick={() => setAns((x) => ({ ...x, [i]: v }))}
                  >
                    {v ? "Solution-neutral" : "Names a solution"}
                  </button>
                ))}
              </div>
              {a !== undefined && (
                <p
                  className={`l3-small ${a === q.neutral ? "l3-ok" : "l3-bad"}`}
                  style={{ marginTop: 6 }}
                >
                  {a === q.neutral ? "Right. " : "Not quite. "}
                  {q.why}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Learn() {
  return (
    <>
      <Panel
        title="Why abstract at all?"
        sub="Pahl & Beitz: the crux is hidden inside the requirements list. Abstraction finds it so you do not just redesign what already exists."
        tag="WHY"
      >
        <Callout tone="info" title="One-line version">
          Strip the requirements list until what is left says{" "}
          <b>what must happen to what</b>, with no product, no numbers and no
          mechanism.
        </Callout>
        <div className="l3-gauto" style={{ marginTop: 12 }}>
          {ABS_OPS.map((o) => (
            <div key={o.n} className="l3-card">
              <div className="l3-op">
                <div className="l3-opn">{o.n}</div>
                <div>
                  <b>{o.t}</b>
                  <p className="l3-small l3-mute">{o.d}</p>
                  <p className="l3-small" style={{ marginTop: 4 }}>
                    Ask: <i>{o.ask}</i>
                  </p>
                </div>
              </div>
              <div className="l3-ba">
                <span>{o.before}</span>
                <em>→</em>
                <span>{o.after}</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <SlideRef p={o.slide.replace("p.", "")} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Elevator />
      <Match />
      <NeutralQuiz />
      <Tip>
        Appendix A in your report must show <b>all five operations</b> so the
        grader sees the thinking, not just the final sentence. The Workbench
        builds that table for you.
      </Tip>
    </>
  );
}

function Bench() {
  const { s, up, go, toast } = useLab();
  const [paste, setPaste] = useState("");
  const lint = lintStatement(s.abs.statement, s.abs.product);
  const addPaste = () => {
    const lines = paste
      .split(/\n+/)
      .map((x) => x.replace(/^[\s\-*•\d.)]+/, "").trim())
      .filter(Boolean);
    if (!lines.length) return;
    up((d) => {
      lines.forEach((t) =>
        d.abs.reqs.push({
          id: uid(),
          text: t,
          verdict: "",
          essence: "",
          general: "",
        }),
      );
    });
    setPaste("");
    toast(`${lines.length} requirement(s) added`);
  };
  const example = () =>
    up((d) => {
      d.abs.product = "fuel gauge";
      d.abs.reqs = [
        {
          id: uid(),
          text: "Must look sporty and be available in red",
          verdict: "pref",
          essence: "",
          general: "",
        },
        {
          id: uid(),
          text: "Measure fuel between 0 and 60 litres",
          verdict: "keep",
          essence: "Measure a wide range of liquid quantity",
          general: "Liquid in containers of unspecified size and shape",
        },
        {
          id: uid(),
          text: "Display the level to the driver at 1 m distance",
          verdict: "keep",
          essence: "Indicate the quantity at a distance",
          general: "Indicate quantity remotely",
        },
        {
          id: uid(),
          text: "Ships in a cardboard box",
          verdict: "nofunc",
          essence: "",
          general: "",
        },
        {
          id: uid(),
          text: "Works while the car moves and the fuel sloshes",
          verdict: "keep",
          essence: "Cope with continuously changing quantity",
          general: "Measure continuously changing quantities",
        },
      ];
      d.abs.statement =
        "Measure continuously changing quantities of liquid and indicate them at a distance.";
    });
  const cnt = (v: string) => s.abs.reqs.filter((r) => r.verdict === v).length;
  const copyTable = () => {
    const rows = s.abs.reqs.map(
      (r) =>
        `| ${r.text} | ${r.verdict === "keep" ? "keep" : r.verdict === "pref" ? "deleted (preference)" : r.verdict === "nofunc" ? "deleted (no function)" : "?"} | ${r.essence} | ${r.general} |`,
    );
    return `| Requirement (Lab 2) | Op 1–2 | Op 3 qualitative | Op 4 general |\n|---|---|---|---|\n${rows.join("\n")}\n\n**Problem statement (Op 5):** ${s.abs.statement}`;
  };
  return (
    <>
      <Panel
        title="1 · Bring your Lab 2 requirements list"
        sub="Paste one requirement per line, or load the fuel-gauge example from the slides."
        tag="INPUT"
      >
        <div className="l3-row" style={{ alignItems: "stretch" }}>
          <textarea
            className="l3-textarea l3-grow"
            placeholder={
              "Handle force no more than 20 N\nMust be red\nWeighs under 2 kg"
            }
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            aria-label="Paste requirements"
          />
          <div className="l3-col">
            <Btn variant="primary" onClick={addPaste} disabled={!paste.trim()}>
              Add lines
            </Btn>
            {s.abs.reqs.length === 0 ? (
              <Btn onClick={example}>Load fuel-gauge example</Btn>
            ) : (
              <ConfirmBtn
                label="Clear all"
                onConfirm={() =>
                  up((d) => {
                    d.abs = { reqs: [], product: "", statement: "" };
                  })
                }
              />
            )}
          </div>
        </div>
      </Panel>

      <Panel
        title="2 · Run operations 1 to 4"
        sub="Classify each line. Then turn numbers into words and climb one rung."
        tag="OPS 1–4"
        right={
          <div className="l3-row">
            <Chip tone="good">{cnt("keep")} keep</Chip>
            <Chip>{cnt("pref")} pref.</Chip>
            <Chip>{cnt("nofunc")} no function</Chip>
          </div>
        }
      >
        {s.abs.reqs.length === 0 ? (
          <Empty>No requirements yet. Paste your list above.</Empty>
        ) : (
          <div className="l3-col">
            {s.abs.reqs.map((r, i) => {
              const nums = findNumbers(r.essence);
              return (
                <div key={r.id} className="l3-card">
                  <div className="l3-row">
                    <span className="l3-mono l3-mute">{i + 1}</span>
                    <input
                      className="l3-input l3-grow"
                      value={r.text}
                      aria-label={`Requirement ${i + 1}`}
                      onChange={(e) =>
                        up((d) => {
                          d.abs.reqs[i]!.text = e.target.value;
                        })
                      }
                    />
                    <select
                      className="l3-select"
                      style={{ width: 230 }}
                      value={r.verdict}
                      aria-label="Classification"
                      onChange={(e) =>
                        up((d) => {
                          d.abs.reqs[i]!.verdict = e.target
                            .value as typeof r.verdict;
                        })
                      }
                    >
                      <option value="">Classify…</option>
                      <option value="keep">
                        Keep (function or essential constraint)
                      </option>
                      <option value="pref">
                        Delete: personal preference (op 1)
                      </option>
                      <option value="nofunc">
                        Delete: no effect on function (op 2)
                      </option>
                    </select>
                    <button
                      className="l3-x"
                      aria-label="Delete requirement"
                      onClick={() =>
                        up((d) => {
                          d.abs.reqs.splice(i, 1);
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                  {r.verdict === "keep" && (
                    <div className="l3-g2" style={{ marginTop: 8 }}>
                      <div className="l3-field">
                        <label>Op 3 · qualitative essence</label>
                        <input
                          className="l3-input"
                          value={r.essence}
                          placeholder="What does the number really say?"
                          onChange={(e) =>
                            up((d) => {
                              d.abs.reqs[i]!.essence = e.target.value;
                            })
                          }
                        />
                        {nums.length > 0 && (
                          <span className="l3-hint l3-warn">
                            Still has a number ({nums[0]}). Say the idea behind
                            it.
                          </span>
                        )}
                      </div>
                      <div className="l3-field">
                        <label>Op 4 · generalized</label>
                        <input
                          className="l3-input"
                          value={r.general}
                          placeholder="What bigger problem is this a case of?"
                          onChange={(e) =>
                            up((d) => {
                              d.abs.reqs[i]!.general = e.target.value;
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel
        title="3 · Operation 5: one solution-neutral sentence"
        sub="No product, no numbers, no mechanism. Say what happens to what."
        tag="OP 5"
      >
        <div className="l3-g2">
          <div className="l3-field">
            <label>Your product (so the linter can catch it)</label>
            <input
              className="l3-input"
              value={s.abs.product}
              placeholder="e.g. garlic press"
              onChange={(e) =>
                up((d) => {
                  d.abs.product = e.target.value;
                })
              }
            />
          </div>
          <div className="l3-field">
            <label>Linter score</label>
            <Meter
              value={lint.score / 100}
              tone={
                lint.score >= 80 ? "green" : lint.score >= 50 ? "amber" : "bad"
              }
              note={`${lint.score}/100`}
            />
          </div>
        </div>
        <div className="l3-field" style={{ marginTop: 8 }}>
          <label>Problem statement</label>
          <textarea
            className="l3-textarea"
            value={s.abs.statement}
            onChange={(e) =>
              up((d) => {
                d.abs.statement = e.target.value;
              })
            }
            placeholder="Measure continuously changing quantities of liquid and indicate them at a distance."
          />
        </div>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 10 }}>
          {lint.checks.map((c, i) => (
            <li key={i} className="l3-lint">
              <b className={c.ok ? "l3-ok" : "l3-bad"}>{c.ok ? "✓" : "✗"}</b>
              <span>
                {c.label}
                {c.detail ? (
                  <span className="l3-mute"> · {c.detail}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <div className="l3-row" style={{ marginTop: 10 }}>
          <CopyBtn text={copyTable} label="Copy Appendix A table" />
          <Btn small onClick={() => go("vault", "A")}>
            See Appendix A preview
          </Btn>
        </div>
      </Panel>
    </>
  );
}

export function Step1() {
  return (
    <StepShell n={1} tabs={TABS} defaultTab="learn">
      {(t) => (t === "bench" ? <Bench /> : <Learn />)}
    </StepShell>
  );
}
