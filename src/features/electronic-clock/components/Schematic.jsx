'use client';
import s from '../clock.module.css';
import { Display4 } from './Segments';
import { FAULTS, NODES } from '../lib/sim';
import { cx } from './ui';

const RINGS = {
  J1: [[40, 182, 60, 78]],
  U1: [[294, 124, 172, 214]],
  C3: [[170, 86, 40, 30]],
  R1: [[170, 262, 40, 52]],
  Y1: [[243, 212, 44, 36]],
  C12: [[203, 324, 44, 30], [223, 356, 44, 28]],
  Q1: [[530, 290, 56, 42]],
  BZ1: [[553, 346, 44, 44]],
  S2: [[400, 356, 40, 40]],
  DS1: [[596, 76, 148, 168]],
};

const TP = { VIN: [100, 40], VCC: [380, 86], RST: [232, 160], XTAL: [283, 205], BASE: [540, 275], BUZ: [575, 342] };

export default function Schematic({ a, probe, onProbe, running, beeping, masks, colon, bright, showFaults, faults }) {
  const bad = (id) => showFaults && FAULTS.some((f) => faults.includes(f.id) && f.part === id);
  const live = a.rail > 2.7 && !a.reversed;
  const W = (pts, extra) => <polyline points={pts} className={cx(s.sw, live && s.swLive, extra)} />;
  const G = (pts) => <polyline points={pts} className={s.sw} />;

  return (
    <svg viewBox="0 0 760 450" className={s.schem} role="img" aria-label="Circuit schematic of the electronic clock. Tap a test point to probe it.">
      {/* rails */}
      {W('70,40 720,40')}
      {G('70,420 720,420')}
      <text x={716} y={32} textAnchor="end" className={s.slabel}>+5 V rail</text>
      <text x={78} y={440} className={s.slabel}>ground rail</text>

      {/* J1 power */}
      {W('70,40 70,196')}
      <line x1={54} y1={196} x2={86} y2={196} className={s.sym} />
      <line x1={62} y1={210} x2={78} y2={210} className={s.sym} />
      {G('70,210 70,420')}
      <text x={92} y={206} className={s.sref}>J1</text>
      <text x={40} y={196} className={s.slabel}>+</text>

      {/* C4 */}
      {W('130,40 130,214')}
      <line x1={118} y1={214} x2={142} y2={214} className={s.sym} /><line x1={118} y1={226} x2={142} y2={226} className={s.sym} />
      {G('130,226 130,420')}
      <text x={146} y={224} className={s.sref}>C4</text>

      {/* C5 — bypass right at the chip. Same topology as C4 (rail to ground), drawn alongside it. */}
      {W('160,40 160,202')}
      <line x1={148} y1={202} x2={172} y2={202} className={s.sym} /><line x1={148} y1={214} x2={172} y2={214} className={s.sym} />
      {G('160,214 160,420')}
      <text x={176} y={212} className={s.sref}>C5</text>

      {/* C3 + R1 reset column */}
      {W('190,40 190,92')}
      <line x1={178} y1={92} x2={202} y2={92} className={s.sym} /><line x1={178} y1={104} x2={202} y2={104} className={s.sym} />
      <text x={206} y={90} className={s.slabel}>+</text>
      {W('190,104 190,160', s.swRst)}
      <text x={206} y={102} className={s.sref}>C3</text>
      {W('190,160 300,160', s.swRst)}
      <circle cx={190} cy={160} r={3.5} className={s.dotFill} />
      {W('190,160 190,266', s.swRst)}
      <rect x={181} y={266} width={18} height={44} className={s.sym} />
      {G('190,310 190,420')}
      <text x={206} y={290} className={s.sref}>R1</text>

      {/* crystal */}
      <polyline points="265,205 300,205" className={s.sw} />
      <polyline points="265,255 300,255" className={s.sw} />
      <polyline points="265,205 265,219" className={s.sw} />
      <polyline points="265,241 265,255" className={s.sw} />
      <line x1={253} y1={219} x2={277} y2={219} className={s.sym} /><line x1={253} y1={241} x2={277} y2={241} className={s.sym} />
      <rect x={260} y={223} width={10} height={14} className={cx(s.sym, a.oscOk && s.vibrateSvg)} />
      <text x={280} y={235} className={s.sref}>Y1</text>
      <circle cx={265} cy={205} r={3.5} className={s.dotFill} /><circle cx={265} cy={255} r={3.5} className={s.dotFill} />
      {/* C1 */}
      <polyline points="265,205 225,205 225,330" className={s.sw} />
      <line x1={213} y1={330} x2={237} y2={330} className={s.sym} /><line x1={213} y1={342} x2={237} y2={342} className={s.sym} />
      {G('225,342 225,420')}
      <text x={170} y={340} className={s.sref}>C1</text>
      {/* C2 */}
      <polyline points="265,255 245,255 245,362" className={s.sw} />
      <line x1={233} y1={362} x2={257} y2={362} className={s.sym} /><line x1={233} y1={374} x2={257} y2={374} className={s.sym} />
      {G('245,374 245,420')}
      <text x={262} y={372} className={s.sref}>C2</text>

      {/* MCU */}
      <rect x={300} y={130} width={160} height={200} rx={6} className={cx(s.mcuBox, running && s.mcuRun)} />
      <path d="M368 130 a12 12 0 0 0 24 0" className={s.sym} />
      <text x={380} y={300} textAnchor="middle" className={s.sref}>U1 · AT89C2051</text>
      {W('380,40 380,130')}
      {G('380,330 380,420')}
      <text x={388} y={150} className={s.slabel}>20 VCC</text>
      <text x={388} y={322} className={s.slabel}>10 GND</text>
      <text x={306} y={164} className={s.slabel}>1 RST</text>
      <text x={306} y={209} className={s.slabel}>5 XTAL1</text>
      <text x={306} y={259} className={s.slabel}>4 XTAL2</text>
      <text x={454} y={168} textAnchor="end" className={s.slabel}>segments</text>
      <text x={454} y={218} textAnchor="end" className={s.slabel}>digit select</text>
      <text x={454} y={268} textAnchor="end" className={s.slabel}>buzzer</text>

      {/* buses to display */}
      <polyline points="460,175 600,175" className={cx(s.sw, s.bus)} />
      <polyline points="460,225 600,225" className={cx(s.sw, s.bus)} />
      <text x={470} y={170} className={s.slabel}>8</text><text x={470} y={220} className={s.slabel}>4</text>

      {/* buzzer chain */}
      <polyline points="460,275 500,275" className={s.sw} />
      <rect x={500} y={267} width={30} height={16} className={s.sym} />
      <text x={503} y={262} className={s.sref}>R2</text>
      <polyline points="530,275 540,275 540,310 548,310" className={s.sw} />
      <line x1={548} y1={298} x2={548} y2={322} className={s.sym} />
      <polyline points="548,304 575,285" className={s.sw} />
      <polyline points="548,316 575,335 575,350" className={s.sw} />
      {W('575,285 575,40')}
      <polygon points="560,292 568,288 565,297" className={s.dotFill} />
      <text x={590} y={310} className={s.sref}>Q1</text>
      <circle cx={575} cy={368} r={18} className={cx(s.sym, beeping && a.buzzerOk && s.buzzOn)} />
      <text x={575} y={372} textAnchor="middle" className={s.slabel}>BZ1</text>
      {G('575,386 575,420')}
      {beeping && a.buzzerOk && <g className={s.waves}><path d="M600 360 q8 8 0 16" /><path d="M608 354 q14 14 0 28" /></g>}

      {/* buttons */}
      <polyline points="340,330 340,356" className={s.sw} />
      <circle cx={340} cy={364} r={3} className={s.dotRing} /><circle cx={340} cy={392} r={3} className={s.dotRing} />
      <line x1={330} y1={372} x2={350} y2={372} className={s.sym} />
      {G('340,395 340,420')}
      <text x={354} y={382} className={s.sref}>S1</text>
      <polyline points="420,330 420,356" className={s.sw} />
      <circle cx={420} cy={364} r={3} className={s.dotRing} /><circle cx={420} cy={392} r={3} className={s.dotRing} />
      <line x1={410} y1={372} x2={430} y2={372} className={s.sym} />
      {G('420,395 420,420')}
      <text x={434} y={382} className={s.sref}>S2</text>

      {/* display */}
      <rect x={600} y={80} width={136} height={160} rx={6} className={s.mcuBox} />
      <text x={608} y={98} className={s.sref}>DS1</text>
      <rect x={608} y={108} width={120} height={50} rx={3} className={s.dispGlass} />
      <Display4 x={614} y={114} w={108} h={38} masks={masks} colon={colon} bright={bright} />
      <text x={608} y={186} className={s.slabel}>4-digit display</text>
      <text x={608} y={222} className={s.slabel}>digit select in</text>

      {/* fault rings */}
      {showFaults && Object.keys(RINGS).filter(bad).map((id) => RINGS[id].map((r, i) => (
        <rect key={`${id}${i}`} x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx={8} className={s.faultRing} />
      )))}
      {a.over && showFaults && <rect x={RINGS.J1[0][0]} y={RINGS.J1[0][1]} width={RINGS.J1[0][2]} height={RINGS.J1[0][3]} rx={8} className={s.faultRing} />}

      {/* test points */}
      {NODES.map((n) => {
        const [x, y] = TP[n.id];
        const on = probe === n.id;
        return (
          <g key={n.id} className={cx(s.tp, on && s.tpOn)} onClick={() => onProbe(n.id)} tabIndex={0} role="button" aria-label={`Probe ${n.label}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProbe(n.id); } }}>
            <circle cx={x} cy={y} r={14} className={s.tpHit} />
            <circle cx={x} cy={y} r={6} className={s.tpDot} />
            <text x={x} y={y - 12} textAnchor="middle" className={s.tpText}>{n.label}</text>
          </g>
        );
      })}
      <g>
        <circle cx={34} cy={420} r={6} className={s.probeBlack} />
        <text x={14} y={406} className={s.slabel}>black probe</text>
      </g>
    </svg>
  );
}
