import type {
  ActivityId,
  BodyParams,
  CycleSummary,
  FrameAnalysis,
  InjuryRisk,
  JointId,
  JointLoad,
  MuscleActivation,
  Pose,
  PostureAssessment,
  SegmentId,
  Vec3,
} from "../types";
import {
  bodyWeightN,
  GRAVITY,
  MUSCLE_GROUPS,
  segmentLength,
  segmentMass,
  SEGMENT_MAP,
} from "./anthropometry";

/**
 * ── Biomechanics analysis engine ────────────────────────────────────────────
 *
 * A pure, framework-free (no DOM, no Three.js) estimator that turns a jointed
 * body `Pose` into credible, textbook-model biomechanics: whole-body centre of
 * mass, joint reaction forces & torques, muscle activation, spinal (L5/S1)
 * compression, injury indices, and metabolic power. Every number here is a
 * **model estimate for education**, not a lab-measured value — the point is
 * plausibility and the right qualitative response to posture, load, and speed,
 * not clinical accuracy.
 *
 * Method & model basis
 * ─────────────────────
 * • Anthropometry — segment masses, lengths and CoM locations come from the
 *   Dempster (1955) / Winter cadaver-derived tables (see `anthropometry.ts`),
 *   the standard basis for estimating limb inertias from height + total mass
 *   alone. Whole-body CoM is the mass-weighted mean of segment CoMs, exactly as
 *   a gait lab reconstructs it from marker positions.
 *
 * • Joint reaction forces — a simplified **inverse-dynamics** bottom-up pass on
 *   the load-bearing lower-limb chain (ankle → knee → hip). Each joint carries
 *   the weight of everything distal to it plus that limb's share of the ground
 *   reaction force (GRF) plus an inertial term that scales with activity
 *   intensity (Winter, *Biomechanics and Motor Control of Human Movement*). Net
 *   joint torque ≈ reaction-force component × a flexion-dependent moment arm.
 *
 * • L5/S1 spinal compression — the classic static lifting model (Chaffin &
 *   Andersson, *Occupational Biomechanics*): the upper-body + arms + external
 *   load act at a horizontal moment arm that grows with trunk flexion; the
 *   erector spinae resists at a short ~0.05 m lever, so a small horizontal load
 *   demands a large muscle force, and compression ≈ that muscle force plus the
 *   supported weight. This is why a loaded, flexed deadlift drives compression
 *   into the thousands of newtons. Risk bands follow the NIOSH lifting-equation
 *   thresholds: 3400 N action limit, 6400 N maximum permissible limit.
 *
 * • Metabolic power — a per-kg baseline scaled by activity intensity, movement
 *   speed and GRF, in the ballpark of published net metabolic rates (walking
 *   ≈ 3–4 W/kg; running/sprinting several times higher).
 *
 * Determinism: no `Math.random`, no `Date.now`. Every output is a smooth
 * function of the pose so the animation never jitters. All fractions and
 * activations are clamped to [0, 1].
 * ────────────────────────────────────────────────────────────────────────────
 */

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const RAD2DEG = 180 / Math.PI;

/**
 * Per-joint reaction-force references (multiples of bodyweight) used to
 * normalize `loadFraction` into a meaningful 0..1 for coloring. Chosen so that
 * everyday loads land mid-range and only genuinely high demand saturates:
 * walking knee ≈ 3×BW, running ≈ 5–7×BW, a heavy loaded squat hip up toward
 * 8×BW. The lumbar spine uses an absolute newton reference (below).
 */
const JOINT_REF: Partial<Record<JointId, number>> = {
  ankleL: 5,
  ankleR: 5,
  kneeL: 6,
  kneeR: 6,
  hipL: 8,
  hipR: 8,
  shoulderL: 3,
  shoulderR: 3,
  elbowL: 2.5,
  elbowR: 2.5,
  neck: 2,
};
/** Absolute compression reference for the lumbar spine (newtons). */
const LUMBAR_REF_N = 6400; // NIOSH maximum-permissible-limit region
/** Erector-spinae moment arm at L5/S1 (metres) — classic lifting model. */
const ERECTOR_LEVER_M = 0.05;
/** NIOSH lifting-equation compression thresholds (newtons). */
const NIOSH_ACTION_LIMIT_N = 3400;
const NIOSH_MAX_LIMIT_N = 6400;

