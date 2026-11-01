'use client';
import { useEffect, useState } from 'react';
import s from '../clock.module.css';
import Board from './Board';
import { WIDGETS } from './Widgets';
import { PARTS, PARTS_BY_ID } from '../lib/data';
import { Deeper, cx } from './ui';
import { timeMasks } from './Segments';

export default function Explore() {
  const [sel, setSel] = useState('U1');
  const [hover, setHover] = useState(null);
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const part = PARTS_BY_ID[sel];
  const Widget = WIDGETS[part.widget];
  const idx = PARTS.findIndex((p) => p.id === sel);
  const go = (d) => setSel(PARTS[(idx + d + PARTS.length) % PARTS.length].id);
  const masks = now ? timeMasks(now.getHours(), now.getMinutes()) : [0, 0, 0, 0];
  const colon = now ? now.getSeconds() % 2 === 0 : false;
  const hovered = hover ? PARTS_BY_ID[hover] : null;

  return (
    <div className={s.exploreGrid}>
      <div className={s.exploreLeft}>
        <div className={s.boardCard}>
          <Board selected={sel} onSelect={setSel} onHover={setHover} masks={masks} colon={colon} />
          <div className={s.caption} aria-live="polite">
            {hovered ? <><b>{hovered.refs}</b> · {hovered.name}</> : 'Tap any part on the board'}
          </div>
        </div>
        <div className={s.chipRow} role="tablist" aria-label="Parts">
          {PARTS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={sel === p.id} className={cx(s.chip, sel === p.id && s.chipOn)} onClick={() => setSel(p.id)}>
              {p.refs}
            </button>
          ))}
        </div>
      </div>

      <article className={s.partPanel} key={part.id}>
        <div className={s.partTop}>
          <span className={s.partRef}>{part.refs}</span>
          <span className={s.partTag}>{part.tag}</span>
          <div className={s.partNav}>
            <button type="button" className={s.iconBtn} onClick={() => go(-1)} aria-label="Previous part">‹</button>
            <button type="button" className={s.iconBtn} onClick={() => go(1)} aria-label="Next part">›</button>
          </div>
        </div>
        <h3 className={s.partName}>{part.name}</h3>
        <p className={s.partSimple}>{part.simple}</p>
        <p className={s.analogy}><span>Think of it as</span> {part.analogy}</p>
        <p className={s.lookFor}><span>How to spot it</span> {part.look}</p>

        <div className={s.widget}>
          <div className={s.widgetTitle}>Try it</div>
          <Widget part={part} />
        </div>

        <div className={s.calloutRow}>
          <div className={cx(s.callout, s.calloutWarn)}><b>Watch out</b><p>{part.watch}</p></div>
          <div className={cx(s.callout, s.calloutTip)}><b>Soldering tip</b><p>{part.solder}</p></div>
        </div>

        <Deeper>
          {part.detail.map((d, i) => <p key={i} className={s.para}>{d}</p>)}
        </Deeper>
      </article>
    </div>
  );
}
