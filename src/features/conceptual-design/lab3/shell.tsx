"use client";
import React, { useState } from "react";
import { STEPS, SCENARIOS } from "./data";
import { advice, stepPct } from "./derive";
import { useLab } from "./store";
import type { View } from "./types";
import { Btn, Callout, Chip, Icon, Ring, SlideRef, Stamp, Tabs } from "./ui";

export function NextPanel({ n }: { n: number }) {
  const { s, up, go } = useLab();
  const a = advice(s, n);
  const [openSc, setOpenSc] = useState<string>("");
  const sc = SCENARIOS.filter((x) => x.step === n);
  const meta = STEPS[n - 1]!;
  return (
    <section className="l3-next" aria-label={`What next after step ${n}`}>
      <header className="l3-nh">
        <div>
          <div className="l3-eyebrow">IF YOU DID THIS → WHAT NEXT</div>
          <h3 className="l3-h3">
            Checkpoint · Step {n}: {meta.name}
          </h3>
        </div>
        <div className="l3-nring">
          <Ring pct={a.pct} size={54} color={meta.color}>
            {Math.round(a.pct * 100)}
          </Ring>
        </div>
      </header>

      {a.ready && (
        <div className="l3-cleared">
          <Stamp text="STEP CLEARED" />
          <p>Everything on this list is done. Advance, or keep polishing.</p>
        </div>
      )}

      <ul className="l3-ck">
        {a.items.map((it) => (
          <li key={it.id} className={it.ok ? "ok" : ""}>
            {it.auto ? (
              <span
                className={`l3-tick${it.ok ? "on" : ""}`}
                aria-label={it.ok ? "done" : "not done"}
              >
                {it.ok ? <Icon n="check" /> : <Icon n="dot" />}
              </span>
            ) : (
              <label className="l3-cbx">
                <input
                  type="checkbox"
                  checked={!!s.checks[it.id]}
                  onChange={(e) =>
                    up((d) => {
                      d.checks[it.id] = e.target.checked;
                    })
                  }
                />
                <span className="l3-box" aria-hidden="true">
                  {s.checks[it.id] ? <Icon n="check" /> : null}
                </span>
              </label>
            )}
            <div className="l3-ckt">
              <b>{it.label}</b>
              {!it.ok && <small>{it.hint}</small>}
            </div>
            {!it.ok && it.fix && (
              <Btn small onClick={() => go(it.fix!.view as View, it.fix!.tab)}>
                Fix <Icon n="arrow" />
              </Btn>
            )}
          </li>
        ))}
      </ul>

      {a.upstream.map((u, i) => (
        <Callout
          key={i}
          tone="warn"
          title={`Heads-up: Step ${u.step} needs attention`}
        >
          <p>{u.text}</p>
          <Btn small onClick={() => go(u.go.view as View, u.go.tab)}>
            Go back to Step {u.step}
          </Btn>
        </Callout>
      ))}

      <div className="l3-cta">
        <div>
          <b>Recommended next move</b>
          <p>{a.primary.why}</p>
        </div>
        <Btn
          variant="primary"
          onClick={() => go(a.primary.view as View, a.primary.tab)}
        >
          {a.primary.label} <Icon n="arrow" />
        </Btn>
      </div>

      {sc.length > 0 && (
        <div className="l3-branch">
          <div className="l3-eyebrow">SOMETHING WENT SIDEWAYS?</div>
          <div className="l3-bchips">
            {sc.map((x) => (
              <button
                key={x.id}
                className={`l3-bchip${openSc === x.id ? "on" : ""}`}
                onClick={() => setOpenSc(openSc === x.id ? "" : x.id)}
              >
                {x.q}
              </button>
            ))}
          </div>
          {sc
            .filter((x) => x.id === openSc)
            .map((x) => (
              <div key={x.id} className="l3-branch-a">
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
            ))}
        </div>
      )}
    </section>
  );
}

export function StepShell({
  n,
  tabs,
  defaultTab,
  children,
}: {
  n: number;
  tabs: { id: string; label: string; badge?: string }[];
  defaultTab: string;
  children: (tab: string) => React.ReactNode;
}) {
  const { s, nav, go } = useLab();
  const meta = STEPS[n - 1]!;
  const active = tabs.some((t) => t.id === nav.tab) ? nav.tab : defaultTab;
  const pct = stepPct(s, n);
  return (
    <div className="l3-step" style={{ ["--accent" as string]: meta.color }}>
      <header className="l3-sh">
        <div className="l3-numeral" aria-hidden="true">
          {n}
        </div>
        <div className="l3-sht">
          <div className="l3-eyebrow">
            STEP {n} OF 6 · {meta.tool.toUpperCase()}
          </div>
          <h2 className="l3-h2">{meta.name}</h2>
          <p className="l3-lead">{meta.blurb}</p>
          <div className="l3-row">
            <Chip tone="accent">{meta.pts} pts</Chip>
            <Chip>Appendix {meta.app}</Chip>
            <SlideRef p={meta.slides.replace("PDF p.", "")} />
          </div>
        </div>
        <Ring pct={pct} size={64} stroke={5} color={meta.color}>
          {Math.round(pct * 100)}%
        </Ring>
      </header>
      <Tabs
        tabs={tabs}
        active={active}
        onChange={(id) => go(`s${n}` as View, id, false)}
      />
      <div className="l3-tabbody">{children(active)}</div>
      <NextPanel n={n} />
    </div>
  );
}