/** Per-activity intensity multiplier for inertial/impact terms. */
const ACTIVITY_INTENSITY: Readonly<Record<ActivityId, number>> = {
  walk: 1,
  run: 1.6,
  sprint: 2.3,
  squat: 1.1,
  deadlift: 1.15,
  jump: 1.9,
  throw: 1.1,
  cycle: 0.85,
};

/** Baseline metabolic power per kg (W/kg) at speed = 1 by activity. */
const METABOLIC_BASE_WKG: Readonly<Record<ActivityId, number>> = {
  walk: 3.5,
  run: 10,
  sprint: 18,
  squat: 6,
  deadlift: 7,
  jump: 9,
  throw: 5,
  cycle: 6,
};

// ── Geometry helpers ─────────────────────────────────────────────────────────

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

/** Point a fraction `f` of the way from proximal `p` to distal `d`. */
function lerp(p: Vec3, d: Vec3, f: number): Vec3 {
  return [
    p[0] + (d[0] - p[0]) * f,
    p[1] + (d[1] - p[1]) * f,
    p[2] + (d[2] - p[2]) * f,
  ];
}

/** Endpoint keys (proximal, distal) that bracket each segment in `pose.points`. */
const SEGMENT_ENDPOINTS: Readonly<
  Record<SegmentId, readonly [string, string]>
> = {
  head: ["trunkTop", "headTop"],
  trunk: ["pelvis", "trunkTop"],
  upperArmL: ["shoulderL", "elbowL"],
  upperArmR: ["shoulderR", "elbowR"],
  forearmL: ["elbowL", "handL"],
  forearmR: ["elbowR", "handR"],
  handL: ["elbowL", "handL"],
  handR: ["elbowR", "handR"],
  thighL: ["hipL", "kneeL"],
  thighR: ["hipR", "kneeR"],
  shankL: ["kneeL", "ankleL"],
  shankR: ["kneeR", "ankleR"],
  footL: ["ankleL", "toeL"],
  footR: ["ankleR", "toeR"],
};

/** CoM point of one segment, derived from its two endpoint keys + comFraction. */
function segmentComPoint(id: SegmentId, pose: Pose): Vec3 {
  const [pKey, dKey] = SEGMENT_ENDPOINTS[id];
  const p = pose.points[pKey]!;
  const d = pose.points[dKey]!;
  // Hands sit at their own centre (endpoints already bracket the hand); using
  // comFraction of the endpoint span is still a fine point estimate.
  return lerp(p, d, SEGMENT_MAP[id].comFraction);
}

// ── 1. Whole-body centre of mass ─────────────────────────────────────────────

/**
 * Whole-body centre of mass = the mass-weighted average of every segment's CoM.
 * Each segment's CoM point is placed between its two endpoint joints at the
 * Dempster `comFraction`, then weighted by `segmentMass`. This is the same
 * reconstruction a marker-based gait lab uses.
 */
export function computeCoM(pose: Pose, body: BodyParams): Vec3 {
  let mx = 0;
  let my = 0;
  let mz = 0;
  let total = 0;
  for (const seg of Object.keys(SEGMENT_ENDPOINTS) as SegmentId[]) {
    const m = segmentMass(seg, body);
    const c = segmentComPoint(seg, pose);
    mx += c[0] * m;
    my += c[1] * m;
    mz += c[2] * m;
    total += m;
  }
  if (total <= 0) return pose.points.pelvis ?? [0, 0, 0];
  return [mx / total, my / total, mz / total];
}

// ── 2. Per-frame analysis ────────────────────────────────────────────────────

/** Mass (kg) of everything at and distal to a given lower-limb joint on one side. */
function distalLegMass(
  joint: "ankle" | "knee" | "hip",
  side: "L" | "R",
  body: BodyParams,
): number {
  const foot = segmentMass(`foot${side}` as SegmentId, body);
  const shank = segmentMass(`shank${side}` as SegmentId, body);
  const thigh = segmentMass(`thigh${side}` as SegmentId, body);
  if (joint === "ankle") return foot;
  if (joint === "knee") return foot + shank;
  return foot + shank + thigh; // hip
}

/** Upper-body mass (kg) supported through the trunk/spine, incl. external load. */
function upperBodyMass(body: BodyParams): number {
  const ids: SegmentId[] = [
    "head",
    "trunk",
    "upperArmL",
    "upperArmR",
    "forearmL",
    "forearmR",
    "handL",
    "handR",
  ];
  let m = 0;
  for (const id of ids) m += segmentMass(id, body);
  return m + body.loadKg;
}

