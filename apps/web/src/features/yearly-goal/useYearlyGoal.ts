import { useState } from "react";

export const DEFAULT_YEARLY_GOAL = 200;
const STORAGE_KEY = "sonora:yearly-goal";

function readGoal(): number {
  try {
    const stored = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "", 10);
    return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_YEARLY_GOAL;
  } catch {
    return DEFAULT_YEARLY_GOAL;
  }
}

// The yearly listening goal is a per-device convenience, not account data:
// it lives in localStorage (guarded — it can be unavailable or blocked) and
// falls back to the default whenever it can't be read.
export function useYearlyGoal(): [number, (goal: number) => void] {
  const [goal, setGoalState] = useState(readGoal);

  const setGoal = (next: number): void => {
    setGoalState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // keep the in-memory value for this session
    }
  };

  return [goal, setGoal];
}
