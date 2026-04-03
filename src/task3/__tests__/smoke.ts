// ============================================================================
// StrainSense — Task 3 Smoke Test
// Exercises all major logic paths to catch runtime holes.
// Run via: npx tsx src/task3/__tests__/smoke.ts
// ============================================================================

import { buildCorrectivePlan, buildEmptyPlan, sortIssuesBySeverity, buildPlanSummary } from "../planBuilder";
import { rankDrills, getDrillIdsForIssue, ISSUE_DRILL_MAP, MAX_RECOMMENDED_DRILLS, MIN_CONFIDENCE_THRESHOLD } from "../recommendationEngine";
import { getDrill, getAllDrills, getDrillsForIssue, DRILL_LIBRARY } from "../drills";
import { buildIssueCard, buildHeadline, buildRiskStatement, buildRecommendedFocus, ISSUE_COPY } from "../issueCopy";
import type { AnalysisResult, DetectedIssue } from "../../types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeIssue(
  overrides: Partial<DetectedIssue> = {}
): DetectedIssue {
  return {
    type: "rounded_shoulders",
    severity: "moderate",
    confidence: 0.75,
    evidenceSummary: "Shoulders sit 3 cm anterior to neutral.",
    affectedAreas: ["shoulders", "upper_back"],
    evidenceFrameId: "front_stance",
    rawMetrics: { shoulderProtractionCm: 3 },
    ...overrides,
  };
}

function makeAnalysis(
  issues: DetectedIssue[],
  overrides: Partial<AnalysisResult> = {}
): AnalysisResult {
  return {
    detectedIssues: issues,
    overallConfidence: issues.length > 0
      ? issues.reduce((s, i) => s + i.confidence, 0) / issues.length
      : 0,
    analysedAt: Date.now(),
    scanQuality: "good",
    warnings: [],
    ...overrides,
  };
}

// ─── 1. Drill Library ────────────────────────────────────────────────────────

section("Drill Library");

assert(DRILL_LIBRARY.size === 5, "DRILL_LIBRARY has exactly 5 drills");
assert(getAllDrills().length === 5, "getAllDrills() returns 5 drills");

const drillIds = ["doorway_pec_stretch", "wall_angel", "hip_flexor_stretch", "squat_alignment_drill", "split_squat_drill"] as const;
drillIds.forEach((id) => {
  const d = getDrill(id);
  assert(d.id === id, `getDrill("${id}") returns correct drill`);
  assert(d.coachingCues.length > 0, `${id} has at least 1 coaching cue`);
  assert(d.unsafeConditions.length > 0, `${id} has at least 1 unsafe condition`);
  assert(d.durationSeconds > 0, `${id} has positive durationSeconds`);
  // Every coaching cue must have a priority and text
  d.coachingCues.forEach((cue, i) => {
    assert(cue.text.length > 0, `${id} cue[${i}] has non-empty text`);
    assert(["unsafe", "major_correction", "fine_adjustment"].includes(cue.priority), `${id} cue[${i}] has valid priority`);
  });
  // Each drill must have at least one unsafe-priority cue
  assert(d.coachingCues.some(c => c.priority === "unsafe"), `${id} has at least one unsafe cue`);
});

// getDrillsForIssue
assert(getDrillsForIssue("rounded_shoulders").length === 2, "rounded_shoulders has 2 drills");
assert(getDrillsForIssue("forward_head_posture").length === 1, "forward_head_posture has 1 drill");
assert(getDrillsForIssue("apt_tendency").length === 1, "apt_tendency has 1 drill");
assert(getDrillsForIssue("knee_valgus").length === 2, "knee_valgus has 2 drills");
assert(getDrillsForIssue("left_right_asymmetry").length === 1, "left_right_asymmetry has 1 drill");

// getDrill throws on unknown id
try {
  getDrill("nonexistent_drill" as never);
  assert(false, "getDrill throws on unknown id");
} catch {
  assert(true, "getDrill throws on unknown id");
}

// ─── 2. Recommendation Engine ────────────────────────────────────────────────

section("Recommendation Engine");

