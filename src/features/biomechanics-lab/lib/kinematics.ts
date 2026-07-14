import type { ActivityId, BodyParams, JointId, Pose, Vec3 } from "../types";
import { segmentLength } from "./anthropometry";
import { clampJoint, pulse, ramp } from "./motion-utils";

/**
 * ── Kinematics generators ───────────────────────────────────────────────────
 *
 * Produces a body pose for a normalized phase (0..1) of each activity. The body
 * is modelled in the sagittal plane (x = forward, y = up, z = lateral) as a
 * jointed chain: pelvis → spine → head, pelvis → thighs → shanks → feet, and
 * shoulders → arms. Joint flexion angles are driven by smooth periodic
 * functions tuned to published gait/lift kinematics (hip/knee/ankle ranges,
 * phase timing). Forward kinematics then places every joint centre, and a
 * ground-contact model produces the vertical GRF profile.
 *
 * The output feeds both the 3D renderer and the inverse-dynamics analysis, so
 * what you see is exactly what is analyzed.
 * ────────────────────────────────────────────────────────────────────────────
 */

const DEG = Math.PI / 180;

export function generatePose(
  activity: ActivityId,
  phase: number,
  body: BodyParams,
): Pose {
  switch (activity) {
    case "walk":
      return gait(phase, body, "walk");
    case "run":
      return gait(phase, body, "run");
    case "sprint":
      return gait(phase, body, "sprint");
    case "squat":
      return squat(phase, body);
    case "deadlift":
      return deadlift(phase, body);
    case "jump":
      return jump(phase, body);
    case "throw":
      return throwMotion(phase, body);
    case "cycle":
      return cycle(phase, body);
  }
}

// ── Shared forward-kinematics rig ────────────────────────────────────────────

interface RigAngles {
  /** Trunk lean from vertical (rad, + = forward flexion). */
  trunk: number;
  /** Neck flexion relative to trunk. */
  neck: number;
  hipL: number;
  hipR: number;
  kneeL: number;
  kneeR: number;
  ankleL: number;
  ankleR: number;
  shoulderL: number;
  shoulderR: number;
  elbowL: number;
  elbowR: number;
  /** Pelvis vertical offset (m) and forward offset (m). */
  pelvisY: number;
  pelvisX: number;
}

/**
 * Place all joint centres from a set of joint angles. Angles are flexions from
 * the neutral standing pose; positive hip/knee flex bring the segment forward.
 */
