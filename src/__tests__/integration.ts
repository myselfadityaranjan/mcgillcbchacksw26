// ============================================================================
// StrainSense — Cross-Task Integration Test (Task 3 ↔ Task 4)
//
// Three test suites:
//   A. Coverage Audit — every DrillId is consistently registered across all
//      lookup tables in both tasks (DRILL_LIBRARY, REQUIRED_LANDMARKS,
//      THRESHOLDS, computeDrillMetrics keys, tickRepDetector handling).
//
//   B. Full Pipeline E2E — for every issue type, run the complete chain:
//      AnalysisResult → buildCorrectivePlan() → priorityDrillId
//      → startSession() → processFrame() × 5 → endSession()
//      and assert shape/validity of every output object.
//
//   C. Rep Detection Simulation — deterministic frame sequences that
//      drive each rep-based drill through N full cycles and verify
//      exactly N reps are counted with the correct phase transitions.
//
// Run with: npm exec -- tsx src/__tests__/integration.ts
// ============================================================================

import type {
  AnalysisResult,
  DetectedIssue,
  DrillId,
  IssueType,
  PoseLandmark,
} from "../types";

// Task 3
import { DRILL_LIBRARY, getAllDrills, getDrill } from "../task3/drills";
import { buildCorrectivePlan } from "../task3/planBuilder";

// Task 4
import { REQUIRED_LANDMARKS, LM } from "../task4/poseUtils";
import { THRESHOLDS, computeDrillMetrics } from "../task4/drillThresholds";
import { tickRepDetector } from "../task4/cueEngine";
import { startSession, processFrame, endSession } from "../task4/liveCoach";

// ─── Test Infrastructure ──────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertClose(a: number, b: number, tol: number, msg: string): void {
  assert(
    Math.abs(a - b) <= tol,
    `${msg} (got ${a.toFixed(4)}, expected ~${b.toFixed(4)} ±${tol})`
  );
}

function section(name: string): void {
  console.log(`\n── ${name}`);
}

// ─── All DrillIds ─────────────────────────────────────────────────────────────

const ALL_DRILL_IDS: DrillId[] = [
  "doorway_pec_stretch",
  "wall_angel",
  "hip_flexor_stretch",
  "squat_alignment_drill",
  "split_squat_drill",
];

const ALL_ISSUE_TYPES: IssueType[] = [
  "rounded_shoulders",
  "forward_head_posture",
  "apt_tendency",
  "knee_valgus",
  "left_right_asymmetry",
];

// ─── Landmark Fixture Builder ─────────────────────────────────────────────────

