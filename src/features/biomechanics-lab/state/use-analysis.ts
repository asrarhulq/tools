"use client";

import { useMemo } from "react";
import { generatePose } from "../lib/kinematics";
import { analyzeFrame, summarizeCycle, computeCoM } from "../lib/analysis";
import { ACTIVITY_MAP } from "../lib/anthropometry";
import { useBiomech } from "./store";
import type { CycleSummary, FrameAnalysis, Pose, Vec3 } from "../types";

const CYCLE_SAMPLES = 60;

/**
 * Derives everything downstream of the store: the current-frame pose + analysis,
 * the whole-body CoM trajectory across the cycle, and the aggregate cycle
 * summary. The cycle sweep is memoized on (activity, body) so scrubbing the
 * timeline only recomputes the single current frame, keeping playback smooth.
 */
export function useAnalysis(): {
  pose: Pose;
  frame: FrameAnalysis;
  summary: CycleSummary;
  comTrajectory: Vec3[];
  cycleSeconds: number;
} {
  const { activity, body, phase } = useBiomech();

  // Full-cycle sweep (for summary + CoM trajectory + timeline charts).
  const { frames, comTrajectory } = useMemo(() => {
    const fr: FrameAnalysis[] = [];
    const com: Vec3[] = [];
    for (let i = 0; i < CYCLE_SAMPLES; i++) {
      const p = i / CYCLE_SAMPLES;
      const pose = generatePose(activity, p, body);
      fr.push(analyzeFrame(pose, body, activity));
      com.push(computeCoM(pose, body));
    }
    return { frames: fr, comTrajectory: com };
  }, [activity, body]);

  const summary = useMemo(
    () => summarizeCycle(frames, activity, body),
    [frames, activity, body],
  );

  // Current frame (recomputed live as the phase scrubs).
  const { pose, frame } = useMemo(() => {
    const p = generatePose(activity, phase, body);
    return { pose: p, frame: analyzeFrame(p, body, activity) };
  }, [activity, phase, body]);

  return {
    pose,
    frame,
    summary,
    comTrajectory,
    cycleSeconds: ACTIVITY_MAP[activity].cycleSeconds,
  };
}
