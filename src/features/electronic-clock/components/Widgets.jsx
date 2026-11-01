'use client';
import { useEffect, useState } from 'react';
import s from '../clock.module.css';
import { PINS } from '../lib/data';
import { beep } from '../lib/audio';
import { Display4, Digit, BIT, SEG_KEYS, digitOfMask } from './Segments';
import { cx } from './ui';

function useFrame(fn, deps) {
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const loop = (t) => { fn((t - t0) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function Range({ label, value, onChange, min, max, step = 1, unit = '', fmt }) {
  return (
    <label className={s.rangeRow}>
      <span className={s.rangeLabel}>{label}</span>
      <input type="range" className={s.range} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className={s.rangeVal}>{fmt ? fmt(value) : value}{unit}</span>
    </label>
  );
}

/* ---------- U1: pin map ---------- */
export function PinMap() {
  const [sel, setSel] = useState(1);
  const pin = PINS.find((p) => p.n === sel);
  const left = PINS.slice(0, 10);
  const right = PINS.slice(10).reverse();
  const y = (i) => 40 + i * 21;
  const row = (p, i, side) => {
    const isL = side === 'L';
    const on = sel === p.n;
    return (
      <g key={p.n} className={cx(s.pinRow, on && s.pinRowOn)} onClick={() => setSel(p.n)} tabIndex={0} role="button" aria-label={`Pin ${p.n} ${p.name}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(p.n); } }}>
        <rect x={isL ? 76 : 200} y={y(i) - 6} width={24} height={12} className={cx(s.pinLeg, s[`pin_${p.kind}`], on && s.pinLegOn)} />
        <text x={isL ? 70 : 230} y={y(i) + 4} textAnchor={isL ? 'end' : 'start'} className={s.pinName}>{p.name}</text>
        <text x={isL ? 108 : 192} y={y(i) + 4} textAnchor={isL ? 'start' : 'end'} className={s.pinNum}>{p.n}</text>
      </g>
    );
  };
  return (
    <div>
      <svg viewBox="0 0 300 262" className={s.wsvg}>
        <rect x={100} y={16} width={100} height={236} rx={8} className={s.chipBody} />
        <path d="M130 16 a20 20 0 0 0 40 0" className={s.chipNotch} />
        {left.map((p, i) => row(p, i, 'L'))}
        {right.map((p, i) => row(p, i, 'R'))}
        <text x={150} y={134} textAnchor="middle" className={s.chipLabel} transform="rotate(-90 150 134)">AT89C2051</text>
      </svg>
      <div className={s.pinInfo}>
        <strong>Pin {pin.n} · {pin.name}</strong>
        <p>{pin.job}</p>
      </div>
      <p className={s.hint}>Tap a pin. The notch at the top marks the end where pin 1 sits.</p>
    </div>
  );
}

/* ---------- Y1: crystal ---------- */
export function CrystalTicker() {
  const [mhz, setMhz] = useState(12);
  const [p, setP] = useState(0);
  useFrame((t) => setP((t / (12 / mhz)) % 1), [mhz]);
  const speed = mhz / 12;
  const C = 2 * Math.PI * 44;
  return (
    <div>
      <div className={s.rowSplit}>
        <svg viewBox="0 0 120 120" className={s.wsvgSm}>
          <circle cx={60} cy={60} r={44} className={s.ringBg} />
          <circle cx={60} cy={60} r={44} className={s.ringFg} strokeDasharray={`${p * C} ${C}`} transform="rotate(-90 60 60)" />
          <g className={s.vibrate} style={{ animationDuration: `${0.16 / speed}s` }}>
            <rect x={46} y={42} width={28} height={36} rx={6} className={s.xtalBody} />
            <text x={60} y={65} textAnchor="middle" className={s.xtalText}>{mhz}</text>
          </g>
        </svg>
        <div className={s.readout}>
          <div><span className={s.big}>{(mhz / 12).toFixed(2)}</span> million steps a second</div>
          <div>One &quot;second&quot; on the display takes <b>{(12 / mhz).toFixed(2)} s</b> of real time</div>
          <div className={speed === 1 ? s.okTxt : s.badTxt}>{speed === 1 ? 'Correct: the clock keeps true time.' : `The clock runs ${speed.toFixed(2)}× real speed.`}</div>
        </div>
      </div>
      <Range label="Crystal" value={mhz} onChange={setMhz} min={6} max={24} unit=" MHz" />
      <p className={s.hint}>The program assumes 12 MHz. Swap in a different crystal and the clock runs fast or slow by the same ratio.</p>
    </div>
  );
}

/* ---------- C1 / C2: load caps ---------- */
export function LoadCaps() {
  const [pf, setPf] = useState(30);
  const zone = pf < 15 ? ['bad', 'Too small: the crystal may start but ring at a slightly wrong pitch.'] : pf <= 40 ? ['ok', 'In the sweet spot. This kit uses about 30 pF.'] : ['bad', 'Too big: the crystal starts slowly, or not at all.'];
  return (
    <div>
      <svg viewBox="0 0 300 170" className={s.wsvg}>
        <line x1={20} y1={40} x2={80} y2={40} className={s.wire} /><line x1={220} y1={40} x2={280} y2={40} className={s.wire} />
        <g className={s.vibrate} style={{ animationDuration: '0.14s' }}>
          <rect x={80} y={26} width={140} height={28} rx={13} className={s.xtalBody} />
          <text x={150} y={45} textAnchor="middle" className={s.xtalText}>12 MHz</text>
        </g>
        <text x={20} y={26} className={s.wlabel}>XTAL1</text><text x={252} y={26} className={s.wlabel}>XTAL2</text>
        {[50, 250].map((x, i) => (
          <g key={x}>
            <line x1={x} y1={40} x2={x} y2={88} className={s.wire} />
            <line x1={x - 16} y1={88} x2={x + 16} y2={88} className={s.plate} />
            <line x1={x - 16} y1={98} x2={x + 16} y2={98} className={s.plate} />
            <line x1={x} y1={98} x2={x} y2={136} className={s.wire} />
            <text x={x + 22} y={96} className={s.wlabel}>C{i + 1}  {pf} pF</text>
          </g>
        ))}
        <line x1={30} y1={136} x2={270} y2={136} className={s.wire} />
        <text x={132} y={158} className={s.wlabel}>ground</text>
      </svg>
      <div className={cx(s.verdict, s[`v_${zone[0]}`])}>{zone[1]}</div>
      <Range label="Capacitance" value={pf} onChange={setPf} min={5} max={80} unit=" pF" />
    </div>
  );
}

/* ---------- C3: reset curve ---------- */
export function ResetCurve() {
  const [R, setR] = useState(10);
  const [C, setC] = useState(10);
  const [gone, setGone] = useState(false);
  const tau = R * C;
  const tmax = Math.max(5 * tau, 50);
  const W = 300, H = 150, pl = 34, pr = 10, pt = 10, pb = 26;
  const X = (t) => pl + (t / tmax) * (W - pl - pr);
  const Y = (v) => pt + (1 - v / 5.5) * (H - pt - pb);
  const pts = Array.from({ length: 61 }, (_, i) => {
    const t = (tmax * i) / 60;
    const v = gone ? 5 : 5 * Math.exp(-t / tau);
    return `${X(t).toFixed(1)},${Y(v).toFixed(1)}`;
  }).join(' ');
  const release = tau * Math.log(5);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.wsvg}>
        <line x1={pl} y1={Y(0)} x2={W - pr} y2={Y(0)} className={s.axis} />
        <line x1={pl} y1={Y(0)} x2={pl} y2={pt} className={s.axis} />
        <line x1={pl} y1={Y(1)} x2={W - pr} y2={Y(1)} className={s.threshold} />
        <text x={W - pr} y={Y(1) - 4} textAnchor="end" className={s.wlabel}>chip wakes below 1 V</text>
        <text x={4} y={Y(5) + 4} className={s.wlabel}>5 V</text><text x={14} y={Y(0) + 3} className={s.wlabel}>0</text>
        <text x={pl} y={H - 6} className={s.wlabel}>0</text><text x={W - pr} y={H - 6} textAnchor="end" className={s.wlabel}>{Math.round(tmax)} ms</text>
        <polyline points={pts} className={s.curve} />
        {!gone && <circle cx={X(release)} cy={Y(1)} r={4.5} className={s.curveDot} />}
      </svg>
      <div className={cx(s.verdict, gone ? s.v_bad : s.v_ok)}>
        {gone ? 'R1 is missing: nothing drains C3, RST stays high, and the chip never wakes.' : `RC = ${tau.toFixed(0)} ms. The chip wakes after about ${release.toFixed(0)} ms.`}
      </div>
      <Range label="R1" value={R} onChange={setR} min={1} max={100} unit=" kΩ" />
      <Range label="C3" value={C} onChange={setC} min={1} max={100} unit=" µF" />
      <label className={s.check}><input type="checkbox" checked={gone} onChange={(e) => setGone(e.target.checked)} /> Remove R1</label>
    </div>
  );
}

/* ---------- R1 / R2: resistor ---------- */
const STD = [100, 220, 470, 1000, 2200, 4700, 10000, 22000, 47000, 100000];
const BANDC = ['#141414', '#7a4a22', '#c8321e', '#f08a1f', '#f2d21b', '#2e9b4a', '#2a5fd0', '#8a3fc0', '#8a8f98', '#f2f2f2'];
const BANDN = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
const showR = (r) => (r >= 1000 ? `${r / 1000} kΩ` : `${r} Ω`);

export function ResistorLab({ part }) {
  const [idx, setIdx] = useState(6);
  const [v, setV] = useState(5);
  const R = STD[idx];
  const exp = Math.floor(Math.log10(R)) - 1;
  const sig = Math.round(R / 10 ** exp);
  const d1 = Math.floor(sig / 10), d2 = sig % 10;
  const mA = (v / R) * 1000;
  const flow = Math.min(1, mA / 25);
  return (
    <div>
      <svg viewBox="0 0 300 100" className={s.wsvg}>
        <line x1={10} y1={50} x2={290} y2={50} className={s.leadW} />
        <rect x={80} y={28} width={140} height={44} rx={20} className={s.resBody} />
        {[[d1, 108], [d2, 130], [exp, 152]].map(([d, x], i) => <rect key={i} x={x} y={28} width={10} height={44} fill={BANDC[d]} />)}
        <rect x={186} y={28} width={10} height={44} fill="#c8a24a" />
      </svg>
      <div className={s.bandKey}>
        {[d1, d2, exp].map((d, i) => (
          <span key={i}><i style={{ background: BANDC[d] }} />{BANDN[d]}<small>{['digit', 'digit', '×10^'][i]}{i === 2 ? exp : ''}</small></span>
        ))}
        <span><i style={{ background: '#c8a24a' }} />gold<small>±5%</small></span>
      </div>
      <div className={s.rowSplit}>
        <div className={s.readout}>
          <div><span className={s.big}>{showR(R)}</span></div>
          <div>Current = {v} V ÷ {showR(R)} = <b>{mA < 1 ? mA.toFixed(2) : mA.toFixed(1)} mA</b></div>
        </div>
        <div className={s.flowBar} aria-hidden="true"><div style={{ width: `${Math.max(3, flow * 100)}%` }} /></div>
      </div>
      <Range label="Value" value={idx} onChange={setIdx} min={0} max={STD.length - 1} fmt={(i) => showR(STD[i])} />
      <Range label="Voltage" value={v} onChange={setV} min={1} max={12} unit=" V" />
      <p className={s.hint}>{part && part.id === 'R2' ? 'In the clock R2 carries the small current that switches Q1 on.' : 'In the clock R1 drains C3 so that the reset pin can fall.'} Your kit part is 10 kΩ: brown, black, orange.</p>
    </div>
  );
}

/* ---------- C4 / C5: smoothing and bypass ---------- */
export function Bucket({ part }) {
  const ref = part ? part.refs : 'C4';
  const fast = part && part.id === 'C5';
  const [on, setOn] = useState(true);
  const [ph, setPh] = useState(0);
  useFrame((t) => setPh(t), []);
  const line = (amp) => Array.from({ length: 90 }, (_, i) => {
    const x = i * 3.2 + 6;
    const speed = fast ? 3 : 1;
    const n = Math.sin(i * 0.45 * speed + ph * 6 * speed) * 0.5 + Math.sin(i * 1.3 * speed + ph * 9 * speed) * 0.3 + Math.sin(i * 3.1 * speed + ph * 14 * speed) * 0.2;
    return `${x.toFixed(1)},${(70 - n * amp * 50).toFixed(1)}`;
  }).join(' ');
  return (
    <div>
      <svg viewBox="0 0 300 140" className={s.wsvg}>
        <line x1={6} y1={70} x2={294} y2={70} className={s.threshold} />
        <text x={8} y={16} className={s.wlabel}>voltage at the chip (nominally 5 V)</text>
        <polyline points={line(on ? 0.1 : 0.6)} className={cx(s.curve, !on && s.curveBad)} />
      </svg>
      <div className={cx(s.verdict, on ? s.v_ok : s.v_bad)}>{on ? `With ${ref}: ${fast ? 'the fast spikes right at the chip are' : 'small bumps are'} absorbed, the supply stays steady.` : `Without ${ref}: every switch of the display or buzzer jolts the supply${fast ? ', fast and close to the chip' : ''}.`}</div>
      <label className={s.check}><input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} /> {ref} fitted</label>
    </div>
  );
}

/* ---------- Q1: transistor ---------- */
export function TransistorSwitch() {
  const [low, setLow] = useState(false);
  return (
    <div>
      <svg viewBox="0 0 300 220" className={s.wsvg}>
        <line x1={170} y1={14} x2={170} y2={80} className={cx(s.wire, low && s.flow)} />
        <text x={178} y={22} className={s.wlabel}>+5 V</text>
        <line x1={170} y1={80} x2={134} y2={104} className={cx(s.wire, low && s.flow)} />
        <line x1={134} y1={92} x2={134} y2={128} className={s.plate} />
        <line x1={134} y1={116} x2={170} y2={140} className={cx(s.wire, low && s.flow)} />
        <line x1={170} y1={140} x2={170} y2={156} className={cx(s.wire, low && s.flow)} />
        <circle cx={170} cy={176} r={18} className={cx(s.buzzSym, low && s.buzzOn)} />
        <text x={164} y={181} className={s.wlabel}>BZ</text>
        <line x1={170} y1={194} x2={170} y2={212} className={s.wire} />
        <text x={178} y={210} className={s.wlabel}>ground</text>
        <line x1={20} y1={110} x2={56} y2={110} className={cx(s.wire, low && s.flow)} />
        <rect x={56} y={102} width={34} height={16} className={s.symBox} />
        <text x={64} y={114} className={s.wlabel}>R2</text>
        <line x1={90} y1={110} x2={134} y2={110} className={cx(s.wire, low && s.flow)} />
        <text x={14} y={96} className={s.wlabel}>chip pin</text>
        {low && <g className={s.waves}><path d="M196 164 q8 12 0 24" /><path d="M206 158 q12 18 0 36" /></g>}
        <text x={196} y={66} className={s.wlabel}>Q1 (PNP)</text>
      </svg>
      <div className={s.rowSplit}>
        <button type="button" className={cx(s.btn, low && s.btnOn)} onClick={() => { setLow((v) => { if (!v) beep(); return !v; }); }}>
          Chip pin: {low ? 'LOW (pulls base down)' : 'HIGH (lets go)'}
        </button>
        <div className={s.readout}>
          <div>Base <b>{low ? '4.3 V' : '5.0 V'}</b></div>
          <div>Collector <b>{low ? '4.7 V' : '0 V'}</b></div>
        </div>
      </div>
      <div className={cx(s.verdict, low ? s.v_ok : s.v_idle)}>
        {low ? 'Base is 0.7 V below the emitter, so Q1 conducts and the buzzer sounds.' : 'Base equals the emitter voltage, so Q1 is off and the buzzer is silent.'}
      </div>
    </div>
  );
}

/* ---------- BZ1: buzzer ---------- */
export function Beeper() {
  const [on, setOn] = useState(false);
  const [kind, setKind] = useState('active');
  const play = () => { setOn(true); beep(2700, 260, 0.06); setTimeout(() => setOn(false), 280); };
  return (
    <div>
      <svg viewBox="0 0 300 150" className={s.wsvg}>
        <circle cx={150} cy={70} r={50} className={s.buzzBody} />
        <circle cx={150} cy={70} r={40} className={s.buzzRing} />
        <circle cx={150} cy={70} r={7} className={s.buzzHole} />
        <text x={108} y={44} className={s.buzzPlus}>+</text>
        <line x1={128} y1={120} x2={128} y2={146} className={s.leadW} /><line x1={172} y1={120} x2={172} y2={138} className={s.leadW} />
        <text x={96} y={142} className={s.wlabel}>+ (longer)</text>
        {on && <g className={s.waves}><path d="M214 56 q12 14 0 28" /><path d="M226 46 q18 24 0 48" /><path d="M238 36 q24 34 0 68" /></g>}
      </svg>
      <div className={s.rowSplit}>
        <button type="button" className={s.btnPrimary} onClick={play}>Press to hear it</button>
        <div className={s.pillRow}>
          {['active', 'passive'].map((k) => (
            <button key={k} type="button" className={cx(s.pill, kind === k && s.pillOn)} onClick={() => setKind(k)}>{k}</button>
          ))}
        </div>
      </div>
      <p className={s.hint}>
        {kind === 'active'
          ? 'Active (this kit): a tiny oscillator is built in. Give it power and it makes its own tone.'
          : 'Passive: no oscillator inside. The chip would have to flip the pin thousands of times a second.'}
      </p>
    </div>
  );
}

/* ---------- S1 / S2: button ---------- */
export function ButtonPin() {
  const [down, setDown] = useState(false);
  const up = () => setDown(false);
  return (
    <div>
      <svg viewBox="0 0 300 190" className={s.wsvg}>
        <text x={14} y={20} className={s.wlabel}>+5 V</text>
        <line x1={60} y1={14} x2={60} y2={40} className={s.wire} />
        <rect x={50} y={40} width={20} height={36} className={s.symBox} /><text x={78} y={62} className={s.wlabel}>weak pull-up</text>
        <line x1={60} y1={76} x2={60} y2={150} className={cx(s.wire, down && s.flow)} />
        <line x1={60} y1={96} x2={160} y2={96} className={s.wire} /><circle cx={60} cy={96} r={3.5} className={s.dotFill} />
        <rect x={160} y={74} width={54} height={44} rx={6} className={s.mcuMini} /><text x={168} y={100} className={s.wlabel}>chip pin</text>
        <text x={222} y={102} className={cx(s.pinState, down ? s.badTxt : s.okTxt)}>{down ? '0 V  LOW' : '5 V  HIGH'}</text>
        <circle cx={60} cy={120} r={3.5} className={s.dotRing} />
        <line x1={60} y1={120} x2={down ? 60 : 84} y2={down ? 146 : 134} className={s.wire} style={{ transition: 'all .12s' }} />
        <circle cx={60} cy={146} r={3.5} className={s.dotRing} />
        <line x1={60} y1={150} x2={60} y2={176} className={s.wire} /><line x1={44} y1={176} x2={76} y2={176} className={s.plate} />
        <text x={84} y={180} className={s.wlabel}>ground</text>
      </svg>
      <button type="button" className={cx(s.btnPrimary, s.btnWide, down && s.btnOn)}
        onPointerDown={() => setDown(true)} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setDown(true); }} onKeyUp={up}>
        Press and hold the button
      </button>
      <p className={s.hint}>Pressed: the switch connects the pin to ground, the pin reads LOW, and the program sees &quot;button!&quot;.</p>
    </div>
  );
}

/* ---------- DS1: display ---------- */
function ScanLab() {
  const [v, setV] = useState(10);
  const [now, setNow] = useState(0);
  useFrame((t) => setNow(t), []);
  const hz = Math.pow(200, v / 100);
  const slots = hz * 4;
  const slotIdx = Math.floor(now * slots);
  const digits = [1, 2, 3, 4].map((n) => [0x06, 0x5b, 0x4f, 0x66][n - 1]);
  const bright = [0, 1, 2, 3].map((i) => {
    const n = slotIdx - ((((slotIdx - i) % 4) + 4) % 4);
    const age = n === slotIdx ? 0 : now - (n + 1) / slots;
    return Math.max(0, 1 - age / 0.1);
  });
  const masks = digits.map((m, i) => (bright[i] > 0.02 ? m : 0));
  return (
    <div>
      <svg viewBox="0 0 300 80" className={s.wsvg}>
        <rect x={0} y={0} width={300} height={80} rx={8} className={s.dispGlass} />
        <Display4 x={16} y={10} w={268} h={60} masks={masks} colon bright={bright} />
      </svg>
      <div className={s.readout}><div>Whole display redrawn <b>{hz < 10 ? hz.toFixed(1) : Math.round(hz)}</b> times a second</div>
        <div className={hz < 25 ? s.badTxt : s.okTxt}>{hz < 25 ? 'Slow enough to see one digit at a time.' : 'Fast enough that your eyes blend the digits.'}</div></div>
      <Range label="Scan speed" value={v} onChange={setV} min={0} max={100} fmt={() => ''} />
    </div>
  );
}

function BuildDigit() {
  const [mask, setMask] = useState(0x06);
  const toggle = (k) => setMask((m) => m ^ BIT[k]);
  const d = digitOfMask(mask);
  return (
    <div>
      <svg viewBox="0 0 200 130" className={s.wsvg}>
        <rect x={0} y={0} width={200} height={130} rx={8} className={s.dispGlass} />
        <Digit x={62} y={14} w={76} h={102} mask={mask} onToggle={toggle} />
      </svg>
      <div className={s.bitRow}>
        {SEG_KEYS.map((k) => (
          <button key={k} type="button" className={cx(s.bit, mask & BIT[k] && s.bitOn)} onClick={() => toggle(k)}>
            <span>{k}</span><b>{mask & BIT[k] ? 1 : 0}</b>
          </button>
        ))}
      </div>
      <div className={s.readout}>
        <div>Pattern: <b className={s.mono}>0x{mask.toString(16).padStart(2, '0')}</b> {d !== null ? <>= the digit <b>{d}</b></> : '(not a digit)'}</div>
      </div>
      <p className={s.hint}>Tap the bars, or the letters. The chip stores one number per digit, one bit per bar.</p>
    </div>
  );
}

export function DisplayLab() {
  const [tab, setTab] = useState('scan');
  return (
    <div>
      <div className={s.pillRow}>
        <button type="button" className={cx(s.pill, tab === 'scan' && s.pillOn)} onClick={() => setTab('scan')}>Slow-motion scan</button>
        <button type="button" className={cx(s.pill, tab === 'bits' && s.pillOn)} onClick={() => setTab('bits')}>Build a digit</button>
      </div>
      {tab === 'scan' ? <ScanLab /> : <BuildDigit />}
    </div>
  );
}

/* ---------- J1: power ---------- */
export function PowerPicker() {
  const [v, setV] = useState(5);
  const [rev, setRev] = useState(false);
  const verdict = rev ? ['bad', 'Wires swapped. There is no protection: the chip can be destroyed at once.']
    : v < 2.7 ? ['bad', 'Too low. The chip cannot start.']
      : v < 4.5 ? ['warn', 'It runs, but the display is dim and the clock may be unreliable.']
        : v <= 5.5 ? ['ok', 'Perfect. This is what the kit is built for.']
          : v <= 6.5 ? ['warn', 'Pushing the limit of the chip. Do not leave it like this.']
            : ['bad', 'Far too high. The chip will be destroyed.'];
  const mx = 10 + (v / 12) * 280;
  return (
    <div>
      <svg viewBox="0 0 300 70" className={s.wsvg}>
        <rect x={10} y={20} width={(2.7 / 12) * 280} height={16} className={s.zBad} />
        <rect x={10 + (2.7 / 12) * 280} y={20} width={(1.8 / 12) * 280} height={16} className={s.zWarn} />
        <rect x={10 + (4.5 / 12) * 280} y={20} width={(1 / 12) * 280} height={16} className={s.zOk} />
        <rect x={10 + (5.5 / 12) * 280} y={20} width={(1 / 12) * 280} height={16} className={s.zWarn} />
        <rect x={10 + (6.5 / 12) * 280} y={20} width={(5.5 / 12) * 280} height={16} className={s.zBad} />
        <path d={`M${mx} 40 l-7 12 h14 Z`} className={s.marker} />
        {[0, 3, 5, 9, 12].map((n) => <text key={n} x={10 + (n / 12) * 280} y={14} textAnchor="middle" className={s.wlabel}>{n}</text>)}
        <text x={mx} y={66} textAnchor="middle" className={s.markerText}>{rev ? '−' : ''}{v} V</text>
      </svg>
      <div className={cx(s.verdict, s[`v_${verdict[0]}`])}>{verdict[1]}</div>
      <div className={s.pillRow}>
        {[3, 5, 9, 12].map((n) => <button key={n} type="button" className={cx(s.pill, v === n && s.pillOn)} onClick={() => setV(n)}>{n} V</button>)}
      </div>
      <Range label="Supply" value={v} onChange={setV} min={0} max={12} step={0.5} unit=" V" />
      <label className={s.check}><input type="checkbox" checked={rev} onChange={(e) => setRev(e.target.checked)} /> Swap + and − wires</label>
    </div>
  );
}

export const WIDGETS = {
  pins: PinMap, crystal: CrystalTicker, loadcaps: LoadCaps, reset: ResetCurve, resistor: ResistorLab,
  bucket: Bucket, transistor: TransistorSwitch, beeper: Beeper, button: ButtonPin, display: DisplayLab, power: PowerPicker,
};
