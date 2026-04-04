// ──────────────────────────────────────────────────────────────
// qualityScore.ts — finalise a coaching session score (Task 4)
// ──────────────────────────────────────────────────────────────

import type { CoachingSession } from '../types/coaching';

/**
 * Compute a final 0–100 session quality score from accumulated
 * state durations.
 */
export function finaliseSession(
  partial: Omit<CoachingSession, 'finalScore' | 'isComplete'>,
): CoachingSession {
  const total = partial.timeInGreen + partial.timeInYellow + partial.timeInRed;

  let finalScore: number;
  if (total === 0) {
    finalScore = 0;
  } else {
    // Green = full credit, yellow = half, red = none
    finalScore = Math.round(
      ((partial.timeInGreen + partial.timeInYellow * 0.5) / total) * 100,
    );
  }

  return { ...partial, finalScore, isComplete: true };
}

/** Human-readable label for a final score */
export function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent form';
  if (score >= 65) return 'Good form';
  if (score >= 45) return 'Needs work';
  return 'Keep practising';
}

/** Encouragement message paired to the score */
export function scoreMessage(score: number): string {
  if (score >= 85)
    return 'Great work — your form was consistently clean throughout this drill.';
  if (score >= 65)
    return 'Solid effort. A few corrections were needed but you held the pattern well overall.';
  if (score >= 45)
    return 'Good start. Focus on the cues highlighted and try again to improve alignment time.';
  return 'This drill needs more practice. Go through the setup instructions again and work on one cue at a time.';
}
