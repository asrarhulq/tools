import type { ArgGraph, EdgeKind, NodeKind } from "../types";

/**
 * A library of classic arguments, pre-mapped and fully editable. Each is a
 * hand-authored `ArgGraph` (positions omitted — the canvas auto-lays them out on
 * load). These give the tool immediate substance and double as worked examples
 * of good structure.
 *
 * Authoring shorthand: `n(id, kind, label, confidence)` and
 * `e(source, target, kind)` keep the definitions compact and readable.
 */

interface Preset {
  id: string;
  title: string;
  blurb: string;
  build: () => ArgGraph;
}

let seq = 0;
const nid = () => `lib-${seq++}`;

function graph(
  spec: (
    n: (
      kind: NodeKind,
      label: string,
      confidence?: number,
      detail?: string,
    ) => string,
    e: (
      source: string,
      target: string,
      kind: EdgeKind,
      weight?: number,
    ) => void,
  ) => void,
): ArgGraph {
  const nodes: ArgGraph["nodes"] = [];
  const edges: ArgGraph["edges"] = [];
  let ei = 0;
  const n = (
    kind: NodeKind,
    label: string,
    confidence = 70,
    detail?: string,
  ) => {
    const id = nid();
    nodes.push({
      id,
      position: { x: 0, y: 0 },
      data: { kind, label, confidence, detail },
    });
    return id;
  };
  const e = (source: string, target: string, kind: EdgeKind, weight = 75) => {
    edges.push({
      id: `e${ei++}-${source}-${target}`,
      source,
      target,
      data: { kind, weight },
    });
  };
  spec(n, e);
  return { nodes, edges };
}

