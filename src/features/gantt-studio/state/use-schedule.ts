"use client";

import { useMemo } from "react";
import { computeSchedule } from "../lib/schedule";
import type { ScheduleResult } from "../types";
import { useGantt } from "./store";

/** Memoized schedule/CPM analysis of the current project. */
export function useSchedule(): ScheduleResult {
  const { project } = useGantt();
  return useMemo(() => computeSchedule(project), [project]);
}
