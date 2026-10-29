// Pure functions: linting, statistics, decision maths, checkpoints and the "what next" engine.
import { VERBS, SOLUTION_WORDS, VAGUE_WORDS, STEPS } from "./data";
import type { State, Structure, Crit, ObjNode, FS, Principle } from "./types";
import { clamp, num } from "./types";

/* ---------------------------------------------------------------- linting */
export function lintFnName(name: string): {
  level: "ok" | "warn" | "bad";
  msg: string;
} {
  const w = name.trim().split(/\s+/).filter(Boolean);
  if (w.length === 0) return { level: "bad", msg: "Empty name." };
  if (w.length < 2)
    return {
      level: "bad",
      msg: "Needs a verb AND a noun (e.g. “Amplify torque”).",
    };
  const v = w[0]!.toLowerCase().replace(/[^a-z-]/g, "");
  if (v.endsWith("ing"))
    return {
      level: "bad",
      msg: `“${w[0]}” is an -ing word. Start with the verb: “${v.replace(/ing$/, "")}…”.`,
    };
  if (VERBS.has(v)) return { level: "ok", msg: "Verb + noun." };
  return {
    level: "warn",
    msg: `“${w[0]}” is not in the verb list. Make sure it is a verb, not a part.`,
  };
}

export interface LintCheck {
  ok: boolean;
  label: string;
  detail?: string;
}
export function lintStatement(
  statement: string,
  product: string,
): { score: number; checks: LintCheck[] } {
  const t = statement.trim();
  const low = t.toLowerCase();
  const words = low.split(/[^a-z0-9-]+/).filter(Boolean);
  const checks: LintCheck[] = [];
  checks.push({
    ok: t.length >= 20,
    label: "Written (at least a short sentence)",
  });
  const nums = t.match(/\d+(\.\d+)?/g);
  checks.push({
    ok: !nums,
    label: "No numbers left (operation 3)",
    detail: nums ? `Found: ${nums.slice(0, 4).join(", ")}` : undefined,
  });
  const prod = product.trim().toLowerCase();
  const prodHit = prod
    ? prod
        .split(/\s+/)
        .filter((x) => x.length > 2)
        .filter((x) => low.includes(x))
    : [];
  checks.push({
    ok: prodHit.length === 0,
    label: prod
      ? `Does not name your product (“${product.trim()}”)`
      : "Does not name your product (type it above to check)",
    detail: prodHit.length ? `Contains: ${prodHit.join(", ")}` : undefined,
  });
  const sol = SOLUTION_WORDS.filter((x) => words.includes(x));
  checks.push({
    ok: sol.length === 0,
    label: "No mechanism words (motor, lever, spring…)",
    detail: sol.length ? `Found: ${sol.join(", ")}` : undefined,
  });
  checks.push({
    ok: !/^\s*(design|build|make|create|develop)\b/i.test(t),
    label: "Does not start with “design a …”",
    detail: "Say what happens to what instead.",
  });
  const sentences = t
    .split(/[.!?]+\s/)
    .filter((x) => x.trim().length > 0).length;
  checks.push({ ok: sentences <= 1 && t.length > 0, label: "One sentence" });
  const hasVerb = words.some((x) => VERBS.has(x));
  checks.push({
    ok: hasVerb,
    label: "Contains an action verb (what is done to what)",
  });
  const ok = checks.filter((c) => c.ok).length;
  return { score: Math.round((ok / checks.length) * 100), checks };
}

export function vagueWords(name: string): string[] {
  const hasNum = /\d/.test(name);
  if (hasNum) return [];
  const w = name.toLowerCase().split(/[^a-z-]+/);
  return VAGUE_WORDS.filter((v) => w.includes(v));
}

export function findNumbers(text: string): string[] {
  return (
    text.match(
      /\d+(\.\d+)?(\s?(mm|cm|m|kg|g|n|nm|n·m|w|kw|v|a|hz|s|min|h|°c|l|ml|psi|pa|kpa|mpa|%|\$))?/gi,
    ) || []
  );
}