function solve(
  raw: RigAngles,
  body: BodyParams,
  grfBodyweights: number,
  phase: number,
  phaseLabel: string,
): Pose {
  // Clamp every joint to its anatomical range of motion so no generator can
  // produce an impossible pose. This is applied centrally so all activities
  // are guaranteed believable, and the clamped angles are exactly what the
  // analysis reads (kept consistent with what is drawn).
  const a: RigAngles = {
    ...raw,
    trunk: clampJoint("lumbar", raw.trunk),
    neck: clampJoint("neck", raw.neck),
    hipL: clampJoint("hipL", raw.hipL),
    hipR: clampJoint("hipR", raw.hipR),
    kneeL: clampJoint("kneeL", raw.kneeL),
    kneeR: clampJoint("kneeR", raw.kneeR),
    ankleL: clampJoint("ankleL", raw.ankleL),
    ankleR: clampJoint("ankleR", raw.ankleR),
    shoulderL: clampJoint("shoulderL", raw.shoulderL),
    shoulderR: clampJoint("shoulderR", raw.shoulderR),
    elbowL: clampJoint("elbowL", raw.elbowL),
    elbowR: clampJoint("elbowR", raw.elbowR),
  };
  const thigh = segmentLength("thighL", body);
  const shank = segmentLength("shankL", body);
  const foot = segmentLength("footL", body);
  const trunkLen = segmentLength("trunk", body);
  const head = segmentLength("head", body);
  const uArm = segmentLength("upperArmL", body);
  const fArm = segmentLength("forearmL", body);
  const hipWidth = body.height * 0.09;
  const shoulderWidth = body.height * 0.11;

  const pelvis: Vec3 = [a.pelvisX, a.pelvisY, 0];

  // Trunk up from pelvis, leaning forward by `trunk`.
  const trunkTop: Vec3 = [
    pelvis[0] + Math.sin(a.trunk) * trunkLen,
    pelvis[1] + Math.cos(a.trunk) * trunkLen,
    0,
  ];
  const headTop: Vec3 = [
    trunkTop[0] + Math.sin(a.trunk + a.neck) * head,
    trunkTop[1] + Math.cos(a.trunk + a.neck) * head,
    0,
  ];

  // Legs (sagittal). Hip angle measured from downward vertical, + = forward.
  const leg = (side: 1 | -1, hip: number, knee: number, ankle: number) => {
    const hipC: Vec3 = [pelvis[0], pelvis[1], side * hipWidth];
    const thighDir = -Math.PI + hip; // start pointing down, flex forward
    const kneeC: Vec3 = [
      hipC[0] + Math.sin(thighDir) * thigh,
      hipC[1] - Math.cos(hip) * thigh,
      hipC[2],
    ];
    const shankDir = hip - knee;
    const ankleC: Vec3 = [
      kneeC[0] + Math.sin(shankDir) * shank,
      kneeC[1] - Math.cos(shankDir) * shank,
      hipC[2],
    ];
    const toe: Vec3 = [
      ankleC[0] + Math.cos(shankDir - ankle) * foot,
      ankleC[1] - Math.sin(Math.abs(shankDir)) * foot * 0.15,
      hipC[2],
    ];
    return { hipC, kneeC, ankleC, toe };
  };

  const legL = leg(1, a.hipL, a.kneeL, a.ankleL);
  const legR = leg(-1, a.hipR, a.kneeR, a.ankleR);

  // Arms (sagittal), hanging then swinging.
  const arm = (side: 1 | -1, shoulder: number, elbow: number) => {
    const shC: Vec3 = [trunkTop[0], trunkTop[1], side * shoulderWidth];
    const upDir = -Math.PI + shoulder;
    const elbowC: Vec3 = [
      shC[0] + Math.sin(upDir) * uArm,
      shC[1] - Math.cos(shoulder) * uArm,
      shC[2],
    ];
    const foreDir = shoulder - elbow;
    const handC: Vec3 = [
      elbowC[0] + Math.sin(foreDir) * fArm,
      elbowC[1] - Math.cos(foreDir) * fArm,
      shC[2],
    ];
    return { shC, elbowC, handC };
  };

  const armL = arm(1, a.shoulderL, a.elbowL);
  const armR = arm(-1, a.shoulderR, a.elbowR);

  const points: Record<string, Vec3> = {
    pelvis,
    trunkTop,
    headTop,
    hipL: legL.hipC,
    kneeL: legL.kneeC,
    ankleL: legL.ankleC,
    toeL: legL.toe,
    hipR: legR.hipC,
    kneeR: legR.kneeC,
    ankleR: legR.ankleC,
    toeR: legR.toe,
    shoulderL: armL.shC,
    elbowL: armL.elbowC,
    handL: armL.handC,
    shoulderR: armR.shC,
    elbowR: armR.elbowC,
    handR: armR.handC,
  };

  const jointAngles: Partial<Record<JointId, number>> = {
    lumbar: a.trunk,
    neck: a.neck,
    hipL: a.hipL,
    hipR: a.hipR,
    kneeL: a.kneeL,
    kneeR: a.kneeR,
    ankleL: a.ankleL,
    ankleR: a.ankleR,
    shoulderL: a.shoulderL,
    shoulderR: a.shoulderR,
    elbowL: a.elbowL,
    elbowR: a.elbowR,
  };

  return { phase, points, jointAngles, grfBodyweights, phaseLabel };
}

// ── Gait (walk / run / sprint) ───────────────────────────────────────────────

