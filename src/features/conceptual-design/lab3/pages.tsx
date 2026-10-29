"use client";
import { useState } from "react";
import { LOCATOR, SCENARIOS, STEPS } from "./data";
import { useLab } from "./store";
import type { View } from "./types";
import { Btn, Callout, Chip, Empty, Panel } from "./ui";

export function Locator() {
  const { go } = useLab();
  const [i, setI] = useState(0);
  const [res, setRes] = useState<null | {
    step: number;
    tab: string;
    msg: string;
  }>(null);
  const done = !res && i >= LOCATOR.length;
  const answer = (yes: boolean) => {
    if (yes) setI(i + 1);
    else setRes(LOCATOR[i]!.no);
  };
  return (
    <Panel
      title="Where am I?"
      sub="Answer honestly. The first “no” is where to work next."
      tag="LOCATOR"
    >
      {res ? (
        <div className="l3-col">
          <Callout
            tone="good"
            title={`You are in Step ${res.step}: ${STEPS[res.step - 1]!.name}`}
          >
            {res.msg}
          </Callout>
          <div className="l3-row">
            <Btn
              variant="primary"
              onClick={() => go(`s${res.step}` as View, res.tab)}
            >
              Open {STEPS[res.step - 1]!.tool}
            </Btn>
            <Btn
              onClick={() => {
                setRes(null);
                setI(0);
              }}
            >
              Start over
            </Btn>
          </div>
        </div>
      ) : done ? (
        <div className="l3-col">
          <Callout tone="good" title="Everything is in place">
            Time to assemble your report. Print the appendices and write the
            main body.
          </Callout>
          <Btn variant="primary" onClick={() => go("vault", "A")}>
            Open the Vault
          </Btn>
        </div>
      ) : (
        <div className="l3-col">
          <div className="l3-eyebrow">
            QUESTION {i + 1} OF {LOCATOR.length}
          </div>
          <p style={{ fontSize: 20, lineHeight: 1.35 }}>{LOCATOR[i]!.q}</p>
          <div className="l3-row">
            <Btn variant="primary" onClick={() => answer(true)}>
              Yes
            </Btn>
            <Btn onClick={() => answer(false)}>Not yet</Btn>
            {i > 0 && (
              <Btn variant="quiet" onClick={() => setI(i - 1)}>
                Back
              </Btn>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

export function Stuck() {
  const { go } = useLab();
  const [q, setQ] = useState("");
  const [step, setStep] = useState(-1);
  const [open, setOpen] = useState("");
  const list = SCENARIOS.filter(
    (x) =>
      (step < 0 || x.step === step || x.step === 0) &&
      (!q || (x.q + x.a).toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <Panel
      title="I’m stuck"
      sub="Common sticking points, with the fix and a button that opens the right tool."
      tag="HELP"
    >
      <div className="l3-row" style={{ marginBottom: 10 }}>
        <input
          className="l3-input l3-grow"
          style={{ minWidth: 220 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search: “datum”, “weights”, “sketch”…"
          aria-label="Search help"
        />
        <Btn small pressed={step < 0} onClick={() => setStep(-1)}>
          All
        </Btn>
        {STEPS.map((st) => (
          <Btn
            key={st.n}
            small
            pressed={step === st.n}
            onClick={() => setStep(st.n)}
          >
            Step {st.n}
          </Btn>
        ))}
      </div>
      {!list.length && (
        <Empty>
          Nothing matches. Ask your TA, and say which step you are on.
        </Empty>
      )}
      <div className="l3-col">
        {list.map((x) => (
          <div key={x.id} className="l3-card">
            <button
              className="l3-row"
              style={{
                width: "100%",
                background: "none",
                border: 0,
                textAlign: "left",
                padding: 0,
              }}
              aria-expanded={open === x.id}
              onClick={() => setOpen(open === x.id ? "" : x.id)}
            >
              <Chip tone="accent">{x.step ? `Step ${x.step}` : "General"}</Chip>
              <b className="l3-grow">{x.q}</b>
              <span>{open === x.id ? "–" : "+"}</span>
            </button>
            {open === x.id && (
              <div className="l3-col" style={{ marginTop: 8 }}>
                <p>{x.a}</p>
                <div className="l3-row">
                  {x.go.map((g, i) => (
                    <Btn
                      key={i}
                      small
                      variant="primary"
                      onClick={() => go(g.view as View, g.tab || "")}
                    >
                      {g.label}
                    </Btn>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
