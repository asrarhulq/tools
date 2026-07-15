/**
 * Domain model for the Ethics Compass. A dilemma offers a "right" and a "wrong"
 * judgment; under each, four compass zones carry a distinct justification and
 * the moral-theory points it awards. The compass axes are:
 *   zoneA → Utility (left)      zoneB → Duty (right)
 *   zoneC → Divine Command (up) zoneD → Culture / Virtue (down)
 */

export type MoralTheory =
  "mill" | "kant" | "theological" | "aristotle" | "relativism";

export type MoralScores = Record<MoralTheory, number>;

export type CompassZone = "zoneA" | "zoneB" | "zoneC" | "zoneD";

export type Judgment = "right" | "wrong";

export interface Justification {
  text: string;
  scores: Partial<MoralScores>;
}

export interface Dilemma {
  id: number;
  text: string;
  actionText: string;
  options: Record<Judgment, Record<CompassZone, Justification>>;
}

export interface TheoryProfile {
  title: string;
  description: string;
  quote: string;
}
