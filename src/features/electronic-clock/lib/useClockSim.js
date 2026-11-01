"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analyse, runningAt, shapeMasks } from "./sim";
import { timeMasks } from "../components/Segments";
import { beep } from "./audio";

// Runs the clock model in real time. Changing power or faults power-cycles it.
export function useClockSim({
  vin = 5,
  faults = [],
  speed = 60,
  sound = true,
}) {
  const key = faults.join("|");
  const a = useMemo(() => analyse({ vin, faults }), [vin, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const soundRef = useRef(sound);
  const speedRef = useRef(speed);
  const aRef = useRef(a);
  useEffect(() => {
    soundRef.current = sound;
    speedRef.current = speed;
    aRef.current = a;
  }, [sound, speed, a]);

  const st = useRef({
    t0: 0,
    last: 0,
    h: 12,
    m: 0,
    sec: 0,
    mode: 0,
    was: false,
    beepUntil: 0,
    frame: 0,
  });
  const [snap, setSnap] = useState(() => ({
    t: 0,
    running: false,
    masks: [0, 0, 0, 0],
    colon: false,
    mode: 0,
    beeping: false,
    h: 12,
    m: 0,
  }));

  const powerCycle = useCallback(() => {
    const now = performance.now();
    Object.assign(st.current, {
      t0: now,
      last: now,
      h: 12,
      m: 0,
      sec: 0,
      mode: 0,
      was: false,
      beepUntil: 0,
    });
  }, []);

  useEffect(() => {
    powerCycle();
  }, [a, powerCycle]);

  useEffect(() => {
    let raf;
    const loop = (now) => {
      const s = st.current;
      if (!s.t0) {
        s.t0 = now;
        s.last = now;
      }
      const dt = Math.min(0.25, (now - s.last) / 1000);
      s.last = now;
      const cur = aRef.current;
      const t = (now - s.t0) / 1000;
      const running = runningAt(cur, t);
      if (running && !s.was) {
        s.h = 12;
        s.m = 0;
        s.sec = 0;
        s.mode = 0;
      }
      s.was = running;
      if (running && s.mode === 0) {
        s.sec += dt * speedRef.current;
        while (s.sec >= 60) {
          s.sec -= 60;
          s.m += 1;
        }
        while (s.m >= 60) {
          s.m -= 60;
          s.h = (s.h + 1) % 24;
        }
      }
      s.frame += 1;
      if (s.frame % 2 === 0) {
        const blinkOff = Math.floor(now / 250) % 2 === 1;
        let masks = timeMasks(s.h, s.m);
        if (s.mode === 1 && blinkOff) masks = [0, 0, masks[2], masks[3]];
        if (s.mode === 2 && blinkOff) masks = [masks[0], masks[1], 0, 0];
        masks = running ? shapeMasks(cur, masks) : [0, 0, 0, 0];
        const colon =
          running && (s.mode !== 0 || Math.floor(now / 500) % 2 === 0);
        setSnap({
          t,
          running,
          masks,
          colon,
          mode: s.mode,
          beeping: now < s.beepUntil,
          h: s.h,
          m: s.m,
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const press = useCallback((btn) => {
    const s = st.current;
    const cur = aRef.current;
    const t = (performance.now() - s.t0) / 1000;
    if (!runningAt(cur, t)) return;
    if (btn === 2 && !cur.s2Ok) return;
    if (btn === 1) s.mode = (s.mode + 1) % 3;
    if (btn === 2) {
      if (s.mode === 1) s.h = (s.h + 1) % 24;
      if (s.mode === 2) {
        s.m = (s.m + 1) % 60;
        s.sec = 0;
      }
    }
    if (cur.buzzerOk) {
      s.beepUntil = performance.now() + 140;
      if (soundRef.current) beep();
    }
  }, []);

  return { a, ...snap, bright: a.bright, press, powerCycle };
}
