// ============================================================================
// StrainSense — Task 3: Plan Builder (Orchestrator)
// The single entry point for Task 3. Task 5 calls buildCorrectivePlan() only.
//
// Pipeline:
//   AnalysisResult (Task 2)
//     → filter + sort issues
//     → buildIssueCard() per issue          [issueCopy.ts]
//     → rankDrills()                        [recommendationEngine.ts]
//     → buildPlanSummary()
//     → assemble CorrectivePlan
//
// Consumed by: Task 5 (ResultsPage)
// ============================================================================

import type {
  AnalysisResult,
  CorrectivePlan,
  DetectedIssue,
  DrillId,
  IssueCard,
  RecommendedDrill,
  Severity,
} from "../types";
import { buildIssueCard } from "./issueCopy";
import { rankDrills, MIN_CONFIDENCE_THRESHOLD } from "./recommendationEngine";

// ─── Severity Sort Order ─────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<Severity, number> = {
  severe: 0,
  moderate: 1,
  mild: 2,
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Builds the full corrective plan from Task 2's analysis output.
 * This is the ONLY function Task 5 should import from this module.
 *
 * Handles all edge cases:
 *   - No issues detected → returns buildEmptyPlan()
 *   - All issues below confidence threshold → returns buildEmptyPlan()
 *   - Poor scan quality → propagates warnings as scanQualityWarning
 *   - Duplicate drills across issues → deduplicated by rankDrills()
 *   - More than MAX_RECOMMENDED_DRILLS → capped by rankDrills()
 */
export function buildCorrectivePlan(analysis: AnalysisResult): CorrectivePlan {
  // ── Guard: no issues at all ─────────────────────────────────────────────
  if (analysis.detectedIssues.length === 0) {
    return buildEmptyPlan(analysis);
  }

  // ── Filter: remove issues below confidence threshold ────────────────────
  const confidentIssues = analysis.detectedIssues.filter(
    (i) => i.confidence >= MIN_CONFIDENCE_THRESHOLD
  );

  if (confidentIssues.length === 0) {
    return buildEmptyPlan(analysis);
  }

  // ── Sort: severe → moderate → mild, then confidence DESC ────────────────
  const sortedIssues = sortIssuesBySeverity(confidentIssues);

  // ── Build issue cards ────────────────────────────────────────────────────
  const issueCards: IssueCard[] = sortedIssues.map((issue) =>
    buildIssueCard(issue)
  );

  // ── Rank drills ──────────────────────────────────────────────────────────
  // rankDrills handles its own confidence filtering, deduplication, and capping.
  // We pass sortedIssues (already sorted) so firstAppearanceRank aligns correctly.
  const recommendedDrills: RecommendedDrill[] = rankDrills(sortedIssues);

  // ── Summary ──────────────────────────────────────────────────────────────
  const summary = buildPlanSummary(issueCards, recommendedDrills);

  // ── Priority drill ───────────────────────────────────────────────────────
  const priorityDrillId: DrillId | null =
    recommendedDrills.length > 0
      ? recommendedDrills[0].drill.id
      : null;

  // ── Scan quality warning ─────────────────────────────────────────────────
  const scanQualityWarning = buildScanQualityWarning(analysis);

  return {
    issueCards,
    recommendedDrills,
    hasIssues: true,
    summary,
    generatedAt: Date.now(),
    priorityDrillId,
    scanQualityWarning,
  };
}

/**
 * Returns an empty corrective plan.
 * Used when no issues were detected or all issues fell below confidence threshold.
 * Task 5 checks plan.hasIssues before rendering issue cards.
 */
export function buildEmptyPlan(analysis?: AnalysisResult): CorrectivePlan {
  const scanQualityWarning = analysis
    ? buildScanQualityWarning(analysis)
    : null;

  const summary =
    scanQualityWarning !== null
      ? "No significant patterns were detected in this scan. Some movement steps may have been incomplete — consider repeating the assessment for a full picture."
      : "No significant movement patterns were detected in this scan. Your posture and movement quality look good — keep it up!";

  return {
    issueCards: [],
    recommendedDrills: [],
    hasIssues: false,
    summary,
    generatedAt: Date.now(),
    priorityDrillId: null,
    scanQualityWarning,
  };
}

/**
 * Sorts a DetectedIssue array by severity descending, then confidence descending.
 * Exported for unit testing.
 */
export function sortIssuesBySeverity(
  issues: DetectedIssue[]
): DetectedIssue[] {
  return [...issues].sort((a, b) => {
    const severityDiff =
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.confidence - a.confidence;
  });
}

/**
 * Generates the 1–2 sentence plan overview shown at the top of the Results page.
 * Mentions issue count, severity context, and the top recommended drill.
 * Exported for unit testing.
 */
export function buildPlanSummary(
  issueCards: IssueCard[],
  recommendedDrills: RecommendedDrill[]
): string {
  const issueCount = issueCards.length;
  const drillCount = recommendedDrills.length;

  if (issueCount === 0 || drillCount === 0) {
    return "No significant movement patterns were detected in this scan.";
  }

  // Count severe issues to calibrate the tone
  const severeCount = issueCards.filter(
    (c) => c.severity === "severe"
  ).length;

  const issueWord = issueCount === 1 ? "pattern" : "patterns";
  const drillWord = drillCount === 1 ? "drill" : "drills";
  const priorityDrillName = recommendedDrills[0].drill.displayName;

  let priorityNote = "";
  if (severeCount > 0) {
    const severeWord = severeCount === 1 ? "pattern" : "patterns";
    priorityNote = ` ${severeCount} ${severeWord} ${severeCount === 1 ? "was" : "were"} flagged as high priority.`;
  }

  const drillNames = recommendedDrills.map((r) => r.drill.displayName);
  const drillList =
    drillNames.length === 1
      ? drillNames[0]
      : drillNames.slice(0, -1).join(", ") +
        " and " +
        drillNames[drillNames.length - 1];

  return (
    `Your assessment detected ${issueCount} movement ${issueWord}.${priorityNote} ` +
    `${drillCount} corrective ${drillWord} ${drillCount === 1 ? "has" : "have"} been suggested — ` +
    `starting with ${priorityDrillName}. ` +
    `Your full corrective focus: ${drillList}.`
  );
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Builds the scanQualityWarning string from AnalysisResult.
 * Returns null when there are no warnings and scan quality is good.
 */
function buildScanQualityWarning(analysis: AnalysisResult): string | null {
  const hasWarnings = analysis.warnings.length > 0;
  const isPoor = analysis.scanQuality === "poor";
  const isPartial = analysis.scanQuality === "partial";

  if (!hasWarnings && !isPoor && !isPartial) return null;

  const parts: string[] = [];

  if (isPoor) {
    parts.push(
      "Scan quality was limited — most assessment steps could not be fully captured."
    );
  } else if (isPartial) {
    parts.push(
      "Some assessment steps were incomplete or captured with reduced visibility."
    );
  }

  if (hasWarnings) {
    parts.push(...analysis.warnings);
  }

  return parts.join(" ") + " Consider repeating the scan for a more complete assessment.";
}
