'use client';
import s from '../clock.module.css';
import { Display4 } from './Segments';
import { PARTS_BY_ID } from '../lib/data';
import { cx } from './ui';

// [x, y, w, h] clickable areas. C1 and C2 both belong to the part "C12".
export const HITS = [
  { id: 'DS1', box: [60, 36, 560, 128] },
  { id: 'U1', box: [92, 188, 238, 86] },
  { id: 'C3', box: [42, 196, 36, 36] },
  { id: 'C5', box: [194, 166, 34, 30] },
  { id: 'R1', box: [38, 238, 30, 72] },
  { id: 'Y1', box: [98, 296, 88, 40] },
  { id: 'C12', k: 'a', box: [58, 316, 30, 38] },
  { id: 'C12', k: 'b', box: [200, 316, 30, 38] },
  { id: 'S1', box: [260, 290, 56, 56] },
  { id: 'S2', box: [334, 290, 56, 56] },
  { id: 'Q1', box: [364, 192, 44, 46] },
  { id: 'R2', box: [412, 190, 28, 66] },
  { id: 'C4', box: [440, 266, 26, 34] },
  { id: 'BZ1', box: [474, 192, 92, 92] },
  { id: 'J1', box: [528, 316, 104, 60] },
];

function Resistor({ x, y, w, h }) {
  const bands = ['#7a4a22', '#111', '#e9791f'];
  return (
    <g>
      <line x1={x + w / 2} y1={y - 10} x2={x + w / 2} y2={y + h + 10} className={s.lead} />
      <rect x={x} y={y} width={w} height={h} rx={5} className={s.resBody} />
      {bands.map((c, i) => (
        <rect key={i} x={x} y={y + 9 + i * 9} width={w} height={4} fill={c} />
      ))}
      <rect x={x} y={y + h - 11} width={w} height={4} fill="#c8a24a" />
    </g>
  );
}

function IC() {
  const pins = Array.from({ length: 10 });
  return (
    <g>
      {pins.map((_, i) => (
        <g key={i}>
          <rect x={102 + i * 22} y={188} width={9} height={11} className={s.pinMetal} />
          <rect x={102 + i * 22} y={263} width={9} height={11} className={s.pinMetal} />
        </g>
      ))}
      <rect x={96} y={198} width={230} height={66} rx={4} className={s.icBody} />
      <path d="M96 218 a9 9 0 0 1 0 26" className={s.icNotch} />
      <circle cx={112} cy={254} r={3} className={s.icDot} />
      <text x={150} y={226} className={s.icText}>ATMEL 9843</text>
      <text x={150} y={248} className={s.icText}>AT89C2051-24PI</text>
    </g>
  );
}

