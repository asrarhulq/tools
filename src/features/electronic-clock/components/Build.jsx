'use client';
import { useEffect, useMemo, useState } from 'react';
import s from '../clock.module.css';
import Board from './Board';
import { BUILD_STEPS, TOOLS, TEMPS, SAFETY, TECHNIQUE, JOINT_INFO, classifyJoint } from '../lib/data';
import { Deeper, cx, useStored } from './ui';

/* ---------- joint cross-section ---------- */
const SHAPES = {
  good: 'M58 94 Q90 90 95 52 L105 52 Q110 90 142 94 Z',
  blob: 'M50 94 C48 26 152 26 150 94 Z',
  starved: 'M82 94 Q94 88 96 74 L104 74 Q106 88 118 94 Z',
  burnt: 'M58 92 Q90 88 95 54 L105 54 Q110 88 142 92 Z',
};

export function JointSVG({ kind = 'good', grow = 1, iron = false, wire = false }) {
  const bridge = kind === 'bridge';
  const leadX = bridge ? [62, 138] : [100];
  return (
    <svg viewBox="0 0 200 140" className={s.jointSvg} role="img" aria-label={JOINT_INFO[kind] ? JOINT_INFO[kind].label : 'solder joint'}>
      <rect x={0} y={100} width={200} height={40} className={s.jointBoard} />
      {bridge ? (
        <>
          <rect x={22} y={94} width={80} height={6} className={s.jointPad} /><rect x={104} y={94} width={80} height={6} className={s.jointPad} />
        </>
      ) : kind === 'burnt' ? (
        <>
          <path d="M30 86 L62 92 L62 100 L30 100 Z" className={s.jointPad} /><rect x={62} y={94} width={108} height={6} className={s.jointPad} />
        </>
      ) : (
        <rect x={30} y={94} width={140} height={6} className={s.jointPad} />
      )}
      {leadX.map((x) => <rect key={x} x={x - 4} y={8} width={8} height={126} className={s.jointLead} />)}
      {kind === 'cold' && (
        <g>
          <ellipse cx={100} cy={74} rx={26} ry={22} className={s.solderDull} />
          <path d="M82 92 L118 92" className={s.crack} />
        </g>
      )}
      {bridge && <path d="M40 94 C40 46 160 46 160 94 Z" className={s.solder} />}
      {SHAPES[kind] && (
        <path
          d={SHAPES[kind]}
          className={kind === 'burnt' ? s.solderBurnt : s.solder}
          style={{ transformOrigin: '100px 94px', transform: `scale(${grow})`, transition: 'transform .6s cubic-bezier(.2,.8,.2,1)' }}
        />
      )}
      {iron && (
        <g className={s.ironG}>
          <polygon points="116,92 124,86 196,28 190,22 118,80 112,88" className={s.ironTip} />
          <polygon points="190,22 196,28 214,14 208,8" className={s.ironBody} />
        </g>
      )}
      {wire && <path d="M16 40 Q50 52 86 90" className={s.solderWire} />}
    </svg>
  );
}

