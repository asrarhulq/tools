"use client";
import { useState } from "react";
import { ATLAS, STEPS } from "./data";
import { funnel, nextMove, stepPct, stepStat } from "./derive";
import { useLab } from "./store";
import type { View } from "./types";
import { Btn, Callout, Icon, Panel, Ring } from "./ui";

export function Home() {
  const { s, go, pulse, pollUrl } = useLab();
  const nm = nextMove(s);
  const fun = funnel(s);
  const totalPct = STEPS.reduce((a, st) => a + stepPct(s, st.n) * st.pts, 0);
  const [q, setQ] = useState("");
  const atlas = ATLAS.filter(
    (a) => !q || (a.p + a.t).toLowerCase().includes(q.toLowerCase()),
  );
  const started = s.abs.statement || s.fs.fns.length || s.principles.length;
  const maxP = Math.max(1, ...(pulse || [0]));
  return (
    <div>
      <section className="l3-hero">
        <div>
          <div className="l3-eyebrow">ME 36400 · LAB 3 · CONCEPTUAL DESIGN</div>
          <h1 className="l3-h1">Mission control for your concept.</h1>
          <p className="l3-lead">
            Six steps from a requirements list to one principal solution, built
            on the Pahl &amp; Beitz method from the course slides. Do a step,
            see what it unlocks, and always know the next move.
          </p>
          <div className="l3-row">
            <Btn
              variant="primary"
              onClick={() =>
                go(
                  started ? (nm.primary.view as View) : "s1",
                  started ? nm.primary.tab : "learn",
                )
              }
            >
              {started ? "Continue where I left off" : "Start Step 1"}{" "}
              <Icon n="arrow" />
            </Btn>
            <Btn onClick={() => go("locator")}>Where am I?</Btn>
            <Btn onClick={() => go("stuck")}>I’m stuck</Btn>
          </div>
        </div>
        <div
          className="l3-card"
          aria-label="Overall progress"
          style={{ display: "flex", gap: 16, alignItems: "center" }}
        >
          <Ring pct={totalPct / 100} size={92} stroke={7}>
            {Math.round(totalPct)}%
          </Ring>
          <div>
            <div className="l3-eyebrow">
              LAB COMPLETENESS (by rubric weight)
            </div>
            <p className="l3-small l3-mute">
              Checklist progress weighted by the points each part is worth (A 10
              · B 20 · C 20 · D 20 · E 20 · F 10). A planning aid, not a grade.
            </p>
          </div>
        </div>
      </section>

      <div className="l3-nm" style={{ marginBottom: 20 }}>
        <div className="l3-grow">
          <div className="l3-eyebrow">IF YOU DID THIS → WHAT NEXT</div>
          <h3 className="l3-h3" style={{ marginTop: 4 }}>
            {nm.primary.label}
          </h3>
          <p className="l3-small l3-mute">{nm.primary.why}</p>
        </div>
        <Btn
          variant="primary"
          onClick={() => go(nm.primary.view as View, nm.primary.tab)}
        >
          Go <Icon n="arrow" />
        </Btn>
      </div>

      <div className="l3-map" role="list">
        {STEPS.map((st) => {
          const p = stepPct(s, st.n);
          return (
            <button
              key={st.n}
              role="listitem"
              className={`l3-node ${s.current === st.n ? "here" : ""}`}
              style={{ ["--c" as string]: st.color }}
              onClick={() => go(`s${st.n}` as View)}
            >
              {s.current === st.n && <span className="you">YOU ARE HERE</span>}
              <div
                className="l3-row"
                style={{ justifyContent: "space-between" }}
              >
                <span className="n">{st.n}</span>
                <Ring pct={p} size={40} stroke={4} color={st.color}>
                  {Math.round(p * 100)}
                </Ring>
              </div>
              <b>{st.name}</b>
              <small>{st.tool}</small>
              <small>{st.blurb}</small>
              <span className="stat">
                {stepStat(s, st.n)} · {st.pts} pts · App. {st.app}
              </span>
            </button>
          );
        })}
      </div>

      <Panel
        title="The idea funnel"
        sub="Your project narrows from one problem to many ideas, then back to one concept. Ghost circles are still to come."
        tag="FUNNEL"
      >
        <div
          className="l3-funnel"
          role="img"
          aria-label="Funnel of counts per step"
        >
          {fun.map((f, i) => {
            const size =
              34 + Math.min(1, Math.log(f.n + 1) / Math.log(40)) * 56;
            const st = STEPS[i]!;
            return (
              <div
                key={i}
                className={`l3-fn ${f.ghost ? "ghost" : ""}`}
                style={{ ["--c" as string]: st.color }}
              >
                <div
                  className="bubble"
                  style={{
                    width: size,
                    height: size,
                    background: st.color,
                    fontSize: 13 + size / 14,
                  }}
                >
                  {f.n}
                </div>
                <small>
                  {
                    [
                      "problem",
                      "functions",
                      "principles",
                      "structures",
                      "survivors",
                      "concept",
                    ][i]
                  }
                </small>
              </div>
            );
          })}
        </div>
      </Panel>

      {pollUrl && (
        <Panel
          title="Where the class is right now"
          sub="Live from your class poll. Everyone sees which step peers are on."
          tag="CLASS PULSE"
        >
          {pulse ? (
            <div className="l3-pulse">
              {STEPS.map((st, i) => (
                <div key={st.n} style={{ ["--c" as string]: st.color }}>
                  <b>{pulse[i] || 0}</b>
                  <i
                    style={{ height: `${((pulse[i] || 0) / maxP) * 60 + 3}px` }}
                  />
                  <span>{st.n}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="l3-mute">Connecting…</p>
          )}
        </Panel>
      )}

      <Panel
        title="Slide atlas"
        sub="Find the slide, find the tool. Page numbers refer to the ME 36400 conceptual-design slide PDF."
        tag="SLIDES"
      >
        <input
          className="l3-input"
          style={{ marginBottom: 10 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a slide topic or page: “morphological”, “datum”, “94”…"
          aria-label="Search slides"
        />
        <div className="l3-atlas">
          {atlas.map((a) => (
            <button
              key={a.p + a.t}
              className="l3-ar"
              onClick={() =>
                a.step ? go(`s${a.step}` as View, a.tab) : go("home")
              }
            >
              <span className="pg">p.{a.p}</span>
              <span className="l3-grow">{a.t}</span>
              {a.step > 0 && (
                <span
                  className="l3-chip"
                  style={{
                    borderColor: STEPS[a.step - 1]!.color,
                    color: STEPS[a.step - 1]!.color,
                  }}
                >
                  Step {a.step}
                </span>
              )}
            </button>
          ))}
          {!atlas.length && <p className="l3-mute">No slide topic matches.</p>}
        </div>
      </Panel>
      <Callout tone="info" title="Your work is saved in this browser">
        Everything you type stays in this browser on this device. Use{" "}
        <b>Vault → Backup</b> to move it to another device or hand it to a
        teammate.
      </Callout>
    </div>
  );
}
