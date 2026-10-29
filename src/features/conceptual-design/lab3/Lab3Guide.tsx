"use client";
import { useEffect, useMemo, useState } from "react";
import { ATLAS, SCENARIOS, STEPS } from "./data";
import { stepPct } from "./derive";
import { Home } from "./home";
import { Locator, Stuck } from "./pages";
import { Paper, APP_IDS } from "./report";
import { Step1 } from "./step1";
import { Step2 } from "./step2";
import { Step3 } from "./step3";
import { Step4 } from "./step4";
import { Step5 } from "./step5";
import { Step6 } from "./step6";
import { LabProvider, useLab } from "./store";
import { CSS } from "./styles";
import type { View } from "./types";
import { Vault } from "./vault";

export interface Lab3GuideProps {
  /** Optional class-poll endpoint (GET returns {counts:number[6]}, POST {clientId, step}). Leave out to disable. */
  pollUrl?: string;
  /** localStorage key. Change it if you host two copies on one origin. */
  storageKey?: string;
  /** Small title in the top bar. */
  title?: string;
}

interface Cmd {
  label: string;
  hint: string;
  run: () => void;
}

function Palette({ onClose }: { onClose: () => void }) {
  const { go } = useLab();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const all = useMemo<Cmd[]>(
    () => [
      { label: "Home · mission map", hint: "view", run: () => go("home") },
      { label: "Where am I?", hint: "view", run: () => go("locator") },
      { label: "I’m stuck", hint: "view", run: () => go("stuck") },
      {
        label: "Vault · appendices and backup",
        hint: "view",
        run: () => go("vault", "A"),
      },
      ...STEPS.map((st) => ({
        label: `Step ${st.n} · ${st.name} (${st.tool})`,
        hint: "step",
        run: () => go(`s${st.n}` as View),
      })),
      ...ATLAS.map((a) => ({
        label: `Slide p.${a.p} · ${a.t}`,
        hint: "slide",
        run: () => (a.step ? go(`s${a.step}` as View, a.tab) : go("home")),
      })),
      ...SCENARIOS.map((x) => ({
        label: x.q,
        hint: "help",
        run: () => go("stuck"),
      })),
    ],
    [go],
  );
  const list = all
    .filter((c) => !q || c.label.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 40);
  const run = (c?: Cmd) => {
    if (c) {
      c.run();
      onClose();
    }
  };
  return (
    <div
      className="l3-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Jump to…"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="l3-pal">
        <input
          autoFocus
          className="l3-input"
          placeholder="Jump to a step, a slide, or a problem…"
          value={q}
          aria-label="Search"
          onChange={(e) => {
            setQ(e.target.value);
            setI(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setI((x) => Math.min(list.length - 1, x + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setI((x) => Math.max(0, x - 1));
            } else if (e.key === "Enter") run(list[i]);
            else if (e.key === "Escape") onClose();
          }}
        />
        <div className="l3-pl" role="listbox">
          {list.map((c, k) => (
            <button
              key={c.label + k}
              role="option"
              aria-selected={k === i}
              className={`l3-pi ${k === i ? "on" : ""}`}
              onMouseEnter={() => setI(k)}
              onClick={() => run(c)}
            >
              {c.label}
              <small>{c.hint}</small>
            </button>
          ))}
          {!list.length && (
            <p className="l3-mute" style={{ padding: 12 }}>
              Nothing found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Shell({ title }: { title: string }) {
  const { s, nav, go, saved, printApp, setPrintApp, toastMsg } = useLab();
  const [pal, setPal] = useState(false);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPal((p) => !p);
      } else if (e.key === "Escape") setPal(false);
    };
    const ap = () => setPrintApp(null);
    window.addEventListener("keydown", k);
    window.addEventListener("afterprint", ap);
    return () => {
      window.removeEventListener("keydown", k);
      window.removeEventListener("afterprint", ap);
    };
  }, [setPrintApp]);
  const accent = /^s[1-6]$/.test(nav.view)
    ? STEPS[Number(nav.view[1]) - 1]!.color
    : "#2F5D50";
  const body = (() => {
    switch (nav.view) {
      case "s1":
        return <Step1 />;
      case "s2":
        return <Step2 />;
      case "s3":
        return <Step3 />;
      case "s4":
        return <Step4 />;
      case "s5":
        return <Step5 />;
      case "s6":
        return <Step6 />;
      case "vault":
        return <Vault />;
      case "stuck":
        return <Stuck />;
      case "locator":
        return <Locator />;
      default:
        return <Home />;
    }
  })();
  return (
    <div className="l3-root" style={{ ["--accent" as string]: accent }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="l3-top">
        <div className="l3-topin">
          <button
            className="l3-brand"
            onClick={() => go("home")}
            aria-label="Home"
          >
            <span className="l3-logo">L3</span>
            <span>
              <b>{title}</b>
              <small>conceptual design guide</small>
            </span>
          </button>
          <nav className="l3-nav" aria-label="Steps">
            {STEPS.map((st) => {
              const p = stepPct(s, st.n);
              return (
                <button
                  key={st.n}
                  className={`l3-pill ${nav.view === `s${st.n}` ? "on" : ""} ${p >= 1 ? "done" : ""}`}
                  style={{
                    ["--c" as string]: st.color,
                    ["--accent" as string]: st.color,
                  }}
                  onClick={() => go(`s${st.n}` as View)}
                  aria-label={`Step ${st.n}: ${st.name}`}
                >
                  <i>{p >= 1 ? "✓" : st.n}</i>
                  {st.name}
                </button>
              );
            })}
            <button
              className={`l3-pill ${nav.view === "vault" ? "on" : ""}`}
              onClick={() => go("vault", "A")}
            >
              Vault
            </button>
            <button
              className={`l3-pill ${nav.view === "stuck" ? "on" : ""}`}
              onClick={() => go("stuck")}
            >
              Stuck?
            </button>
          </nav>
          <div className="l3-topr">
            <button
              className="l3-btn l3-sm"
              onClick={() => setPal(true)}
              aria-label="Jump to"
            >
              <span>Jump</span> <span className="l3-kbd">Ctrl K</span>
            </button>
            <span
              className={`l3-save ${saved === "err" ? "err" : ""}`}
              aria-live="polite"
            >
              {saved === "ok" ? "saved" : saved === "err" ? "not saving" : ""}
            </span>
          </div>
        </div>
      </header>
      <main className="l3-main">{body}</main>
      <div className="l3-foot">
        Built from the ME 36400 conceptual-design slides and the Lab 3 handout.
        Check the official handout for the final rubric.
      </div>
      {pal && <Palette onClose={() => setPal(false)} />}
      {toastMsg && (
        <div className="l3-toast" role="status">
          {toastMsg}
        </div>
      )}
      {printApp && (
        <div className="l3-printarea">
          {(printApp === "ALL"
            ? [...APP_IDS]
            : [printApp as (typeof APP_IDS)[number]]
          ).map((id) => (
            <Paper key={id} id={id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Lab3Guide({
  pollUrl,
  storageKey = "lab3-guide:v1",
  title = "ME 36400 · Lab 3",
}: Lab3GuideProps) {
  return (
    <LabProvider storageKey={storageKey} pollUrl={pollUrl}>
      <Shell title={title} />
    </LabProvider>
  );
}
export default Lab3Guide;
