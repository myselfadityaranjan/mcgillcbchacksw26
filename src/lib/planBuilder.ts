// ──────────────────────────────────────────────────────────────
// planBuilder.ts — assemble the CorrectionPlan (Task 3)
// ──────────────────────────────────────────────────────────────

import type { AnalysisResult } from '../types/analysis';
import type { CorrectionPlan } from '../types/plan';
import { buildRecommendations, buildWellnessRecommendations } from './recommendationEngine';

export function buildPlan(analysis: AnalysisResult): CorrectionPlan {
  const recommendations =
    analysis.issues.length > 0
      ? buildRecommendations(analysis.issues)
      : buildWellnessRecommendations();
  const primaryIssueId = analysis.issues[0]?.id ?? null;

  let summary: string;
  if (analysis.issues.length === 0) {
    summary =
      'Great posture — no significant patterns detected. Keep it up with these maintenance drills to stay mobile and pain-free.';
  } else if (analysis.issues.length === 1) {
    summary = `One pattern was identified: ${analysis.issues[0]!.name}. The drill${recommendations.length === 1 ? '' : 's'} below target${recommendations.length === 1 ? 's' : ''} this directly.`;
  } else {
    const names = analysis.issues.slice(0, 2).map((i) => i.name).join(' and ');
    summary = `${analysis.issues.length} patterns were identified — ${names} are the most significant. Work through the recommended drills in order.`;
  }

  return {
    recommendations,
    primaryIssueId,
    summary,
    generatedAt: Date.now(),
  };
}
