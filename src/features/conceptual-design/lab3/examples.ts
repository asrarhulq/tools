// One-click worked examples taken from the slides.
import { EXAMPLE_FS, RIG, RIG_TREE, RIG_CRIT_ORDER, RIG_VALUES } from "./data";
import { leaves } from "./derive";
import type { State, Fn, Flow, Principle, Structure, Crit } from "./types";
import { defaultState } from "./types";

export function loadFsExample(s: State, key: "carpet" | "jar" | "driver") {
  const e = EXAMPLE_FS[key];
  s.fs = {
    overall: e.overall,
    fns: e.fns.map((f) => ({ ...f })) as Fn[],
    flows: e.flows.map((f) => ({ ...f })) as Flow[],
    boundary: true,
  };
}

/** Whole impulse-loading test rig case (slides p.99–115): functions, 5+ principles each, V1–V4, criteria, ratings, hierarchy. */
export function loadRig(s: State) {
  const d = defaultState();
  Object.assign(s, d);
  s.current = 5;
  s.abs = {
    reqs: [
      {
        id: "r1",
        text: "Apply dynamically changing torque (impulse loading)",
        verdict: "keep",
        essence: "Time-varying torque on a test piece",
        general: "Time-varying load on a specimen",
      },
      {
        id: "r2",
        text: "Measure load levels, stresses and strains",
        verdict: "keep",
        essence: "Measure loads and responses while loading",
        general: "Measure mechanical quantities",
      },
      {
        id: "r3",
        text: "Looks good on the lab bench",
        verdict: "pref",
        essence: "",
        general: "",
      },
    ],
    product: "impulse test rig",
    statement:
      "Apply a time-varying load to a specimen while measuring the loads and responses it produces.",
  };
  const fns: Fn[] = RIG.rows.map((r, i) => ({
    id: `rf${i + 1}`,
    name: r.n.replace(/^Change energy: /, "Change energy: "),
    aux: false,
  }));
  const flows: Flow[] = [
    { id: "rl0", from: "IN", to: fns[0]!.id, type: "E", label: "electricity" },
  ];
  fns.forEach((f, i) => {
    if (i)
      flows.push({
        id: `rl${i}`,
        from: fns[i - 1]!.id,
        to: f.id,
        type: "E",
        label: "energy",
      });
  });
  flows.push({
    id: "rlx",
    from: fns[fns.length - 1]!.id,
    to: "OUT",
    type: "E",
    label: "dynamic torque",
  });
  s.fs = {
    overall: "Apply dynamically changing torque to a specimen",
    fns,
    flows,
    boundary: true,
  };
  const ps: Principle[] = [];
  RIG.rows.forEach((r, i) =>
    r.p.forEach((t, j) =>
      ps.push({
        id: `rp${i + 1}_${j + 1}`,
        fnId: fns[i]!.id,
        text: t,
        effect: r.e[j]!,
        geometry: "",
        sketch: "",
        sketched: true,
      }),
    ),
  );
  s.principles = ps;
  s.structures = RIG.variants.map((v) => {
    const picks: Record<string, string[]> = {};
    v.codes.forEach((c) => {
      const [r, k] = c.split(".").map(Number);
      const fn = fns[r! - 1];
      if (!fn) return;
      const id = `rp${r}_${k}`;
      const arr = (picks[fn.id] ||= []);
      if (!arr.includes(id)) arr.push(id);
    });
    return {
      id: v.name,
      name: v.name,
      picks,
      checks: {
        phys: true,
        geom: true,
        energy: true,
        signal: true,
        material: true,
      },
      sketched: true,
      note: v.note || "",
    } as Structure;
  });
  const lv = leaves(RIG_TREE);
  const byId = new Map(lv.map((l) => [l.id, l]));
  s.crit = RIG_CRIT_ORDER.map((id, i) => {
    const l = byId.get(id)!;
    return {
      id,
      name: l.name,
      rank: i + 1,
      weight: l.w,
      pref: "H",
      lo: 0,
      hi: 10,
      unit: "score",
    } as Crit;
  });
  s.weightMode = "direct";
  s.obj = JSON.parse(JSON.stringify(RIG_TREE));
  s.ratings = {};
  Object.entries(RIG_VALUES).forEach(([v, arr]) => {
    s.ratings[v] = {};
    RIG_CRIT_ORDER.forEach((c, i) => {
      s.ratings[v]![c] = arr[i]!;
    });
  });
  s.elim = {};
  s.final.structId = "V2";
}
