// ──────────────────────────────────────────────────────────────
// Plan types — Task 3 output, consumed by Tasks 4–6
// ──────────────────────────────────────────────────────────────

import type { IssueId } from './analysis';

export type DrillId =
  | 'doorway-pec-stretch'
  | 'wall-angel'
  | 'hip-flexor-stretch'
  | 'squat-alignment-drill'
  | 'split-squat-drill';

export interface Drill {
  id: DrillId;
  name: string;
  targetIssues: IssueId[];
  bodyArea: string;
  /** Short description shown on the drill card */
  description: string;
  /** How to get into position */
  setupInstructions: string;
  /** Ordered coaching cues shown during the drill */
  coachingCues: string[];
  /** Recommended hold duration in seconds */
  durationSeconds: number;
  reps?: number;
  /** Conditions that should stop the drill */
  unsafeConditions: string[];
  /** Landmark indices that the live coach should highlight */
  keyLandmarks: number[];
}

export interface DrillRecommendation {
  drill: Drill;
  /** Why this drill was chosen — shown to the user */
  reason: string;
  targetIssueIds: IssueId[];
  /** Lower = higher priority (1 is most important) */
  priority: number;
}

export interface CorrectionPlan {
  recommendations: DrillRecommendation[];
  /** The single most important issue driving the plan */
  primaryIssueId: IssueId | null;
  /** 1–2 sentence overall summary shown on the results page */
  summary: string;
  generatedAt: number;
}