function gait(
  phase: number,
  body: BodyParams,
  kind: "walk" | "run" | "sprint",
): Pose {
  const t = phase * 2 * Math.PI;
  const intensity = kind === "walk" ? 1 : kind === "run" ? 1.6 : 2.2;
  const hipAmp = (kind === "walk" ? 25 : kind === "run" ? 35 : 45) * DEG;
  const kneeAmp = (kind === "walk" ? 35 : kind === "run" ? 70 : 90) * DEG;
  const kneeBase = (kind === "walk" ? 10 : 18) * DEG;

  const hipL = Math.sin(t) * hipAmp + 5 * DEG;
  const hipR = Math.sin(t + Math.PI) * hipAmp + 5 * DEG;
  // Knee flexion driven by a smooth (1 - cos)/2 swing gate that peaks once per
  // stride — C¹ everywhere, so no "snap" back to zero as the old max(0,·) did.
  const swingGate = (ph: number) => (1 - Math.cos(ph)) * 0.5; // 0..1, smooth
  const kneeL = kneeBase + swingGate(t - 0.6) * kneeAmp;
  const kneeR = kneeBase + swingGate(t + Math.PI - 0.6) * kneeAmp;
  const ankleL = Math.sin(t + 0.4) * 15 * DEG;
  const ankleR = Math.sin(t + Math.PI + 0.4) * 15 * DEG;

  const trunk = (kind === "walk" ? 5 : kind === "run" ? 10 : 16) * DEG;

  // Vertical bob — smooth sinusoid (no abs() cusp).
  const bobAmp = kind === "walk" ? 0.02 : 0.05;
  const pelvisY =
    body.height * 0.53 - (0.5 - 0.5 * Math.cos(2 * t)) * bobAmp * body.height;

  // GRF: smooth double-hump. For running gaits a smooth window shapes stance
  // vs. a soft (never hard-zero) flight phase, so the force curve is continuous.
  let grf: number;
  if (kind === "walk") {
    grf = 1 + 0.25 * Math.cos(2 * t);
  } else {
    // Two smooth stance bells per cycle (one per foot), softened flight troughs.
    const stance = Math.max(
      Math.pow(Math.max(0, Math.sin(t)), 1.5),
      Math.pow(Math.max(0, Math.sin(t + Math.PI)), 1.5),
    );
    grf = intensity * (0.15 + 1.05 * stance);
  }

  const swingArm = (kind === "walk" ? 20 : 35) * DEG;
  return solve(
    {
      trunk,
      neck: -trunk * 0.3,
      hipL,
      hipR,
      kneeL,
      kneeR,
      ankleL,
      ankleR,
      shoulderL: Math.sin(t + Math.PI) * swingArm,
      shoulderR: Math.sin(t) * swingArm,
      elbowL: (kind === "walk" ? 20 : 80) * DEG,
      elbowR: (kind === "walk" ? 20 : 80) * DEG,
      pelvisY,
      pelvisX: 0,
    },
    body,
    grf,
    phase,
    gaitPhaseLabel(phase),
  );
}

function gaitPhaseLabel(phase: number): string {
  if (phase < 0.12) return "Heel strike";
  if (phase < 0.3) return "Loading response";
  if (phase < 0.5) return "Mid-stance";
  if (phase < 0.62) return "Terminal stance";
  if (phase < 0.75) return "Pre-swing";
  return "Swing";
}

// ── Squat ────────────────────────────────────────────────────────────────────