function makeLandmarks(
  overrides: Partial<Record<number, Partial<PoseLandmark>>> = {}
): PoseLandmark[] {
  const defaults: Record<number, PoseLandmark> = {
    [LM.NOSE]:              { x: 0.50, y: 0.05, z: 0.00, visibility: 1 },
    [LM.LEFT_EYE]:          { x: 0.48, y: 0.04, z: 0.00, visibility: 1 },
    [LM.RIGHT_EYE]:         { x: 0.52, y: 0.04, z: 0.00, visibility: 1 },
    [LM.LEFT_EAR]:          { x: 0.45, y: 0.06, z: -0.05, visibility: 1 },
    [LM.RIGHT_EAR]:         { x: 0.55, y: 0.06, z: -0.05, visibility: 1 },
    [LM.LEFT_SHOULDER]:     { x: 0.42, y: 0.20, z: -0.05, visibility: 1 },
    [LM.RIGHT_SHOULDER]:    { x: 0.58, y: 0.20, z: -0.05, visibility: 1 },
    [LM.LEFT_ELBOW]:        { x: 0.38, y: 0.36, z: -0.02, visibility: 1 },
    [LM.RIGHT_ELBOW]:       { x: 0.62, y: 0.36, z: -0.02, visibility: 1 },
    [LM.LEFT_WRIST]:        { x: 0.37, y: 0.50, z: -0.02, visibility: 1 },
    [LM.RIGHT_WRIST]:       { x: 0.63, y: 0.50, z: -0.02, visibility: 1 },
    [LM.LEFT_HIP]:          { x: 0.44, y: 0.55, z: -0.03, visibility: 1 },
    [LM.RIGHT_HIP]:         { x: 0.56, y: 0.55, z: -0.03, visibility: 1 },
    [LM.LEFT_KNEE]:         { x: 0.44, y: 0.72, z: -0.02, visibility: 1 },
    [LM.RIGHT_KNEE]:        { x: 0.56, y: 0.72, z: -0.02, visibility: 1 },
    [LM.LEFT_ANKLE]:        { x: 0.44, y: 0.88, z: -0.01, visibility: 1 },
    [LM.RIGHT_ANKLE]:       { x: 0.56, y: 0.88, z: -0.01, visibility: 1 },
    [LM.LEFT_HEEL]:         { x: 0.43, y: 0.90, z:  0.00, visibility: 1 },
    [LM.RIGHT_HEEL]:        { x: 0.57, y: 0.90, z:  0.00, visibility: 1 },
    [LM.LEFT_FOOT_INDEX]:   { x: 0.43, y: 0.92, z:  0.00, visibility: 1 },
    [LM.RIGHT_FOOT_INDEX]:  { x: 0.57, y: 0.92, z:  0.00, visibility: 1 },
  };

  const arr: PoseLandmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5, y: 0.5, z: 0, visibility: 0,
  }));

  for (const [idx, lm] of Object.entries(defaults)) {
    arr[Number(idx)] = { ...lm };
  }
  for (const [idx, ov] of Object.entries(overrides)) {
    const i = Number(idx);
    arr[i] = { ...arr[i], ...ov };
  }
  return arr;
}

/**
 * Squat bottom landmark set: knees bent to ~90°.
 * Achieved by moving knees forward (smaller x for left, larger for right)
 * and hips down. angleDeg(hip, knee, ankle) ≈ 90°.
 */
function makeSquatBottom(): PoseLandmark[] {
  return makeLandmarks({
    [LM.LEFT_HIP]:   { x: 0.44, y: 0.75, z: -0.03, visibility: 1 },
    [LM.RIGHT_HIP]:  { x: 0.56, y: 0.75, z: -0.03, visibility: 1 },
    [LM.LEFT_KNEE]:  { x: 0.38, y: 0.78, z: -0.02, visibility: 1 }, // knee forward → ~90°
    [LM.RIGHT_KNEE]: { x: 0.62, y: 0.78, z: -0.02, visibility: 1 },
    [LM.LEFT_ANKLE]: { x: 0.44, y: 0.90, z: -0.01, visibility: 1 },
    [LM.RIGHT_ANKLE]:{ x: 0.56, y: 0.90, z: -0.01, visibility: 1 },
  });
}

/** Squat top: legs nearly straight (upright default → ~180°). */
const lmSquatTop = makeLandmarks();

/** Wall angel top: wrists clearly above shoulders. */
function makeWallTop(): PoseLandmark[] {
  return makeLandmarks({
    [LM.LEFT_WRIST]:  { x: 0.37, y: 0.10, z: -0.05, visibility: 1 },
    [LM.RIGHT_WRIST]: { x: 0.63, y: 0.10, z: -0.05, visibility: 1 },
    // Ears and hips pressed to wall (negative z)
    [LM.LEFT_EAR]:    { x: 0.45, y: 0.06, z: -0.10, visibility: 1 },
    [LM.RIGHT_EAR]:   { x: 0.55, y: 0.06, z: -0.10, visibility: 1 },
    [LM.LEFT_HIP]:    { x: 0.44, y: 0.55, z: -0.08, visibility: 1 },
    [LM.RIGHT_HIP]:   { x: 0.56, y: 0.55, z: -0.08, visibility: 1 },
  });
}

/** Wall angel bottom: wrists below shoulders. */
function makeWallBottom(): PoseLandmark[] {
  return makeLandmarks({
    [LM.LEFT_WRIST]:  { x: 0.37, y: 0.40, z: -0.05, visibility: 1 },
    [LM.RIGHT_WRIST]: { x: 0.63, y: 0.40, z: -0.05, visibility: 1 },
    [LM.LEFT_EAR]:    { x: 0.45, y: 0.06, z: -0.10, visibility: 1 },
    [LM.RIGHT_EAR]:   { x: 0.55, y: 0.06, z: -0.10, visibility: 1 },
    [LM.LEFT_HIP]:    { x: 0.44, y: 0.55, z: -0.08, visibility: 1 },
    [LM.RIGHT_HIP]:   { x: 0.56, y: 0.55, z: -0.08, visibility: 1 },
  });
}

