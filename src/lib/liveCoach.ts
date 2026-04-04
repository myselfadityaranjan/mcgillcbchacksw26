// ──────────────────────────────────────────────────────────────
// liveCoach.ts — per-frame live coaching logic (Task 4)
//   landmarks → CoachingFrame
// ──────────────────────────────────────────────────────────────

import type { NormalizedLandmark } from '../types/pose';
import type { CoachingFrame, FormState } from '../types/coaching';
import type { DrillId } from '../types/plan';
import { DRILL_THRESHOLDS } from './drillThresholds';
import { selectCue } from './cueEngine';

// ── Form state classification ────────────────────────────────

function classifyMetric(
  value: number,
  threshold: { green: number; yellow: number },
): 'green' | 'yellow' | 'red' {
  if (value <= threshold.green) return 'green';
  if (value <= threshold.yellow) return 'yellow';
  return 'red';
}

// ── Quality score ────────────────────────────────────────────

function computeQuality(
  metricStates: Record<string, 'green' | 'yellow' | 'red'>,
): number {
  const values = Object.values(metricStates);
  if (values.length === 0) return 100;

  const score =
    values.reduce((sum, s) => {
      if (s === 'green') return sum + 100;
      if (s === 'yellow') return sum + 50;
      return sum;
    }, 0) / values.length;

  return Math.round(score);
}

// ── Overall form state ────────────────────────────────────────

function overallFormState(
  metricStates: Record<string, 'green' | 'yellow' | 'red'>,
): FormState {
  const values = Object.values(metricStates);
  if (values.some((s) => s === 'red')) return 'red';
  if (values.some((s) => s === 'yellow')) return 'yellow';
  return 'green';
}

// ── Main per-frame function ───────────────────────────────────

/**
 * Evaluate a single frame of pose data against the drill thresholds.
 * Returns null if the drill is not recognised or no landmarks are present.
 */
export function evaluateFrame(
  drillId: DrillId,
  landmarks: NormalizedLandmark[],
): CoachingFrame | null {
  const definition = DRILL_THRESHOLDS[drillId];
  if (!definition || landmarks.length < 33) return null;

  const metrics = definition.metricFn(landmarks);
  const metricStates: Record<string, 'green' | 'yellow' | 'red'> = {};

  for (const [key, value] of Object.entries(metrics)) {
    const threshold = definition.thresholds[key];
    if (!threshold) continue;
    metricStates[key] = classifyMetric(value, threshold);
  }

  const redMetrics = Object.entries(metricStates)
    .filter(([, s]) => s === 'red')
    .map(([k]) => k);

  const yellowMetrics = Object.entries(metricStates)
    .filter(([, s]) => s === 'yellow')
    .map(([k]) => k);

  const cue = selectCue(drillId, redMetrics, yellowMetrics);
  const formState = overallFormState(metricStates);
  const qualityScore = computeQuality(metricStates);

  return {
    formState,
    cue,
    qualityScore,
    metrics,
  };
}