/* ---------------------------------------------------------------- function structure */
export function fsLint(fs: FS) {
  const msgs: { level: "ok" | "warn" | "bad"; text: string }[] = [];
  const names = fs.fns.map((f) => ({ f, l: lintFnName(f.name) }));
  const nameBad = names.filter((n) => n.l.level === "bad");
  const nameWarn = names.filter((n) => n.l.level === "warn");
  nameBad.forEach((n) =>
    msgs.push({ level: "bad", text: `“${n.f.name || "(empty)"}”: ${n.l.msg}` }),
  );
  nameWarn.forEach((n) =>
    msgs.push({ level: "warn", text: `“${n.f.name}”: ${n.l.msg}` }),
  );
  const inF = fs.flows.filter((f) => f.from === "IN");
  const outF = fs.flows.filter((f) => f.to === "OUT");
  if (fs.fns.length && !inF.length)
    msgs.push({
      level: "bad",
      text: "No input crosses the system boundary. Add a flow from IN.",
    });
  if (fs.fns.length && !outF.length)
    msgs.push({
      level: "bad",
      text: "No output leaves the system boundary. Add a flow to OUT.",
    });
  const disconnected: string[] = [];
  fs.fns.forEach((f) => {
    const hasIn = fs.flows.some((x) => x.to === f.id);
    const hasOut = fs.flows.some((x) => x.from === f.id);
    if (!hasIn || !hasOut)
      disconnected.push(
        `${f.name || "(unnamed)"} (${!hasIn ? "no input" : "no output"})`,
      );
  });
  disconnected.forEach((d) =>
    msgs.push({ level: "bad", text: `Function without a complete path: ${d}` }),
  );
  const unl = fs.flows.filter((f) => !f.label.trim());
  if (unl.length)
    msgs.push({
      level: "warn",
      text: `${unl.length} flow(s) have no label. Name what flows (torque, tiles, on/off…).`,
    });
  const types = new Set(fs.flows.map((f) => f.type));
  if (fs.fns.length >= 3 && types.size === 1)
    msgs.push({
      level: "warn",
      text: "Only one flow type used. Do energy, material and signal flows all matter here? Check.",
    });
  if (!fs.overall.trim())
    msgs.push({
      level: "warn",
      text: "Write the overall function (verb + noun) from your problem statement.",
    });
  if (msgs.length === 0 && fs.fns.length)
    msgs.push({ level: "ok", text: "No problems found. Clear structure." });
  return {
    msgs,
    namesOk: fs.fns.length > 0 && nameBad.length === 0,
    ioOk: inF.length > 0 && outF.length > 0,
    connectedOk: fs.fns.length > 0 && disconnected.length === 0,
    labelsOk: fs.flows.length > 0 && unl.length === 0,
  };
}

/* ---------------------------------------------------------------- chart */
export const isSketched = (p: Principle) => p.sketched || !!p.sketch;
export const principlesOf = (s: State, fnId: string) =>
  s.principles.filter((p) => p.fnId === fnId);

export function chartStats(s: State) {
  const rows = s.fs.fns.map((fn) => {
    const ps = principlesOf(s, fn.id);
    const effects = new Set(ps.map((p) => p.effect).filter(Boolean));
    return {
      fn,
      ps,
      count: ps.length,
      sketched: ps.filter(isSketched).length,
      effects: effects.size,
      noEffect: ps.filter((p) => !p.effect).length,
    };
  });
  const need = rows.length * 5;
  const have = rows.reduce((a, r) => a + Math.min(r.count, 5), 0);
  return {
    rows,
    total: s.principles.length,
    fiveOk: rows.length > 0 && rows.every((r) => r.count >= 5),
    effectOk: s.principles.length > 0 && s.principles.every((p) => !!p.effect),
    sketchOk: s.principles.length > 0 && s.principles.every(isSketched),
    varietyOk:
      rows.length > 0 &&
      rows.every(
        (r) => r.effects >= Math.min(3, Math.max(r.count, 1)) && r.count > 0,
      ),
    pctCount: need ? have / need : 0,
    pctSketch: s.principles.length
      ? s.principles.filter(isSketched).length / s.principles.length
      : 0,
  };
}

