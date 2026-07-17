"use client";

import { useEffect, useId, useRef } from "react";
import { useFocus } from "../state/store";
import { ACCENTS, MODE_LABEL } from "../lib/config";
import { formatTime } from "../lib/format";

/** Round to 3 dp so server and client emit byte-identical SVG coordinate
 *  strings (unrounded `Math.cos/sin` results differ in float precision across
 *  the two renders and cause hydration mismatches). */
const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * The centrepiece: a layered SVG progress ring driven by its own
 * requestAnimationFrame loop that reads the store's `progressRef` every frame,
 * so the sweep is buttery and never triggers React re-renders. Only the digit
 * readout updates from state (~1×/sec).
 *
 * Depth is built from stacked layers (outer → in):
 *   • a soft breathing aura glow behind everything
 *   • a fine tick dial (60 marks) for an instrument feel
 *   • a recessed track groove
 *   • the gradient progress arc with a drop-shadow glow
 *   • a bright leading "head" dot that rides the arc tip
 *   • a recessed inner disc the readout sits on
 * Reduced-motion disables the breathing; colours transition smoothly on accent
 * / mode change.
 */
export function TimerRing({ size = 320 }: { size?: number }) {
  const { progressRef, remainingMsRef, phase, mode, settings, remainingLabel } =
    useFocus();

  const circleRef = useRef<SVGCircleElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const gid = useId().replace(/:/g, "");

  const stroke = 12;
  const r = (size - stroke) / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const accent = ACCENTS[settings.accent].color;

  // Drive the arc, head dot, and digits directly from refs each frame.
  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;

    const render = () => {
      const p = Math.min(1, Math.max(0, progressRef.current));
      el.style.strokeDashoffset = `${circumference * (1 - p)}`;

      if (headRef.current) {
        // Position the leading dot at the current arc angle. The <svg> is
        // rotated -90° so angle 0 is at 12 o'clock; progress sweeps clockwise.
        const angle = p * 2 * Math.PI - Math.PI / 2;
        headRef.current.setAttribute("cx", `${cx + r * Math.cos(angle)}`);
        headRef.current.setAttribute("cy", `${cy + r * Math.sin(angle)}`);
        headRef.current.style.opacity = p > 0.002 && p < 0.999 ? "1" : "0";
      }

      if (timeRef.current) {
        timeRef.current.textContent = formatTime(
          remainingMsRef.current / 1000,
          settings.hideSeconds,
        );
      }
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [
    circumference,
    cx,
    cy,
    r,
    progressRef,
    remainingMsRef,
    settings.hideSeconds,
  ]);

  const running = phase === "running";
  const breathe = running && settings.animations;

  // 60 tick marks around the dial.
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const tickOuter = r + stroke / 2 + 6;

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
      role="timer"
      aria-live="off"
      aria-label={`${MODE_LABEL[mode]} timer, ${formatTime(remainingLabel, settings.hideSeconds)} remaining`}
    >
      {/* Breathing aura */}
      <div
        aria-hidden="true"
        className={breathe ? "focus-breathe" : ""}
        style={{
          position: "absolute",
          inset: "6%",
          borderRadius: "9999px",
          background: `radial-gradient(circle, color-mix(in oklch, ${accent} 26%, transparent), transparent 68%)`,
          filter: "blur(30px)",
          opacity: running ? 1 : 0.4,
          transition: "opacity 500ms ease",
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={`grad-${gid}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={`color-mix(in oklch, ${accent} 72%, white)`}
            />
            <stop offset="55%" stopColor={accent} />
            <stop
              offset="100%"
              stopColor={`color-mix(in oklch, ${accent} 70%, var(--color-primary))`}
            />
          </linearGradient>
          <radialGradient id={`disc-${gid}`} cx="50%" cy="42%" r="70%">
            <stop
              offset="0%"
              stopColor="color-mix(in oklch, var(--color-surface) 92%, transparent)"
            />
            <stop offset="100%" stopColor="var(--color-surface-2)" />
          </radialGradient>
          <filter
            id={`soft-${gid}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="4"
              floodColor={accent}
              floodOpacity="0.55"
            />
          </filter>
        </defs>

        {/* Tick dial. Coordinates are rounded so the server- and client-rendered
            strings are byte-identical — unrounded trig results serialize at
            different float precision on each side and trip hydration. */}
        <g opacity="0.5">
          {ticks.map((i) => {
            const a = (i / 60) * 2 * Math.PI - Math.PI / 2;
            const major = i % 5 === 0;
            const inner = tickOuter - (major ? 8 : 4);
            const cos = Math.cos(a);
            const sin = Math.sin(a);
            return (
              <line
                key={i}
                x1={round(cx + tickOuter * cos)}
                y1={round(cy + tickOuter * sin)}
                x2={round(cx + inner * cos)}
                y2={round(cy + inner * sin)}
                stroke="var(--color-border)"
                strokeWidth={major ? 1.6 : 0.8}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* Recessed inner disc */}
        <circle
          cx={cx}
          cy={cy}
          r={r - stroke / 2 - 2}
          fill={`url(#disc-${gid})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r - stroke / 2 - 2}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Rotate the arc layer so 0 is at the top and it sweeps clockwise. */}
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {/* Track groove */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={stroke}
            opacity={0.9}
          />
          {/* Progress arc */}
          <circle
            ref={circleRef}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#grad-${gid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            filter={`url(#soft-${gid})`}
            style={{ transition: "stroke 400ms ease" }}
          />
          {/* Leading head dot */}
          <circle
            ref={headRef}
            cx={cx}
            cy={cy - r}
            r={stroke / 2 + 1.5}
            fill="white"
            stroke={accent}
            strokeWidth="2.5"
            style={{
              opacity: 0,
              filter: `drop-shadow(0 0 6px color-mix(in oklch, ${accent} 70%, transparent))`,
              transition: "opacity 250ms ease",
            }}
          />
        </g>
      </svg>

      {/* Center readout */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="microlabel mb-1.5 text-[var(--color-muted-foreground)]">
          {MODE_LABEL[mode]}
        </span>
        <div
          ref={timeRef}
          className="font-display text-6xl font-semibold tracking-tight tabular-nums sm:text-7xl"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatTime(remainingLabel, settings.hideSeconds)}
        </div>
        <span className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
          <span
            className="inline-block size-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: running
                ? "var(--color-ok)"
                : phase === "paused"
                  ? "var(--color-warn)"
                  : "var(--color-muted-foreground)",
            }}
          />
          {phase === "running"
            ? "In focus"
            : phase === "paused"
              ? "Paused"
              : "Ready"}
        </span>
      </div>
    </div>
  );
}
