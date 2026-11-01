'use client';
import { useEffect, useRef, useState } from 'react';
import s from './clock.module.css';
import { DetailCtx, FullscreenButton, Section, Segmented, useFullscreen, useStored, cx } from './components/ui';
import Explore from './components/Explore';
import Journey from './components/Journey';
import Build from './components/Build';
import Lab from './components/Lab';
import { Display4, timeMasks } from './components/Segments';
import { PARTS, BUILD_STEPS } from './lib/data';
import { FAULTS } from './lib/sim';

const NAV = [
  { id: 'board', label: 'The board' },
  { id: 'how', label: 'How it works' },
  { id: 'build', label: 'Build it' },
  { id: 'lab', label: 'Lab' },
];

export default function ElectronicClock() {
  const [mode, setMode] = useStored('mode', 'simple');
  const [active, setActive] = useState('board');
  const [now, setNow] = useState(null);
  const rootRef = useRef(null);
  const [fullscreen, toggleFullscreen] = useFullscreen(rootRef);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean);
    if (!('IntersectionObserver' in window) || !els.length) return undefined;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (vis) setActive(vis.target.id);
    }, { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.2, 0.5] });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const masks = now ? timeMasks(now.getHours(), now.getMinutes()) : [0, 0, 0, 0];
  const colon = now ? now.getSeconds() % 2 === 0 : false;

  return (
    <DetailCtx.Provider value={{ detailed: mode === 'detailed' }}>
      <div ref={rootRef} className={s.root} style={fullscreen ? { '--stick': '0px' } : undefined}>
        <header className={s.header}>
          <div className={cx(s.wrap, s.headerInner)}>
            <a href="#top" className={s.brand}>
              <span className={s.brandMark} aria-hidden="true" />
              <span>Electronic clock</span>
            </a>
            <nav className={s.nav} aria-label="Sections">
              {NAV.map((n) => (
                <a key={n.id} href={`#${n.id}`} className={cx(s.navLink, active === n.id && s.navOn)}>{n.label}</a>
              ))}
            </nav>
            <Segmented label="Explanation depth" value={mode} onChange={setMode} options={[{ value: 'simple', label: 'Simple' }, { value: 'detailed', label: 'Detailed' }]} />
            <FullscreenButton on={fullscreen} toggle={toggleFullscreen} />
          </div>
        </header>

        <div id="top" className={s.hero}>
          <div className={s.wrap}>
            <p className={s.kicker}>A four-digit clock, part by part</p>
            <h1 className={s.heroTitle}>Electronic clock</h1>
            <p className={s.heroSub}>One chip, one crystal and a handful of small parts. Learn what each one does, solder it properly, then break it on purpose and find the fault.</p>
            <div className={s.heroDisplay} aria-hidden="true">
              <svg viewBox="0 0 400 120">
                <Display4 x={14} y={14} w={372} h={92} masks={masks} colon={colon} />
              </svg>
            </div>
            <dl className={s.heroMeta}>
              <div><dt>{PARTS.length}</dt><dd>parts explained</dd></div>
              <div><dt>{BUILD_STEPS.length}</dt><dd>build steps</dd></div>
              <div><dt>{FAULTS.length}</dt><dd>faults to hunt</dd></div>
            </dl>
          </div>
        </div>

        <main>
          <Section id="board" kicker="01 · The board" title="Meet every part" lede="Tap a part on the board. Each one has a plain explanation, a small experiment to play with, and a deeper layer when you want it.">
            <Explore />
          </Section>
          <Section id="how" kicker="02 · How it works" title="From power to time" lede="Six things happen, in order, the instant you connect 5 V. Step through them and watch the board.">
            <Journey />
          </Section>
          <Section id="build" kicker="03 · Build it" title="Soldering, done properly" lede="The tools, the five-count that makes a good joint, a way to train your eye, and the build in the right order.">
            <Build />
          </Section>
          <Section id="lab" kicker="04 · Lab" title="Simulate it, break it, debug it" lede="A working model of this exact clock. Change the power, plant soldering mistakes, probe with a meter, and follow the chain to the fault.">
            <Lab />
          </Section>
        </main>

        <footer className={s.footer}>
          <div className={s.wrap}>
            <p>The simulator is a teaching model of this style of kit. Pin assignments and button behaviour can differ slightly between batches, so always trust your own board and a multimeter.</p>
          </div>
        </footer>
      </div>
    </DetailCtx.Provider>
  );
}
