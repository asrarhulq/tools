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

// Full screen for one element (the guide's own root), not the whole tab.
export function useFullscreen(ref) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const onChange = () => setOn(!!document.fullscreenElement && document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [ref]);
  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
      } else {
        (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
      }
    } catch { /* full screen may be blocked by the browser */ }
  }, [ref]);
  return [on, toggle];
}

export function FullscreenButton({ on, toggle }) {
  return (
    <button type="button" className={s.iconBtn} onClick={toggle} aria-label={on ? 'Exit full screen' : 'Full screen'} title={on ? 'Exit full screen' : 'Full screen'}>
      {on ? (
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
          <path d="M6 2v3a1 1 0 0 1-1 1H2M10 2v3a1 1 0 0 0 1 1h3M6 14v-3a1 1 0 0 0-1-1H2M10 14v-3a1 1 0 0 1 1-1h3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
          <path d="M2 6V3a1 1 0 0 1 1-1h3M14 6V3a1 1 0 0 0-1-1h-3M2 10v3a1 1 0 0 0 1 1h3M14 10v3a1 1 0 0 1-1 1h-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export const cx = (...a) => a.filter(Boolean).join(' ');