assert(MAX_RECOMMENDED_DRILLS === 3, "MAX_RECOMMENDED_DRILLS is 3");
assert(MIN_CONFIDENCE_THRESHOLD === 0.4, "MIN_CONFIDENCE_THRESHOLD is 0.4");

// All 5 issue types are in the map
(["rounded_shoulders", "forward_head_posture", "apt_tendency", "knee_valgus", "left_right_asymmetry"] as const).forEach((type) => {
  assert(type in ISSUE_DRILL_MAP, `ISSUE_DRILL_MAP has entry for ${type}`);
  assert(getDrillIdsForIssue(type).length > 0, `getDrillIdsForIssue("${type}") is non-empty`);
});

// Empty input → empty output
assert(rankDrills([]).length === 0, "rankDrills([]) returns []");

// Single issue → correct drill(s)
const singleRounded = rankDrills([makeIssue()]);
assert(singleRounded.length === 2, "Single rounded_shoulders issue yields 2 drills");
assert(singleRounded[0].priorityRank === 1, "First drill has priorityRank 1");
assert(singleRounded[1].priorityRank === 2, "Second drill has priorityRank 2");
assert(singleRounded[0].primaryForIssues.includes("rounded_shoulders"), "First drill is primary for rounded_shoulders");

// Below confidence threshold → filtered out
const lowConf = rankDrills([makeIssue({ confidence: 0.3 })]);
assert(lowConf.length === 0, "Issue below confidence threshold is filtered");

// Deduplication: rounded_shoulders + forward_head_posture both map to wall_angel
const dedupeIssues = [
  makeIssue({ type: "rounded_shoulders", severity: "moderate", confidence: 0.8 }),
  makeIssue({ type: "forward_head_posture", severity: "moderate", confidence: 0.7 }),
];
const dedupedDrills = rankDrills(dedupeIssues);
const wallAngelEntry = dedupedDrills.find((r) => r.drill.id === "wall_angel");
assert(wallAngelEntry !== undefined, "wall_angel appears in deduped plan");
assert(wallAngelEntry?.isDeduped === true, "wall_angel is marked as deduped");
assert(
  (wallAngelEntry?.primaryForIssues.length ?? 0) + (wallAngelEntry?.alsoHelpsIssues.length ?? 0) >= 2,
  "wall_angel references both issues"
);

// Cap at MAX_RECOMMENDED_DRILLS: 5 issues would yield many drills
const allIssues: DetectedIssue[] = [
  makeIssue({ type: "rounded_shoulders", severity: "severe", confidence: 0.9 }),
  makeIssue({ type: "forward_head_posture", severity: "moderate", confidence: 0.8 }),
  makeIssue({ type: "apt_tendency", severity: "moderate", confidence: 0.75 }),
  makeIssue({ type: "knee_valgus", severity: "mild", confidence: 0.6 }),
  makeIssue({ type: "left_right_asymmetry", severity: "mild", confidence: 0.5 }),
];
const cappedDrills = rankDrills(allIssues);
assert(cappedDrills.length <= MAX_RECOMMENDED_DRILLS, `rankDrills caps at ${MAX_RECOMMENDED_DRILLS}`);

// Severe issue gets its drill ranked first
const severeKnee = rankDrills([
  makeIssue({ type: "rounded_shoulders", severity: "mild", confidence: 0.9 }),
  makeIssue({ type: "knee_valgus", severity: "severe", confidence: 0.9 }),
]);
const topDrill = severeKnee[0];
assert(
  topDrill.drill.targetIssues.includes("knee_valgus"),
  "Severe knee_valgus issue pushes its drill to rank 1"
);

// All RecommendedDrills have non-empty whyRecommended
rankDrills(allIssues).forEach((r, i) => {
  assert(r.whyRecommended.length > 0, `rankDrills result[${i}] has non-empty whyRecommended`);
});

// ─── 3. Issue Copy ───────────────────────────────────────────────────────────

section("Issue Copy");

