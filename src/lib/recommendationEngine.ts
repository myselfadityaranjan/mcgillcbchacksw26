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
    primary: ['wall-angel'],
    secondary: ['doorway-pec-stretch'],
    reason: (i) =>
      `Wall angels will restore the cervical neutral position and reduce the ${i.severity} forward head posture detected in your side view.`,
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
};

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
