'use client';
import s from '../clock.module.css';

export const BIT = { a: 1, b: 2, c: 4, d: 8, e: 16, f: 32, g: 64 };
export const SEG_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
export const DIGIT_MASK = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f];

export const maskOfDigit = (n) => (n >= 0 && n <= 9 ? DIGIT_MASK[n] : 0);
export const digitOfMask = (m) => {
  const i = DIGIT_MASK.indexOf(m);
  return i < 0 ? null : i;
};
export function timeMasks(h, m) {
  return [maskOfDigit(Math.floor(h / 10)), maskOfDigit(h % 10), maskOfDigit(Math.floor(m / 10)), maskOfDigit(m % 10)];
}

function points(key, w, h, t) {
  const hf = t / 2;
  const g = t * 0.16;
  const H = (yc, x0, x1) => [[x0, yc], [x0 + hf, yc - hf], [x1 - hf, yc - hf], [x1, yc], [x1 - hf, yc + hf], [x0 + hf, yc + hf]];
  const V = (xc, y0, y1) => [[xc, y0], [xc + hf, y0 + hf], [xc + hf, y1 - hf], [xc, y1], [xc - hf, y1 - hf], [xc - hf, y0 + hf]];
  const map = {
    a: H(hf, hf + g, w - hf - g),
    g: H(h / 2, hf + g, w - hf - g),
    d: H(h - hf, hf + g, w - hf - g),
    b: V(w - hf, hf + g, h / 2 - g),
    c: V(w - hf, h / 2 + g, h - hf - g),
    f: V(hf, hf + g, h / 2 - g),
    e: V(hf, h / 2 + g, h - hf - g),
  };
  return map[key].map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
}

export function Digit({ x = 0, y = 0, w = 40, h = 72, mask = 0, bright = 1, onToggle }) {
  const t = Math.max(3, w * 0.165);
  return (
    <g transform={`translate(${x} ${y})`}>
      {SEG_KEYS.map((k) => {
        const on = !!(mask & BIT[k]);
        return (
          <polygon
            key={k}
            points={points(k, w, h, t)}
            className={`${on ? s.ledOn : s.ledOff} ${onToggle ? s.ledTap : ''}`}
            style={on ? { opacity: 0.3 + 0.7 * bright } : undefined}
            onClick={onToggle ? () => onToggle(k) : undefined}
          />
        );
      })}
    </g>
  );
}

export function Display4({ x = 0, y = 0, w = 300, h = 100, masks = [0, 0, 0, 0], colon = false, bright = 1 }) {
  const gap = w * 0.025;
  const colonW = w * 0.07;
  const dw = (w - 4 * gap - colonW) / 4;
  const xs = [0, dw + gap, 2 * (dw + gap) + colonW + gap, 3 * (dw + gap) + colonW + gap];
  const cx = 2 * (dw + gap) - gap / 2 + colonW / 2;
  const br = (i) => (Array.isArray(bright) ? bright[i] : bright);
  return (
    <g transform={`translate(${x} ${y})`}>
      {xs.map((dx, i) => (
        <Digit key={i} x={dx} y={0} w={dw} h={h} mask={masks[i]} bright={br(i)} />
      ))}
      <circle cx={cx} cy={h * 0.33} r={Math.max(1.6, h * 0.05)} className={colon ? s.ledOn : s.ledOff} />
      <circle cx={cx} cy={h * 0.67} r={Math.max(1.6, h * 0.05)} className={colon ? s.ledOn : s.ledOff} />
    </g>
  );
}