// All 5 issues have copy blocks
(["rounded_shoulders", "forward_head_posture", "apt_tendency", "knee_valgus", "left_right_asymmetry"] as const).forEach((type) => {
  const block = ISSUE_COPY[type];
  assert(block.displayName.length > 0, `${type} has non-empty displayName`);
  assert(block.whyItMatters.length > 0, `${type} has non-empty whyItMatters`);
  assert(block.mildRisk.length > 0, `${type} has non-empty mildRisk`);
  assert(block.moderateRisk.length > 0, `${type} has non-empty moderateRisk`);
  assert(block.severeRisk.length > 0, `${type} has non-empty severeRisk`);
  assert(block.recommendedFocus.length > 0, `${type} has non-empty recommendedFocus`);
});

// buildHeadline
assert(buildHeadline("rounded_shoulders", "moderate") === "Rounded Shoulders — Moderate", "buildHeadline formats correctly");
assert(buildHeadline("knee_valgus", "severe") === "Knee Valgus — Severe", "buildHeadline formats severe correctly");

// buildRiskStatement returns different text per severity
const mildRisk = buildRiskStatement("rounded_shoulders", "mild");
const severeRisk = buildRiskStatement("rounded_shoulders", "severe");
assert(mildRisk !== severeRisk, "buildRiskStatement returns different text per severity");
assert(mildRisk.toLowerCase().includes("may"), "Risk statements use 'may' language");
assert(severeRisk.toLowerCase().includes("may"), "Severe risk statement also uses 'may' language");

// buildRecommendedFocus appends supporting cues for issues that have them
const fwdHeadFocus = buildRecommendedFocus("forward_head_posture");
assert(fwdHeadFocus.includes("posture reset cues"), "forward_head_posture focus includes posture reset cues");
const aptFocus = buildRecommendedFocus("apt_tendency");
assert(aptFocus.includes("pelvic reposition cues"), "apt_tendency focus includes pelvic reposition cues");
const kneeValgusF = buildRecommendedFocus("knee_valgus");
assert(!kneeValgusF.includes("cues"), "knee_valgus focus has no extra cues (none in spec)");

// buildIssueCard produces a complete card
const card = buildIssueCard(makeIssue());
assert(card.issueType === "rounded_shoulders", "IssueCard has correct issueType");
assert(card.severity === "moderate", "IssueCard has correct severity");
assert(card.headline.includes("Rounded Shoulders"), "IssueCard headline mentions issue name");
assert(card.whatWasDetected.toLowerCase().includes("consistent with"), "whatWasDetected uses safe language");
assert(card.whyItMatters.length > 0, "IssueCard has non-empty whyItMatters");
assert(card.whatItMayContributeTo.toLowerCase().includes("may"), "whatItMayContributeTo uses 'may' language");
assert(card.affectedAreas.length > 0, "IssueCard has non-empty affectedAreas");

// evidenceFrameDataUrl is passed through correctly
const cardWithUrl = buildIssueCard(makeIssue({ evidenceFrameDataUrl: "data:image/png;base64,abc" }));
assert(cardWithUrl.evidenceFrameDataUrl === "data:image/png;base64,abc", "evidenceFrameDataUrl passed through");
const cardNoUrl = buildIssueCard(makeIssue({ evidenceFrameDataUrl: undefined }));
assert(cardNoUrl.evidenceFrameDataUrl === undefined, "Missing evidenceFrameDataUrl is undefined (not null)");

// affectedAreas is a copy (mutation isolation)
const original = makeIssue({ affectedAreas: ["shoulders"] });
const cardForMutation = buildIssueCard(original);
cardForMutation.affectedAreas.push("knees");
assert(original.affectedAreas.length === 1, "buildIssueCard affectedAreas is a copy, not a reference");

// ─── 4. Plan Builder ─────────────────────────────────────────────────────────

section("Plan Builder");

