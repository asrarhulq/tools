"use client";
import { useState } from "react";
import { codeOf, meritOf, principlesOf, survivors, weightsOf } from "./derive";
import { fmt } from "./types";
import { Sketch } from "./sketch";
import { StepShell } from "./shell";
import { useLab } from "./store";
import { Btn, Callout, Chip, Meter, Panel, SlideRef, Tip } from "./ui";

const TABS = [
  { id: "studio", label: "Studio" },
  { id: "calc", label: "Feasibility calculators" },
  { id: "sketch", label: "Detailed sketch" },
];

function Studio() {
  const { s, up, go } = useLab();
  const surv = survivors(s);
  const ranked = [
    ...meritOf(
      s,
      surv.map((x) => x.id),
      weightsOf(s),
    ),
  ].sort((a, b) => b.merit - a.merit);
  const chosen = s.structures.find((x) => x.id === s.final.structId);
  const draftWalk = () =>
    up((d) => {
      const st = d.structures.find((x) => x.id === d.final.structId);
      if (!st) return;
      d.fs.fns.forEach((fn) => {
        const ids = st.picks[fn.id] || [];
        const ps = d.principles.filter((p) => ids.includes(p.id));
        d.final.walk[fn.id] = ps.length
          ? `${fn.name || "This function"} is done by ${ps.map((p) => p.text.replace(/^[^:]*:\s*/, "") || p.effect || "an unnamed principle").join(", then ")}${ps.some((p) => p.effect) ? ` (effect: ${Array.from(new Set(ps.map((p) => p.effect).filter(Boolean))).join(", ")})` : ""}.`
          : "";
      });
    });
  if (!s.structures.length)
    return (
      <Callout tone="warn" title="Nothing to firm up yet">
        Steps 4 and 5 produce the winner.{" "}
        <Btn small onClick={() => go("s4", "weave")}>
          Go to Step 4
        </Btn>
      </Callout>
    );
  return (
    <>
      <Panel
        title="Pick the principal solution"
        sub="Usually the Step 5 winner. If you override it, say why in your report."
        tag="WINNER"
      >
        <div className="l3-g2">
          <div className="l3-field">
            <label>Chosen structure</label>
            <select
              className="l3-select"
              value={s.final.structId}
              onChange={(e) =>
                up((d) => {
                  d.final.structId = e.target.value;
                })
              }
            >
              <option value="">Select…</option>
              {s.structures.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <div className="l3-field">
            <label>Ranking from Step 5</label>
            <div className="l3-row">
              {ranked.length ? (
                ranked.map((r, i) => (
                  <Chip key={r.id} tone={i === 0 ? "good" : ""}>
                    {i + 1}. {s.structures.find((x) => x.id === r.id)?.name}{" "}
                    {fmt(r.merit, 2)}
                  </Chip>
                ))
              ) : (
                <span className="l3-mute">no matrix yet</span>
              )}
            </div>
          </div>
        </div>
        {chosen && (
          <p className="l3-small l3-mute" style={{ marginTop: 8 }}>
            Path: <span className="l3-code">{codeOf(s, chosen)}</span>
          </p>
        )}
      </Panel>
      {chosen && (
        <>
          <Panel
            title="One-sentence summary"
            sub="How it works, by what physical effect."
            tag="SUMMARY"
          >
            <textarea
              className="l3-textarea"
              value={s.final.summary}
              placeholder="e.g. A flywheel stores kinetic energy that a controlled brake releases into the shaft as a short torque pulse."
              onChange={(e) =>
                up((d) => {
                  d.final.summary = e.target.value;
                })
              }
            />
          </Panel>
          <Panel
            title="Walk through the function structure"
            sub="One sentence per function: what principle does it and how."
            tag="WALK"
            right={
              <Btn small onClick={draftWalk}>
                Auto-draft from my picks
              </Btn>
            }
          >
            {s.fs.fns.map((fn) => {
              const ps = principlesOf(s, fn.id).filter((p) =>
                (chosen.picks[fn.id] || []).includes(p.id),
              );
              return (
                <div
                  key={fn.id}
                  className="l3-field"
                  style={{ marginBottom: 8 }}
                >
                  <label>
                    {fn.name || "(unnamed)"}
                    {ps.length
                      ? ` · ${ps.map((p) => p.effect || "–").join(", ")}`
                      : ""}
                  </label>
                  <input
                    className="l3-input"
                    value={s.final.walk[fn.id] || ""}
                    onChange={(e) =>
                      up((d) => {
                        d.final.walk[fn.id] = e.target.value;
                      })
                    }
                  />
                </div>
              );
            })}
          </Panel>
          <div className="l3-g2">
            <Panel
              title="Rough numbers"
              sub="Forces, sizes, speeds. Use the calculators."
              tag="NUMBERS"
            >
              <textarea
                className="l3-textarea"
                style={{ minHeight: 120 }}
                value={s.final.numbers}
                placeholder="Peak torque ≈ 40 N·m at the specimen…"
                onChange={(e) =>
                  up((d) => {
                    d.final.numbers = e.target.value;
                  })
                }
              />
              <Btn small onClick={() => go("s6", "calc")}>
                Open calculators
              </Btn>
            </Panel>
            <Panel
              title="Demands check"
              sub="Which demands from the requirements list does it meet?"
              tag="DEMANDS"
            >
              <textarea
                className="l3-textarea"
                style={{ minHeight: 120 }}
                value={s.final.demands}
                onChange={(e) =>
                  up((d) => {
                    d.final.demands = e.target.value;
                  })
                }
              />
            </Panel>
          </div>
          <Panel
            title="Weak points"
            sub="What would you fix in Embodiment Design? Honest weak points score better than silence."
            tag="RISKS"
          >
            <textarea
              className="l3-textarea"
              value={s.final.weak}
              placeholder="Brake wear; alignment between flywheel and specimen; sensor noise at impact."
              onChange={(e) =>
                up((d) => {
                  d.final.weak = e.target.value;
                })
              }
            />
          </Panel>
          <Panel
            title="Looking beyond the lab"
            sub="Slides: Step 7 (technical and economic evaluation) is not graded in Lab 3."
            tag="STEP 7"
          >
            <p className="l3-small l3-mute">
              In Pahl &amp; Beitz, step 7 checks the principal solution on cost
              and technical risk before embodiment. If you have time, add one
              sentence on each.
            </p>
          </Panel>
        </>
      )}
    </>
  );
}

interface V {
  k: string;
  label: string;
  unit: string;
  def: number;
}
function Calc({
  title,
  tag,
  vars,
  formula,
  explain,
  run,
  unit,
}: {
  title: string;
  tag: string;
  vars: V[];
  formula: string;
  explain: string;
  run: (v: Record<string, number>) => number;
  unit: string;
}) {
  const { up, toast } = useLab();
  const [v, setV] = useState<Record<string, number>>(() =>
    Object.fromEntries(vars.map((x) => [x.k, x.def])),
  );
  const out = run(v);
  return (
    <Panel title={title} tag={tag}>
      <p className="l3-small">
        <span className="l3-code">{formula}</span>
      </p>
      <p className="l3-small l3-mute" style={{ margin: "6px 0 10px" }}>
        {explain}
      </p>
      <div className="l3-g3">
        {vars.map((x) => (
          <div key={x.k} className="l3-field">
            <label>
              {x.k} · {x.label}
            </label>
            <div className="l3-row" style={{ gap: 4 }}>
              <input
                className="l3-input"
                type="number"
                value={v[x.k]}
                onChange={(e) =>
                  setV((o) => ({ ...o, [x.k]: Number(e.target.value) }))
                }
              />
              <span className="l3-mute l3-small">{x.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="l3-row" style={{ marginTop: 10 }}>
        <div className="l3-timer" style={{ fontSize: 28 }}>
          {Number.isFinite(out) ? Number(out.toPrecision(4)) : "–"}{" "}
          <small className="l3-mute" style={{ fontSize: 14 }}>
            {unit}
          </small>
        </div>
        <Btn
          small
          onClick={() => {
            up((d) => {
              d.final.numbers =
                (d.final.numbers ? d.final.numbers + "\n" : "") +
                `${title}: ${Number.isFinite(out) ? Number(out.toPrecision(4)) : "?"} ${unit} (${vars.map((x) => `${x.k}=${v[x.k]} ${x.unit}`).join(", ")})`;
            });
            toast("Added to rough numbers");
          }}
        >
          Add to my numbers
        </Btn>
      </div>
    </Panel>
  );
}

function Calcs() {
  return (
    <>
      <Callout tone="info" title="Order-of-magnitude is enough">
        Lab 3 wants believable rough numbers, not detailed design. Each
        calculator names every symbol.
      </Callout>
      <div className="l3-split">
        <div>
          <Calc
            title="Torque from a force"
            tag="T = F·r"
            vars={[
              { k: "F", label: "force", unit: "N", def: 100 },
              {
                k: "r",
                label: "arm length (perpendicular distance)",
                unit: "m",
                def: 0.2,
              },
            ]}
            formula="T = F × r"
            explain="Torque T is how hard something is twisted. It equals the force F times the distance r from the pivot. Longer arm, easier twist."
            run={(v) => v.F! * v.r!}
            unit="N·m"
          />
          <Calc
            title="Lever force amplification"
            tag="LEVER"
            vars={[
              { k: "Fin", label: "input force", unit: "N", def: 50 },
              { k: "Lin", label: "input arm", unit: "mm", def: 400 },
              { k: "Lout", label: "output arm", unit: "mm", def: 80 },
            ]}
            formula="Fout = Fin × (Lin / Lout)"
            explain="Around a pivot, force times arm length is balanced on both sides. A long input arm and short output arm multiplies force (and divides distance)."
            run={(v) => v.Fin! * (v.Lin! / v.Lout!)}
            unit="N"
          />
          <Calc
            title="Mechanical power"
            tag="P = T·ω"
            vars={[
              { k: "T", label: "torque", unit: "N·m", def: 10 },
              { k: "n", label: "speed", unit: "rpm", def: 300 },
            ]}
            formula="P = T × ω, ω = 2π·n / 60"
            explain="Power P is how fast energy is delivered. ω (omega) is rotation speed in radians per second, found from rpm n. More torque or more speed means more power."
            run={(v) => (v.T! * (2 * Math.PI * v.n!)) / 60}
            unit="W"
          />
        </div>
        <div>
          <Calc
            title="Spring energy"
            tag="½kx²"
            vars={[
              { k: "k", label: "spring stiffness", unit: "N/m", def: 2000 },
              { k: "x", label: "compression or stretch", unit: "m", def: 0.05 },
            ]}
            formula="E = ½ · k · x²"
            explain="A spring stores energy E when squeezed or stretched by x. Stiffer spring (k) or bigger stretch stores more; doubling x quadruples E."
            run={(v) => 0.5 * v.k! * v.x! * v.x!}
            unit="J"
          />
          <Calc
            title="Flywheel energy (solid disc)"
            tag="½Iω²"
            vars={[
              { k: "m", label: "mass", unit: "kg", def: 5 },
              { k: "r", label: "radius", unit: "m", def: 0.1 },
              { k: "n", label: "speed", unit: "rpm", def: 3000 },
            ]}
            formula="I = ½·m·r², E = ½·I·ω², ω = 2π·n / 60"
            explain="I (moment of inertia) says how hard it is to change the disc’s spin. ω is the spin rate. Stored kinetic energy E grows with the square of speed."
            run={(v) => {
              const I = 0.5 * v.m! * v.r! * v.r!;
              const w = (2 * Math.PI * v.n!) / 60;
              return 0.5 * I * w * w;
            }}
            unit="J"
          />
          <Calc
            title="Hydraulic force multiplication"
            tag="PASCAL"
            vars={[
              { k: "F1", label: "force on small piston", unit: "N", def: 100 },
              { k: "d1", label: "small piston diameter", unit: "mm", def: 20 },
              { k: "d2", label: "large piston diameter", unit: "mm", def: 60 },
            ]}
            formula="F2 = F1 × (d2 / d1)²"
            explain="Pressure is the same everywhere in the fluid. Area grows with diameter squared, so a piston 3× wider pushes 9× harder."
            run={(v) => v.F1! * Math.pow(v.d2! / v.d1!, 2)}
            unit="N"
          />
        </div>
      </div>
    </>
  );
}

function SketchTab() {
  const { s, up } = useLab();
  return (
    <>
      <Panel
        title="Detailed sketch of the principal solution"
        sub="Show HOW it works: a cross-section or exploded view. Label parts, forces and motions, add a couple of rough sizes."
        tag="APPENDIX F"
      >
        <Sketch
          value={s.final.sketch}
          onChange={(u) =>
            up((d) => {
              d.final.sketch = u;
            })
          }
          label="Principal solution sketch"
        />
        <label className="l3-row l3-small" style={{ marginTop: 10 }}>
          <input
            type="checkbox"
            checked={!!s.checks["f-sk-paper"]}
            onChange={(e) =>
              up((d) => {
                d.checks["f-sk-paper"] = e.target.checked;
              })
            }
          />{" "}
          My detailed sketch is on paper / in my report instead
        </label>
      </Panel>
      <Tip>
        Photo of a paper sketch works: use “Import photo”, then add labels on
        top. Exterior views alone lose points: show the inside.
      </Tip>
    </>
  );
}

export function Step6() {
  const { s } = useLab();
  void s;
  void Meter;
  void SlideRef;
  return (
    <StepShell n={6} tabs={TABS} defaultTab="studio">
      {(t) =>
        t === "calc" ? <Calcs /> : t === "sketch" ? <SketchTab /> : <Studio />
      }
    </StepShell>
  );
}
