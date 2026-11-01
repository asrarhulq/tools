'use client';
import { useEffect, useState } from 'react';
import s from '../clock.module.css';
import Board from './Board';
import { JOURNEY, PARTS_BY_ID } from '../lib/data';
import { Deeper, cx } from './ui';
import { timeMasks } from './Segments';

export default function Journey() {
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);
  const step = JOURNEY[i];

  useEffect(() => {
    if (!play) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % JOURNEY.length), 3600);
    return () => clearInterval(id);
  }, [play]);

  const lit = i >= 4;
  const masks = lit ? timeMasks(12, 0) : [0, 0, 0, 0];

  return (
    <div className={s.journeyGrid}>
      <div className={s.boardCard}>
        <Board highlight={step.parts} masks={masks} colon={lit} compact />
        <div className={s.caption}>
          {step.parts.map((id) => PARTS_BY_ID[id].refs).join('  ·  ')}
        </div>
      </div>

      <div>
        <ol className={s.timeline}>
          {JOURNEY.map((st, n) => (
            <li key={st.id}>
              <button type="button" className={cx(s.tlItem, n === i && s.tlOn, n < i && s.tlDone)} onClick={() => { setI(n); setPlay(false); }}>
                <span className={s.tlDot}>{n + 1}</span>
                <span className={s.tlText}>{st.title}</span>
              </button>
            </li>
          ))}
        </ol>

        <article className={s.stepCardBig} key={step.id}>
          <div className={s.stepTime}>{step.time}</div>
          <h3 className={s.stepTitle}>{step.title}</h3>
          <p className={s.partSimple}>{step.simple}</p>
          <div className={s.statRow}>{step.stats.map((x) => <span key={x} className={s.stat}>{x}</span>)}</div>
          <Deeper><p className={s.para}>{step.detail}</p></Deeper>
        </article>

        <div className={s.stepControls}>
          <button type="button" className={s.btn} onClick={() => { setI((n) => (n - 1 + JOURNEY.length) % JOURNEY.length); setPlay(false); }}>Back</button>
          <button type="button" className={s.btnPrimary} onClick={() => setPlay((p) => !p)}>{play ? 'Pause' : 'Play the power-up'}</button>
          <button type="button" className={s.btn} onClick={() => { setI((n) => (n + 1) % JOURNEY.length); setPlay(false); }}>Next</button>
        </div>
      </div>
    </div>
  );
}
