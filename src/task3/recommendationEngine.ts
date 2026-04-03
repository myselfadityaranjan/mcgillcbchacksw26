// ============================================================================
// StrainSense — Task 3: Recommendation Engine
// Maps detected issues to drills, deduplicates, and ranks the final plan.
//
// Consumed by: planBuilder.ts
// Exports for testing: ISSUE_DRILL_MAP, MAX_RECOMMENDED_DRILLS,
//                      MIN_CONFIDENCE_THRESHOLD, getDrillIdsForIssue, rankDrills
// ============================================================================

import type {
  DrillId,
  IssueType,
  Severity,
  DetectedIssue,
  RecommendedDrill,
} from "../types";
import { getDrill } from "./drills";

// ─── Constants ──────────────────────────────────────────────────────────────

/**
 * Maximum number of drills in a corrective plan.
 * Caps the output of rankDrills() to avoid overwhelming the user.
 */
export const MAX_RECOMMENDED_DRILLS = 3;

/**
 * Minimum confidence score required for a DetectedIssue to be included
 * in the plan. Issues below this threshold are silently filtered out to
 * avoid misleading drill recommendations.
 */
export const MIN_CONFIDENCE_THRESHOLD = 0.4;

// ─── Issue → Drill Mapping ──────────────────────────────────────────────────

/**
 * Shape of one entry in the mapping table.
 * primaryDrills: DrillIds that should appear in RecommendedDrill entries.
 * supportingCues: Plain-text cues (non-drill) referenced in IssueCard copy.
 *                 These are NOT surfaced as selectable drills.
 */
interface IssueMapping {
  readonly primaryDrills: readonly DrillId[];
  readonly supportingCues: readonly string[];
}

/**
 * Ground-truth mapping table from the StrainSense spec (§11).
 * All issue→drill relationships are defined here and nowhere else.
 *
 * Notes:
 * - "posture reset cues" / "pelvic reposition cues" / "balance drill" are
 *   supportingCues — informational text, not selectable drills.
 * - "balance_drill" is not a DrillId in MVP; it lives as a supportingCue until
 *   a future sprint adds it to the library.
 */
export const ISSUE_DRILL_MAP: Readonly<Record<IssueType, IssueMapping>> = {
  rounded_shoulders: {
    primaryDrills: ["doorway_pec_stretch", "wall_angel"],
    supportingCues: [],
  },
  forward_head_posture: {
    primaryDrills: ["wall_angel"],
    supportingCues: ["posture reset cues"],
  },
  apt_tendency: {
    primaryDrills: ["hip_flexor_stretch"],
    supportingCues: ["pelvic reposition cues"],
  },
  knee_valgus: {
    primaryDrills: ["squat_alignment_drill", "split_squat_drill"],
    supportingCues: [],
  },
  left_right_asymmetry: {
    primaryDrills: ["split_squat_drill"],
    supportingCues: ["balance drill"],
  },
};

// ─── Severity Scoring ───────────────────────────────────────────────────────

/** Numeric weight for severity — used in priority scoring. */
const SEVERITY_WEIGHT: Record<Severity, number> = {
  severe: 3,
  moderate: 2,
  mild: 1,
};

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Returns the primary DrillIds mapped to a given issue type.
 * Does not filter by confidence or severity — use rankDrills for full logic.
 */
export function getDrillIdsForIssue(issueType: IssueType): DrillId[] {
  return [...ISSUE_DRILL_MAP[issueType].primaryDrills];
}

/**
 * Returns the supporting (non-drill) cue text for an issue.
 * Used by issueCopy.ts to append context to IssueCard.recommendedFocus.
 */
export function getSupportingCuesForIssue(issueType: IssueType): string[] {
  return [...ISSUE_DRILL_MAP[issueType].supportingCues];
}

/**
 * Core ranking algorithm.
 * Takes the full list of DetectedIssues from Task 2, filters low-confidence
 * entries, maps each to drills, deduplicates, ranks, caps at MAX_RECOMMENDED_DRILLS,
 * and returns a fully populated RecommendedDrill[].
 *
 * Algorithm in full:
 * 1. Filter: drop issues with confidence < MIN_CONFIDENCE_THRESHOLD
 * 2. For each remaining issue (already sorted by caller or re-sorted here):
 *    collect its primary DrillIds from ISSUE_DRILL_MAP
 * 3. Build a frequency+weight map per DrillId:
 *    - count: how many distinct issues map to this drill
 *    - maxSeverityWeight: highest severity weight among those issues
 *    - firstAppearanceRank: position of the most severe issue that maps here
 *      (lower = appeared earlier in severity-sorted input)
 *    - primaryForIssues: issues for which this is the first (primary) drill
 *    - alsoHelpsIssues: issues for which this is a secondary drill
 * 4. Sort by: maxSeverityWeight DESC → count DESC → firstAppearanceRank ASC
 * 5. Cap at MAX_RECOMMENDED_DRILLS
 * 6. Assign 1-based priorityRank
 * 7. Generate whyRecommended sentence
 * 8. Return RecommendedDrill[]
 */