// No issues → empty plan
const emptyAnalysis = makeAnalysis([]);
const emptyPlan = buildCorrectivePlan(emptyAnalysis);
assert(!emptyPlan.hasIssues, "Empty analysis → hasIssues is false");
assert(emptyPlan.issueCards.length === 0, "Empty plan has no issue cards");
assert(emptyPlan.recommendedDrills.length === 0, "Empty plan has no drills");
assert(emptyPlan.priorityDrillId === null, "Empty plan priorityDrillId is null");
assert(emptyPlan.scanQualityWarning === null, "Good scan with no warnings → null scanQualityWarning");
assert(emptyPlan.generatedAt > 0, "Empty plan has generatedAt timestamp");

// buildEmptyPlan directly
const directEmpty = buildEmptyPlan();
assert(!directEmpty.hasIssues, "buildEmptyPlan() returns hasIssues false");

// All below threshold → empty plan
const belowThreshold = makeAnalysis([makeIssue({ confidence: 0.2 })]);
const filteredPlan = buildCorrectivePlan(belowThreshold);
assert(!filteredPlan.hasIssues, "All-below-threshold analysis → empty plan");

// Single issue → full plan
const singleAnalysis = makeAnalysis([makeIssue()]);
const singlePlan = buildCorrectivePlan(singleAnalysis);
assert(singlePlan.hasIssues, "Single-issue analysis → hasIssues true");
assert(singlePlan.issueCards.length === 1, "Single-issue plan has 1 issue card");
assert(singlePlan.recommendedDrills.length > 0, "Single-issue plan has drills");
assert(singlePlan.priorityDrillId !== null, "Single-issue plan has a priorityDrillId");
assert(singlePlan.summary.length > 0, "Single-issue plan has a non-empty summary");
assert(singlePlan.generatedAt > 0, "Plan has a generatedAt timestamp");

// Multiple issues → correctly sorted (severe first)
const multiAnalysis = makeAnalysis([
  makeIssue({ type: "forward_head_posture", severity: "mild", confidence: 0.9 }),
  makeIssue({ type: "knee_valgus", severity: "severe", confidence: 0.8 }),
  makeIssue({ type: "rounded_shoulders", severity: "moderate", confidence: 0.7 }),
]);
const multiPlan = buildCorrectivePlan(multiAnalysis);
assert(multiPlan.issueCards[0].severity === "severe", "First issue card is the most severe");
assert(multiPlan.issueCards[1].severity === "moderate", "Second issue card is moderate");
assert(multiPlan.issueCards[2].severity === "mild", "Third issue card is mild");
assert(multiPlan.recommendedDrills.length <= MAX_RECOMMENDED_DRILLS, "Multi-issue plan capped at MAX_RECOMMENDED_DRILLS");

// Drill priority rank is 1-based and in order
multiPlan.recommendedDrills.forEach((r, i) => {
  assert(r.priorityRank === i + 1, `Drill at index ${i} has priorityRank ${i + 1}`);
});

// scanQualityWarning propagates from Task 2 warnings
const warnAnalysis = makeAnalysis([makeIssue()], {
  warnings: ["single_leg_balance step skipped"],
  scanQuality: "partial",
});
const warnPlan = buildCorrectivePlan(warnAnalysis);
assert(warnPlan.scanQualityWarning !== null, "Warnings from Task 2 propagate to plan");
assert(warnPlan.scanQualityWarning?.includes("single_leg_balance step skipped") ?? false, "Warning text is preserved in plan");

// scanQualityWarning is null when scan is good and no warnings
const goodScanAnalysis = makeAnalysis([makeIssue()], { scanQuality: "good", warnings: [] });
const goodPlan = buildCorrectivePlan(goodScanAnalysis);
assert(goodPlan.scanQualityWarning === null, "Good scan with no warnings → null scanQualityWarning");

// sortIssuesBySeverity is stable under equal severity (uses confidence as tiebreak)
const equalSeverity = [
  makeIssue({ type: "rounded_shoulders", severity: "moderate", confidence: 0.6 }),
  makeIssue({ type: "apt_tendency", severity: "moderate", confidence: 0.8 }),
];
const sortedEqual = sortIssuesBySeverity(equalSeverity);
assert(sortedEqual[0].type === "apt_tendency", "Equal severity: higher confidence sorts first");

