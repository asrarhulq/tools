import type { ActivityId } from "../types";

/**
 * Educational content: activity explanations (what/why/engineering/biology) and
 * an interactive body-map knowledge base (anatomy, function, common injuries,
 * biomechanics, prevention) for each clickable region.
 */

export interface ActivityLesson {
  what: string;
  why: string;
  engineering: string;
  biology: string;
}

export const LESSONS: Record<ActivityId, ActivityLesson> = {
  walk: {
    what: "Walking is a gait cycle alternating single- and double-support phases, with the centre of mass vaulting over a relatively stiff stance leg.",
    why: "It is the most common human movement — understanding its low but repetitive loads matters for rehabilitation and long-term joint health.",
    engineering:
      "The stance leg behaves like an inverted pendulum; ground reaction force shows a characteristic two-hump curve (~1.1×BW) from heel-strike and push-off.",
    biology:
      "Efficient walking exchanges kinetic and gravitational potential energy, so metabolic cost per distance is remarkably low (~2–4 W/kg).",
  },
  run: {
    what: "Running adds a flight phase with no ground contact and replaces the inverted pendulum with a spring-mass model.",
    why: "Impact forces rise to 2–3×BW, so joint loading and running form strongly influence injury risk.",
    engineering:
      "The leg acts as a linear spring; peak vertical GRF and loading rate are key predictors of tibial and knee stress.",
    biology:
      "Elastic energy stored in the Achilles and arch is recycled each stride, improving economy at higher speeds.",
  },
  sprint: {
    what: "Sprinting is maximal-effort running with high cadence, large hip extension velocity, and brief, forceful ground contacts.",
    why: "Forces peak (up to 4–5×BW) and hamstrings work near their limits — the classic setting for strains.",
    engineering:
      "Horizontal propulsion depends on producing large impulse in a very short contact time; power output is enormous.",
    biology:
      "Fast-twitch fibres dominate; the hamstrings act eccentrically to decelerate the shank, a common injury mechanism.",
  },
  squat: {
    what: "The squat is a bilateral knee- and hip-dominant movement lowering and raising the body (and any load).",
    why: "It builds lower-body strength but stresses the knees and lumbar spine, especially with heavy load or forward lean.",
    engineering:
      "Knee and hip torques scale with the moment arm from the joint to the load line; deep flexion and load raise both.",
    biology:
      "Quadriceps, glutes, and erector spinae co-contract; bracing raises intra-abdominal pressure to protect the spine.",
  },
  deadlift: {
    what: "The deadlift is a hip-hinge lift of a load from the floor to standing.",
    why: "It produces some of the highest safely-trainable spinal loads — technique dominates injury risk.",
    engineering:
      "L5/S1 compression follows a lever model: load × horizontal distance to the spine is resisted by erector spinae at a tiny (~5 cm) moment arm, multiplying the force.",
    biology:
      "The posterior chain (glutes, hamstrings, erectors) extends the hips and spine; a neutral spine keeps shear within tolerance.",
  },
  jump: {
    what: "A counter-movement jump loads the legs eccentrically, then explosively extends the hips, knees, and ankles for flight.",
    why: "Landing forces can exceed 3–4×BW, making landing mechanics a key ACL-injury factor.",
    engineering:
      "Take-off velocity comes from impulse (force × time); landing must dissipate that same energy over a controlled range.",
    biology:
      "The stretch-shortening cycle stores and releases elastic energy; knee valgus on landing raises ligament strain.",
  },
  throw: {
    what: "Overhead throwing is a kinetic-chain sequence from legs and trunk to the arm, ending in rapid shoulder and elbow motion.",
    why: "The shoulder reaches extreme angular velocities, so repetitive throwing overloads the rotator cuff and elbow.",
    engineering:
      "Energy transfers proximal-to-distal; the arm is the last, fastest link, amplifying small trunk contributions.",
    biology:
      "The rotator cuff decelerates the arm eccentrically during follow-through — the highest-demand phase.",
  },
  cycle: {
    what: "Cycling is a closed-chain, low-impact leg movement driving pedals through a repeated revolution.",
    why: "Joint impact is minimal, but sustained flexed posture and repetitive load affect the knees and lower back.",
    engineering:
      "Power = pedal force × cadence × crank length; saddle height changes the knee's effective moment arm.",
    biology:
      "Quadriceps and calves dominate the down-stroke; there is little eccentric loading, so it is gentle on tissue.",
  },
};