/**
 * Core per-frame biomechanics. Runs the CoM, a simplified inverse-dynamics pass
 * over the lower-limb chain, the L5/S1 lifting model, arm loads, muscle
 * activations, injury indices, and a metabolic-power estimate — all as smooth
 * deterministic functions of the pose.
 */
export function analyzeFrame(
  pose: Pose,
  body: BodyParams,
  activity: ActivityId,
): FrameAnalysis {
  const bw = bodyWeightN(body);
  const intensity = ACTIVITY_INTENSITY[activity];
  const centerOfMass = computeCoM(pose, body);
  const comHeight = centerOfMass[1];
  const grfN = pose.grfBodyweights * bw;

  const ang = pose.jointAngles;
  const trunkFlex = Math.max(0, ang.lumbar ?? 0); // rad, + = forward flexion
  const trunkFlexDeg = Math.round(trunkFlex * RAD2DEG);
  const neckFlex = Math.abs(ang.neck ?? 0);

  const jointLoads: JointLoad[] = [];

  // ── Lower-limb inverse dynamics (bottom-up, both sides) ──────────────────
  // Each side carries roughly half the GRF; a joint sees the supported segment
  // weight + its GRF share + an inertial term that grows with activity
  // intensity and how flexed the joint is (dynamic, off-axis loading).
  const grfShare = grfN * 0.5;
  const lowerChain: Array<{
    id: JointId;
    joint: "ankle" | "knee" | "hip";
    side: "L" | "R";
    seg: SegmentId;
    label: string;
  }> = [
    {
      id: "ankleL",
      joint: "ankle",
      side: "L",
      seg: "shankL",
      label: "Left ankle",
    },
    {
      id: "ankleR",
      joint: "ankle",
      side: "R",
      seg: "shankR",
      label: "Right ankle",
    },
    {
      id: "kneeL",
      joint: "knee",
      side: "L",
      seg: "thighL",
      label: "Left knee",
    },
    {
      id: "kneeR",
      joint: "knee",
      side: "R",
      seg: "thighR",
      label: "Right knee",
    },
    { id: "hipL", joint: "hip", side: "L", seg: "trunk", label: "Left hip" },
    { id: "hipR", joint: "hip", side: "R", seg: "trunk", label: "Right hip" },
  ];

  for (const c of lowerChain) {
    const flex = Math.max(0, ang[c.id] ?? 0);
    // Supported weight through this joint (distal limb) + shared GRF.
    const supportedWeightN = distalLegMass(c.joint, c.side, body) * GRAVITY;
    // Inertial amplification: dynamic activities push the reaction above the
    // static minimum.
    const inertial =
      grfShare * (intensity - 1) * (0.6 + 0.4 * clamp01(flex / (Math.PI / 2)));
    // Muscle-contraction contribution — the dominant part of real joint contact
    // force. The extensors span a short internal lever, so balancing the
    // external flexion moment demands a muscle force a couple times that moment;
    // joint contact force = external + muscle. This is what makes a flexed,
    // weight-bearing knee reach 2–4×BW in gait and 4–7×BW in running. Scaling
    // with sqrt(GRF share) rather than GRF share keeps high-impact values in a
    // plausible band instead of blowing up; a straight leg stays near GRF.
    const muscleGain = c.joint === "knee" ? 1.5 : c.joint === "hip" ? 1.3 : 0.8;
    const grfRoot = Math.sqrt(grfShare * bw); // damped GRF scaling (N)
    const contraction =
      (supportedWeightN + grfRoot + inertial) *
      muscleGain *
      Math.sin(Math.min(flex, Math.PI / 2));
    const forceN = supportedWeightN + grfShare + inertial + contraction;

    // Net joint torque ≈ reaction-force component × moment arm. The lever is the
    // segment CoM distance from the joint, opened up by flexion (a flexed knee
    // has a longer external moment arm about the joint centre).
    const lever = segmentLength(c.seg, body) * SEGMENT_MAP[c.seg].comFraction;
    const torqueNm =
      forceN * lever * Math.sin(Math.min(flex + 0.15, Math.PI / 2));

    const refBw = JOINT_REF[c.id] ?? 5;
    jointLoads.push({
      joint: c.id,
      label: c.label,
      forceN,
      torqueNm,
      bodyweights: forceN / bw,
      loadFraction: clamp01(forceN / (refBw * bw)),
    });
  }

  // ── L5/S1 lumbar compression (static lifting model) ──────────────────────
  // Upper body + arms + load act at a horizontal moment arm that grows with
  // trunk flexion (arm ≈ upper-body CoM height × sin(flex), plus the load held
  // out in front). Erector spinae resists at ERECTOR_LEVER_M, so:
  //   Fmuscle = (Wupper·armUpper + Wload·armLoad) / erectorLever
  //   compression ≈ Fmuscle + (Wupper + Wload)·cos(flex)
  const upperMassKg = upperBodyMass(body);
  const upperWeightN = upperMassKg * GRAVITY;
  const loadWeightN = body.loadKg * GRAVITY;
  const trunkLen = segmentLength("trunk", body);
  // Horizontal offset of the upper-body CoM ahead of L5/S1 when flexed.
  const armUpper = trunkLen * 0.5 * Math.sin(trunkFlex) + 0.02;
  // A held load is kept close to the body (good lifting technique keeps the bar
  // ~0.1–0.2 m from the spine); the offset grows modestly with flexion.
  const armLoad = 0.08 + trunkLen * 0.15 * Math.sin(trunkFlex);
  const erectorForceN =
    (upperWeightN * armUpper + loadWeightN * armLoad) / ERECTOR_LEVER_M;
  const spinalCompressionN =
    erectorForceN + (upperWeightN + loadWeightN) * Math.cos(trunkFlex);

  jointLoads.push({
    joint: "lumbar",
    label: "L5/S1 lumbar",
    forceN: spinalCompressionN,
    torqueNm: upperWeightN * armUpper + loadWeightN * armLoad,
    bodyweights: spinalCompressionN / bw,
    loadFraction: clamp01(spinalCompressionN / LUMBAR_REF_N),
  });

  // ── Shoulder & elbow (arm elevation + held load) ─────────────────────────
  // Reaction rises with how elevated the arm is and any grip load. Throwing
  // spikes the throwing shoulder; deadlift grip loads both.
  const gripShareN = loadWeightN * 0.5; // each hand
  for (const side of ["L", "R"] as const) {
    const shId = `shoulder${side}` as JointId;
    const elId = `elbow${side}` as JointId;
    const elev = Math.abs(ang[shId] ?? 0); // rad from neutral hang
    const armWeightN =
      (segmentMass(`upperArm${side}` as SegmentId, body) +
        segmentMass(`forearm${side}` as SegmentId, body) +
        segmentMass(`hand${side}` as SegmentId, body)) *
      GRAVITY;
    // Deltoid/rotator demand grows with elevation (moment arm ∝ sin(elev)) and
    // dynamic intensity for throwing.
    const throwBoost = activity === "throw" ? 1 + elev * intensity * 0.6 : 1;
    const shForceN =
      (armWeightN * (1 + 3 * Math.sin(Math.min(elev, Math.PI / 2))) +
        gripShareN) *
      throwBoost;
    const uArmLen = segmentLength(`upperArm${side}` as SegmentId, body);
    const shTorqueNm =
      shForceN *
      uArmLen *
      SEGMENT_MAP[`upperArm${side}` as SegmentId].comFraction *
      Math.sin(Math.min(elev + 0.1, Math.PI / 2));
    jointLoads.push({
      joint: shId,
      label: side === "L" ? "Left shoulder" : "Right shoulder",
      forceN: shForceN,
      torqueNm: shTorqueNm,
      bodyweights: shForceN / bw,
      loadFraction: clamp01(shForceN / ((JOINT_REF[shId] ?? 3) * bw)),
    });

    const elbowFlex = Math.abs(ang[elId] ?? 0);
    const foreWeightN =
      (segmentMass(`forearm${side}` as SegmentId, body) +
        segmentMass(`hand${side}` as SegmentId, body)) *
      GRAVITY;
    const elForceN =
      (foreWeightN + gripShareN) *
      (1 + 0.4 * Math.sin(Math.min(elbowFlex, Math.PI / 2)));
    const fArmLen = segmentLength(`forearm${side}` as SegmentId, body);
    const elTorqueNm =
      elForceN *
      fArmLen *
      SEGMENT_MAP[`forearm${side}` as SegmentId].comFraction;
    jointLoads.push({
      joint: elId,
      label: side === "L" ? "Left elbow" : "Right elbow",
      forceN: elForceN,
      torqueNm: elTorqueNm,
      bodyweights: elForceN / bw,
      loadFraction: clamp01(elForceN / ((JOINT_REF[elId] ?? 2.5) * bw)),
    });
  }

  // ── Neck ─────────────────────────────────────────────────────────────────
  const headWeightN = segmentMass("head", body) * GRAVITY;
  const neckForceN =
    headWeightN * (1 + 2 * Math.sin(Math.min(neckFlex, Math.PI / 2)));
  jointLoads.push({
    joint: "neck",
    label: "Neck (C-spine)",
    forceN: neckForceN,
    torqueNm:
      neckForceN *
      segmentLength("head", body) *
      0.5 *
      Math.sin(Math.min(neckFlex + 0.05, Math.PI / 2)),
    bodyweights: neckForceN / bw,
    loadFraction: clamp01(neckForceN / ((JOINT_REF.neck ?? 2) * bw)),
  });

  // ── Muscle activations ───────────────────────────────────────────────────
  const grfBw = pose.grfBodyweights;
  const kneeFlexAvg =
    (Math.max(0, ang.kneeL ?? 0) + Math.max(0, ang.kneeR ?? 0)) /
    2 /
    (Math.PI / 2);
  const hipFlexAvg =
    (Math.max(0, ang.hipL ?? 0) + Math.max(0, ang.hipR ?? 0)) /
    2 /
    (Math.PI / 2);
  const ankleAvg =
    (Math.abs(ang.ankleL ?? 0) + Math.abs(ang.ankleR ?? 0)) / 2 / (Math.PI / 6);
  const loadFactor = clamp01(body.loadKg / (body.mass * 1.5)); // 0..1 external load severity

  const muscles: MuscleActivation[] = MUSCLE_GROUPS.map((mg) => {
    const primary = mg.primaryFor.includes(activity);
    const base = 0.08; // resting tone
    const boost = primary ? 0.15 : 0;
    let driver = 0;
    switch (mg.id) {
      case "quads-l":
      case "quads-r":
        // Quads track knee flexion × ground loading.
        driver = 0.7 * kneeFlexAvg * clamp01(grfBw / 1.5) + 0.15 * loadFactor;
        break;
      case "hams-l":
      case "hams-r":
        // Hamstrings track hip flexion (hinge) and load.
        driver = 0.6 * hipFlexAvg * clamp01(grfBw / 1.5) + 0.25 * loadFactor;
        break;
      case "calf-l":
      case "calf-r":
        // Calves track push-off (ankle) × GRF.
        driver =
          0.6 * ankleAvg * clamp01(grfBw / 1.2) + 0.2 * clamp01(grfBw - 1);
        break;
      case "glute":
        driver = 0.6 * hipFlexAvg * clamp01(grfBw / 1.3) + 0.25 * loadFactor;
        break;
      case "erector":
        // Erector spinae tracks trunk flexion × load — the spinal driver.
        driver =
          0.5 * clamp01(trunkFlex / (Math.PI / 3)) * (0.6 + 0.8 * loadFactor) +
          0.3 * clamp01(spinalCompressionN / LUMBAR_REF_N);
        break;
      case "abs":
        driver =
          0.35 * clamp01(grfBw / 1.5) +
          0.25 * Math.sin(pose.phase * 2 * Math.PI) ** 2;
        break;
      case "delt-l":
      case "delt-r": {
        const side = mg.id.endsWith("-l") ? "L" : "R";
        const elev = Math.abs(ang[`shoulder${side}` as JointId] ?? 0) / Math.PI;
        driver = 0.7 * clamp01(elev) + 0.2 * loadFactor;
        break;
      }
      case "bic-r": {
        const elbow = Math.abs(ang.elbowR ?? 0) / Math.PI;
        driver = 0.5 * clamp01(elbow) + 0.4 * loadFactor;
        break;
      }
      default:
        driver = 0.2 * clamp01(grfBw / 1.5);
    }
    return {
      id: mg.id,
      label: mg.label,
      activation: clamp01(base + boost + driver),
      segment: mg.segment,
    };
  });

  // ── Injury indices ───────────────────────────────────────────────────────
  const kneeLoads = jointLoads.filter(
    (j) => j.joint === "kneeL" || j.joint === "kneeR",
  );
  const peakKnee = kneeLoads.reduce((m, j) => (j.forceN > m ? j.forceN : m), 0);
  const shoulderLoads = jointLoads.filter(
    (j) => j.joint === "shoulderL" || j.joint === "shoulderR",
  );
  const peakShoulder = shoulderLoads.reduce(
    (m, j) => (j.forceN > m ? j.forceN : m),
    0,
  );
  const ankleForce = jointLoads
    .filter((j) => j.joint === "ankleL" || j.joint === "ankleR")
    .reduce((m, j) => (j.forceN > m ? j.forceN : m), 0);

  const levelOf = (r: number): InjuryRisk["level"] =>
    r < 0.4 ? "low" : r < 0.7 ? "moderate" : "high";

  const injuries: InjuryRisk[] = [];

  // Lumbar spine — anchored to the NIOSH thresholds.
  const lumbarRisk = clamp01(
    spinalCompressionN <= NIOSH_ACTION_LIMIT_N
      ? (spinalCompressionN / NIOSH_ACTION_LIMIT_N) * 0.4
      : 0.4 +
          ((spinalCompressionN - NIOSH_ACTION_LIMIT_N) /
            (NIOSH_MAX_LIMIT_N - NIOSH_ACTION_LIMIT_N)) *
            0.5,
  );
  injuries.push({
    region: "Lumbar spine (L5/S1)",
    risk: lumbarRisk,
    level: levelOf(lumbarRisk),
    note:
      spinalCompressionN > NIOSH_MAX_LIMIT_N
        ? `Compression ${Math.round(spinalCompressionN)} N exceeds the NIOSH ${NIOSH_MAX_LIMIT_N} N maximum limit at ${trunkFlexDeg}° flexion.`
        : spinalCompressionN > NIOSH_ACTION_LIMIT_N
          ? `Compression ${Math.round(spinalCompressionN)} N is past the NIOSH ${NIOSH_ACTION_LIMIT_N} N action limit — brace and reduce trunk flexion.`
          : `Compression ${Math.round(spinalCompressionN)} N is within the NIOSH action limit.`,
  });

  // Knees — flexion × GRF driven.
  const kneeRisk = clamp01(
    (peakKnee / (JOINT_REF.kneeL! * bw)) * (0.7 + 0.5 * kneeFlexAvg),
  );
  injuries.push({
    region: "Knee (patellofemoral / ACL)",
    risk: kneeRisk,
    level: levelOf(kneeRisk),
    note: `Peak knee reaction ${(peakKnee / bw).toFixed(1)}×BW with deep flexion raises patellofemoral and ligament load.`,
  });

  // Shoulder — elevation/throw driven.
  const shoulderRisk = clamp01(
    (peakShoulder / (JOINT_REF.shoulderL! * bw)) *
      (activity === "throw" ? 1.3 : 1),
  );
  injuries.push({
    region: "Shoulder (rotator cuff)",
    risk: shoulderRisk,
    level: levelOf(shoulderRisk),
    note:
      activity === "throw"
        ? "High-velocity overhead loading stresses the rotator cuff and labrum."
        : `Shoulder reaction ${(peakShoulder / bw).toFixed(1)}×BW from arm elevation/grip load.`,
  });

  // Achilles / ankle — push-off × GRF driven.
  const ankleRisk = clamp01(
    (ankleForce / (JOINT_REF.ankleL! * bw)) * (0.6 + 0.6 * clamp01(grfBw - 1)),
  );
  injuries.push({
    region: "Achilles / ankle",
    risk: ankleRisk,
    level: levelOf(ankleRisk),
    note: `Ankle/Achilles load tracks ${grfBw.toFixed(1)}×BW ground reaction during push-off and landing.`,
  });

  // ── Metabolic power ──────────────────────────────────────────────────────
  const speedFactor = Math.max(0.3, body.speed);
  const grfExtra = 1 + 0.25 * Math.max(0, grfBw - 1);
  const loadExtra = 1 + 0.4 * (body.loadKg / body.mass);
  const metabolicW =
    METABOLIC_BASE_WKG[activity] *
    body.mass *
    speedFactor *
    grfExtra *
    loadExtra;

  // ── AI-assistant notes ───────────────────────────────────────────────────
  const notes: string[] = [];
  notes.push(
    `During ${pose.phaseLabel.toLowerCase()}, ground reaction is ${grfBw.toFixed(2)}×BW (${Math.round(grfN)} N) and the whole-body CoM sits ${comHeight.toFixed(2)} m above the floor.`,
  );
  if (spinalCompressionN > NIOSH_ACTION_LIMIT_N) {
    notes.push(
      `The lumbar spine sees ${Math.round(spinalCompressionN)} N of compression at ${trunkFlexDeg}° trunk flexion — ${
        spinalCompressionN > NIOSH_MAX_LIMIT_N ? "beyond" : "approaching"
      } the NIOSH action limit; keep the load closer and hinge less.`,
    );
  } else if (peakKnee / bw > 4) {
    notes.push(
      `Knee reaction peaks near ${(peakKnee / bw).toFixed(1)}×BW here — the quadriceps are working hard to control flexion under load.`,
    );
  }
  if (activity === "throw" && peakShoulder / bw > 1.5) {
    notes.push(
      `The throwing shoulder is highly loaded in this phase; rotator-cuff and labral stress peak through acceleration.`,
    );
  }

  return {
    phase: pose.phase,
    phaseLabel: pose.phaseLabel,
    centerOfMass,
    comHeight,
    jointLoads,
    muscles,
    injuries,
    grfN,
    spinalCompressionN,
    metabolicW,
    notes,
  };
}