export const picksOf = (st: Structure, fnId: string) => st.picks[fnId] || [];
export function codeOf(s: State, st: Structure): string {
  const out: { r: number; c: number }[] = [];
  s.fs.fns.forEach((fn, r) => {
    const ps = principlesOf(s, fn.id);
    picksOf(st, fn.id).forEach((pid) => {
      const c = ps.findIndex((p) => p.id === pid);
      if (c >= 0) out.push({ r: r + 1, c: c + 1 });
    });
  });
  return out.map((o) => `${o.r}.${o.c}`).join(" – ") || "(empty)";
}
export const structComplete = (s: State, st: Structure) =>
  s.fs.fns.length > 0 && s.fs.fns.every((f) => picksOf(st, f.id).length > 0);
export function structDiff(s: State, a: Structure, b: Structure): number {
  return s.fs.fns.filter(
    (f) =>
      [...picksOf(a, f.id)].sort().join() !==
      [...picksOf(b, f.id)].sort().join(),
  ).length;
}
export function comboCount(s: State): number {
  return s.fs.fns.reduce(
    (a, f) => a * Math.max(1, principlesOf(s, f.id).length),
    1,
  );
}

/* ---------------------------------------------------------------- elimination */
export const eliminated = (s: State, id: string) =>
  Object.values(s.elim[id] || {}).includes("-");
export const survivors = (s: State) =>
  s.structures.filter((x) => !eliminated(s, x.id));

/* ---------------------------------------------------------------- decision maths */
export function weightsOf(s: State): Record<string, number> {
  const raw = s.crit.map((c) =>
    s.weightMode === "rank" ? Math.max(0, c.rank) : Math.max(0, c.weight),
  );
  const sum = raw.reduce((a, b) => a + b, 0);
  const out: Record<string, number> = {};
  s.crit.forEach((c, i) => {
    out[c.id] = sum > 0 ? raw[i]! / sum : 0;
  });
  return out;
}
export function norm(c: Crit, x: number): number {
  const span = c.hi - c.lo;
  if (span === 0) return 0;
  return clamp(c.pref === "H" ? (x - c.lo) / span : (c.hi - x) / span, 0, 1);
}
export interface MeritRow {
  id: string;
  merit: number;
  missing: number;
  contrib: Record<string, number>;
  R: number;
}
export function meritOf(
  s: State,
  ids: string[],
  w: Record<string, number>,
  scale = 1,
): MeritRow[] {
  return ids.map((id) => {
    let merit = 0,
      missing = 0,
      sumN = 0,
      n = 0;
    const contrib: Record<string, number> = {};
    s.crit.forEach((c) => {
      const raw = num(s.ratings[id]?.[c.id]);
      if (raw === null) {
        missing++;
        contrib[c.id] = 0;
        return;
      }
      const x = scale === 1 ? raw : raw * scale;
      const nv = norm(c, x);
      contrib[c.id] = (w[c.id] || 0) * nv;
      merit += contrib[c.id]!;
      sumN += nv;
      n++;
    });
    return { id, merit, missing, contrib, R: n ? sumN / n : 0 };
  });
}
export function ratingComplete(s: State, ids: string[]): boolean {
  return (
    s.crit.length > 0 &&
    ids.length > 0 &&
    ids.every((id) => s.crit.every((c) => num(s.ratings[id]?.[c.id]) !== null))
  );
}

