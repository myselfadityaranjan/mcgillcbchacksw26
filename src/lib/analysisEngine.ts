// ──────────────────────────────────────────────────────────────
// analysisEngine.ts — orchestrates Task 2:
//   AssessmentResult → PostureMetrics → DetectedIssues → AnalysisResult
//
// Includes data-quality checks so we never present a confident
// result from low-quality input.
// ──────────────────────────────────────────────────────────────

import type { AssessmentResult } from '../types/pose';
import type { AnalysisResult } from '../types/analysis';
import { computeMetrics } from './metrics';
import {
  detectRoundedShoulders,
  detectForwardHeadPosture,
  detectAnteriorPelvicTilt,
  detectKneeValgus,
  detectLateralAsymmetry,
} from './issueDetectors';

/**
 * Compute a 0–1 data quality score based on how many steps have
 * usable representative frames with good landmark visibility.
 */
function assessDataQuality(result: AssessmentResult): number {
  const steps = result.captures;
  if (steps.length === 0) return 0;

  let usableSteps = 0;
  for (const capture of steps) {
    const frame = capture.representativeFrame;
    if (!frame) continue;
    const avgVis =
      frame.normalizedLandmarks.reduce((s, l) => s + l.visibility, 0) /
      frame.normalizedLandmarks.length;
    if (avgVis > 0.4) usableSteps++;
  }
  return usableSteps / steps.length;
}

/**
 * Run the full posture analysis pipeline on a completed assessment.
 * Returns detected issues sorted by severity (most significant first)
 * together with the raw metric values.
 */
export function runAnalysis(result: AssessmentResult): AnalysisResult {
  const metrics = computeMetrics(result);
  const dataQuality = assessDataQuality(result);

  const candidates = [
    detectForwardHeadPosture(metrics, result),
    detectRoundedShoulders(metrics, result),
    detectAnteriorPelvicTilt(metrics, result),
    detectKneeValgus(metrics, result),
    detectLateralAsymmetry(metrics, result),
  ].filter((i): i is NonNullable<typeof i> => i !== null);

  // Scale confidence by data quality
  for (const issue of candidates) {
    issue.confidence = issue.confidence * dataQuality;
  }

  // Sort: significant > moderate > mild, then by confidence descending
  const SEVERITY_ORDER = { significant: 0, moderate: 1, mild: 2 } as const;
  candidates.sort((a, b) => {
    const sd = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    return sd !== 0 ? sd : b.confidence - a.confidence;
  });

  return {
    issues: candidates,
    metrics,
    dataQuality,
    analyzedAt: Date.now(),
  };
}
