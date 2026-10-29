"use client";
// Canvas sketch pad: pen, eraser, colours, undo, image import. Value is a PNG data URL.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Btn } from "./ui";

const W = 900,
  H = 540;
const COLORS = ["#111111", "#1D4ED8", "#C2410C", "#15803D", "#B91C1C"];

export function Sketch({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hist = useRef<ImageData[]>([]);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(COLORS[0]!);
  const [size, setSize] = useState(3);
  const [erase, setErase] = useState(false);
  const [grid, setGrid] = useState(true);

  const paper = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = "#FDFCF7";
      ctx.fillRect(0, 0, W, H);
      if (grid) {
        ctx.strokeStyle = "rgba(80,110,160,.14)";
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 0; y <= H; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
      }
    },
    [grid],
  );

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    paper(ctx);
    if (value) {
      const im = new Image();
      im.onload = () => ctx.drawImage(im, 0, 0, W, H);
      im.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  };
  const snap = () => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (c && ctx) {
      hist.current.push(ctx.getImageData(0, 0, W, H));
      if (hist.current.length > 25) hist.current.shift();
    }
  };
  const down = (e: React.PointerEvent) => {
    const c = ref.current;
    if (!c) return;
    c.setPointerCapture(e.pointerId);
    snap();
    drawing.current = true;
    last.current = pos(e);
    const ctx = c.getContext("2d")!;
    const p = last.current;
    ctx.fillStyle = erase ? "#FDFCF7" : color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, (erase ? size * 4 : size) / 2, 0, 7);
    ctx.fill();
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const p = pos(e);
    const l = last.current || p;
    ctx.strokeStyle = erase ? "#FDFCF7" : color;
    ctx.lineWidth = erase ? size * 4 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(l.x, l.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const c = ref.current;
    if (c) onChange(c.toDataURL("image/png"));
  };
  const undo = () => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    const h = hist.current.pop();
    if (c && ctx && h) {
      ctx.putImageData(h, 0, 0);
      onChange(c.toDataURL("image/png"));
    }
  };
  const clear = () => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (c && ctx) {
      snap();
      paper(ctx);
      onChange("");
    }
  };
  const upload = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const c = ref.current;
        const ctx = c?.getContext("2d");
        if (!c || !ctx) return;
        snap();
        const k = Math.min(W / im.width, H / im.height);
        const w = im.width * k,
          h = im.height * k;
        ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
        onChange(c.toDataURL("image/png"));
      };
      im.src = String(r.result);
    };
    r.readAsDataURL(f);
  };

  return (
    <div className="l3-sk" aria-label={label || "Sketch pad"}>
      <div className="l3-skb">
        {COLORS.map((c) => (
          <button
            key={c}
            className={`l3-sw${!erase && color === c ? "on" : ""}`}
            style={{ background: c }}
            aria-label={`Pen colour ${c}`}
            onClick={() => {
              setColor(c);
              setErase(false);
            }}
          />
        ))}
        <label className="l3-small l3-mute">
          Size{" "}
          <input
            type="range"
            min={1}
            max={10}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </label>
        <Btn small pressed={erase} onClick={() => setErase(!erase)}>
          Eraser
        </Btn>
        <Btn
          small
          pressed={grid}
          onClick={() => setGrid((g) => !g)}
          title="Grid shows on new strokes only"
        >
          Grid
        </Btn>
        <Btn small onClick={undo}>
          Undo
        </Btn>
        <Btn small variant="danger" onClick={clear}>
          Clear
        </Btn>
        <label className="l3-btn l3-sm" style={{ cursor: "pointer" }}>
          Import photo
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
    </div>
  );
}

/** Small thumbnail that opens the pad in a modal. */
export function SketchThumb({
  value,
  onChange,
  title,
}: {
  value: string;
  onChange: (u: string) => void;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [tmp, setTmp] = useState(value);
  return (
    <>
      <div
        className="l3-thumb"
        role="button"
        tabIndex={0}
        style={value ? { backgroundImage: `url(${value})` } : undefined}
        onClick={() => {
          setTmp(value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setTmp(value);
            setOpen(true);
          }
        }}
      >
        {!value && <span>✎ sketch</span>}
      </div>
      {open && (
        <div
          className="l3-modal"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="l3-mbox">
            <div className="l3-row" style={{ marginBottom: 8 }}>
              <b>{title}</b>
              <span className="l3-end" />
              <Btn
                variant="primary"
                onClick={() => {
                  onChange(tmp);
                  setOpen(false);
                }}
              >
                Save sketch
              </Btn>
              <Btn onClick={() => setOpen(false)}>Cancel</Btn>
            </div>
            <Sketch value={value} onChange={setTmp} label={title} />
          </div>
        </div>
      )}
    </>
  );
}