export function sensitivity(s: State, ids: string[]) {
  const w = weightsOf(s);
  const base = meritOf(s, ids, w);
  // slide p.94: all attributes 5% better, then 5% worse (direction depends on preference)
  const shifted = (f: number) =>
    ids.map((id) => {
      let merit = 0;
      s.crit.forEach((c) => {
        const raw = num(s.ratings[id]?.[c.id]);
        if (raw === null) return;
        const x = raw * (c.pref === "H" ? f : 2 - f);
        merit += (w[c.id] || 0) * norm(c, x);
      });
      return { id, merit };
    });
  const better = shifted(1.05),
    worse = shifted(0.95);
  const sorted = [...base].sort((a, b) => b.merit - a.merit);
  const winner = sorted[0]?.id;
  const runner = sorted[1]?.id;
  const bw = base.find((b) => b.id === winner),
    bi = better.find((b) => b.id === runner),
    wi = worse.find((b) => b.id === winner);
  const overlap = !!(winner && runner && wi && bi && wi.merit <= bi.merit);
  // domination by one attribute
  let topCrit = "",
    topShare = 0;
  if (bw && bw.merit > 0)
    s.crit.forEach((c) => {
      const sh = (bw.contrib[c.id] || 0) / bw.merit;
      if (sh > topShare) {
        topShare = sh;
        topCrit = c.name;
      }
    });
  // weight swings: each weight x1.5 and x0.5, renormalized
  let flips = 0,
    total = 0;
  const flipList: string[] = [];
  s.crit.forEach((c) => {
    [1.5, 0.5].forEach((f) => {
      const w2: Record<string, number> = {};
      let sum = 0;
      s.crit.forEach((x) => {
        w2[x.id] = (w[x.id] || 0) * (x.id === c.id ? f : 1);
        sum += w2[x.id]!;
      });
      if (sum <= 0) return;
      s.crit.forEach((x) => {
        w2[x.id] = w2[x.id]! / sum;
      });
      const m = meritOf(s, ids, w2).sort((a, b) => b.merit - a.merit);
      total++;
      if (m[0] && m[0].id !== winner) {
        flips++;
        flipList.push(`${c.name} ×${f}: ${m[0].id} wins`);
      }
    });
  });
  return {
    base,
    better,
    worse,
    winner,
    runner,
    overlap,
    topCrit,
    topShare,
    flips,
    total,
    flipList,
    margin: bw && sorted[1] ? bw.merit - sorted[1].merit : 0,
    w,
    wMerit: bw?.merit ?? 0,
  };
}

/* ---------------------------------------------------------------- objective hierarchy */
export interface Leaf {
  id: string;
  name: string;
  w: number;
  path: string;
}
export function leaves(n: ObjNode, acc = 1, path = ""): Leaf[] {
  if (!n.children.length)
    return path ? [{ id: n.id, name: n.name, w: acc, path }] : [];
  return n.children.flatMap((c) =>
    leaves(c, acc * c.w, path ? `${path} › ${c.name}` : c.name),
  );
}
export const sibSum = (n: ObjNode) => n.children.reduce((a, c) => a + c.w, 0);

/* ---------------------------------------------------------------- checkpoints */
export interface Item {
  id: string;
  label: string;
  ok: boolean;
  auto: boolean;
  hint: string;
  fix?: { view: string; tab: string };
}

