"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import type { AlleyData, Selection, SeasonFilter } from "../lib/types";
import { SEASONS } from "../lib/types";
import type {
  FieldSigJob,
  FieldSigRequest,
  FieldSigResponse,
} from "../lib/worker-protocol";
import type { FieldSigResult } from "../lib/stats";
import { boxSeries, seriesKey, yearIdx } from "../lib/data";

/** Loads the precomputed JSON as its own chunk (never in any other route's bundle). */
export function useAlleyData() {
  const [data, setData] = useState<AlleyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    import("../data/alley-tracker.json")
      .then((m) => live && setData(m.default as unknown as AlleyData))
      .catch((e: unknown) => live && setError(String(e)));
    return () => {
      live = false;
    };
  }, []);
  return { data, error };
}

export function useIsDark() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark";
}

export const FIELD_SIG_PARAMS = {
  nBoot: 10000,
  block: 5,
  alpha: 0.05,
  seed: 20161681,
} as const;

type Pending = { resolve: (r: FieldSigResponse) => void };

/** One long-lived worker; `run` returns a promise per request. */
export function useStatsWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, Pending>());
  const nextId = useRef(1);

  useEffect(() => {
    const map = pending.current;
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      map.clear();
    };
  }, []);

  return useCallback((jobs: FieldSigJob[]): Promise<FieldSigResponse> => {
    if (!workerRef.current) {
      const w = new Worker(new URL("../lib/stats.worker.ts", import.meta.url), {
        type: "module",
      });
      w.onmessage = (e: MessageEvent<FieldSigResponse>) => {
        const p = pending.current.get(e.data.id);
        if (p) {
          pending.current.delete(e.data.id);
          p.resolve(e.data);
        }
      };
      workerRef.current = w;
    }
    const id = nextId.current++;
    const req: FieldSigRequest = {
      type: "fieldsig",
      id,
      jobs,
      ...FIELD_SIG_PARAMS,
    };
    return new Promise((resolve) => {
      pending.current.set(id, { resolve });
      workerRef.current!.postMessage(req);
    });
  }, []);
}

export function buildJobs(data: AlleyData, sel: Selection): FieldSigJob[] {
  const key = seriesKey(sel.rating, sel.measure);
  const idxA = yearIdx(data, sel.a, sel.exclude2024);
  const idxB = yearIdx(data, sel.b, sel.exclude2024);
  return (["ALL", ...SEASONS] as SeasonFilter[]).map((s) => ({
    tag: s,
    values: boxSeries(data, key, s),
    idxA,
    idxB,
  }));
}

export type FieldSigState =
  | { status: "idle" | "running"; byTag: null; ms: 0 }
  | { status: "done"; byTag: Record<string, FieldSigResult>; ms: number };

/**
 * Re-runs field significance (all seasons at once) whenever the periods,
 * rating or measure change — debounced, and stale answers are dropped.
 */
export function useFieldSignificance(data: AlleyData | null, sel: Selection) {
  const run = useStatsWorker();
  const [state, setState] = useState<FieldSigState>({
    status: "idle",
    byTag: null,
    ms: 0,
  });
  const latest = useRef(0);
  const { a, b, rating, measure, exclude2024 } = sel;
  const key = useMemo(
    () => JSON.stringify([a, b, rating, measure, exclude2024]),
    [a, b, rating, measure, exclude2024],
  );

  useEffect(() => {
    if (!data) return;
    const ticket = ++latest.current;
    const t = setTimeout(() => {
      setState({ status: "running", byTag: null, ms: 0 });
      const s = JSON.parse(key) as [
        Selection["a"],
        Selection["b"],
        Selection["rating"],
        Selection["measure"],
        boolean,
      ];
      const jobs = buildJobs(data, {
        ...sel,
        a: s[0],
        b: s[1],
        rating: s[2],
        measure: s[3],
        exclude2024: s[4],
      });
      run(jobs).then((res) => {
        if (ticket !== latest.current) return;
        const byTag: Record<string, FieldSigResult> = {};
        for (const r of res.results) byTag[r.tag] = r.result;
        setState({ status: "done", byTag, ms: res.ms });
      });
    }, 250);
    return () => clearTimeout(t);
    // `sel` fields that matter are folded into `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, key, run]);

  return state;
}