export function rankDrills(detectedIssues: DetectedIssue[]): RecommendedDrill[] {
  // Step 1 — filter below confidence threshold
  const confident = detectedIssues.filter(
    (i) => i.confidence >= MIN_CONFIDENCE_THRESHOLD
  );

  if (confident.length === 0) return [];

  // Sort input by severity DESC, then confidence DESC so firstAppearanceRank
  // correctly reflects the most important issue that maps to each drill.
  const sorted = [...confident].sort((a, b) => {
    const sevDiff =
      SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.confidence - a.confidence;
  });

  // Step 2 & 3 — build the frequency+weight map
  interface DrillAccumulator {
    count: number;
    maxSeverityWeight: number;
    firstAppearanceRank: number; // 0-indexed position of highest-severity issue
    primaryForIssues: IssueType[];
    alsoHelpsIssues: IssueType[];
  }

  const drillMap = new Map<DrillId, DrillAccumulator>();

  sorted.forEach((issue, rank) => {
    const drillIds = getDrillIdsForIssue(issue.type);
    const weight = SEVERITY_WEIGHT[issue.severity];

    drillIds.forEach((drillId, drillIndex) => {
      const existing = drillMap.get(drillId);

      if (!existing) {
        drillMap.set(drillId, {
          count: 1,
          maxSeverityWeight: weight,
          firstAppearanceRank: rank,
          // drillIndex 0 = first/primary drill for this issue; >0 = secondary
          primaryForIssues: drillIndex === 0 ? [issue.type] : [],
          alsoHelpsIssues: drillIndex > 0 ? [issue.type] : [],
        });
      } else {
        existing.count += 1;
        if (weight > existing.maxSeverityWeight) {
          existing.maxSeverityWeight = weight;
        }
        if (rank < existing.firstAppearanceRank) {
          existing.firstAppearanceRank = rank;
        }
        if (drillIndex === 0) {
          existing.primaryForIssues.push(issue.type);
        } else {
          existing.alsoHelpsIssues.push(issue.type);
        }
      }
    });
  });

  // Step 4 — sort drills
  const sortedEntries = Array.from(drillMap.entries()).sort(
    ([, a], [, b]) => {
      // Primary: highest severity weight wins
      const sevDiff = b.maxSeverityWeight - a.maxSeverityWeight;
      if (sevDiff !== 0) return sevDiff;
      // Secondary: most issues pointing here wins (most bang for the buck)
      const countDiff = b.count - a.count;
      if (countDiff !== 0) return countDiff;
      // Tertiary: appeared earlier in severity-sorted input
      return a.firstAppearanceRank - b.firstAppearanceRank;
    }
  );

  // Step 5 — cap
  const capped = sortedEntries.slice(0, MAX_RECOMMENDED_DRILLS);

  // Step 6 & 7 & 8 — build RecommendedDrill[]
  return capped.map(([drillId, acc], index): RecommendedDrill => {
    const drill = getDrill(drillId);
    const isDeduped = acc.count > 1;

    return {
      drill,
      primaryForIssues: acc.primaryForIssues,
      alsoHelpsIssues: acc.alsoHelpsIssues,
      priorityRank: index + 1,
      whyRecommended: buildWhyRecommended(
        drill.displayName,
        acc.primaryForIssues,
        acc.alsoHelpsIssues,
        isDeduped
      ),
      isDeduped,
    };
  });
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/** Human-readable display names for issues — used in generated sentences. */
const ISSUE_DISPLAY_NAMES: Record<IssueType, string> = {
  rounded_shoulders: "rounded shoulder pattern",
  forward_head_posture: "forward head tendency",
  apt_tendency: "anterior pelvic tilt tendency",
  knee_valgus: "knee alignment pattern",
  left_right_asymmetry: "left-right loading imbalance",
};

/**
 * Generates a 1–2 sentence rationale linking a drill to the user's specific issues.
 * Uses non-diagnostic language throughout.
 */
function buildWhyRecommended(
  drillName: string,
  primaryIssues: IssueType[],
  secondaryIssues: IssueType[],
  isDeduped: boolean
): string {
  const allIssues = [...primaryIssues, ...secondaryIssues];

  if (allIssues.length === 0) {
    return `${drillName} is recommended as a corrective focus based on your movement assessment.`;
  }

  const issueNames = allIssues.map((t) => ISSUE_DISPLAY_NAMES[t]);

  if (isDeduped && allIssues.length >= 2) {
    const [first, second, ...rest] = issueNames;
    const listed =
      rest.length > 0
        ? `${first}, ${second}, and ${rest.join(", ")}`
        : `${first} and ${second}`;
    return (
      `${drillName} addresses both your ${listed} detected in this scan. ` +
      `It is prioritised because it targets multiple patterns simultaneously.`
    );
  }

  const issueText =
    issueNames.length === 1
      ? issueNames[0]
      : issueNames.slice(0, -1).join(", ") +
        " and " +
        issueNames[issueNames.length - 1];

  return `${drillName} is recommended to address the ${issueText} detected in your assessment.`;
}