// ── 3. Cycle summary ─────────────────────────────────────────────────────────

const CADENCE_PER_MIN: Readonly<Record<ActivityId, number>> = {
  walk: 110, // steps/min
  run: 165,
  sprint: 220,
  squat: 20, // reps/min
  deadlift: 15,
  jump: 30,
  throw: 24,
  cycle: 90, // rpm
};

const RISK_RANK: Readonly<Record<InjuryRisk["level"], number>> = {
  low: 0,
  moderate: 1,
  high: 2,
};

/**
 * Aggregate a full cycle of frame analyses: peak GRF, the single most-loaded
 * joint, peak spinal compression, average metabolic power, energy per cycle,
 * cadence, an overall risk band (worst injury level seen), and a left/right
 * symmetry percentage from peak knee/hip loads.
 */
export function summarizeCycle(
  frames: FrameAnalysis[],
  activity: ActivityId,
  body: BodyParams,
): CycleSummary {
  const bw = bodyWeightN(body);
  if (frames.length === 0) {
    return {
      activity,
      peakGrfN: 0,
      peakGrfBodyweights: 0,
      peakJoint: { label: "—", forceN: 0 },
      peakSpinalN: 0,
      avgMetabolicW: 0,
      energyPerCycleJ: 0,
      cadence: CADENCE_PER_MIN[activity],
      overallRisk: "low",
      symmetryPct: 100,
    };
  }

  let peakGrfN = 0;
  let peakSpinalN = 0;
  let peakJoint = { label: "—", forceN: 0 };
  let metabolicSum = 0;
  let worstRisk: InjuryRisk["level"] = "low";
  let peakKneeL = 0;
  let peakKneeR = 0;
  let peakHipL = 0;
  let peakHipR = 0;

  for (const f of frames) {
    if (f.grfN > peakGrfN) peakGrfN = f.grfN;
    if (f.spinalCompressionN > peakSpinalN) peakSpinalN = f.spinalCompressionN;
    metabolicSum += f.metabolicW;
    for (const j of f.jointLoads) {
      if (j.forceN > peakJoint.forceN)
        peakJoint = { label: j.label, forceN: j.forceN };
      if (j.joint === "kneeL" && j.forceN > peakKneeL) peakKneeL = j.forceN;
      if (j.joint === "kneeR" && j.forceN > peakKneeR) peakKneeR = j.forceN;
      if (j.joint === "hipL" && j.forceN > peakHipL) peakHipL = j.forceN;
      if (j.joint === "hipR" && j.forceN > peakHipR) peakHipR = j.forceN;
    }
    for (const inj of f.injuries) {
      if (RISK_RANK[inj.level] > RISK_RANK[worstRisk]) worstRisk = inj.level;
    }
  }

  const avgMetabolicW = metabolicSum / frames.length;
  // Cycle duration: roughly one second at speed = 1, scaled by movement speed.
  const cycleSeconds = 1 / Math.max(0.3, body.speed);
  const energyPerCycleJ = avgMetabolicW * cycleSeconds;

  // Symmetry: compare left vs right peak knee & hip loads. 100% = identical.
  const kneeSym = symmetry(peakKneeL, peakKneeR);
  const hipSym = symmetry(peakHipL, peakHipR);
  const symmetryPct = Math.round(((kneeSym + hipSym) / 2) * 1000) / 10;

  return {
    activity,
    peakGrfN,
    peakGrfBodyweights: peakGrfN / bw,
    peakJoint,
    peakSpinalN,
    avgMetabolicW,
    energyPerCycleJ,
    cadence: CADENCE_PER_MIN[activity] * Math.max(0.3, body.speed),
    overallRisk: worstRisk,
    symmetryPct,
  };
}

