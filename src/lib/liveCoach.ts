// ──────────────────────────────────────────────────────────────
// liveCoach.ts — per-frame live coaching logic (Task 4)
//   landmarks → CoachingFrame
//   Includes hysteresis to prevent state flickering and
//   exponential smoothing on the quality score.
// ──────────────────────────────────────────────────────────────

import type { NormalizedLandmark } from '../types/pose';
import type { CoachingFrame, FormState } from '../types/coaching';
import type { DrillId } from '../types/plan';
import { DRILL_THRESHOLDS } from './drillThresholds';
import { selectCue } from './cueEngine';

// ── Hysteresis-aware classification ──────────────────────────

/**
 * Previous metric states are used for hysteresis: a metric must
 * exceed the NEXT threshold by a small margin before it changes
 * state, preventing rapid flickering at boundary values.
 */
const HYSTERESIS = 0.006; // ~0.6% of normalised coordinate space

let prevMetricStates: Record<string, 'green' | 'yellow' | 'red'> = {};

function classifyMetric(
  key: string,
  value: number,
  threshold: { green: number; yellow: number },
): 'green' | 'yellow' | 'red' {
  const prev = prevMetricStates[key] ?? 'green';

  // Tighten the threshold for leaving a state (hysteresis)
  if (prev === 'green') {
    if (value > threshold.green + HYSTERESIS) {
      return value > threshold.yellow + HYSTERESIS ? 'red' : 'yellow';
    }
    return 'green';
  }
  if (prev === 'yellow') {
    if (value <= threshold.green - HYSTERESIS) return 'green';
    if (value > threshold.yellow + HYSTERESIS) return 'red';
    return 'yellow';
  }
  // prev === 'red'
  if (value <= threshold.yellow - HYSTERESIS) {
    return value <= threshold.green - HYSTERESIS ? 'green' : 'yellow';
  }
  return 'red';
}

// ── Quality score with exponential smoothing ─────────────────

let smoothedScore = 100;
const SMOOTH_FACTOR = 0.25; // 0 = frozen, 1 = instant

function computeQuality(
  metricStates: Record<string, 'green' | 'yellow' | 'red'>,
): number {
  const values = Object.values(metricStates);
  if (values.length === 0) return 100;

  const rawScore =
    values.reduce((sum, s) => {
      if (s === 'green') return sum + 100;
      if (s === 'yellow') return sum + 50;
      return sum;
    }, 0) / values.length;

  smoothedScore = smoothedScore * (1 - SMOOTH_FACTOR) + rawScore * SMOOTH_FACTOR;
  return Math.round(smoothedScore);
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

// ── Reset (call when starting a new session) ──────────────────

export function resetCoachState(): void {
  prevMetricStates = {};
  smoothedScore = 100;
}

// ── Main per-frame function ───────────────────────────────────

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
    metricStates[key] = classifyMetric(key, value, threshold);
  }

  prevMetricStates = { ...metricStates };

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