function squat(phase: number, body: BodyParams): Pose {
  // Down then up. Smooth (1−cos)/2 depth curve → zero velocity at top and
  // bottom (natural pause at lockout and the hole), C¹ everywhere: no cusp.
  const depth = (1 - Math.cos(phase * 2 * Math.PI)) * 0.5; // 0 top → 1 bottom → 0 top
  const hip = depth * 95 * DEG + 5 * DEG;
  const knee = depth * 110 * DEG + 8 * DEG;
  const ankle = depth * 30 * DEG;
  const trunk = depth * 40 * DEG + 5 * DEG; // forward lean at bottom
  const pelvisY = body.height * 0.53 - depth * body.height * 0.28;
  const grf =
    1 +
    (phase > 0.5 ? 0.4 * (1 - depth) : 0.1 * depth) +
    body.loadKg / body.mass;
  return solve(
    {
      trunk,
      neck: -trunk,
      hipL: hip,
      hipR: hip,
      kneeL: knee,
      kneeR: knee,
      ankleL: ankle,
      ankleR: ankle,
      shoulderL: 70 * DEG,
      shoulderR: 70 * DEG,
      elbowL: 90 * DEG,
      elbowR: 90 * DEG,
      pelvisY,
      pelvisX: -depth * 0.05,
    },
    body,
    grf,
    phase,
    depth > 0.85 ? "Bottom" : phase < 0.5 ? "Descent" : "Drive",
  );
}

// ── Deadlift ─────────────────────────────────────────────────────────────────

function deadlift(phase: number, body: BodyParams): Pose {
  // Bar starts on floor: max hip flexion + forward trunk at phase 0, lockout at
  // 0.5. Smooth (1−cos)/2 lift curve → natural pause at the floor and lockout,
  // C¹ everywhere (the old triangle wave snapped direction at both extremes).
  const lift = (1 - Math.cos(phase * 2 * Math.PI)) * 0.5; // 0 floor → 1 lockout → 0
  const hip = (1 - lift) * 70 * DEG + 10 * DEG;
  const knee = (1 - lift) * 65 * DEG + 8 * DEG;
  const trunk = (1 - lift) * 65 * DEG + 8 * DEG; // heavy hip hinge
  const pelvisY = body.height * 0.5 - (1 - lift) * body.height * 0.12;
  const grf = 1 + body.loadKg / body.mass + (1 - lift) * 0.15;
  // Arms hang straight to the bar.
  const armReach = trunk;
  return solve(
    {
      trunk,
      neck: -trunk * 0.6,
      hipL: hip,
      hipR: hip,
      kneeL: knee,
      kneeR: knee,
      ankleL: 12 * DEG,
      ankleR: 12 * DEG,
      shoulderL: armReach,
      shoulderR: armReach,
      elbowL: 3 * DEG,
      elbowR: 3 * DEG,
      pelvisY,
      pelvisX: 0,
    },
    body,
    grf,
    phase,
    lift < 0.15
      ? "Set-up / floor"
      : lift > 0.9
        ? "Lockout"
        : phase < 0.5
          ? "Pull"
          : "Lower",
  );
}

// ── Vertical jump ────────────────────────────────────────────────────────────