/** 0..1 symmetry between two peaks (1 = identical). */
function symmetry(a: number, b: number): number {
  const max = Math.max(a, b);
  if (max <= 0) return 1;
  return 1 - Math.abs(a - b) / max;
}

// ── 4. Static posture assessment ─────────────────────────────────────────────

/**
 * Assess a (typically standing or lifting) pose for postural alignment: trunk
 * flexion, forward-head/neck angle, shoulder and hip level symmetry. Produces a
 * 0–100 score (100 = neutral) plus plain-language findings and recommendations.
 */
export function assessPosture(pose: Pose, body: BodyParams): PostureAssessment {
  const ang = pose.jointAngles;
  const p = pose.points;

  // Spinal alignment = trunk flexion from vertical, degrees.
  const spinalAlignmentDeg = Math.abs((ang.lumbar ?? 0) * RAD2DEG);

  // Neck angle: prefer the measured joint angle; else derive from head-vs-trunk
  // vector tilt from vertical.
  let neckAngleDeg = Math.abs((ang.neck ?? 0) * RAD2DEG);
  if (ang.neck === undefined && p.headTop && p.trunkTop) {
    const v = sub(p.headTop, p.trunkTop);
    const len = norm(v) || 1;
    neckAngleDeg = Math.acos(clamp01(v[1] / len)) * RAD2DEG;
  }

  // Shoulder / hip level asymmetry: vertical mismatch converted to a small angle
  // across the joint width (atan of Δy over the segment span).
  const shoulderWidth = body.height * 0.11 * 2 || 1;
  const hipWidth = body.height * 0.09 * 2 || 1;
  const shoulderDy =
    p.shoulderL && p.shoulderR ? Math.abs(p.shoulderL[1] - p.shoulderR[1]) : 0;
  const hipDy = p.hipL && p.hipR ? Math.abs(p.hipL[1] - p.hipR[1]) : 0;
  const shoulderSymmetryDeg = Math.atan2(shoulderDy, shoulderWidth) * RAD2DEG;
  const hipAlignmentDeg = Math.atan2(hipDy, hipWidth) * RAD2DEG;

  // Score: start at 100, penalize each deviation. Trunk flexion is weighted
  // most heavily (spinal health), then forward head, then side asymmetries.
  let score = 100;
  score -= Math.min(45, spinalAlignmentDeg * 0.9);
  score -= Math.min(30, Math.max(0, neckAngleDeg - 5) * 1.2);
  score -= Math.min(15, shoulderSymmetryDeg * 3);
  score -= Math.min(15, hipAlignmentDeg * 3);
  score = Math.round(clamp01(score / 100) * 100);

  const findings: string[] = [];
  const recommendations: string[] = [];

  if (spinalAlignmentDeg > 15) {
    findings.push(
      `Significant trunk flexion detected (${Math.round(spinalAlignmentDeg)}°).`,
    );
    recommendations.push(
      "Reduce lumbar flexion under load; hinge from the hips and keep the spine neutral.",
    );
  } else if (spinalAlignmentDeg > 5) {
    findings.push(
      `Mild forward trunk lean (${Math.round(spinalAlignmentDeg)}°).`,
    );
  } else {
    findings.push("Trunk is close to neutral upright alignment.");
  }

  if (neckAngleDeg > 12) {
    findings.push(
      `Forward head posture detected (${Math.round(neckAngleDeg)}°).`,
    );
    recommendations.push(
      "Retract the chin and stack the head over the shoulders to unload the cervical spine.",
    );
  }

  if (shoulderSymmetryDeg > 2) {
    findings.push(
      `Shoulder height asymmetry (${shoulderSymmetryDeg.toFixed(1)}°).`,
    );
    recommendations.push(
      "Level the shoulders; check for single-side loading or muscular imbalance.",
    );
  }
  if (hipAlignmentDeg > 2) {
    findings.push(
      `Pelvic obliquity / hip height asymmetry (${hipAlignmentDeg.toFixed(1)}°).`,
    );
    recommendations.push(
      "Balance weight evenly between both legs to level the pelvis.",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Posture is well aligned — maintain neutral spine and even loading.",
    );
  }

  return {
    spinalAlignmentDeg,
    neckAngleDeg,
    shoulderSymmetryDeg,
    hipAlignmentDeg,
    score,
    findings,
    recommendations,
  };
}
