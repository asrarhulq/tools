'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import s from '../clock.module.css';

export const DetailCtx = createContext({ detailed: false });
export const useDetail = () => useContext(DetailCtx);

// A "Go deeper" fold. Opens by itself when the page is set to Detailed.
export function Deeper({ children, label = 'Go deeper' }) {
  const { detailed } = useDetail();
  const [open, setOpen] = useState(false);
  const show = detailed || open;
  return (
    <div className={s.deeper}>
      {!detailed && (
        <button type="button" className={s.deeperBtn} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className={s.deeperPlus}>{open ? '−' : '+'}</span> {open ? 'Show less' : label}
        </button>
      )}
      {show && <div className={s.deeperBody}>{children}</div>}
    </div>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className={s.segmented} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`${s.segBtn} ${value === o.value ? s.segBtnOn : ''}`}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Section({ id, kicker, title, lede, children }) {
  return (
    <section id={id} className={s.section}>
      <div className={s.wrap}>
        <header className={s.sectionHead}>
          <p className={s.kicker}>{kicker}</p>
          <h2 className={s.h2}>{title}</h2>
          {lede && <p className={s.lede}>{lede}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}

// localStorage-backed state that is safe for server rendering.
export function useStored(key, initial) {
  const k = `eclock:${key}`;
  const [v, setV] = useState(initial);
  useEffect(() => {
    const hydrate = () => {
      try {
        const raw = localStorage.getItem(k);
        if (raw !== null) setV(JSON.parse(raw));
      } catch { /* storage may be blocked */ }
    };
    hydrate();
  }, [k]);
  const set = useCallback((next) => {
    setV((prev) => {
      const val = typeof next === 'function' ? next(prev) : next;
      try { localStorage.setItem(k, JSON.stringify(val)); } catch { /* ignore */ }
      return val;
    });
  }, [k]);
  return [v, set];
}

export const cx = (...a) => a.filter(Boolean).join(' ');
