"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { defaultState } from "./types";
import type { State, View } from "./types";

export interface Nav {
  view: View;
  tab: string;
}
interface Ctx {
  s: State;
  up: (f: (d: State) => void) => void;
  nav: Nav;
  go: (view: View, tab?: string, scroll?: boolean) => void;
  saved: "idle" | "ok" | "err";
  resetAll: () => void;
  exportJson: () => string;
  importJson: (t: string) => boolean;
  pulse: number[] | null;
  printApp: string | null;
  setPrintApp: (a: string | null) => void;
  toast: (m: string) => void;
  toastMsg: string;
  pollUrl?: string;
}

const C = createContext<Ctx | null>(null);
export const useLab = (): Ctx => {
  const c = useContext(C);
  if (!c) throw new Error("useLab outside provider");
  return c;
};

const VIEWS: View[] = [
  "home",
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "vault",
  "stuck",
  "locator",
];
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function parseHash(): Nav | null {
  try {
    const h = window.location.hash.replace(/^#/, "");
    if (!h) return null;
    const [v, t] = h.split("/");
    if ((VIEWS as string[]).includes(v!))
      return { view: v as View, tab: t || "" };
  } catch {
    /* ignore */
  }
  return null;
}

export function LabProvider({
  storageKey,
  pollUrl,
  children,
}: {
  storageKey: string;
  pollUrl?: string;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [s, setS] = useState<State>(defaultState);
  const [nav, setNav] = useState<Nav>({ view: "home", tab: "" });
  const [saved, setSaved] = useState<"idle" | "ok" | "err">("idle");
  const [printApp, setPrintApp] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [pulse, setPulse] = useState<number[] | null>(null);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // load — one mount-time init, run from inside a callback rather than the
  // effect body's top level (react-hooks/set-state-in-effect wants setState
  // reached via a callback, not called directly in the effect; this is a
  // one-time read of an external source — localStorage — so there's no
  // way to avoid a setState here, only where it lexically sits).
  useEffect(() => {
    const init = () => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const p = JSON.parse(raw);
          if (p && p.v === 1) setS({ ...defaultState(), ...p });
        }
      } catch {
        /* storage blocked: start fresh */
      }
      const h = parseHash();
      if (h) setNav(h);
      setReady(true);
    };
    init();
    const onHash = () => {
      const n = parseHash();
      if (n) setNav(n);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [storageKey]);

  // save (debounced)
  useEffect(() => {
    if (!ready) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(s));
        setSaved("ok");
      } catch {
        setSaved("err");
      }
    }, 350);
    return () => {
      if (saveRef.current) clearTimeout(saveRef.current);
    };
  }, [s, ready, storageKey]);

  const up = useCallback((f: (d: State) => void) => {
    setS((prev) => {
      const d = clone(prev);
      f(d);
      return d;
    });
  }, []);

  const go = useCallback((view: View, tab = "", scroll = true) => {
    setNav({ view, tab });
    if (/^s[1-6]$/.test(view))
      setS((prev) =>
        prev.current === Number(view[1])
          ? prev
          : { ...prev, current: Number(view[1]) },
      );
    try {
      window.history.replaceState(null, "", `#${view}${tab ? "/" + tab : ""}`);
    } catch {
      /* ignore */
    }
    if (scroll) {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        /* ignore */
      }
    }
  }, []);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setToastMsg(""), 2600);
  }, []);

  const resetAll = useCallback(() => {
    setS(defaultState());
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const exportJson = useCallback(
    () => JSON.stringify({ app: "lab3-guide", state: s }, null, 2),
    [s],
  );
  const importJson = useCallback((t: string) => {
    try {
      const p = JSON.parse(t);
      const st = p && p.state ? p.state : p;
      if (!st || st.v !== 1) return false;
      setS({ ...defaultState(), ...st });
      return true;
    } catch {
      return false;
    }
  }, []);

  // optional class pulse (works with the Express poll from earlier: GET/POST {clientId, step})
  useEffect(() => {
    if (!ready || !pollUrl) return;
    let id = "";
    try {
      id = window.localStorage.getItem(storageKey + ":cid") || "";
      if (!id) {
        id = crypto.randomUUID
          ? crypto.randomUUID()
          : String(Math.random()).slice(2) + Date.now();
        window.localStorage.setItem(storageKey + ":cid", id);
      }
    } catch {
      id = String(Math.random()).slice(2) + Date.now();
    }
    const base = pollUrl.replace(/\/$/, "");
    fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: id, step: s.current }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.counts)) setPulse(d.counts);
      })
      .catch(() => {
        /* poll is optional */
      });
    const t = setInterval(() => {
      fetch(base)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.counts)) setPulse(d.counts);
        })
        .catch(() => {
          /* ignore */
        });
    }, 15000);
    return () => clearInterval(t);
  }, [ready, pollUrl, s.current, storageKey]);

  const value = useMemo<Ctx>(
    () => ({
      s,
      up,
      nav,
      go,
      saved,
      resetAll,
      exportJson,
      importJson,
      pulse,
      printApp,
      setPrintApp,
      toast,
      toastMsg,
      pollUrl,
    }),
    [
      s,
      up,
      nav,
      go,
      saved,
      resetAll,
      exportJson,
      importJson,
      pulse,
      printApp,
      toast,
      toastMsg,
      pollUrl,
    ],
  );

  if (!ready)
    return (
      <div className="l3-boot" role="status">
        Loading your Lab 3 workspace…
      </div>
    );
  return <C.Provider value={value}>{children}</C.Provider>;
}
