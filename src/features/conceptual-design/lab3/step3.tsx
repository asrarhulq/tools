"use client";
import { useEffect, useRef, useState } from "react";
import {
  BRAINSTORM_RULES,
  EFFECTS,
  EFFECT_CATS,
  METAPHORS,
  SCAMPER,
} from "./data";
import { chartStats, isSketched } from "./derive";
import { loadRig } from "./examples";
import { SketchThumb } from "./sketch";
import { StepShell } from "./shell";
import { useLab } from "./store";
import { uid } from "./types";
import type { State } from "./types";
import {
  Btn,
  Callout,
  Chip,
  ConfirmBtn,
  Empty,
  Meter,
  Panel,
  SlideRef,
  Tip,
} from "./ui";

const TABS = [
  { id: "learn", label: "Learn it" },
  { id: "spark", label: "Spark ideas" },
  { id: "effects", label: "Effect cards" },
  { id: "chart", label: "Morph chart" },
];

export const addPrinciple = (
  d: State,
  fnId: string,
  p: Partial<{ text: string; effect: string; geometry: string }> = {},
) => {
  d.principles.push({
    id: uid(),
    fnId,
    text: p.text || "",
    effect: p.effect || "",
    geometry: p.geometry || "",
    sketch: "",
    sketched: false,
  });
};

function FnPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { s, go } = useLab();
  if (!s.fs.fns.length)
    return (
      <Callout tone="warn" title="No functions yet">
        The chart needs functions as rows.{" "}
        <Btn small onClick={() => go("s2", "forge")}>
          Build them in Step 2
        </Btn>
      </Callout>
    );
  return (
    <div className="l3-field">
      <label>Working on function</label>
      <select
        className="l3-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {s.fs.fns.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name || "(unnamed)"}
            {f.aux ? " (aux)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
const useFn = () => {
  const { s } = useLab();
  const [fnId, setFnId] = useState("");
  const valid = s.fs.fns.some((f) => f.id === fnId)
    ? fnId
    : s.fs.fns[0]?.id || "";
  return [valid, setFnId, s.fs.fns.find((f) => f.id === valid)] as const;
};

function Learn() {
  return (
    <>
      <Panel
        title="What is a working principle?"
        sub="Slides p.33–38."
        tag="DEFINE"
      >
        <div
          className="l3-g3"
          style={{ alignItems: "center", textAlign: "center" }}
        >
          <div className="l3-card">
            <div className="l3-eyebrow">PHYSICAL EFFECT</div>
            <p>the law of nature doing the work</p>
            <p className="l3-mute l3-small">
              lever, friction, capillary action
            </p>
          </div>
          <div
            className="l3-card"
            style={{ border: 0, background: "none", fontSize: 28 }}
          >
            +{" "}
            <span className="l3-mute" style={{ fontSize: 14 }}>
              then
            </span>
          </div>
          <div className="l3-card">
            <div className="l3-eyebrow">GEOMETRY / MATERIAL</div>
            <p>the shape and stuff that make it happen</p>
            <p className="l3-mute l3-small">
              long arm, rubber lining, wedge angle
            </p>
          </div>
        </div>
        <Callout tone="good" title="Example">
          “Amplify force”: <b>lever effect</b> + a long rigid arm on a pivot.
          Or: <b>hydrostatic pressure</b> + two pistons of different area. Same
          function, different effect = a genuinely different idea.
        </Callout>
        <Callout tone="warn" title="The trap">
          Five lever variations are one idea. The lab wants five{" "}
          <b>different</b> effects per function, each sketched.
        </Callout>
        <div className="l3-row">
          <SlideRef p="33–38" />
          <SlideRef p="39–55" />
          <SlideRef p="56–64" />
        </div>
      </Panel>
      <Panel title="Where ideas come from" sub="Slides p.39–64." tag="SOURCES">
        <div className="l3-gauto">
          {[
            [
              "Physical effects",
              "Browse the effect catalogue. Ask: which law of nature already does this function?",
            ],
            [
              "Existing systems",
              "Take apart or study products that already do the function.",
            ],
            [
              "Nature",
              "Gecko feet, octopus arms, kangaroo tendons: nature solved it already.",
            ],
            [
              "Brainstorm",
              "Quantity over quality. Defer judgment. Combine and build on others’ ideas.",
            ],
            [
              "SCAMPER",
              "Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Rearrange.",
            ],
            [
              "6-3-5 / Synectics",
              "Six people, three ideas, five rounds. Or compare the problem to unrelated things.",
            ],
          ].map(([t, d]) => (
            <div key={t} className="l3-card">
              <b>{t}</b>
              <p className="l3-small l3-mute">{d}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Tip>
        Use <b>two or more techniques</b> and say so in your main body. It is
        one of the Step 3 checkpoint items.
      </Tip>
    </>
  );
}

function Timer({ onDone }: { onDone: () => void }) {
  const [left, setLeft] = useState(300);
  const [run, setRun] = useState(false);
  const cb = useRef(onDone);
  useEffect(() => {
    cb.current = onDone;
  }, [onDone]);
  useEffect(() => {
    if (!run) return;
    const t = setInterval(
      () =>
        setLeft((l) => {
          if (l <= 1) {
            setRun(false);
            cb.current();
            return 0;
          }
          return l - 1;
        }),
      1000,
    );
    return () => clearInterval(t);
  }, [run]);
  const m = Math.floor(left / 60),
    sec = String(left % 60).padStart(2, "0");
  return (
    <div className="l3-row">
      <div className="l3-timer" role="timer" aria-live="off">
        {m}:{sec}
      </div>
      <Btn
        variant="primary"
        onClick={() => {
          if (left === 0) setLeft(300);
          setRun((r) => !r);
        }}
      >
        {run ? "Pause" : left === 300 ? "Start 5-minute sprint" : "Resume"}
      </Btn>
      <Btn
        small
        onClick={() => {
          setRun(false);
          setLeft(300);
        }}
      >
        Reset
      </Btn>
    </div>
  );
}

function Spark() {
  const { s, up, toast } = useLab();
  const [fnId, setFnId, fn] = useFn();
  const [idea, setIdea] = useState("");
  const [open, setOpen] = useState("Substitute");
  const count = s.principles.filter((p) => p.fnId === fnId).length;
  const add = (text: string, effect = "") => {
    if (!fnId || !text.trim()) return;
    up((d) => addPrinciple(d, fnId, { text: text.trim(), effect }));
    toast("Added to the chart");
  };
  return (
    <>
      <Panel
        title="Idea Sprint"
        sub="Pick a function, set the timer, and type until it rings. No judging."
        tag="SPRINT"
        right={
          fnId ? (
            <Chip tone={count >= 5 ? "good" : "accent"}>{count} / 5 ideas</Chip>
          ) : undefined
        }
      >
        <FnPicker value={fnId} onChange={setFnId} />
        {fn && (
          <>
            <div style={{ margin: "12px 0" }}>
              <Timer
                onDone={() => toast("Time. Stop judging, start sketching.")}
              />
            </div>
            <div className="l3-row">
              <input
                className="l3-input l3-grow"
                value={idea}
                placeholder={`One idea for “${fn.name || "this function"}”…`}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    add(idea);
                    setIdea("");
                  }
                }}
              />
              <Btn
                variant="primary"
                disabled={!idea.trim()}
                onClick={() => {
                  add(idea);
                  setIdea("");
                }}
              >
                Add
              </Btn>
            </div>
            <ul
              style={{ margin: "10px 0 0", paddingLeft: 18 }}
              className="l3-small l3-mute"
            >
              {BRAINSTORM_RULES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}
      </Panel>
      {fn && (
        <Panel
          title="SCAMPER prompts"
          sub={`Seven questions about “${fn.name || "this function"}”. Click one for the next.`}
          tag="SCAMPER"
        >
          {SCAMPER.map((sc) => (
            <div
              key={sc.k}
              className="l3-scamper"
              role="button"
              tabIndex={0}
              onClick={() => setOpen(sc.k)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setOpen(sc.k);
              }}
              style={
                open === sc.k ? { borderColor: "var(--accent)" } : undefined
              }
            >
              <b>{sc.k}</b>
              <div>
                <span className={open === sc.k ? "" : "l3-mute"}>
                  {open === sc.k
                    ? sc.q(fn.name || "this function")
                    : "Tap to see the question"}
                </span>
                {open === sc.k && (
                  <div className="l3-hint">Slide example: {sc.slide}</div>
                )}
              </div>
            </div>
          ))}
        </Panel>
      )}
      {fn && (
        <Panel
          title="Ask nature"
          sub="Biological metaphors from the synectics slides. Add one as a starting principle."
          tag="NATURE"
        >
          <div className="l3-gauto">
            {METAPHORS.map((m) => (
              <div key={m.n} className="l3-card">
                <b>{m.n}</b>
                <p className="l3-small l3-mute">{m.d}</p>
                <div className="l3-row" style={{ marginTop: 6 }}>
                  <Chip>{m.effect}</Chip>
                  <Btn
                    small
                    onClick={() => add(`${m.n}-inspired: ${m.d}`, m.effect)}
                  >
                    Use
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}

function Effects() {
  const { s, up, toast } = useLab();
  const [fnId, setFnId] = useState("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const valid = s.fs.fns.some((f) => f.id === fnId)
    ? fnId
    : s.fs.fns[0]?.id || "";
  const list = EFFECTS.filter(
    (e) =>
      (!cat || e.cat === cat) &&
      (!q || (e.n + e.d + e.ex).toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <Panel
      title="Physical effect cards"
      sub={`${EFFECTS.length} effects. Search by function word (“hold”, “heat”, “sense”) or browse a category.`}
      tag="CATALOGUE"
    >
      <div className="l3-g3" style={{ marginBottom: 12 }}>
        <div className="l3-field">
          <label>Search</label>
          <input
            className="l3-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="hold, heat, sense, amplify…"
          />
        </div>
        <div className="l3-field">
          <label>Category</label>
          <select
            className="l3-select"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            <option value="">All</option>
            {EFFECT_CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <FnPicker value={valid} onChange={setFnId} />
      </div>
      {!list.length && <Empty>No effect matches. Try a broader word.</Empty>}
      <div className="l3-gauto">
        {list.map((e) => (
          <div key={e.n} className="l3-effcard">
            <div className="l3-row">
              <h4>{e.n}</h4>
              <Chip>{e.cat.split(" ")[0]}</Chip>
            </div>
            <p className="l3-small">{e.d}</p>
            <p className="l3-small l3-mute">Good for: {e.ex}</p>
            <Btn
              small
              disabled={!valid}
              onClick={() => {
                up((d) =>
                  addPrinciple(d, valid, { effect: e.n, text: `${e.n}: ` }),
                );
                toast(`Added “${e.n}” to the chart`);
              }}
            >
              + Use in chart
            </Btn>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Chart() {
  const { s, up, go } = useLab();
  const c = chartStats(s);
  const hasData = s.principles.length > 0;
  const effNames = EFFECTS.map((e) => e.n);
  return (
    <>
      <Panel
        title="Chart health"
        sub="Every row needs 5 or more principles, each a different effect, each sketched."
        tag="STATS"
      >
        <div className="l3-g3">
          <Meter
            label="Principles per row (target 5)"
            value={c.pctCount}
            tone="amber"
            note={`${Math.round(c.pctCount * 100)}%`}
          />
          <Meter label="Sketched" value={c.pctSketch} tone="green" />
          <Meter
            label="Distinct effects (3+ per row)"
            value={
              c.rows.length
                ? c.rows.filter((r) => r.effects >= 3).length / c.rows.length
                : 0
            }
            tone="violet"
          />
        </div>
        <div className="l3-row" style={{ marginTop: 8 }}>
          {hasData ? (
            <ConfirmBtn
              small
              label="Load slide example (impulse test rig)"
              confirm="Replace everything?"
              onConfirm={() => up((d) => loadRig(d))}
            />
          ) : (
            <Btn small onClick={() => up((d) => loadRig(d))}>
              Load slide example (impulse test rig)
            </Btn>
          )}
          <SlideRef p="104–113" />
        </div>
      </Panel>
      {!s.fs.fns.length ? (
        <Callout tone="warn" title="No functions yet">
          The chart has one row per function.{" "}
          <Btn small onClick={() => go("s2", "forge")}>
            Go to Step 2
          </Btn>
        </Callout>
      ) : (
        <div className="l3-morph">
          {c.rows.map((r, ri) => (
            <div key={r.fn.id} className="l3-mrow">
              <div className="l3-mfn">
                <span className="l3-mono l3-mute">ROW {ri + 1}</span>
                <b>{r.fn.name || "(unnamed)"}</b>
                {r.fn.aux && <Chip>aux</Chip>}
                <Meter
                  value={Math.min(r.count, 5) / 5}
                  tone={r.count >= 5 ? "green" : "amber"}
                  note={`${r.count}/5`}
                />
                <span className="l3-hint">
                  {r.effects} distinct effect{r.effects === 1 ? "" : "s"}
                </span>
              </div>
              {r.ps.map((p, ci) => {
                const gi = s.principles.findIndex((x) => x.id === p.id);
                const ok = !!p.effect && isSketched(p);
                return (
                  <div key={p.id} className={`l3-cell ${ok ? "ok" : ""}`}>
                    <span className="cn">
                      {ri + 1}.{ci + 1}
                    </span>
                    <textarea
                      className="l3-textarea"
                      style={{ minHeight: 56 }}
                      aria-label={`Principle ${ri + 1}.${ci + 1}`}
                      placeholder="Describe the idea…"
                      value={p.text}
                      onChange={(e) =>
                        up((d) => {
                          d.principles[gi]!.text = e.target.value;
                        })
                      }
                    />
                    <input
                      className="l3-input l3-s"
                      list="l3-effects"
                      placeholder="Physical effect…"
                      value={p.effect}
                      onChange={(e) =>
                        up((d) => {
                          d.principles[gi]!.effect = e.target.value;
                        })
                      }
                    />
                    <input
                      className="l3-input l3-s"
                      placeholder="Geometry / material…"
                      value={p.geometry}
                      onChange={(e) =>
                        up((d) => {
                          d.principles[gi]!.geometry = e.target.value;
                        })
                      }
                    />
                    <SketchThumb
                      value={p.sketch}
                      title={`Sketch ${ri + 1}.${ci + 1}`}
                      onChange={(u) =>
                        up((d) => {
                          d.principles[gi]!.sketch = u;
                        })
                      }
                    />
                    <div
                      className="l3-row"
                      style={{ justifyContent: "space-between" }}
                    >
                      <label className="l3-small l3-row" style={{ gap: 5 }}>
                        <input
                          type="checkbox"
                          checked={p.sketched}
                          onChange={(e) =>
                            up((d) => {
                              d.principles[gi]!.sketched = e.target.checked;
                            })
                          }
                        />
                        on paper
                      </label>
                      <button
                        className="l3-x"
                        aria-label="Delete principle"
                        onClick={() =>
                          up((d) => {
                            d.principles.splice(gi, 1);
                            Object.values(d.structures).forEach((st) => {
                              Object.keys(st.picks).forEach((k) => {
                                st.picks[k] = st.picks[k]!.filter(
                                  (x) => x !== p.id,
                                );
                              });
                            });
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                className="l3-cell add"
                onClick={() => up((d) => addPrinciple(d, r.fn.id))}
              >
                + principle
              </button>
            </div>
          ))}
          <datalist id="l3-effects">
            {effNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
      )}
      {c.rows.some((r) => r.count > 0 && r.effects === 1 && r.count >= 3) && (
        <Callout tone="warn" title="One effect repeated">
          At least one row uses a single physical effect many times. That is one
          idea in disguise.
        </Callout>
      )}
    </>
  );
}

export function Step3() {
  return (
    <StepShell n={3} tabs={TABS} defaultTab="learn">
      {(t) =>
        t === "spark" ? (
          <Spark />
        ) : t === "effects" ? (
          <Effects />
        ) : t === "chart" ? (
          <Chart />
        ) : (
          <Learn />
        )
      }
    </StepShell>
  );
}
