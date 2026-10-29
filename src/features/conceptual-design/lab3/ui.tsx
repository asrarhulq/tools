"use client";
import React, { useState } from "react";
import { useLab } from "./store";

export function Panel({
  title,
  sub,
  tag,
  children,
  className = "",
  right,
}: {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  tag?: string;
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <section className={`l3-panel ${className}`}>
      {(title || right) && (
        <header className="l3-ph">
          <div>
            {title && <h3 className="l3-h3">{title}</h3>}
            {sub && <p className="l3-sub">{sub}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
      {tag && (
        <div className="l3-tb" aria-hidden="true">
          {tag}
        </div>
      )}
    </section>
  );
}

export function Btn({
  children,
  onClick,
  variant = "ghost",
  disabled,
  title,
  small,
  type = "button",
  pressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "quiet";
  disabled?: boolean;
  title?: string;
  small?: boolean;
  type?: "button" | "submit";
  pressed?: boolean;
}) {
  return (
    <button
      type={type}
      className={`l3-btn l3-${variant}${small ? "l3-sm" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={pressed}
    >
      {children}
    </button>
  );
}

export function Chip({
  children,
  tone = "",
  title,
}: {
  children: React.ReactNode;
  tone?: string;
  title?: string;
}) {
  return (
    <span className={`l3-chip ${tone ? "l3-t-" + tone : ""}`} title={title}>
      {children}
    </span>
  );
}

export function SlideRef({ p }: { p: string }) {
  return (
    <span
      className="l3-slide"
      title="Page in the ME 36400 conceptual-design slide PDF"
    >
      slides {p}
    </span>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; badge?: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="l3-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`l3-tab${active === t.id ? "on" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.badge ? <i className="l3-badge">{t.badge}</i> : null}
        </button>
      ))}
    </div>
  );
}

export function Meter({
  value,
  label,
  tone = "cyan",
  note,
}: {
  value: number;
  label?: string;
  tone?: string;
  note?: string;
}) {
  const p = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      className="l3-meter"
      role="img"
      aria-label={`${label || "progress"} ${p}%`}
    >
      {label && (
        <div className="l3-ml">
          <span>{label}</span>
          <b>{note ?? `${p}%`}</b>
        </div>
      )}
      <div className="l3-mt">
        <i className={`l3-fill l3-f-${tone}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export function Ring({
  pct,
  size = 44,
  stroke = 4,
  color = "#5CE1E6",
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2,
    c = 2 * Math.PI * r;
  return (
    <div className="l3-ring" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(143,196,255,.22)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * Math.max(0, Math.min(1, pct))} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span>{children}</span>
    </div>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "good" | "bad";
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`l3-call l3-c-${tone}`}>
      {title && <b className="l3-ct">{title}</b>}
      <div>{children}</div>
    </div>
  );
}

export function CopyBtn({
  text,
  label = "Copy",
  small = true,
}: {
  text: string | (() => string);
  label?: string;
  small?: boolean;
}) {
  const { toast } = useLab();
  const doCopy = async () => {
    const t = typeof text === "function" ? text() : text;
    try {
      await navigator.clipboard.writeText(t);
      toast("Copied to clipboard");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = t;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast("Copied to clipboard");
      } catch {
        toast("Copy blocked by the browser");
      }
    }
  };
  return (
    <Btn small={small} onClick={doCopy}>
      {label}
    </Btn>
  );
}

export function ConfirmBtn({
  label,
  confirm = "Click again to confirm",
  onConfirm,
  variant = "ghost",
  small,
}: {
  label: string;
  confirm?: string;
  onConfirm: () => void;
  variant?: "ghost" | "danger";
  small?: boolean;
}) {
  const [arm, setArm] = useState(false);
  return (
    <Btn
      small={small}
      variant={arm ? "danger" : variant}
      onClick={() => {
        if (arm) {
          setArm(false);
          onConfirm();
        } else {
          setArm(true);
          setTimeout(() => setArm(false), 3200);
        }
      }}
    >
      {arm ? confirm : label}
    </Btn>
  );
}

export function Stamp({ text = "CLEARED" }: { text?: string }) {
  return (
    <div className="l3-stamp" aria-label={text}>
      {text}
    </div>
  );
}

export function Empty({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="l3-empty">
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="l3-tip">
      <span aria-hidden="true">✎</span>
      <div>{children}</div>
    </div>
  );
}

export function Icon({ n }: { n: "check" | "dot" | "warn" | "x" | "arrow" }) {
  if (n === "check")
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M3 8.5l3.2 3L13 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (n === "x")
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  if (n === "warn")
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M8 2l7 12H1z M8 6.5v3.5 M8 12v.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  if (n === "arrow")
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M2 8h11M9 4l4 4-4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