export default function Board({ selected, onSelect, highlight = [], badges = {}, masks = [0, 0, 0, 0], colon = false, bright = 1, onHover, compact = false }) {
  const interactive = !!onSelect;
  return (
    <svg viewBox="0 0 680 410" className={cx(s.boardSvg, compact && s.boardCompact)} role="img" aria-label="Top view of the clock circuit board">
      {/* board */}
      <rect x={20} y={20} width={640} height={372} rx={16} className={s.pcb} />
      <g className={s.traces}>
        <polyline points="40,176 40,190" /><polyline points="620,164 640,164 640,300" />
        <polyline points="330,230 358,230 358,214" /><polyline points="274,274 274,290" />
        <polyline points="150,274 150,296" /><polyline points="400,274 400,290 340,290" />
        <polyline points="560,284 560,316" /><polyline points="98,336 62,336 62,352" />
      </g>
      <circle cx={642} cy={40} r={7} className={s.hole} />
      <circle cx={36} cy={372} r={7} className={s.hole} />

      {/* display */}
      <g>
        <rect x={60} y={36} width={560} height={128} rx={6} className={s.dispFrame} />
        <rect x={70} y={44} width={540} height={112} rx={3} className={s.dispGlass} />
        <Display4 x={96} y={54} w={470} h={92} masks={masks} colon={colon} bright={bright} />
      </g>
      {/* header strip behind chip */}
      <rect x={96} y={168} width={230} height={9} rx={2} className={s.pinHeader} />

      <IC />

      {/* C5 bypass cap, standing right above the chip, marked 102J */}
      <g>
        <line x1={206} y1={189} x2={206} y2={199} className={s.lead} />
        <line x1={216} y1={189} x2={216} y2={199} className={s.lead} />
        <ellipse cx={211} cy={180} rx={10} ry={11} className={s.ceramic} />
      </g>

      {/* C3 electrolytic */}
      <g>
        <circle cx={60} cy={214} r={16} className={s.elecBody} />
        <path d="M60 198 a16 16 0 0 0 0 32 Z" className={s.elecStripe} />
        <text x={52} y={218} className={s.elecMinus}>−</text>
      </g>
      <Resistor x={44} y={248} w={16} h={44} />
      {/* crystal */}
      <g>
        <line x1={110} y1={334} x2={110} y2={344} className={s.lead} />
        <line x1={174} y1={334} x2={174} y2={344} className={s.lead} />
        <rect x={100} y={304} width={84} height={30} rx={14} className={s.xtalBody} />
        <text x={116} y={324} className={s.xtalText}>12.000</text>
      </g>
      {/* ceramic caps */}
      <g>
        <ellipse cx={72} cy={330} rx={9} ry={11} className={s.ceramic} />
        <line x1={68} y1={340} x2={68} y2={352} className={s.lead} /><line x1={76} y1={340} x2={76} y2={352} className={s.lead} />
        <ellipse cx={214} cy={330} rx={9} ry={11} className={s.ceramic} />
        <line x1={210} y1={340} x2={210} y2={352} className={s.lead} /><line x1={218} y1={340} x2={218} y2={352} className={s.lead} />
      </g>
      {/* buttons */}
      {[288, 362].map((cxp, i) => (
        <g key={cxp}>
          <rect x={cxp - 26} y={292} width={52} height={52} rx={5} className={s.btnBase} />
          <circle cx={cxp} cy={318} r={14} className={s.btnCap} />
          <circle cx={cxp} cy={318} r={7} className={s.btnCapInner} />
          <text x={cxp - 8} y={360} className={s.silk}>S{i + 1}</text>
        </g>
      ))}
      {/* transistor */}
      <g transform="translate(386 214)">
        <path d="M-16 14 L-16 -2 A16 16 0 0 1 16 -2 L16 14 Z" className={s.q1Body} />
        <text x={-13} y={7} className={s.q1Text}>8550</text>
        <line x1={-8} y1={14} x2={-8} y2={26} className={s.lead} /><line x1={0} y1={14} x2={0} y2={26} className={s.lead} /><line x1={8} y1={14} x2={8} y2={26} className={s.lead} />
      </g>
      <Resistor x={418} y={200} w={14} h={44} />
      {/* C4 */}
      <g>
        <rect x={444} y={270} width={18} height={26} rx={4} className={s.c4Body} />
        <line x1={449} y1={296} x2={449} y2={306} className={s.lead} /><line x1={457} y1={296} x2={457} y2={306} className={s.lead} />
      </g>
      {/* buzzer */}
      <g>
        <circle cx={520} cy={238} r={46} className={s.buzzBody} />
        <circle cx={520} cy={238} r={36} className={s.buzzRing} />
        <circle cx={520} cy={238} r={7} className={s.buzzHole} />
        <text x={482} y={212} className={s.buzzPlus}>+</text>
      </g>
      {/* terminal */}
      <g>
        <rect x={532} y={320} width={96} height={52} rx={4} className={s.terminal} />
        {[560, 600].map((tx) => (
          <g key={tx}>
            <circle cx={tx} cy={346} r={14} className={s.screw} />
            <line x1={tx - 8} y1={346} x2={tx + 8} y2={346} className={s.screwSlot} />
          </g>
        ))}
        <text x={536} y={314} className={s.silk}>+</text>
        <text x={620} y={314} className={s.silk}>−</text>
      </g>

      {/* silkscreen labels */}
      <text x={104} y={290} className={s.silk}>U1</text>
      <text x={224} y={172} className={s.silk}>C5</text>
      <text x={40} y={192} className={s.silk}>C3</text>
      <text x={20} y={248} className={s.silk}>R1</text>
      <text x={134} y={354} className={s.silk}>Y1</text>
      <text x={62} y={368} className={s.silk}>C1</text>
      <text x={206} y={368} className={s.silk}>C2</text>
      <text x={366} y={252} className={s.silk}>Q1</text>
      <text x={414} y={260} className={s.silk}>R2</text>
      <text x={440} y={316} className={s.silk}>C4</text>
      <text x={500} y={300} className={s.silk}>BZ1</text>
      <text x={570} y={388} className={s.silk}>J1</text>

      {/* hit areas, halos and badges */}
      {HITS.map((h, i) => {
        const [x, y, w, hh] = h.box;
        const sel = selected === h.id;
        const hi = highlight.includes(h.id);
        const part = PARTS_BY_ID[h.id];
        return (
          <g key={`${h.id}${h.k || ''}${i}`}>
            {(sel || hi) && <rect x={x - 3} y={y - 3} width={w + 6} height={hh + 6} rx={8} className={sel ? s.haloSel : s.haloHi} />}
            <rect
              x={x} y={y} width={w} height={hh} rx={6}
              className={cx(s.hit, interactive && s.hitLive)}
              tabIndex={interactive ? 0 : -1}
              role={interactive ? 'button' : undefined}
              aria-label={part ? `${part.refs}, ${part.name}` : h.id}
              onClick={interactive ? () => onSelect(h.id) : undefined}
              onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(h.id); } } : undefined}
              onMouseEnter={onHover ? () => onHover(h.id) : undefined}
              onMouseLeave={onHover ? () => onHover(null) : undefined}
            />
            {badges[h.id] && !h.k && (
              <g transform={`translate(${x + 2} ${y + 2})`}>
                <circle r={11} className={s.badge} />
                <text y={4} textAnchor="middle" className={s.badgeText}>{badges[h.id]}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