/* ---------- the five-count ---------- */
function Technique() {
  const [n, setN] = useState(0);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    if (!play) return undefined;
    const id = setInterval(() => setN((x) => (x + 1) % TECHNIQUE.length), 2600);
    return () => clearInterval(id);
  }, [play]);
  const t = TECHNIQUE[n];
  const grow = [0.001, 0.001, 0.62, 1, 1][n];
  return (
    <div className={s.techGrid}>
      <div className={s.jointCard}>
        <JointSVG kind="good" grow={grow} iron={n >= 1 && n <= 3} wire={n === 2} />
        <div className={s.techDots}>
          {TECHNIQUE.map((x, i) => (
            <button key={x.n} type="button" className={cx(s.techDot, i === n && s.techDotOn, i < n && s.techDotDone)} onClick={() => { setN(i); setPlay(false); }} aria-label={`Step ${x.n}: ${x.title}`}>{x.n}</button>
          ))}
        </div>
      </div>
      <div>
        <div className={s.stepTime}>{t.sec}</div>
        <h3 className={s.stepTitle}>{t.n}. {t.title}</h3>
        <p className={s.partSimple}>{t.simple}</p>
        <Deeper><p className={s.para}>{t.detail}</p></Deeper>
        <div className={s.stepControls}>
          <button type="button" className={s.btn} onClick={() => { setN((x) => (x + TECHNIQUE.length - 1) % TECHNIQUE.length); setPlay(false); }}>Back</button>
          <button type="button" className={s.btnPrimary} onClick={() => setPlay((p) => !p)}>{play ? 'Pause' : 'Play the sequence'}</button>
          <button type="button" className={s.btn} onClick={() => { setN((x) => (x + 1) % TECHNIQUE.length); setPlay(false); }}>Next</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- joint lab: heat and amount ---------- */
function JointLab() {
  const [heat, setHeat] = useState(2);
  const [amount, setAmount] = useState(52);
  const kind = classifyJoint(heat, amount);
  const info = JOINT_INFO[kind];
  const grow = kind === 'good' ? 0.5 + amount / 120 : kind === 'blob' ? 0.8 + (amount - 72) / 140 : kind === 'starved' ? 0.6 + amount / 70 : 1;
  return (
    <div className={s.techGrid}>
      <div className={s.jointCard}>
        <JointSVG kind={kind} grow={Math.min(1.1, grow)} />
        <div className={cx(s.jointVerdict, kind === 'good' ? s.v_ok : s.v_bad)}>{info.label}</div>
      </div>
      <div>
        <label className={s.rangeRow}>
          <span className={s.rangeLabel}>Heat time</span>
          <input type="range" className={s.range} min={0} max={5} step={0.1} value={heat} onChange={(e) => setHeat(Number(e.target.value))} />
          <span className={s.rangeVal}>{heat.toFixed(1)} s</span>
        </label>
        <label className={s.rangeRow}>
          <span className={s.rangeLabel}>Solder</span>
          <input type="range" className={s.range} min={0} max={100} step={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <span className={s.rangeVal}>{amount < 28 ? 'little' : amount > 72 ? 'lots' : 'just right'}</span>
        </label>
        <p className={s.partSimple}>{info.why}</p>
        {kind !== 'good' && <div className={cx(s.callout, s.calloutTip)}><b>The fix</b><p>{info.fix}</p></div>}
        <p className={s.hint}>Slide the heat and the amount of solder and watch what the joint does. Good joints need 1 to 4 seconds of heat and a modest amount of solder.</p>
      </div>
    </div>
  );
}

/* ---------- joint quiz ---------- */
const QUIZ_POOL = ['good', 'cold', 'starved', 'blob', 'burnt', 'bridge', 'good', 'good'];
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

function JointQuiz() {
  const [deck, setDeck] = useState(QUIZ_POOL);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [score, setScore] = useState(0);
  useEffect(() => {
    const dealShuffledDeck = () => setDeck(shuffle(QUIZ_POOL));
    dealShuffledDeck();
  }, []);
  const done = i >= deck.length;
  const kind = deck[i];
  const answered = pick !== null;
  const right = answered && (pick === 'good') === (kind === 'good');
  const next = () => { setI((x) => x + 1); setPick(null); };
  const again = () => { setDeck(shuffle(QUIZ_POOL)); setI(0); setPick(null); setScore(0); };
  const choose = (p) => { if (answered) return; setPick(p); if ((p === 'good') === (kind === 'good')) setScore((x) => x + 1); };

  if (done) {
    return (
      <div className={s.quizDone}>
        <div className={s.big}>{score} / {deck.length}</div>
        <p className={s.partSimple}>{score === deck.length ? 'A perfect eye. You can spot a bad joint at a glance.' : score >= deck.length - 2 ? 'Sharp. Look again at the ones you missed.' : 'Worth another go. Cold joints and bridges are the sneaky ones.'}</p>
        <button type="button" className={s.btnPrimary} onClick={again}>Play again</button>
      </div>
    );
  }
  return (
    <div className={s.techGrid}>
      <div className={s.jointCard}>
        <JointSVG key={i} kind={kind} />
        <div className={s.quizCount}>Joint {i + 1} of {deck.length}</div>
      </div>
      <div>
        <h3 className={s.stepTitle}>Would you leave this joint?</h3>
        <div className={s.pillRow}>
          <button type="button" className={cx(s.btn, answered && pick === 'good' && s.btnOn)} onClick={() => choose('good')}>It is good</button>
          <button type="button" className={cx(s.btn, answered && pick === 'bad' && s.btnOn)} onClick={() => choose('bad')}>Needs rework</button>
        </div>
        {answered && (
          <div className={cx(s.verdict, right ? s.v_ok : s.v_bad)} aria-live="polite">
            <b>{right ? 'Right. ' : 'Not quite. '}{JOINT_INFO[kind].label}.</b> {JOINT_INFO[kind].why}
            {kind !== 'good' && <> <em>Fix: {JOINT_INFO[kind].fix}</em></>}
          </div>
        )}
        {answered && <button type="button" className={s.btnPrimary} onClick={next}>{i + 1 === deck.length ? 'See score' : 'Next joint'}</button>}
      </div>
    </div>
  );
}

/* ---------- build steps ---------- */
function BuildSteps() {
  const [done, setDone] = useStored('build-done', {});
  const [active, setActive] = useState(0);
  const step = BUILD_STEPS[active];
  const count = BUILD_STEPS.filter((st) => done[st.id]).length;
  const badges = useMemo(() => {
    const b = {};
    BUILD_STEPS.forEach((st, n) => st.parts.forEach((p) => { b[p] = n + 1; }));
    return b;
  }, []);
  const toggle = (key) => setDone((d) => ({ ...d, [key]: !d[key] }));

  return (
    <div className={s.buildGrid}>
      <div className={s.buildSticky}>
        <div className={s.boardCard}>
          <Board highlight={step.parts} badges={badges} compact />
          <div className={s.caption}>Step {active + 1}: {step.title}</div>
        </div>
        <div className={s.progress} aria-label={`${count} of ${BUILD_STEPS.length} steps done`}>
          <div className={s.progressBar}><div style={{ width: `${(count / BUILD_STEPS.length) * 100}%` }} /></div>
          <span>{count} of {BUILD_STEPS.length} done</span>
          {count > 0 && <button type="button" className={s.linkBtn} onClick={() => setDone({})}>Reset</button>}
        </div>
      </div>

      <ol className={s.buildList}>
        {BUILD_STEPS.map((st, n) => {
          const open = n === active;
          return (
            <li key={st.id} className={cx(s.buildItem, open && s.buildOpen, done[st.id] && s.buildDone)}>
              <div className={s.buildHead}>
                <button type="button" className={s.buildCheck} onClick={() => toggle(st.id)} aria-pressed={!!done[st.id]} aria-label={`Mark step ${n + 1} done`}>{done[st.id] ? '✓' : n + 1}</button>
                <button type="button" className={s.buildTitle} onClick={() => setActive(n)} aria-expanded={open}>
                  <span>{st.title}</span><small>{st.time}</small>
                </button>
              </div>
              {open && (
                <div className={s.buildBody}>
                  <ul className={s.bullets}>{st.simple.map((t, k) => <li key={k}>{t}</li>)}</ul>
                  <Deeper><p className={s.para}>{st.detail}</p></Deeper>
                  <div className={s.checkList}>
                    {st.check.map((c, k) => {
                      const key = `${st.id}:${k}`;
                      return (
                        <label key={key} className={s.check}><input type="checkbox" checked={!!done[key]} onChange={() => toggle(key)} /> {c}</label>
                      );
                    })}
                  </div>
                  <div className={cx(s.callout, s.calloutWarn)}><b>Common mistake</b><p>{st.mistake}</p></div>
                  <div className={s.stepControls}>
                    {n > 0 && <button type="button" className={s.btn} onClick={() => setActive(n - 1)}>Previous</button>}
                    {n < BUILD_STEPS.length - 1 && <button type="button" className={s.btnPrimary} onClick={() => { setDone((d) => ({ ...d, [st.id]: true })); setActive(n + 1); }}>Done, next step</button>}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function Build() {
  return (
    <div className={s.stack}>
      <div className={s.twoCol}>
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Your kit of tools</h3>
          <ul className={s.toolList}>{TOOLS.map((t) => <li key={t.name}><b>{t.name}</b><span>{t.why}</span></li>)}</ul>
        </div>
        <div className={s.panel}>
          <h3 className={s.panelTitle}>Iron temperature</h3>
          <ul className={s.tempList}>{TEMPS.map((t) => <li key={t.name}><span>{t.name}</span><b>{t.c}</b><small>{t.f}</small></li>)}</ul>
          <p className={s.hint}>Check your solder spool. The right number depends on the alloy.</p>
          <h3 className={cx(s.panelTitle, s.panelTitleGap)}>Stay safe</h3>
          <ul className={s.bullets}>{SAFETY.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      </div>

      <div className={s.subhead}><h3>One good joint in five counts</h3><p>Every joint on the board follows the same rhythm.</p></div>
      <div className={s.panel}><Technique /></div>

      <div className={s.subhead}><h3>What makes a joint good or bad</h3><p>Change the heat and the amount of solder and see what happens.</p></div>
      <div className={s.panel}><JointLab /></div>

      <div className={s.subhead}><h3>Train your eye</h3><p>Eight joints. Good or needs rework?</p></div>
      <div className={s.panel}><JointQuiz /></div>

      <div className={s.subhead}><h3>The build, in order</h3><p>Shortest parts first, tallest last. Tick things off as you go. Your progress is saved on this device.</p></div>
      <BuildSteps />
    </div>
  );
}