export function checkpoint(s: State, n: number): Item[] {
  const m = (id: string, label: string, hint: string): Item => ({
    id,
    label,
    ok: !!s.checks[id],
    auto: false,
    hint,
  });
  const a = (
    id: string,
    label: string,
    ok: boolean,
    hint: string,
    view: string,
    tab: string,
  ): Item => ({ id, label, ok, auto: true, hint, fix: { view, tab } });
  if (n === 1) {
    const r = s.abs.reqs,
      keeps = r.filter((x) => x.verdict === "keep");
    const lint = lintStatement(s.abs.statement, s.abs.product);
    return [
      a(
        "a-list",
        "Requirements listed (3 or more)",
        r.length >= 3,
        "Paste your Lab 2 list into the workbench.",
        "s1",
        "bench",
      ),
      a(
        "a-class",
        "Every requirement is classified (keep / preference / no function)",
        r.length > 0 && r.every((x) => x.verdict !== ""),
        "Operations 1 and 2.",
        "s1",
        "bench",
      ),
      a(
        "a-ess",
        "Every kept requirement has a qualitative essence",
        keeps.length > 0 && keeps.every((x) => x.essence.trim()),
        "Operation 3: numbers become words.",
        "s1",
        "bench",
      ),
      a(
        "a-gen",
        "Every kept requirement is generalized",
        keeps.length > 0 && keeps.every((x) => x.general.trim()),
        "Operation 4: climb the ladder.",
        "s1",
        "bench",
      ),
      a(
        "a-stmt",
        "Solution-neutral statement passes the linter (80+)",
        lint.score >= 80 && s.abs.statement.trim().length > 0,
        "Operation 5.",
        "s1",
        "bench",
      ),
      m(
        "m-a",
        "Appendix A in your report shows all five operations",
        "Export the table from the Vault.",
      ),
    ];
  }
  if (n === 2) {
    const l = fsLint(s.fs);
    return [
      a(
        "b-fns",
        "At least 3 functions",
        s.fs.fns.length >= 3,
        "Add boxes in the Forge.",
        "s2",
        "forge",
      ),
      a(
        "b-names",
        "Every function name is verb + noun",
        l.namesOk,
        "See the lint panel.",
        "s2",
        "forge",
      ),
      a(
        "b-io",
        "Inputs and outputs cross the system boundary",
        l.ioOk,
        "Add IN and OUT flows.",
        "s2",
        "forge",
      ),
      a(
        "b-conn",
        "Every function has an input and an output flow",
        l.connectedOk,
        "No orphan boxes.",
        "s2",
        "forge",
      ),
      a(
        "b-label",
        "Every flow is typed and labelled",
        l.labelsOk,
        "Name what flows.",
        "s2",
        "forge",
      ),
      a(
        "b-over",
        "Overall function written",
        s.fs.overall.trim().length > 3,
        "The black box from your problem statement.",
        "s2",
        "forge",
      ),
      m(
        "m-b",
        "Appendix B figure has legend + system boundary",
        "Export SVG/PNG from the Forge or print the Vault page.",
      ),
    ];
  }
  if (n === 3) {
    const c = chartStats(s);
    return [
      a(
        "c-fns",
        "Functions defined (from Step 2)",
        s.fs.fns.length > 0,
        "The chart needs rows.",
        "s2",
        "forge",
      ),
      a(
        "c-five",
        "Every function has 5 or more principles",
        c.fiveOk,
        "Use the idea tools.",
        "s3",
        "spark",
      ),
      a(
        "c-eff",
        "Every principle names a physical effect",
        c.effectOk,
        "Pick from the effects list.",
        "s3",
        "chart",
      ),
      a(
        "c-var",
        "Each row uses different physical effects (3 or more)",
        c.varietyOk,
        "Five levers is one idea.",
        "s3",
        "effects",
      ),
      a(
        "c-sk",
        "Every principle is sketched",
        c.sketchOk,
        "Use the sketch pad or tick it when drawn on paper.",
        "s3",
        "chart",
      ),
      m(
        "m-c",
        "Used two or more ideation techniques (e.g. brainstorm + SCAMPER)",
        "Mention them in the main body.",
      ),
    ];
  }
  if (n === 4) {
    const st = s.structures;
    const pairsOk =
      st.length >= 2 &&
      st.every((x, i) =>
        st.every((y, j) => i === j || structDiff(s, x, y) >= 2),
      );
    return [
      a(
        "d-n",
        "At least four working structures",
        st.length >= 4,
        "Weave more paths.",
        "s4",
        "weave",
      ),
      a(
        "d-comp",
        "Every structure picks a principle for every function",
        st.length > 0 && st.every((x) => structComplete(s, x)),
        "No empty rows.",
        "s4",
        "weave",
      ),
      a(
        "d-compat",
        "Compatibility checked (physical + geometric) for each",
        st.length > 0 && st.every((x) => x.checks.phys && x.checks.geom),
        "Only compatible principles combine.",
        "s4",
        "weave",
      ),
      a(
        "d-diff",
        "Every pair of structures differs in 2 or more functions",
        pairsOk,
        "Genuinely different concepts.",
        "s4",
        "weave",
      ),
      a(
        "d-sk",
        "Each structure has a rough sketch",
        st.length > 0 && st.every((x) => x.sketched),
        "Sketches make compatibility visible.",
        "s4",
        "weave",
      ),
      m(
        "m-d",
        "Appendix D shows each combination clearly",
        "Highlighted path or combination table.",
      ),
    ];
  }
  if (n === 5) {
    const sv = survivors(s),
      ids = sv.map((x) => x.id);
    const vague = s.crit.filter((c) => vagueWords(c.name).length);
    const ws = weightsOf(s);
    return [
      a(
        "e-elim",
        "Every structure screened (+ − ? !)",
        s.structures.length > 0 &&
          s.structures.every((x) =>
            Object.values(s.elim[x.id] || {}).some((v) => v !== ""),
          ),
        "Filter first.",
        "s5",
        "filter",
      ),
      a(
        "e-surv",
        "Two or more survivors",
        sv.length >= 2,
        "You need something to compare.",
        "s5",
        "filter",
      ),
      a(
        "e-crit",
        "Five or more measurable criteria",
        s.crit.length >= 5 && vague.length === 0,
        vague.length
          ? `Vague wording: ${vague.map((v) => v.name).join(", ")}`
          : "Take them from the Lab 2 list.",
        "s5",
        "matrix",
      ),
      a(
        "e-w",
        "Weights assigned",
        Object.values(ws).some((x) => x > 0),
        "Ranking method, direct, or hierarchy.",
        "s5",
        "weights",
      ),
      a(
        "e-r",
        "Every survivor rated on every criterion",
        ratingComplete(s, ids),
        "Fill the matrix.",
        "s5",
        "matrix",
      ),
      m(
        "m-e1",
        "Ran the stress test and wrote down what changed",
        "Slide p.94.",
      ),
      m(
        "m-e2",
        "Appendix E states the method (scale, weights, formula)",
        "Copy the auto-written method paragraph.",
      ),
    ];
  }
  const f = s.final;
  const st = s.structures.find((x) => x.id === f.structId);
  return [
    a(
      "f-win",
      "Winning structure chosen",
      !!st,
      "Pick it from Step 5’s ranking.",
      "s6",
      "studio",
    ),
    a(
      "f-sum",
      "One-sentence summary written",
      f.summary.trim().length > 15,
      "How it works, by what effect.",
      "s6",
      "studio",
    ),
    a(
      "f-walk",
      "Every function has a walk-through sentence",
      !!st &&
        s.fs.fns.length > 0 &&
        s.fs.fns.every((fn) => (f.walk[fn.id] || "").trim().length > 5),
      "Auto-drafted from your picks.",
      "s6",
      "studio",
    ),
    a(
      "f-num",
      "Rough numbers recorded (force, size, speed…)",
      f.numbers.trim().length > 5,
      "Use the feasibility calculators.",
      "s6",
      "calc",
    ),
    a(
      "f-weak",
      "Weak points listed",
      f.weak.trim().length > 10,
      "What would you fix in Embodiment Design?",
      "s6",
      "studio",
    ),
    a(
      "f-sk",
      "Detailed sketch attached or drawn",
      !!f.sketch || !!s.checks["f-sk-paper"],
      "Draw it here or tick that it is in your report.",
      "s6",
      "sketch",
    ),
    m(
      "m-f",
      "Appendix F shows forces, motions and parts labelled",
      "A cross-section beats an exterior view.",
    ),
  ];
}