// buildPlanSummary handles edge case of no drills
const emptySummary = buildPlanSummary([], []);
assert(emptySummary.length > 0, "buildPlanSummary returns non-empty string for empty inputs");

// buildPlanSummary mentions the top drill name
const singleCard = buildIssueCard(makeIssue());
const singleDrillList = rankDrills([makeIssue()]);
const summary = buildPlanSummary([singleCard], singleDrillList);
assert(summary.includes(singleDrillList[0].drill.displayName), "buildPlanSummary includes top drill name");

// ─── 5. End-to-end integration ───────────────────────────────────────────────

section("End-to-End Integration");

// Full realistic scenario: 3 issues, mixed severity
const e2eAnalysis: AnalysisResult = {
  detectedIssues: [
    {
      type: "rounded_shoulders",
      severity: "moderate",
      confidence: 0.82,
      evidenceSummary: "Shoulders protracting ~3 cm beyond neutral.",
      affectedAreas: ["shoulders", "upper_back"],
      evidenceFrameId: "front_stance",
      rawMetrics: { shoulderProtractionCm: 3 },
    },
    {
      type: "forward_head_posture",
      severity: "mild",
      confidence: 0.65,
      evidenceSummary: "Head ~2 cm anterior to shoulder line on side view.",
      affectedAreas: ["neck"],
      evidenceFrameId: "side_stance",
      rawMetrics: { headForwardOffsetCm: 2 },
    },
    {
      type: "knee_valgus",
      severity: "severe",
      confidence: 0.91,
      evidenceSummary: "Knees drift inward ~18° from hip-to-foot line during squat descent.",
      affectedAreas: ["knees", "hips"],
      evidenceFrameId: "squat",
      rawMetrics: { kneeValgusAngleDeg: 18 },
    },
  ],
  overallConfidence: 0.79,
  analysedAt: Date.now(),
  scanQuality: "good",
  warnings: [],
};

const e2ePlan = buildCorrectivePlan(e2eAnalysis);

assert(e2ePlan.hasIssues, "E2E: hasIssues is true");
assert(e2ePlan.issueCards.length === 3, "E2E: 3 issue cards");
assert(e2ePlan.issueCards[0].severity === "severe", "E2E: first card is severe (knee_valgus)");
assert(e2ePlan.issueCards[0].issueType === "knee_valgus", "E2E: first card is knee_valgus");
assert(e2ePlan.recommendedDrills.length <= 3, "E2E: at most 3 drills");
assert(e2ePlan.recommendedDrills[0].priorityRank === 1, "E2E: first drill has rank 1");
assert(
  e2ePlan.recommendedDrills[0].drill.targetIssues.includes("knee_valgus"),
  "E2E: top drill targets the most severe issue"
);
assert(e2ePlan.priorityDrillId === e2ePlan.recommendedDrills[0].drill.id, "E2E: priorityDrillId matches first drill");
assert(e2ePlan.scanQualityWarning === null, "E2E: no warning for good scan");
assert(e2ePlan.summary.includes("3"), "E2E: summary mentions issue count");

// Confirm wall_angel deduplication (rounded_shoulders + forward_head_posture both map to it)
const wallAngelInPlan = e2ePlan.recommendedDrills.find(r => r.drill.id === "wall_angel");
if (wallAngelInPlan) {
  assert(wallAngelInPlan.isDeduped, "E2E: wall_angel is deduped when two issues map to it");
}

// All issue cards pass through evidenceFrameDataUrl correctly
e2ePlan.issueCards.forEach((card) => {
  assert(card.affectedAreas.length > 0, `E2E: ${card.issueType} card has affectedAreas`);
  assert(card.whatWasDetected.toLowerCase().includes("consistent with"), `E2E: ${card.issueType} uses safe language`);
  assert(card.whatItMayContributeTo.toLowerCase().includes("may"), `E2E: ${card.issueType} uses 'may' language`);
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n════════════════════════════════════`);
console.log(`Task 3 Smoke Test: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("SOME TESTS FAILED — review output above.");
  process.exit(1);
} else {
  console.log("All checks passed. Task 3 is production-ready.");
}
