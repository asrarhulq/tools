'use client';
import { useCallback, useEffect, useState } from 'react';
import s from '../clock.module.css';
import Schematic from './Schematic';
import { Display4 } from './Segments';
import { useClockSim } from '../lib/useClockSim';
import { FAULTS, FAULT_BY_ID, FAULT_GROUPS, INDEPENDENT, NODES, nodeVoltage } from '../lib/sim';
import { SYMPTOMS, SYMPTOM_GROUPS } from '../lib/data';
import { Deeper, Segmented, cx, useStored } from './ui';

/* ---------- the power-up chain ---------- */
function Chain({ stages }) {
  const [open, setOpen] = useState(null);
  return (
    <ol className={s.chain}>
      {stages.map((st) => (
        <li key={st.id} className={cx(s.chainItem, s[`st_${st.state}`])}>
          <button type="button" className={s.chainBtn} onClick={() => setOpen(open === st.id ? null : st.id)} aria-expanded={open === st.id}>
            <span className={s.chainDot} />
            <span className={s.chainTitle}>{st.title}</span>
            <span className={s.chainVal}>{st.value}</span>
          </button>
          {open === st.id && (
            <div className={s.chainBody}>
              <p>{st.why}</p>
              {st.fix && <p><b>Fix:</b> {st.fix}</p>}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

/* ---------- multimeter ---------- */
function Meter({ a, sim, probe, setProbe }) {
  const [peek, setPeek] = useState(false);
  const v = nodeVoltage(a, probe, sim.t, sim.beeping, sim.running);
  const node = NODES.find((n) => n.id === probe);
  return (
    <div className={s.meter}>
      <div className={s.lcd} aria-live="off">
        <span className={s.lcdSign}>{v < -0.005 ? '−' : ''}</span>
        <span className={s.lcdNum}>{Math.abs(v).toFixed(2)}</span>
        <span className={s.lcdUnit}>V DC</span>
      </div>
      <div className={s.meterLegend}>
        <span><i className={s.redDot} /> red: {node.where}</span>
        <span><i className={s.blackDot} /> black: ground</span>
      </div>
      <div className={s.pillRow}>
        {NODES.map((n) => <button key={n.id} type="button" className={cx(s.pill, probe === n.id && s.pillOn)} onClick={() => setProbe(n.id)}>{n.label}</button>)}
      </div>
      <label className={s.check}><input type="checkbox" checked={peek} onChange={(e) => setPeek(e.target.checked)} /> Show what a healthy board reads here</label>
      {peek && <div className={s.hint}>{node.expect}</div>}
    </div>
  );
}

/* ---------- the board under test ---------- */
function Bench({ sim, children }) {
  const modes = ['RUN', 'SET HOURS', 'SET MINUTES'];
  return (
    <div className={s.benchCard}>
      <div className={s.bezel}>
        <svg viewBox="0 0 300 90" className={s.wsvg} role="img" aria-label="Clock display">
          <Display4 x={12} y={10} w={276} h={70} masks={sim.masks} colon={sim.colon} bright={sim.bright} />
        </svg>
      </div>
      <div className={s.benchRow}>
        <div className={s.modeTag}>{sim.running ? modes[sim.mode] : 'OFF'}</div>
        <div className={cx(s.beepLamp, sim.beeping && s.beepOn)}>{sim.beeping ? 'BEEP' : 'buzzer'}</div>
      </div>
      <div className={s.benchBtns}>
        <button type="button" className={s.padBtn} onClick={() => sim.press(1)}><b>S1</b><span>mode</span></button>
        <button type="button" className={s.padBtn} onClick={() => sim.press(2)}><b>S2</b><span>adjust</span></button>
      </div>
      {children}
    </div>
  );
}

function BenchTab({ vin, setVin, faults, setFaults, sim, probe, setProbe, speed, setSpeed, sound, setSound }) {
  const toggle = (id) => setFaults((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const active = faults.map((id) => FAULT_BY_ID[id]);
  return (
    <>
      <div className={s.labGrid}>
        <div className={s.schemCard}>
          <Schematic a={sim.a} probe={probe} onProbe={setProbe} running={sim.running} beeping={sim.beeping} masks={sim.masks} colon={sim.colon} bright={sim.bright} showFaults faults={faults} />
          <div className={s.caption}>Tap a test point to move the red probe. Red dashed outlines show where a fault has been planted.</div>
        </div>
        <aside className={s.labSide}>
          <Bench sim={sim}>
            <div className={s.supply}>
              <label className={s.rangeRow}>
                <span className={s.rangeLabel}>Supply</span>
                <input type="range" className={s.range} min={0} max={12} step={0.5} value={vin} onChange={(e) => setVin(Number(e.target.value))} />
                <span className={cx(s.rangeVal, sim.a.over && s.badTxt)}>{vin.toFixed(1)} V</span>
              </label>
              <div className={s.rowSplit}>
                <button type="button" className={s.btn} onClick={sim.powerCycle}>Power cycle</button>
                <span className={s.mono}>{sim.a.current ? `${Math.round(sim.a.current)} mA` : '0 mA'}</span>
              </div>
              <div className={s.rowSplit}>
                <Segmented label="Clock speed" value={speed} onChange={setSpeed} options={[{ value: 1, label: '1×' }, { value: 60, label: '60×' }, { value: 600, label: '600×' }]} />
                <label className={s.check}><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Sound</label>
              </div>
            </div>
          </Bench>
          <Meter a={sim.a} sim={sim} probe={probe} setProbe={setProbe} />
        </aside>
      </div>

      <div className={s.twoCol}>
        <div className={s.panel}>
          <div className={s.panelHead}>
            <h3 className={s.panelTitle}>Plant a fault</h3>
            {faults.length > 0 && <button type="button" className={s.linkBtn} onClick={() => setFaults([])}>Clear all</button>}
          </div>
          {FAULT_GROUPS.map((g) => (
            <div key={g} className={s.faultGroup}>
              <div className={s.faultGroupName}>{g}</div>
              <div className={s.pillRow}>
                {FAULTS.filter((f) => f.group === g).map((f) => (
                  <button key={f.id} type="button" className={cx(s.pill, faults.includes(f.id) && s.pillBad)} aria-pressed={faults.includes(f.id)} onClick={() => toggle(f.id)}>{f.label}</button>
                ))}
              </div>
            </div>
          ))}
          {active.length > 0 && (
            <div className={s.faultNotes}>
              {active.map((f) => (
                <div key={f.id} className={s.faultNote}>
                  <b>{f.label}</b>
                  <p><span>How it happens</span> {f.how}</p>
                  <p><span>What you see</span> {f.sees}</p>
                  <p><span>Fix</span> {f.fix}</p>
                </div>
              ))}
            </div>
          )}
          {active.length === 0 && <p className={s.hint}>Everything is built correctly. Plant a fault, or slide the supply above 6.5 V, and watch the chain break.</p>}
        </div>
        <div className={s.panel}>
          <h3 className={s.panelTitle}>The power-up chain</h3>
          <p className={s.hint}>Each step needs the one above it. The first red step is where to look.</p>
          <Chain stages={sim.a.stages} />
        </div>
      </div>
    </>
  );
}

/* ---------- guided debugger: grouped symptoms, one check at a time ---------- */
function DebuggerTab({ onReproduce }) {
  const [group, setGroup] = useState(SYMPTOM_GROUPS[0]);
  const groupSymptoms = SYMPTOMS.filter((x) => x.group === group);
  const [sym, setSym] = useState(groupSymptoms[0].id);
  const [step, setStep] = useState(0);

  const chooseGroup = (g) => {
    setGroup(g);
    setSym(SYMPTOMS.find((x) => x.group === g).id);
    setStep(0);
  };
  const chooseSym = (id) => {
    setSym(id);
    setStep(0);
  };

  const cur = SYMPTOMS.find((x) => x.id === sym);
  const curStep = cur.steps[step];
  const isLast = step === cur.steps.length - 1;

  return (
    <div className={s.dbgGrid}>
      <div className={s.panel}>
        <h3 className={s.panelTitle}>What are you seeing?</h3>
        <p className={s.hint}>Pick the kind of problem, then the exact symptom.</p>
        <div className={s.pillRow}>
          {SYMPTOM_GROUPS.map((g) => (
            <button key={g} type="button" className={cx(s.pill, group === g && s.pillOn)} onClick={() => chooseGroup(g)}>{g}</button>
          ))}
        </div>
        <div className={s.symList} style={{ marginTop: 12 }}>
          {groupSymptoms.map((x) => (
            <button key={x.id} type="button" className={cx(s.symBtn, sym === x.id && s.symOn)} onClick={() => chooseSym(x.id)}>{x.title}</button>
          ))}
        </div>
      </div>
      <div className={s.panel}>
        <h3 className={s.panelTitle}>{cur.title}</h3>
        <p className={s.partSimple}>{cur.plain}</p>
        <div className={s.hint}>Check {step + 1} of {cur.steps.length}</div>
        <div key={`${sym}:${step}`} className={s.dbgSteps}>
          <div className={s.dbgDo}><span>{step + 1}</span>{curStep.do}</div>
          <div className={s.dbgExpect}><b>You should see</b> {curStep.expect}</div>
          <div className={s.dbgIf}><b>If not</b> {curStep.ifNot}</div>
          <div className={s.pillRow}>
            {curStep.tryFaults.map((id) => (
              <button key={id} type="button" className={s.pillGhost} onClick={() => onReproduce([id])}>Reproduce: {FAULT_BY_ID[id].label}</button>
            ))}
          </div>
        </div>
        <div className={s.stepControls}>
          <button type="button" className={s.btn} disabled={step === 0} onClick={() => setStep((n) => n - 1)}>Back</button>
          {!isLast
            ? <button type="button" className={s.btnPrimary} onClick={() => setStep((n) => n + 1)}>Next check</button>
            : <span className={s.hint}>That was every check for this symptom.</span>}
        </div>
        <Deeper label="Why this order?">
          <p className={s.para}>Debugging works best from the source downwards: power first, then the chip, then reset, then the crystal, and only then the display and extras. A broken early step makes every later step look broken too, so fix the first red step before you worry about anything beyond it.</p>
        </Deeper>
      </div>
    </div>
  );
}

/* ---------- mystery board ---------- */
function pickCase(hard) {
  if (hard) {
    const pool = [...INDEPENDENT].sort(() => Math.random() - 0.5);
    return pool.slice(0, 2);
  }
  const all = FAULTS.map((f) => f.id);
  return [all[Math.floor(Math.random() * all.length)]];
}

function MysteryTab({ m, setM, score, setScore, sim, probe, setProbe }) {
  const need = m.faults.length;
  const toggleGuess = (id) => setM((x) => ({ ...x, guess: x.guess.includes(id) ? x.guess.filter((g) => g !== id) : [...x.guess, id].slice(-need) }));
  const submit = () => {
    const ok = m.guess.length === need && m.guess.every((g) => m.faults.includes(g));
    setM((x) => ({ ...x, revealed: true, ok }));
    setScore((sc) => ({ solved: sc.solved + (ok ? 1 : 0), tried: sc.tried + 1, streak: ok ? sc.streak + 1 : 0 }));
  };
  const fresh = (hard) => setM({ faults: pickCase(hard), hard, guess: [], revealed: false, ok: false, hint: false });
  const firstBad = sim.a.stages.find((st) => st.state === 'bad' || st.state === 'warn');
  const speedLine = need > 1 ? 'Two independent faults are hiding on this board.' : 'One fault is hiding on this board.';

  return (
    <>
      <div className={s.labGrid}>
        <div className={s.schemCard}>
          <Schematic a={sim.a} probe={probe} onProbe={setProbe} running={sim.running} beeping={sim.beeping} masks={sim.masks} colon={sim.colon} bright={sim.bright} showFaults={m.revealed} faults={m.faults} />
          <div className={s.caption}>{speedLine} Use the display, the buttons and the meter to find out what.</div>
        </div>
        <aside className={s.labSide}>
          <Bench sim={sim} />
          <Meter a={sim.a} sim={sim} probe={probe} setProbe={setProbe} />
        </aside>
      </div>
      <div className={s.twoCol}>
        <div className={s.panel}>
          <div className={s.panelHead}>
            <h3 className={s.panelTitle}>Your diagnosis</h3>
            <span className={s.scoreTag}>{score.solved} solved · streak {score.streak}</span>
          </div>
          <div className={s.faultGroups}>
            {FAULT_GROUPS.map((g) => (
              <div key={g} className={s.faultGroup}>
                <div className={s.faultGroupName}>{g}</div>
                <div className={s.pillRow}>
                  {FAULTS.filter((f) => f.group === g).map((f) => (
                    <button key={f.id} type="button" disabled={m.revealed}
                      className={cx(s.pill, m.guess.includes(f.id) && s.pillOn, m.revealed && m.faults.includes(f.id) && s.pillBad)}
                      onClick={() => toggleGuess(f.id)}>{f.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {!m.revealed && (
            <div className={s.stepControls}>
              <button type="button" className={s.btnPrimary} disabled={m.guess.length !== need} onClick={submit}>Check my diagnosis{need > 1 ? ` (pick ${need})` : ''}</button>
              <button type="button" className={s.btn} onClick={() => setM((x) => ({ ...x, hint: true }))}>Give me a hint</button>
            </div>
          )}
          {m.hint && !m.revealed && firstBad && <div className={cx(s.verdict, s.v_idle)}>Hint: the chain first goes wrong at <b>{firstBad.title.toLowerCase()}</b>.</div>}
          {m.revealed && (
            <div className={cx(s.verdict, m.ok ? s.v_ok : s.v_bad)}>
              <b>{m.ok ? 'Solved.' : 'Not this time.'}</b>
              {m.faults.map((id) => <p key={id}><b>{FAULT_BY_ID[id].label}.</b> {FAULT_BY_ID[id].sees} <em>Fix: {FAULT_BY_ID[id].fix}</em></p>)}
            </div>
          )}
          {m.revealed && (
            <div className={s.stepControls}>
              <button type="button" className={s.btnPrimary} onClick={() => fresh(false)}>New board</button>
              <button type="button" className={s.btn} onClick={() => fresh(true)}>New board, hard mode</button>
            </div>
          )}
        </div>
        <div className={s.panel}>
          <h3 className={s.panelTitle}>How to hunt</h3>
          <ul className={s.bullets}>
            <li>Look first: is the display dark, partly lit, flashing or normal?</li>
            <li>Press S1 and S2. Do they change the time? Do you hear a beep?</li>
            <li>Move the red probe to VIN, then VCC, then RST. Compare with a healthy board.</li>
            <li>Remember that the chain works from power downwards.</li>
          </ul>
        </div>
      </div>
    </>
  );
}

/* ---------- lab shell ---------- */
export default function Lab() {
  const [tab, setTab] = useState('bench');
  const [vin, setVin] = useState(5);
  const [faults, setFaults] = useState([]);
  const [probe, setProbe] = useState('VCC');
  const [speed, setSpeed] = useState(60);
  const [sound, setSound] = useStored('sound', true);
  const [score, setScore] = useStored('score', { solved: 0, tried: 0, streak: 0 });
  const [m, setM] = useState({ faults: [], hard: false, guess: [], revealed: false, ok: false, hint: false });

  const isM = tab === 'mystery';
  useEffect(() => {
    const dealFirstCase = () => {
      if (isM && m.faults.length === 0) setM((x) => ({ ...x, faults: pickCase(false) }));
    };
    dealFirstCase();
  }, [isM]); // eslint-disable-line react-hooks/exhaustive-deps

  const sim = useClockSim({ vin: isM ? 5 : vin, faults: isM ? m.faults : faults, speed: isM ? 60 : speed, sound });

  const reproduce = useCallback((ids) => {
    setFaults(ids);
    setVin(5);
    setTab('bench');
    const el = document.getElementById('lab');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className={s.stack}>
      <div className={s.labTabs}>
        <Segmented label="Lab mode" value={tab} onChange={setTab} options={[
          { value: 'bench', label: 'Bench' }, { value: 'debugger', label: 'Debugger' }, { value: 'mystery', label: 'Mystery board' },
        ]} />
        <p className={s.hint}>
          {tab === 'bench' && 'A working clock to poke at. Plant mistakes, probe the circuit and watch the chain react.'}
          {tab === 'debugger' && 'Start from what you see on a real board. Follow the checks, then reproduce the fault here.'}
          {tab === 'mystery' && 'A board with hidden faults. Work out what is wrong using only the display, buttons and meter.'}
        </p>
      </div>

      {tab === 'bench' && <BenchTab {...{ vin, setVin, faults, setFaults, sim, probe, setProbe, speed, setSpeed, sound, setSound }} />}
      {tab === 'debugger' && (
        <>
          <DebuggerTab onReproduce={reproduce} />
          <div className={s.panel}><h3 className={s.panelTitle}>Live chain on the bench</h3><Chain stages={sim.a.stages} /></div>
        </>
      )}
      {tab === 'mystery' && <MysteryTab {...{ m, setM, score, setScore, sim, probe, setProbe }} />}
    </div>
  );
}