export const LIBRARY: Preset[] = [
  {
    id: "cogito",
    title: "Cogito, ergo sum",
    blurb: "Descartes' first certainty — I think, therefore I am.",
    build: () =>
      graph((n, e) => {
        const doubt = n(
          "premise",
          "I can doubt everything, even my senses.",
          80,
        );
        const thinking = n(
          "premise",
          "But doubting is itself a form of thinking.",
          90,
        );
        const cannotDoubt = n(
          "intermediate",
          "So I cannot doubt that I am thinking.",
          88,
        );
        const exists = n(
          "conclusion",
          "Therefore I exist (as a thinking thing).",
          85,
        );
        const assume = n("assumption", "Thinking requires a thinker.", 70);
        e(doubt, thinking, "supports");
        e(thinking, cannotDoubt, "supports");
        e(cannotDoubt, exists, "supports");
        e(assume, exists, "dependsOn");
      }),
  },
  {
    id: "trolley",
    title: "The Trolley Problem",
    blurb: "Should you divert the trolley to kill one instead of five?",
    build: () =>
      graph((n, e) => {
        const util = n("principle", "Minimise total deaths.", 75);
        const divert = n("conclusion", "You should pull the lever.", 60);
        const five = n("premise", "Doing nothing lets five die.", 90);
        const one = n("premise", "Pulling the lever kills one.", 90);
        const doing = n("objection", "Killing is worse than letting die.", 65);
        const rights = n(
          "principle",
          "Using a person merely as a means is wrong.",
          60,
        );
        e(util, divert, "supports");
        e(five, divert, "supports");
        e(one, doing, "supports");
        e(doing, divert, "attacks");
        e(rights, doing, "supports");
      }),
  },
  {
    id: "evil",
    title: "The Problem of Evil",
    blurb: "Can an all-good, all-powerful God coexist with suffering?",
    build: () =>
      graph((n, e) => {
        const omni = n("premise", "God is omnipotent and omnibenevolent.", 70);
        const evil = n("observation", "Gratuitous suffering exists.", 92);
        const would = n(
          "premise",
          "A good, able being would prevent needless suffering.",
          80,
        );
        const contra = n("conclusion", "So such a God does not exist.", 55);
        const freewill = n(
          "rebuttal",
          "Free will requires the possibility of evil.",
          55,
        );
        const natural = n(
          "counterexample",
          "Natural disasters cause suffering without human choice.",
          70,
        );
        e(omni, contra, "supports");
        e(evil, contra, "supports");
        e(would, contra, "supports");
        e(freewill, contra, "attacks");
        e(natural, freewill, "attacks");
      }),
  },
  {
    id: "ship",
    title: "The Ship of Theseus",
    blurb: "If every plank is replaced, is it the same ship?",
    build: () =>
      graph((n, e) => {
        const replace = n(
          "premise",
          "Every plank of the ship is gradually replaced.",
          95,
        );
        const continuity = n(
          "premise",
          "Identity is preserved through gradual change.",
          60,
        );
        const same = n("intermediate", "So it is the same ship.", 55);
        const rebuilt = n(
          "counterexample",
          "The old planks are reassembled into a second ship.",
          85,
        );
        const both = n(
          "objection",
          "Both ships now have equal claim — they can't both be it.",
          75,
        );
        const def = n(
          "definition",
          "“Same” = unbroken spatiotemporal continuity.",
          60,
        );
        e(replace, same, "supports");
        e(continuity, same, "supports");
        e(rebuilt, both, "supports");
        e(both, same, "attacks");
        e(def, continuity, "qualifies");
      }),
  },
  {
    id: "pascal",
    title: "Pascal's Wager",
    blurb: "Is believing in God the rational bet?",
    build: () =>
      graph((n, e) => {
        const finite = n("premise", "Belief costs only a finite amount.", 65);
        const infinite = n(
          "premise",
          "If God exists, belief yields infinite reward.",
          50,
        );
        const bet = n("conclusion", "So you should wager on belief.", 45);
        const many = n(
          "objection",
          "Which God? Many mutually exclusive religions make the same offer.",
          80,
        );
        const sincerity = n(
          "objection",
          "You can't choose to sincerely believe for gain.",
          75,
        );
        const ev = n(
          "principle",
          "Maximise expected value under uncertainty.",
          70,
        );
        e(finite, bet, "supports");
        e(infinite, bet, "supports");
        e(ev, bet, "supports");
        e(many, bet, "attacks");
        e(sincerity, bet, "attacks");
      }),
  },
  {
    id: "simulation",
    title: "The Simulation Argument",
    blurb: "Are we almost certainly living in a simulation?",
    build: () =>
      graph((n, e) => {
        const able = n(
          "premise",
          "Advanced civilisations could run ancestor simulations.",
          60,
        );
        const many = n("premise", "They would run vast numbers of them.", 55);
        const count = n(
          "intermediate",
          "Simulated minds would vastly outnumber real ones.",
          60,
        );
        const prob = n("conclusion", "So we are probably simulated.", 40);
        const assume = n(
          "assumption",
          "Consciousness can be simulated on a computer.",
          45,
        );
        const ev = n(
          "evidence",
          "No physics experiment has revealed simulation artefacts.",
          70,
          "Observational — absence of evidence.",
        );
        e(able, count, "supports");
        e(many, count, "supports");
        e(count, prob, "supports");
        e(assume, prob, "dependsOn");
        e(ev, prob, "attacks");
      }),
  },
  {
    id: "chinese-room",
    title: "The Chinese Room",
    blurb: "Does running a program ever amount to understanding?",
    build: () =>
      graph((n, e) => {
        const room = n(
          "thoughtExperiment",
          "A person in a room follows rules to answer Chinese notes, without understanding Chinese.",
          85,
        );
        const syntax = n(
          "premise",
          "The person manipulates symbols by syntax alone.",
          85,
        );
        const nomind = n(
          "premise",
          "Syntax is not sufficient for semantics (meaning).",
          70,
        );
        const concl = n(
          "conclusion",
          "So running a program can't produce genuine understanding.",
          55,
        );
        const systems = n(
          "objection",
          "The whole system (room + rules) understands, even if the person doesn't.",
          65,
        );
        e(room, syntax, "illustrates");
        e(syntax, concl, "supports");
        e(nomind, concl, "supports");
        e(systems, concl, "attacks");
      }),
  },
  {
    id: "ontological",
    title: "The Ontological Argument",
    blurb: "Does the very concept of God entail God's existence?",
    build: () =>
      graph((n, e) => {
        const def = n(
          "definition",
          "God = a being than which none greater can be conceived.",
          70,
        );
        const greater = n(
          "premise",
          "Existing in reality is greater than existing only in the mind.",
          55,
        );
        const concl = n("conclusion", "So God must exist in reality.", 40);
        const kant = n(
          "objection",
          "Existence is not a predicate that adds greatness.",
          80,
        );
        const island = n(
          "counterexample",
          "The same form 'proves' a perfect island exists.",
          75,
        );
        e(def, concl, "supports");
        e(greater, concl, "supports");
        e(kant, concl, "attacks");
        e(island, concl, "attacks");
      }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return LIBRARY.find((p) => p.id === id);
}