function jump(phase: number, body: BodyParams): Pose {
  // Timeline: 0–0.28 counter-movement crouch, 0.28–0.42 propulsion (extend),
  // 0.42–0.72 flight, 0.72–1.0 land + recover. Every segment is shaped with
  // C¹ smooth blends (ramp/pulse) so there are no velocity snaps at the seams.
  const crouch = pulse(phase, 0, 0.42); // rises into the hole, back out at take-off
  const landCrouch = ramp(phase, 0.72, 0.82) * (1 - ramp(phase, 0.82, 1)); // soft absorb + recover
  const depth = Math.max(crouch * 0.9, landCrouch * 0.75);

  // Flight arc: smooth half-sine hop, only during the flight window.
  const flightT = ramp(phase, 0.42, 0.72);
  const inFlight = flightT > 0 && flightT < 1;
  const air = inFlight ? Math.sin(flightT * Math.PI) * body.height * 0.34 : 0;

  // GRF: smooth loading dip, propulsive bell, soft-zero flight, landing bell.
  const propulsion = pulse(phase, 0.24, 0.44); // take-off spike
  const landing = pulse(phase, 0.72, 0.9); // impact
  const grf = inFlight
    ? 0.05
    : 1 + propulsion * 1.8 + landing * 2.4 - crouch * 0.25;

  const hip = depth * 80 * DEG + 5 * DEG;
  const knee = depth * 95 * DEG + 8 * DEG;
  const ankle = depth * 25 * DEG - air * 0.4;
  const pelvisY = body.height * 0.53 - depth * body.height * 0.2 + air;
  // Arms swing up through propulsion, reach overhead in flight, settle on land.
  const arm = (ramp(phase, 0.1, 0.5) - ramp(phase, 0.72, 0.95)) * 150 * DEG;
  return solve(
    {
      trunk: depth * 22 * DEG,
      neck: 0,
      hipL: hip,
      hipR: hip,
      kneeL: knee,
      kneeR: knee,
      ankleL: ankle,
      ankleR: ankle,
      shoulderL: arm,
      shoulderR: arm,
      elbowL: 15 * DEG,
      elbowR: 15 * DEG,
      pelvisY,
      pelvisX: 0,
    },
    body,
    Math.max(0.05, grf),
    phase,
    phase < 0.28
      ? "Counter-movement"
      : phase < 0.42
        ? "Propulsion"
        : phase < 0.72
          ? "Flight"
          : "Landing",
  );
}

// ── Overhead throw ─────────────────────────────────────────────────────────

function throwMotion(phase: number, body: BodyParams): Pose {
  // Right-arm throw shaped from smooth blends so the whip reads as one
  // continuous motion: arm draws back (wind-up), cocks high (cocking), whips
  // forward fast (acceleration), then decelerates (follow-through).
  const drawBack = ramp(phase, 0, 0.32); // 0 → 1 back
  const forward = ramp(phase, 0.32, 0.62); // rapid forward sweep
  const settle = ramp(phase, 0.62, 1);
  const shoulderR =
    -40 * DEG * drawBack + 200 * DEG * forward - 40 * DEG * settle;
  const elbowR = 30 * DEG + 90 * DEG * (drawBack - forward * 0.9);
  const trunk = Math.sin(phase * Math.PI) * 20 * DEG;
  return solve(
    {
      trunk,
      neck: 0,
      hipL: 10 * DEG,
      hipR: 15 * DEG,
      kneeL: 15 * DEG,
      kneeR: 20 * DEG,
      ankleL: 0,
      ankleR: 5 * DEG,
      shoulderL: -20 * DEG,
      shoulderR,
      elbowL: 40 * DEG,
      elbowR,
      pelvisY: body.height * 0.53,
      pelvisX: 0,
    },
    body,
    1.2,
    phase,
    phase < 0.3
      ? "Wind-up"
      : phase < 0.55
        ? "Cocking"
        : phase < 0.7
          ? "Acceleration"
          : "Follow-through",
  );
}

// ── Cycling ──────────────────────────────────────────────────────────────────

function cycle(phase: number, body: BodyParams): Pose {
  const t = phase * 2 * Math.PI;
  const hipBase = 40 * DEG;
  const hipL = hipBase + Math.sin(t) * 20 * DEG;
  const hipR = hipBase + Math.sin(t + Math.PI) * 20 * DEG;
  const kneeL = 60 * DEG + Math.sin(t - 0.5) * 45 * DEG;
  const kneeR = 60 * DEG + Math.sin(t + Math.PI - 0.5) * 45 * DEG;
  return solve(
    {
      trunk: 35 * DEG,
      neck: -25 * DEG,
      hipL,
      hipR,
      kneeL,
      kneeR,
      ankleL: 10 * DEG,
      ankleR: 10 * DEG,
      shoulderL: 55 * DEG,
      shoulderR: 55 * DEG,
      elbowL: 25 * DEG,
      elbowR: 25 * DEG,
      pelvisY: body.height * 0.5,
      pelvisX: 0,
    },
    body,
    Math.sin(t) > 0 ? 0.7 : 0.4,
    phase,
    "Pedal stroke",
  );
}
