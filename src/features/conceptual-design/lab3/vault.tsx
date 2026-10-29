"use client";
import { useState } from "react";
import { STEPS } from "./data";
import { download } from "./export";
import { APP_IDS, Paper, appendixMd, mainBodyMd } from "./report";
import type { AppId } from "./report";
import { stepPct } from "./derive";
import { useLab } from "./store";
import { Btn, Callout, Chip, ConfirmBtn, CopyBtn, Panel, Tabs } from "./ui";

export function Vault() {
  const { s, nav, go, setPrintApp, exportJson, importJson, resetAll, toast } =
    useLab();
  const tabs = [
    ...APP_IDS.map((a) => ({ id: a, label: `App. ${a}` })),
    { id: "draft", label: "Report draft" },
    { id: "backup", label: "Backup" },
  ];
  const tab = tabs.some((t) => t.id === nav.tab) ? nav.tab : "A";
  const [imp, setImp] = useState("");
  const print = (a: string) => {
    setPrintApp(a);
    setTimeout(() => window.print(), 200);
  };
  const isApp = (APP_IDS as readonly string[]).includes(tab);
  const meta = isApp ? STEPS[APP_IDS.indexOf(tab as AppId)] : null;
  return (
    <div>
      <div className="l3-eyebrow">THE VAULT</div>
      <h2 className="l3-h2">Assemble your report</h2>
      <p className="l3-lead">
        Appendices A–F are generated from your work. Print each one (or all of
        them), then write the five-page main body.
      </p>
      <Tabs
        tabs={tabs}
        active={tab}
        onChange={(id) => go("vault", id, false)}
      />
      {isApp && meta && (
        <>
          <div className="l3-row" style={{ marginBottom: 12 }}>
            <Chip tone={stepPct(s, meta.n) >= 1 ? "good" : "warn"}>
              {Math.round(stepPct(s, meta.n) * 100)}% of Step {meta.n} checklist
            </Chip>
            <Btn variant="primary" onClick={() => print(tab)}>
              Print / save PDF
            </Btn>
            <Btn onClick={() => print("ALL")}>Print all A–F</Btn>
            <CopyBtn
              small={false}
              text={() => appendixMd(s, tab as AppId)}
              label="Copy as Markdown"
            />
            <Btn
              onClick={() =>
                download(
                  `lab3-appendix-${tab}.md`,
                  appendixMd(s, tab as AppId),
                  "text/markdown",
                )
              }
            >
              Download .md
            </Btn>
            <Btn variant="quiet" onClick={() => go(`s${meta.n}` as "s1")}>
              Edit in Step {meta.n}
            </Btn>
          </div>
          <Paper id={tab as AppId} s={s} />
        </>
      )}
      {tab === "draft" && (
        <Panel
          title="Main-body draft"
          sub="A five-section skeleton filled from your data. Rewrite it in your own words; the grader wants your reasoning, not boilerplate."
          tag="DRAFT"
        >
          <pre className="l3-pre">{mainBodyMd(s)}</pre>
          <div className="l3-row" style={{ marginTop: 10 }}>
            <CopyBtn
              small={false}
              text={() => mainBodyMd(s)}
              label="Copy draft"
            />
            <Btn
              onClick={() =>
                download("lab3-main-body.md", mainBodyMd(s), "text/markdown")
              }
            >
              Download .md
            </Btn>
          </div>
        </Panel>
      )}
      {tab === "backup" && (
        <Panel
          title="Backup and restore"
          sub="Your data lives in this browser. Save a file to move it between devices."
          tag="DATA"
        >
          <div className="l3-row">
            <Btn
              variant="primary"
              onClick={() =>
                download("lab3-progress.json", exportJson(), "application/json")
              }
            >
              Download my progress (.json)
            </Btn>
            <CopyBtn small={false} text={exportJson} label="Copy JSON" />
          </div>
          <div className="l3-field" style={{ marginTop: 12 }}>
            <label>Restore: paste JSON or choose a file</label>
            <textarea
              className="l3-textarea"
              value={imp}
              onChange={(e) => setImp(e.target.value)}
              placeholder='{"app":"lab3-guide","state":{…}}'
            />
            <div className="l3-row">
              <Btn
                disabled={!imp.trim()}
                onClick={() => {
                  toast(
                    importJson(imp)
                      ? "Progress restored"
                      : "That JSON is not a Lab 3 save",
                  );
                }}
              >
                Restore from text
              </Btn>
              <label className="l3-btn" style={{ cursor: "pointer" }}>
                Choose file
                <input
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    f.text().then((t) =>
                      toast(
                        importJson(t)
                          ? "Progress restored"
                          : "That file is not a Lab 3 save",
                      ),
                    );
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
          <Callout tone="warn" title="Danger zone">
            <ConfirmBtn
              label="Erase everything and start over"
              confirm="Really erase it all?"
              onConfirm={() => {
                resetAll();
                toast("Cleared");
                go("home");
              }}
            />
          </Callout>
        </Panel>
      )}
    </div>
  );
}
