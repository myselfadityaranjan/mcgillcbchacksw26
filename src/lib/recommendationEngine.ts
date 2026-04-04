// ──────────────────────────────────────────────────────────────
// recommendationEngine.ts — map detected issues to drills (Task 3)
// ──────────────────────────────────────────────────────────────

import type { DetectedIssue, IssueId, Severity } from '../types/analysis';
import type { Drill, DrillId, DrillRecommendation } from '../types/plan';
import { DRILLS } from './drills';

// ── Issue → drill mappings ────────────────────────────────────

type IssueMapping = {
  primary: DrillId[];
  secondary: DrillId[];
  reason: (issue: DetectedIssue) => string;
};

const MAPPINGS: Record<IssueId, IssueMapping> = {
  'rounded-shoulders': {
    primary: ['doorway-pec-stretch', 'wall-angel'],
    secondary: [],
    reason: (i) =>
      `Your ${i.severity} rounded shoulder pattern is best addressed by opening the chest and retraining scapular retraction.`,
  },
  'forward-head-posture': {
    primary: ['chin-tuck-exercise', 'wall-angel'],
    secondary: ['doorway-pec-stretch'],
    reason: (i) =>
      `Chin tucks directly retrain the deep cervical flexors to pull the head back, and wall angels reinforce the neutral cervical position — together they address the ${i.severity} forward head posture in your side view.`,
  },
  'anterior-pelvic-tilt': {
    primary: ['hip-flexor-stretch'],
    secondary: ['split-squat-drill'],
    reason: (i) =>
      `A ${i.severity} anterior pelvic tilt tendency benefits most from lengthening tight hip flexors and strengthening the glutes.`,
  },
  'knee-valgus': {
    primary: ['squat-alignment-drill'],
    secondary: ['split-squat-drill'],
    reason: (i) =>
      `The ${i.severity} knee valgus detected during your squat requires retraining the glute medius to keep the knee aligned over the foot.`,
  },
  'lateral-asymmetry': {
    primary: ['split-squat-drill'],
    secondary: ['squat-alignment-drill'],
    reason: (i) =>
      `Your ${i.severity} left–right asymmetry responds well to unilateral loading drills that expose and correct side-to-side imbalances.`,
  },
  'thoracic-kyphosis': {
    primary: ['cat-cow-stretch', 'wall-angel'],
    secondary: ['doorway-pec-stretch'],
    reason: (i) =>
      `Your ${i.severity} thoracic kyphosis is best addressed with spinal mobilisation through cat–cow and thoracic extension work via wall angels to reverse the forward-rounding pattern.`,
  },
  'neck-flexion': {
    primary: ['chin-tuck-exercise'],
    secondary: ['wall-angel'],
    reason: (i) =>
      `A ${i.severity} neck flexion posture is directly corrected by chin tucks, which activate the deep cervical flexors to restore neutral cervical alignment.`,
  },
};

// ── Wellness recommendations (no issues detected) ─────────────

const WELLNESS_DRILL_IDS: DrillId[] = ['wall-angel', 'hip-flexor-stretch'];

/**
 * Return general wellness drill recommendations for users with no
 * detected issues — good posture should still be maintained.
 */
export function buildWellnessRecommendations(): DrillRecommendation[] {
  return WELLNESS_DRILL_IDS.map((id, idx) => ({
    drill: DRILLS[id] as Drill,
    reason: 'Recommended as a general mobility maintenance routine to support long-term posture health and joint freedom.',
    targetIssueIds: [],
    priority: idx + 1,
  }));
}

// ── Build recommendations ─────────────────────────────────────

/**
 * Generate an ordered list of drill recommendations from detected issues.
 * Avoids duplicates; limits output to 3 recommendations.
 */
export function buildRecommendations(
  issues: DetectedIssue[],
): DrillRecommendation[] {
  const SEVERITY_WEIGHT: Record<Severity, number> = {
    significant: 3,
    moderate: 2,
    mild: 1,
  };

  // Score each drill
  const drillScores = new Map<DrillId, number>();
  const drillReasons = new Map<DrillId, string>();
  const drillIssueIds = new Map<DrillId, IssueId[]>();

  for (const issue of issues) {
    const mapping = MAPPINGS[issue.id];
    if (!mapping) continue;
    const weight = SEVERITY_WEIGHT[issue.severity];

    for (const drillId of mapping.primary) {
      drillScores.set(drillId, (drillScores.get(drillId) ?? 0) + weight * 2);
      drillReasons.set(drillId, mapping.reason(issue));
      const existing = drillIssueIds.get(drillId) ?? [];
      if (!existing.includes(issue.id)) existing.push(issue.id);
      drillIssueIds.set(drillId, existing);
    }
    for (const drillId of mapping.secondary) {
      drillScores.set(drillId, (drillScores.get(drillId) ?? 0) + weight);
      if (!drillReasons.has(drillId)) drillReasons.set(drillId, mapping.reason(issue));
      const existing = drillIssueIds.get(drillId) ?? [];
      if (!existing.includes(issue.id)) existing.push(issue.id);
      drillIssueIds.set(drillId, existing);
    }
  }

  // Sort by score descending
  const sorted = [...drillScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return sorted.map(([drillId], idx) => {
    const drill = DRILLS[drillId] as Drill;
    return {
      drill,
      reason: drillReasons.get(drillId) ?? 'Supports overall movement quality.',
      targetIssueIds: drillIssueIds.get(drillId) ?? [],
      priority: idx + 1,
    };
  });
}