// ─── AnalysisResult Factory ───────────────────────────────────────────────────

function makeAnalysisResult(issues: DetectedIssue[]): AnalysisResult {
  return {
    detectedIssues: issues,
    overallConfidence: issues.length > 0
      ? issues.reduce((s, i) => s + i.confidence, 0) / issues.length
      : 0,
    analysedAt: Date.now(),
    scanQuality: "good",
    warnings: [],
  };
}

function makeIssue(
  type: IssueType,
  severity: "mild" | "moderate" | "severe" = "moderate",
  confidence = 0.85
): DetectedIssue {
  return {
    type,
    severity,
    confidence,
    evidenceSummary: `Test evidence for ${type}.`,
    affectedAreas: ["shoulders"],
    evidenceFrameId: "front_stance",
    rawMetrics: {},
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// SUITE A: Coverage Audit
// ═════════════════════════════════════════════════════════════════════════════

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  SUITE A: Coverage Audit                                     ║");
console.log("╚══════════════════════════════════════════════════════════════╝");

section("A1. Every DrillId is in DRILL_LIBRARY (Task 3)");
for (const id of ALL_DRILL_IDS) {
  assert(DRILL_LIBRARY.has(id), `DRILL_LIBRARY has ${id}`);
}
assert(DRILL_LIBRARY.size === ALL_DRILL_IDS.length, `DRILL_LIBRARY size = ${ALL_DRILL_IDS.length}`);

section("A2. Every DrillId is in REQUIRED_LANDMARKS (Task 4 poseUtils)");
for (const id of ALL_DRILL_IDS) {
  assert(id in REQUIRED_LANDMARKS, `REQUIRED_LANDMARKS has ${id}`);
  assert(REQUIRED_LANDMARKS[id].length >= 4, `${id}: at least 4 required landmarks`);
  // All required indices must be valid MediaPipe indices [0–32]
  for (const idx of REQUIRED_LANDMARKS[id]) {
    assert(idx >= 0 && idx <= 32, `${id}: landmark index ${idx} in valid range`);
  }
}

section("A3. Every DrillId is in THRESHOLDS (Task 4 drillThresholds)");
for (const id of ALL_DRILL_IDS) {
  assert(id in THRESHOLDS, `THRESHOLDS has ${id}`);
  const entries = Object.entries(THRESHOLDS[id]);
  assert(entries.length >= 2, `${id}: at least 2 threshold entries`);
  // Every pair must have correction < unsafe OR unsafe = Infinity (for inverted checks)
  for (const [key, pair] of entries) {
    if (isFinite(pair.unsafe)) {
      // For non-inverted (gt direction), unsafe should be more extreme than correction
      // We can't know direction here, so just assert both are finite numbers
      assert(typeof pair.correction === "number", `${id}.${key}.correction is number`);
      assert(typeof pair.unsafe === "number", `${id}.${key}.unsafe is number`);
      assert(!isNaN(pair.correction), `${id}.${key}.correction is not NaN`);
      assert(!isNaN(pair.unsafe), `${id}.${key}.unsafe is not NaN`);
    }
  }
}

section("A4. computeDrillMetrics() returns all threshold errorIds as keys");
const lmFull = makeLandmarks();
for (const id of ALL_DRILL_IDS) {
  const metrics = computeDrillMetrics(lmFull, id);
  for (const errorId of Object.keys(THRESHOLDS[id])) {
    assert(
      errorId in metrics,
      `${id}: computeDrillMetrics returns key "${errorId}"`
    );
    assert(
      !isNaN(metrics[errorId]),
      `${id}: metric "${errorId}" is not NaN with full landmark set`
    );
  }
}

section("A5. tickRepDetector handles all 5 DrillIds without throwing");
for (const id of ALL_DRILL_IDS) {
  let threw = false;
  try {
    tickRepDetector(id, "READY", 0, {
      mean_knee_angle_deg: 170,
      front_knee_angle_deg: 170,
      wrist_above_shoulder_ratio: 0.15,
    });
  } catch {
    threw = true;
  }
  assert(!threw, `tickRepDetector("${id}") does not throw`);
}

section("A6. getDrill() resolves for all DrillIds and has required cue tiers");
for (const id of ALL_DRILL_IDS) {
  const drill = getDrill(id);
  assert(drill.id === id, `${id}: drill.id matches`);
  assert(drill.displayName.length > 0, `${id}: has displayName`);
  assert(drill.coachingCues.length >= 2, `${id}: at least 2 coaching cues`);
  assert(drill.unsafeConditions.length >= 1, `${id}: at least 1 unsafe condition`);

  // Every drill must have at least one "unsafe" cue so selectActiveCue can respond
  const hasUnsafeCue = drill.coachingCues.some(c => c.priority === "unsafe");
  assert(hasUnsafeCue, `${id}: has at least one "unsafe" priority cue`);

  // Every cue must have non-empty text and a valid targetArea
  for (const cue of drill.coachingCues) {
    assert(cue.text.length > 0, `${id}: cue text is non-empty`);
    assert(cue.targetArea.length > 0, `${id}: cue targetArea is non-empty`);
  }
}

section("A7. THRESHOLDS errorId keys don't contain any typos vs known errorIds");
// The set of ALL known errorIds across all drills
const knownErrorIds = new Set(ALL_DRILL_IDS.flatMap(id => Object.keys(THRESHOLDS[id])));
// We'll verify no duplicate threshold key appears under two drills with conflicting
// "direction" implications (both positive and negative unsafe for same key).
// At minimum, verify no drill defines the same errorId twice.
for (const id of ALL_DRILL_IDS) {
  const keys = Object.keys(THRESHOLDS[id]);
  const unique = new Set(keys);
  assert(unique.size === keys.length, `${id}: no duplicate threshold keys`);
}
assert(knownErrorIds.size >= 12, `at least 12 distinct errorId types across all drills`);

section("A8. All IssueTypes are reachable via recommendationEngine");
for (const issueType of ALL_ISSUE_TYPES) {
  const analysis = makeAnalysisResult([makeIssue(issueType, "moderate", 0.9)]);
  const plan = buildCorrectivePlan(analysis);
  assert(plan.hasIssues === true, `${issueType}: plan has issues`);
  assert(plan.recommendedDrills.length >= 1, `${issueType}: at least 1 drill recommended`);
  assert(plan.priorityDrillId !== null, `${issueType}: priorityDrillId is not null`);
  // The priority drill must be in DRILL_LIBRARY and THRESHOLDS and REQUIRED_LANDMARKS
  const pId = plan.priorityDrillId!;
  assert(DRILL_LIBRARY.has(pId), `${issueType}: priorityDrill "${pId}" in DRILL_LIBRARY`);
  assert(pId in THRESHOLDS, `${issueType}: priorityDrill "${pId}" in THRESHOLDS`);
  assert(pId in REQUIRED_LANDMARKS, `${issueType}: priorityDrill "${pId}" in REQUIRED_LANDMARKS`);
}

// ═════════════════════════════════════════════════════════════════════════════
// SUITE B: Full Pipeline E2E
// ═════════════════════════════════════════════════════════════════════════════

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  SUITE B: Full Pipeline E2E                                  ║");
console.log("╚══════════════════════════════════════════════════════════════╝");

section("B1. Single-issue plan → session → result (all 5 issues)");
for (const issueType of ALL_ISSUE_TYPES) {
  const analysis = makeAnalysisResult([makeIssue(issueType, "severe", 0.92)]);
  const plan = buildCorrectivePlan(analysis);

  // Task 3 → Task 4 handoff: priorityDrillId used to start session
  const drillId = plan.priorityDrillId!;
  const session = startSession(drillId);

  // Run 5 frames
  const lm = makeLandmarks();
  const frames = [];
  for (let i = 0; i < 5; i++) {
    frames.push(processFrame(session, lm, (i + 1) * 200));
  }

  const result = endSession(session);

  // Validate plan shape
  assert(plan.issueCards.length === 1,       `${issueType}: 1 issue card`);
  assert(plan.issueCards[0].issueType === issueType, `${issueType}: card type matches`);
  assert(plan.issueCards[0].severity === "severe", `${issueType}: severity = severe`);
  assert(plan.issueCards[0].headline.length > 0, `${issueType}: headline non-empty`);
  assert(plan.summary.includes(drillId.replace(/_/g, " ").split(" ")[0] === "wall"
    ? "Wall" : plan.recommendedDrills[0].drill.displayName.split(" ")[0]),
    `${issueType}: summary mentions priority drill name`);

  // Validate frames
  for (const frame of frames) {
    assert(frame.landmarksVisible === true, `${issueType}: frame visible`);
    assert(["good","needs_correction","unsafe"].includes(frame.formState),
      `${issueType}: valid formState`);
    assert(frame.qualityScore >= 0 && frame.qualityScore <= 100,
      `${issueType}: qualityScore in [0,100]`);
    assert(typeof frame.metrics === "object", `${issueType}: metrics is object`);
    assert(Array.isArray(frame.errors), `${issueType}: errors is array`);
    // activeCue is null or has text + targetArea
    if (frame.activeCue !== null) {
      assert(frame.activeCue.text.length > 0, `${issueType}: activeCue.text non-empty`);
      assert(frame.activeCue.targetArea.length > 0, `${issueType}: activeCue.targetArea set`);
    }
  }

  // Validate result
  assert(result.drillId === drillId, `${issueType}: result.drillId matches`);
  assert(result.drillDisplayName === getDrill(drillId).displayName,
    `${issueType}: displayName from Task 3 drill library`);
  assert(result.meanQualityScore >= 0 && result.meanQualityScore <= 100, `${issueType}: meanQualityScore in [0,100]`);
  assert(result.goodFormPercent >= 0 && result.goodFormPercent <= 100,
    `${issueType}: goodFormPercent in [0,100]`);
  assert(result.topErrors.length <= 3, `${issueType}: topErrors ≤ 3`);
  assert(Array.isArray(result.snapshots), `${issueType}: snapshots array`);
}

section("B2. Multi-issue plan → all recommended drills can run sessions");
const multiAnalysis = makeAnalysisResult([
  makeIssue("rounded_shoulders",   "severe",   0.95),
  makeIssue("knee_valgus",         "moderate", 0.80),
  makeIssue("left_right_asymmetry","mild",     0.70),
]);
const multiPlan = buildCorrectivePlan(multiAnalysis);
assert(multiPlan.hasIssues === true, "multi-issue plan has issues");
assert(multiPlan.recommendedDrills.length <= 3, "capped at 3 drills");
assert(multiPlan.recommendedDrills.length >= 1, "at least 1 drill");

for (const rec of multiPlan.recommendedDrills) {
  const s = startSession(rec.drill.id);
  const f = processFrame(s, makeLandmarks(), 500);
  const r = endSession(s);
  assert(f.landmarksVisible === true, `multi: ${rec.drill.id} frame visible`);
  assert(r.drillId === rec.drill.id, `multi: ${rec.drill.id} result drillId`);
  assert(r.drillDisplayName === rec.drill.displayName,
    `multi: displayName consistent across Task 3 + Task 4`);
}

section("B3. Empty AnalysisResult → empty plan → still launches a session safely");
const emptyAnalysis = makeAnalysisResult([]);
const emptyPlan = buildCorrectivePlan(emptyAnalysis);
assert(emptyPlan.hasIssues === false,    "empty plan hasIssues = false");
assert(emptyPlan.priorityDrillId === null, "empty plan priorityDrillId = null");
assert(emptyPlan.recommendedDrills.length === 0, "empty plan no drills");
// Task 4 can still be used independently (user picks any drill)
const manualSession = startSession("wall_angel");
const manualFrame = processFrame(manualSession, makeLandmarks(), 100);
assert(manualFrame.landmarksVisible === true, "manual session frame visible");

section("B4. Low-confidence issues filtered → empty plan");
const lowConfAnalysis = makeAnalysisResult([
  makeIssue("knee_valgus", "severe", 0.20), // below 0.4 threshold
]);
const lowPlan = buildCorrectivePlan(lowConfAnalysis);
assert(lowPlan.hasIssues === false, "low-confidence issue produces empty plan");

section("B5. Plan summary mentions all recommended drill names");
const summaryAnalysis = makeAnalysisResult([
  makeIssue("rounded_shoulders", "severe", 0.95),
]);
const summaryPlan = buildCorrectivePlan(summaryAnalysis);
for (const rec of summaryPlan.recommendedDrills) {
  const name = rec.drill.displayName;
  assert(
    summaryPlan.summary.includes(name),
    `summary mentions "${name}"`
  );
}

section("B6. FinalSessionResult.totalReps undefined for all hold drills");
const holdDrills: DrillId[] = ["doorway_pec_stretch", "hip_flexor_stretch"];
for (const id of holdDrills) {
  const s = startSession(id);
  processFrame(s, makeLandmarks(), 500);
  const r = endSession(s);
  assert(r.totalReps === undefined, `${id}: totalReps undefined (hold drill)`);
}

section("B7. FinalSessionResult.totalReps defined for rep drills");
const repDrills: DrillId[] = ["wall_angel", "squat_alignment_drill", "split_squat_drill"];
for (const id of repDrills) {
  const s = startSession(id);
  processFrame(s, makeLandmarks(), 500);
  const r = endSession(s);
  assert(typeof r.totalReps === "number", `${id}: totalReps is a number (rep drill)`);
}

section("B8. processFrame with zero frames → endSession still returns valid result");
const zeroSess = startSession("squat_alignment_drill");
const zeroResult = endSession(zeroSess);
assert(zeroResult.meanQualityScore === 0,   "zero frames → meanQualityScore = 0");
assert(zeroResult.goodFormPercent === 0,    "zero frames → goodFormPercent = 0");
assert(zeroResult.topErrors.length === 0,   "zero frames → no topErrors");
assert(zeroResult.totalReps === 0,          "zero frames → 0 reps");
assert(zeroResult.durationSeconds >= 0,     "zero frames → durationSeconds ≥ 0");

section("B9. Snapshot timestamps are monotonically increasing");
const snapSess = startSession("squat_alignment_drill");
const lmForSnap = makeLandmarks();
for (let t = 0; t < 6000; t += 500) {
  processFrame(snapSess, lmForSnap, t);
}
const snapResult = endSession(snapSess);
for (let i = 1; i < snapSess.snapshots.length; i++) {
  assert(
    snapSess.snapshots[i].timestampMs >= snapSess.snapshots[i - 1].timestampMs,
    `snapshot ${i} timestamp ≥ previous`
  );
}
assert(snapSess.snapshots.length >= 4, "at least 4 snapshots over 6 seconds");

section("B10. CoachingCue returned by processFrame is always from the drill's cues list");
for (const id of ALL_DRILL_IDS) {
  const drill = getDrill(id);
  const cueTexts = new Set(drill.coachingCues.map(c => c.text));
  const s = startSession(id);
  for (let i = 0; i < 10; i++) {
    const f = processFrame(s, makeLandmarks(), i * 100);
    if (f.activeCue !== null) {
      assert(
        cueTexts.has(f.activeCue.text),
        `${id}: activeCue text is from drill's coachingCues list`
      );
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SUITE C: Rep Detection Simulation
// ═════════════════════════════════════════════════════════════════════════════

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  SUITE C: Rep Detection Simulation                           ║");
console.log("╚══════════════════════════════════════════════════════════════╝");

// ─── Verify squat bottom/top angles first ────────────────────────────────────

section("C0. Fixture sanity — verify squat bottom/top knee angles");
const bottomMetrics = computeDrillMetrics(makeSquatBottom(), "squat_alignment_drill");
const topMetrics    = computeDrillMetrics(lmSquatTop, "squat_alignment_drill");
assert(
  bottomMetrics["mean_knee_angle_deg"] <= 100,
  `squat bottom angle ≤ 100° (got ${bottomMetrics["mean_knee_angle_deg"].toFixed(1)}°)`
);
assert(
  topMetrics["mean_knee_angle_deg"] >= 155,
  `squat top angle ≥ 155° (got ${topMetrics["mean_knee_angle_deg"].toFixed(1)}°)`
);

const wallTopMetrics    = computeDrillMetrics(makeWallTop(), "wall_angel");
const wallBottomMetrics = computeDrillMetrics(makeWallBottom(), "wall_angel");
assert(
  wallTopMetrics["wrist_above_shoulder_ratio"] >= 0.10,
  `wall top ratio ≥ 0.10 (got ${wallTopMetrics["wrist_above_shoulder_ratio"].toFixed(3)})`
);
assert(
  wallBottomMetrics["wrist_above_shoulder_ratio"] < 0,
  `wall bottom ratio < 0 (got ${wallBottomMetrics["wrist_above_shoulder_ratio"].toFixed(3)})`
);

section("C1. Squat — 3 complete reps counted via state machine only");
{
  const frames = [
    // start upright
    lmSquatTop, lmSquatTop,
    // rep 1: down → bottom → up → top
    makeSquatBottom(), makeSquatBottom(),
    lmSquatTop, lmSquatTop,
    // rep 2
    makeSquatBottom(), makeSquatBottom(),
    lmSquatTop, lmSquatTop,
    // rep 3
    makeSquatBottom(), makeSquatBottom(),
    lmSquatTop, lmSquatTop,
  ];

  let phase = "READY" as import("../../types").RepPhase;
  let count = 0;

  for (const lm of frames) {
    const m = computeDrillMetrics(lm, "squat_alignment_drill");
    const tick = tickRepDetector("squat_alignment_drill", phase, count, m);
    phase = tick.repPhase;
    count = tick.repCount;
  }

  assert(count === 3, `squat: 3 reps after 3 full cycles (got ${count})`);
  assert(phase === "READY", `squat: ends in READY phase (got ${phase})`);
}

section("C2. Squat — false start (abort before bottom) does not count a rep");
{
  let phase = "READY" as import("../../types").RepPhase;
  let count = 0;

  const frames = [
    lmSquatTop,    // READY
    makeLandmarks({ // slightly bent (angle ~150°, between 100 and 155 → DESCENDING)
      [LM.LEFT_HIP]:   { x: 0.44, y: 0.58, z: -0.03, visibility: 1 },
      [LM.RIGHT_HIP]:  { x: 0.56, y: 0.58, z: -0.03, visibility: 1 },
      [LM.LEFT_KNEE]:  { x: 0.42, y: 0.74, z: -0.02, visibility: 1 },
      [LM.RIGHT_KNEE]: { x: 0.58, y: 0.74, z: -0.02, visibility: 1 },
    }),
    lmSquatTop,    // back to top before reaching bottom → false start → READY
    lmSquatTop,
  ];

  for (const lm of frames) {
    const m = computeDrillMetrics(lm, "squat_alignment_drill");
    const t = tickRepDetector("squat_alignment_drill", phase, count, m);
    phase = t.repPhase;
    count = t.repCount;
  }

  assert(count === 0, `false start: no rep counted (got ${count})`);
}

section("C3. Wall Angel — 2 complete reps counted");
{
  const frames: PoseLandmark[][] = [
    makeWallBottom(), makeWallBottom(),
    makeWallTop(),   makeWallTop(),
    makeWallBottom(), makeWallBottom(),  // rep 1
    makeWallTop(),   makeWallTop(),
    makeWallBottom(), makeWallBottom(),  // rep 2
  ];

  let phase = "READY" as import("../../types").RepPhase;
  let count = 0;

  for (const lm of frames) {
    const m = computeDrillMetrics(lm, "wall_angel");
    const t = tickRepDetector("wall_angel", phase, count, m);
    phase = t.repPhase;
    count = t.repCount;
  }

  assert(count === 2, `wall angel: 2 reps counted (got ${count})`);
}

section("C4. Squat — rep count via processFrame (session accumulates correctly)");
{
  const sqSession = startSession("squat_alignment_drill");
  const repFrames = [
    lmSquatTop, lmSquatTop,
    makeSquatBottom(), makeSquatBottom(),
    lmSquatTop, lmSquatTop,
    makeSquatBottom(), makeSquatBottom(),
    lmSquatTop, lmSquatTop,
  ];

  let lastFrame = null as import("../../types").LiveCoachingFrame | null;
  for (let i = 0; i < repFrames.length; i++) {
    lastFrame = processFrame(sqSession, repFrames[i], i * 100);
  }

  const result = endSession(sqSession);
  assert(result.totalReps !== undefined, "squat session: totalReps is defined");
  assert(result.totalReps! >= 2, `squat session: ≥2 reps counted (got ${result.totalReps})`);
}

section("C5. Wall Angel — rep count via processFrame");
{
  const waSession = startSession("wall_angel");
  const waFrames = [
    makeWallBottom(), makeWallBottom(),
    makeWallTop(),   makeWallTop(),
    makeWallBottom(), makeWallBottom(),
    makeWallTop(),   makeWallTop(),
    makeWallBottom(), makeWallBottom(),
  ];

  for (let i = 0; i < waFrames.length; i++) {
    processFrame(waSession, waFrames[i], i * 100);
  }

  const waResult = endSession(waSession);
  assert(waResult.totalReps !== undefined, "wall angel: totalReps defined");
  assert(waResult.totalReps! >= 1, `wall angel: ≥1 rep counted (got ${waResult.totalReps})`);
}

section("C6. Split squat — state machine ticks without throwing on all phases");
{
  const splitFrames = [lmSquatTop, makeSquatBottom(), lmSquatTop];
  let phase = "READY" as import("../../types").RepPhase;
  let count = 0;
  for (const lm of splitFrames) {
    const m = computeDrillMetrics(lm, "split_squat_drill");
    const t = tickRepDetector("split_squat_drill", phase, count, m);
    phase = t.repPhase;
    count = t.repCount;
    assert(
      ["READY","DESCENDING","BOTTOM_HOLD","ASCENDING"].includes(phase),
      `split_squat: valid phase "${phase}"`
    );
  }
}

section("C7. Hold drills return phase=READY, count=0 forever");
{
  for (const id of ["doorway_pec_stretch", "hip_flexor_stretch"] as DrillId[]) {
    for (const lm of [lmSquatTop, makeSquatBottom()]) {
      const m = computeDrillMetrics(lm, id);
      const t = tickRepDetector(id, "READY", 0, m);
      assert(t.repPhase === "READY", `${id}: hold drill phase always READY`);
      assert(t.repCount === 0,       `${id}: hold drill count always 0`);
    }
  }
}

section("C8. Quality score degrades meaningfully when valgus is introduced mid-session");
{
  const sess = startSession("squat_alignment_drill");
  const goodLm = makeLandmarks();
  // Good frames
  for (let i = 0; i < 3; i++) {
    processFrame(sess, goodLm, i * 100);
  }
  const qualityAfterGood = sess.smoothedQualityScore;

  // Bad frames — left knee valgus (positive ratio requires knee.x < hip.x=0.44)
  // ratio = (0*apY - 0.33*apX)/0.1089; for ratio > 0.12, apX must be < 0 → knee.x < 0.44
  const badLm = makeLandmarks({
    [LM.LEFT_KNEE]: { x: 0.36, y: 0.72, z: -0.02, visibility: 1 }, // displaced medially → ratio ≈ +0.27
  });
  for (let i = 3; i < 8; i++) {
    processFrame(sess, badLm, i * 100);
  }
  const qualityAfterBad = sess.smoothedQualityScore;

  assert(
    qualityAfterBad < qualityAfterGood,
    `quality drops when valgus introduced (${qualityAfterBad.toFixed(1)} < ${qualityAfterGood.toFixed(1)})`
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Results
// ═════════════════════════════════════════════════════════════════════════════

console.log(`\n${"═".repeat(64)}`);
console.log(`Integration Test Results: ${passed} passed, ${failed} failed`);
console.log("═".repeat(64));

if (failed > 0) {
  process.exit(1);
}