export interface BodyRegion {
  id: string;
  label: string;
  anatomy: string;
  function: string;
  injuries: string[];
  biomechanics: string;
  prevention: string;
}

export const BODY_REGIONS: readonly BodyRegion[] = [
  {
    id: "lumbar",
    label: "Lumbar spine (L5/S1)",
    anatomy:
      "Five lumbar vertebrae with intervertebral discs; L5/S1 is the lowest, most loaded level.",
    function:
      "Supports the upper body, allows flexion/extension, and transfers load to the pelvis.",
    injuries: ["Disc herniation", "Muscle strain", "Facet joint irritation"],
    biomechanics:
      "Compressive load rises steeply with forward flexion and external load due to the short erector-spinae moment arm.",
    prevention:
      "Keep a neutral spine under load, hinge at the hips, brace the core, and progress load gradually.",
  },
  {
    id: "knee",
    label: "Knee joint",
    anatomy:
      "Hinge joint between femur, tibia, and patella, stabilized by ACL, PCL, MCL, LCL and the menisci.",
    function:
      "Flexes and extends the leg and absorbs impact during gait and landing.",
    injuries: [
      "ACL tear",
      "Meniscus tear",
      "Patellofemoral pain",
      "Patellar tendinopathy",
    ],
    biomechanics:
      "Reaction forces reach 3–7×BW in running; valgus collapse on landing sharply raises ACL strain.",
    prevention:
      "Strengthen quads and glutes, train landing mechanics, and avoid sudden training-load spikes.",
  },
  {
    id: "hip",
    label: "Hip joint",
    anatomy:
      "Ball-and-socket joint between the femoral head and acetabulum with a deep, stable labrum.",
    function:
      "Bears body weight and provides a large range of motion for gait, squatting, and sprinting.",
    injuries: [
      "Labral tear",
      "Impingement (FAI)",
      "Hip flexor strain",
      "Bursitis",
    ],
    biomechanics:
      "Hip reaction force can exceed 8×BW during sprinting and single-leg landing.",
    prevention:
      "Maintain mobility and glute strength; avoid repetitive deep-flexion loading if symptomatic.",
  },
  {
    id: "ankle",
    label: "Ankle & Achilles",
    anatomy:
      "The talocrural joint plus the Achilles tendon connecting the calf muscles to the heel.",
    function:
      "Enables push-off and shock absorption; the Achilles stores and returns elastic energy.",
    injuries: ["Ankle sprain", "Achilles tendinopathy", "Achilles rupture"],
    biomechanics:
      "Achilles load can reach 6–8×BW in sprinting and jumping push-off.",
    prevention:
      "Progress calf loading, include eccentric heel drops, and manage surface/footwear changes.",
  },
  {
    id: "shoulder",
    label: "Shoulder complex",
    anatomy:
      "Glenohumeral ball-and-socket with the rotator cuff and scapular stabilizers.",
    function:
      "Provides the arm's huge range of motion at the cost of inherent instability.",
    injuries: [
      "Rotator cuff tear",
      "Impingement",
      "Labral (SLAP) tear",
      "Instability",
    ],
    biomechanics:
      "Throwing generates extreme angular velocity; the cuff decelerates the arm eccentrically.",
    prevention:
      "Build cuff and scapular strength, manage throwing volume, and preserve mobility.",
  },
];
