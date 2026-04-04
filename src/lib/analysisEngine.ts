// ──────────────────────────────────────────────────────────────
// analysisEngine.ts — orchestrates Task 2:
//   AssessmentResult → PostureMetrics → DetectedIssues → AnalysisResult
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
 * Run the full posture analysis pipeline on a completed assessment.
 * Returns detected issues sorted by severity (most significant first)
 * together with the raw metric values.
 */
export function runAnalysis(result: AssessmentResult): AnalysisResult {
  const metrics = computeMetrics(result);

  const candidates = [
    detectForwardHeadPosture(metrics, result),
    detectRoundedShoulders(metrics, result),
    detectAnteriorPelvicTilt(metrics, result),
    detectKneeValgus(metrics, result),
    detectLateralAsymmetry(metrics, result),
  ].filter((i): i is NonNullable<typeof i> => i !== null);

  // Sort: significant > moderate > mild, then by confidence descending
  const SEVERITY_ORDER = { significant: 0, moderate: 1, mild: 2 } as const;
  candidates.sort((a, b) => {
    const sd = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    return sd !== 0 ? sd : b.confidence - a.confidence;
  });

  return {
    issues: candidates,
    metrics,
    analyzedAt: Date.now(),
  };
}