export const stepPct = (s: State, n: number) => {
  const it = checkpoint(s, n);
  return it.length ? it.filter((x) => x.ok).length / it.length : 0;
};

export function stepStat(s: State, n: number): string {
  if (n === 1) return s.abs.statement.trim() ? "1 problem" : "no statement yet";
  if (n === 2) return `${s.fs.fns.length} functions`;
  if (n === 3) return `${s.principles.length} principles`;
  if (n === 4) return `${s.structures.length} structures`;
  if (n === 5)
    return s.structures.length ? `${survivors(s).length} survivors` : "–";
  return s.final.structId ? "1 concept" : "not chosen";
}

export function funnel(s: State): { n: number; ghost: boolean }[] {
  return [
    { n: 1, ghost: !s.abs.statement.trim() },
    {
      n: Math.max(1, Math.min(8, s.fs.fns.length || 1)),
      ghost: s.fs.fns.length === 0,
    },
    { n: s.principles.length || 25, ghost: s.principles.length === 0 },
    { n: s.structures.length || 4, ghost: s.structures.length === 0 },
    {
      n: s.structures.length ? survivors(s).length : 2,
      ghost: s.structures.length === 0,
    },
    { n: 1, ghost: !s.final.structId },
  ];
}

/* ---------------------------------------------------------------- what-next engine */
export interface Advice {
  step: number;
  pct: number;
  items: Item[];
  open: Item[];
  ready: boolean;
  upstream: { step: number; text: string; go: { view: string; tab: string } }[];
  primary: { label: string; view: string; tab: string; why: string };
}
export function advice(s: State, n: number): Advice {
  const items = checkpoint(s, n);
  const open = items.filter((x) => !x.ok);
  const upstream: Advice["upstream"] = [];
  if (n >= 3 && s.fs.fns.length === 0)
    upstream.push({
      step: 2,
      text: "No functions yet. The chart needs functions as rows.",
      go: { view: "s2", tab: "forge" },
    });
  if (n >= 4 && s.fs.fns.length > 0) {
    const c = chartStats(s);
    const thin = c.rows.filter((r) => r.count < 2);
    if (thin.length)
      upstream.push({
        step: 3,
        text: `Rows with fewer than 2 principles can’t be combined: ${thin.map((r) => r.fn.name || "(unnamed)").join(", ")}.`,
        go: { view: "s3", tab: "chart" },
      });
  }
  if (n >= 5 && s.structures.length < 2)
    upstream.push({
      step: 4,
      text: "Fewer than 2 structures: there is nothing to select between.",
      go: { view: "s4", tab: "weave" },
    });
  if (n >= 6 && !survivors(s).length)
    upstream.push({
      step: 5,
      text: "No surviving structure. Revisit the filter.",
      go: { view: "s5", tab: "filter" },
    });
  const first = open[0];
  const meta = STEPS[n - 1]!;
  let primary;
  if (upstream.length)
    primary = {
      label: `Go back to Step ${upstream[0]!.step}`,
      view: upstream[0]!.go.view,
      tab: upstream[0]!.go.tab,
      why: upstream[0]!.text,
    };
  else if (first)
    primary = {
      label: first.fix ? `Fix: ${first.label}` : first.label,
      view: first.fix?.view || `s${n}`,
      tab: first.fix?.tab || "",
      why: first.hint,
    };
  else if (n < 6)
    primary = {
      label: `Advance to Step ${n + 1}: ${STEPS[n]!.name}`,
      view: `s${n + 1}`,
      tab: "",
      why: `Step ${n} is cleared. Next: ${STEPS[n]!.blurb}`,
    };
  else
    primary = {
      label: "Assemble your report in the Vault",
      view: "vault",
      tab: "",
      why: `${meta.name} is cleared. Print Appendices A–F and write the 5-page main body.`,
    };
  return {
    step: n,
    pct: items.length ? (items.length - open.length) / items.length : 0,
    items,
    open,
    ready: open.length === 0,
    upstream,
    primary,
  };
}

export function nextMove(s: State): Advice {
  let n = s.current;
  if (stepPct(s, n) >= 1) {
    const nx = [1, 2, 3, 4, 5, 6].find((k) => stepPct(s, k) < 1);
    n = nx || 6;
  }
  return advice(s, n);
}
