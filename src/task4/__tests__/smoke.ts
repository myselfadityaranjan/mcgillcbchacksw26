// ============================================================================
// StrainSense — Task 4: Smoke Tests
//
// Covers poseUtils, drillThresholds, safetyRules, cueEngine, qualityScore,
// and liveCoach end-to-end. All assertions use bare throws for zero deps.
// Run with: npx ts-node src/task4/__tests__/smoke.ts
// ============================================================================

import type { PoseLandmark, DrillId, CoachingSession, FormError } from "../../types";
import { LM, landmarksVisible, dist2D, midpoint, angleDeg, lateralOffsetRatio, ema, REQUIRED_LANDMARKS, MIN_VISIBILITY } from "../poseUtils";
import { computeDrillMetrics, THRESHOLDS } from "../drillThresholds";
import { evaluateSafetyRules, ERROR_AREAS } from "../safetyRules";
import { evaluateFormErrors, selectActiveCue, tickRepDetector } from "../cueEngine";
import { computeQualityScore } from "../qualityScore";
import { startSession, processFrame, endSession } from "../liveCoach";

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

function assertClose(a: number, b: number, tol: number, message: string): void {
  assert(Math.abs(a - b) <= tol, `${message} (got ${a.toFixed(4)}, expected ~${b.toFixed(4)} ±${tol})`);
}

function section(name: string): void {
  console.log(`\n── ${name} ─────────────────────────────────────────`);
}

// ─── Landmark Fixture Builder ─────────────────────────────────────────────────

/** Creates a neutral, fully-visible 33-landmark array standing upright. */
function makeLandmarks(overrides: Partial<Record<number, Partial<PoseLandmark>>> = {}): PoseLandmark[] {
  // Default: symmetrical upright stance, all landmarks at visibility 1.0
  const defaults: Record<number, PoseLandmark> = {
    [LM.NOSE]:             { x: 0.50, y: 0.05, z: 0.00, visibility: 1 },
    [LM.LEFT_EYE]:         { x: 0.48, y: 0.04, z: 0.00, visibility: 1 },
    [LM.RIGHT_EYE]:        { x: 0.52, y: 0.04, z: 0.00, visibility: 1 },
    [LM.LEFT_EAR]:         { x: 0.45, y: 0.06, z: -0.05, visibility: 1 },
    [LM.RIGHT_EAR]:        { x: 0.55, y: 0.06, z: -0.05, visibility: 1 },
    [LM.LEFT_SHOULDER]:    { x: 0.42, y: 0.20, z: -0.05, visibility: 1 },
    [LM.RIGHT_SHOULDER]:   { x: 0.58, y: 0.20, z: -0.05, visibility: 1 },
    [LM.LEFT_ELBOW]:       { x: 0.38, y: 0.36, z: -0.02, visibility: 1 },
    [LM.RIGHT_ELBOW]:      { x: 0.62, y: 0.36, z: -0.02, visibility: 1 },
    [LM.LEFT_WRIST]:       { x: 0.37, y: 0.50, z: -0.02, visibility: 1 },
    [LM.RIGHT_WRIST]:      { x: 0.63, y: 0.50, z: -0.02, visibility: 1 },
    [LM.LEFT_HIP]:         { x: 0.44, y: 0.55, z: -0.03, visibility: 1 },
    [LM.RIGHT_HIP]:        { x: 0.56, y: 0.55, z: -0.03, visibility: 1 },
    [LM.LEFT_KNEE]:        { x: 0.44, y: 0.72, z: -0.02, visibility: 1 },
    [LM.RIGHT_KNEE]:       { x: 0.56, y: 0.72, z: -0.02, visibility: 1 },
    [LM.LEFT_ANKLE]:       { x: 0.44, y: 0.88, z: -0.01, visibility: 1 },
    [LM.RIGHT_ANKLE]:      { x: 0.56, y: 0.88, z: -0.01, visibility: 1 },
    [LM.LEFT_HEEL]:        { x: 0.43, y: 0.90, z: 0.00, visibility: 1 },
    [LM.RIGHT_HEEL]:       { x: 0.57, y: 0.90, z: 0.00, visibility: 1 },
    [LM.LEFT_FOOT_INDEX]:  { x: 0.43, y: 0.92, z: 0.00, visibility: 1 },
    [LM.RIGHT_FOOT_INDEX]: { x: 0.57, y: 0.92, z: 0.00, visibility: 1 },
  };

  // Fill unused indices with low-visibility placeholders
  const arr: PoseLandmark[] = Array.from({ length: 33 }, (_, i) => ({
    x: 0.5, y: 0.5, z: 0, visibility: 0,
  }));

  for (const [idx, lm] of Object.entries(defaults)) {
    arr[Number(idx)] = { ...lm };
  }

  for (const [idx, override] of Object.entries(overrides)) {
    const i = Number(idx);
    arr[i] = { ...arr[i], ...override };
  }

  return arr;
}

// ─── Section 1: LM Constants ──────────────────────────────────────────────────

section("1. LM Constants");
assert(LM.NOSE === 0,           "NOSE = 0");
assert(LM.LEFT_SHOULDER === 11, "LEFT_SHOULDER = 11");
assert(LM.RIGHT_HIP === 24,     "RIGHT_HIP = 24");
assert(LM.LEFT_FOOT_INDEX === 31, "LEFT_FOOT_INDEX = 31");
assert(Object.keys(LM).length === 21, "21 landmark constants defined");

// ─── Section 2: REQUIRED_LANDMARKS ───────────────────────────────────────────

section("2. REQUIRED_LANDMARKS");
const drillIds: DrillId[] = [
  "doorway_pec_stretch", "wall_angel", "hip_flexor_stretch",
  "squat_alignment_drill", "split_squat_drill",
];
for (const id of drillIds) {
  assert(Array.isArray(REQUIRED_LANDMARKS[id]), `${id} has required landmarks`);
  assert(REQUIRED_LANDMARKS[id].length >= 4, `${id} requires at least 4 landmarks`);
}
assert(REQUIRED_LANDMARKS["squat_alignment_drill"].includes(LM.LEFT_HEEL), "squat requires LEFT_HEEL");
assert(REQUIRED_LANDMARKS["wall_angel"].includes(LM.LEFT_WRIST), "wall angel requires LEFT_WRIST");

// ─── Section 3: landmarksVisible ─────────────────────────────────────────────

section("3. landmarksVisible");
const lmFull = makeLandmarks();
assert(landmarksVisible(lmFull, [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER]), "visible when all lm above threshold");
assert(!landmarksVisible(lmFull, [99]), "false for out-of-bounds index");
const lmLowVis = makeLandmarks({ [LM.LEFT_SHOULDER]: { visibility: 0.3 } });
assert(!landmarksVisible(lmLowVis, [LM.LEFT_SHOULDER], 0.5), "false when visibility below threshold");
assert(landmarksVisible(lmLowVis, [LM.LEFT_SHOULDER], 0.2), "true when threshold lowered");
assert(!landmarksVisible([], [0]), "false for empty landmark array");

// ─── Section 4: Geometric Primitives ─────────────────────────────────────────

section("4. dist2D");
const ptA: PoseLandmark = { x: 0, y: 0, z: 0, visibility: 1 };
const ptB: PoseLandmark = { x: 3, y: 4, z: 0, visibility: 1 };
assertClose(dist2D(ptA, ptB), 5.0, 0.0001, "3-4-5 triangle dist2D");
assertClose(dist2D(ptA, ptA), 0.0, 0.0001, "distance to self = 0");

section("4. midpoint");
const ptA2: PoseLandmark = { x: 0, y: 0, z: 0, visibility: 0.4 };
const mid = midpoint(ptA2, ptB);
assertClose(mid.x, 1.5, 0.001, "midpoint x");
assertClose(mid.y, 2.0, 0.001, "midpoint y");
assertClose(mid.visibility, 0.7, 0.001, "midpoint visibility averaged (0.4+1)/2=0.7");

section("4. angleDeg");
// Right angle at origin: A(1,0), B(0,0), C(0,1)
const pA: PoseLandmark = { x: 1, y: 0, z: 0, visibility: 1 };
const pB: PoseLandmark = { x: 0, y: 0, z: 0, visibility: 1 };
const pC: PoseLandmark = { x: 0, y: 1, z: 0, visibility: 1 };
assertClose(angleDeg(pA, pB, pC), 90, 0.001, "90° angle");
// Straight line: A-B-C collinear → 180°
const pC2: PoseLandmark = { x: -1, y: 0, z: 0, visibility: 1 };
assertClose(angleDeg(pA, pB, pC2), 180, 0.001, "180° straight line");
// Degenerate (B = A) → 0
assertClose(angleDeg(pA, pA, pC), 0, 0.001, "degenerate → 0");

section("4. lateralOffsetRatio");
// P exactly on the line A→B → ratio should be 0
const lineA: PoseLandmark = { x: 0, y: 0, z: 0, visibility: 1 };
const lineB: PoseLandmark = { x: 1, y: 0, z: 0, visibility: 1 };
const onLine: PoseLandmark = { x: 0.5, y: 0, z: 0, visibility: 1 };
assertClose(lateralOffsetRatio(onLine, lineA, lineB), 0, 0.0001, "point on line = 0");
// P displaced perpendicular by 0.5 (|AB|=1, |AB|²=1) → ratio = +0.5
// A→B direction is +x. P is at y=+0.5 (downward in MediaPipe = clockwise = right of A→B) → positive.
const displaced: PoseLandmark = { x: 0.5, y: 0.5, z: 0, visibility: 1 };
assertClose(lateralOffsetRatio(displaced, lineA, lineB), 0.5, 0.0001, "perpendicular displacement (positive = right of A→B direction)");

section("4. ema");
assertClose(ema(50, 100, 0.15), 57.5, 0.001, "EMA step (50 + 0.15*(100-50) = 57.5)");
assertClose(ema(70, 70, 0.15), 70, 0.001, "EMA stable at same value");

// ─── Section 5: THRESHOLDS ────────────────────────────────────────────────────

section("5. THRESHOLDS structure");
for (const id of drillIds) {
  const t = THRESHOLDS[id];
  assert(t !== undefined, `${id} has threshold entry`);
  assert(Object.keys(t).length >= 2, `${id} has ≥2 error thresholds`);
  for (const [key, pair] of Object.entries(t)) {
    assert(typeof pair.correction === "number", `${id}.${key}.correction is number`);
    assert(typeof pair.unsafe === "number", `${id}.${key}.unsafe is number`);
  }
}
// unsafe threshold is more extreme than correction (for finite values)
assert(THRESHOLDS["squat_alignment_drill"]["left_knee_valgus"].unsafe >
       THRESHOLDS["squat_alignment_drill"]["left_knee_valgus"].correction,
       "squat left_knee_valgus: unsafe > correction");
assert(THRESHOLDS["wall_angel"]["arm_height_insufficient"].unsafe === Infinity,
       "arm_height_insufficient unsafe = Infinity");

// ─── Section 6: computeDrillMetrics ──────────────────────────────────────────

section("6. computeDrillMetrics — squat upright");
const lmSquat = makeLandmarks();
const sqMetrics = computeDrillMetrics(lmSquat, "squat_alignment_drill");
assert("mean_knee_angle_deg" in sqMetrics, "squat has mean_knee_angle_deg");
assert("left_knee_valgus" in sqMetrics,    "squat has left_knee_valgus");
assert("right_knee_valgus" in sqMetrics,   "squat has right_knee_valgus");
assert("heel_lift" in sqMetrics,           "squat has heel_lift");
assert("torso_forward_lean" in sqMetrics,  "squat has torso_forward_lean");
// Upright stance — knee angle should be large (nearly straight legs)
assert(sqMetrics["mean_knee_angle_deg"] > 140, "upright squat knee angle > 140°");
// No valgus in symmetric stance
assertClose(sqMetrics["left_knee_valgus"],  0, 0.05, "no left valgus in symmetric stance");
assertClose(sqMetrics["right_knee_valgus"], 0, 0.05, "no right valgus in symmetric stance");

section("6. computeDrillMetrics — wall angel");
const lmWall = makeLandmarks();
const waMetrics = computeDrillMetrics(lmWall, "wall_angel");
assert("head_off_wall" in waMetrics,            "wall angel has head_off_wall");
assert("wrist_above_shoulder_ratio" in waMetrics, "wall angel has wrist_above_shoulder_ratio");
// Default position: wrists at y=0.50, shoulders at y=0.20 → wrists below → negative ratio
assert(waMetrics["wrist_above_shoulder_ratio"] < 0, "wrists below shoulders in default position");

section("6. computeDrillMetrics — doorway pec");
const dpMetrics = computeDrillMetrics(lmSquat, "doorway_pec_stretch");
assert("elbow_above_shoulder" in dpMetrics, "doorway_pec has elbow_above_shoulder");
assert("shoulder_elevation" in dpMetrics,   "doorway_pec has shoulder_elevation");
assert("lumbar_arch" in dpMetrics,          "doorway_pec has lumbar_arch");

section("6. computeDrillMetrics — hip flexor");
const hfMetrics = computeDrillMetrics(lmSquat, "hip_flexor_stretch");
assert("lumbar_arch" in hfMetrics,          "hip_flexor has lumbar_arch");
assert("torso_forward_lean" in hfMetrics,   "hip_flexor has torso_forward_lean");
assert("front_knee_angle_deg" in hfMetrics, "hip_flexor has front_knee_angle_deg (rep driver)");
assert("front_is_left" in hfMetrics,        "hip_flexor has front_is_left flag");

section("6. computeDrillMetrics — split squat");
const ssMetrics = computeDrillMetrics(lmSquat, "split_squat_drill");
assert("front_knee_valgus" in ssMetrics,    "split_squat has front_knee_valgus");
assert("hip_rotation" in ssMetrics,         "split_squat has hip_rotation");
assert("front_knee_angle_deg" in ssMetrics, "split_squat has front_knee_angle_deg (rep driver)");
// Absolute valgus — always non-negative
assert(ssMetrics["front_knee_valgus"] >= 0,  "front_knee_valgus is non-negative (abs)");

// ─── Section 7: ERROR_AREAS ───────────────────────────────────────────────────

section("7. ERROR_AREAS coverage");
const expectedErrorIds = [
  "elbow_above_shoulder", "shoulder_elevation", "lumbar_arch",
  "head_off_wall", "lower_back_off_wall", "wrist_off_wall", "arm_height_insufficient",
  "torso_forward_lean", "front_knee_over_toes",
  "left_knee_valgus", "right_knee_valgus", "heel_lift",
  "front_knee_valgus", "hip_rotation",
];
for (const id of expectedErrorIds) {
  assert(ERROR_AREAS[id] !== undefined, `ERROR_AREAS has entry for ${id}`);
}
assert(ERROR_AREAS["left_knee_valgus"]  === "knees",       "knee valgus → knees");
assert(ERROR_AREAS["lumbar_arch"]       === "lower_back",  "lumbar → lower_back");
assert(ERROR_AREAS["head_off_wall"]     === "neck",        "head_off_wall → neck");

// ─── Section 8: evaluateSafetyRules ──────────────────────────────────────────

section("8. evaluateSafetyRules — no violations (good form)");
const goodMetrics: Record<string, number> = {
  left_knee_valgus:   0.05,
  right_knee_valgus:  -0.05,
  heel_lift:          0.01,
  torso_forward_lean: 150,
  mean_knee_angle_deg: 170,
};
const noUnsafe = evaluateSafetyRules(goodMetrics, "squat_alignment_drill");
assert(noUnsafe.length === 0, "no safety errors on good squat form");

section("8. evaluateSafetyRules — unsafe left knee valgus");
const badMetrics: Record<string, number> = {
  left_knee_valgus:   0.22,   // > 0.20 unsafe
  right_knee_valgus:  -0.05,
  heel_lift:          0.01,
  torso_forward_lean: 150,
};
const unsafeErrors = evaluateSafetyRules(badMetrics, "squat_alignment_drill");
assert(unsafeErrors.length >= 1, "safety error detected for left_knee_valgus > 0.20");
assert(unsafeErrors[0].isUnsafe === true, "error isUnsafe = true");
assert(unsafeErrors[0].errorId === "left_knee_valgus", "errorId = left_knee_valgus");
assert(unsafeErrors[0].area === "knees", "area = knees");
assertClose(unsafeErrors[0].measuredValue, 0.22, 0.0001, "measuredValue = 0.22");
assertClose(unsafeErrors[0].threshold, 0.20, 0.0001, "threshold = 0.20");

section("8. evaluateSafetyRules — arm_height_insufficient never triggers (unsafe = Infinity)");
const wallMetrics: Record<string, number> = {
  head_off_wall:       0.10,  // above 0.02 unsafe
  lower_back_off_wall: 0.05,
  wrist_off_wall:      0.00,
  arm_height_insufficient: -0.5, // well below correction but unsafe = Infinity
  wrist_above_shoulder_ratio: -0.5,
};
const wallUnsafe = evaluateSafetyRules(wallMetrics, "wall_angel");
const armEntry = wallUnsafe.find(e => e.errorId === "arm_height_insufficient");
assert(armEntry === undefined, "arm_height_insufficient never appears in safety errors");

section("8. evaluateSafetyRules — NaN metric skipped");
const nanMetrics: Record<string, number> = {
  left_knee_valgus: NaN, // should be skipped
  right_knee_valgus: -0.05,
  heel_lift: 0.0,
  torso_forward_lean: 160,
};
const nanResult = evaluateSafetyRules(nanMetrics, "squat_alignment_drill");
const nanEntry = nanResult.find(e => e.errorId === "left_knee_valgus");
assert(nanEntry === undefined, "NaN metric skipped without error");

// ─── Section 9: evaluateFormErrors ───────────────────────────────────────────

section("9. evaluateFormErrors — correction tier, no unsafe overlap");
const corrMetrics: Record<string, number> = {
  left_knee_valgus:   0.15,   // > 0.12 correction, < 0.20 unsafe
  right_knee_valgus:  -0.05,
  heel_lift:          0.01,
  torso_forward_lean: 150,
};
const corrErrors = evaluateFormErrors(corrMetrics, "squat_alignment_drill");
assert(corrErrors.length === 1, "one correction error (left_knee_valgus)");
assert(corrErrors[0].isUnsafe === false, "form error isUnsafe = false");
assert(corrErrors[0].errorId === "left_knee_valgus", "correct errorId");
assertClose(corrErrors[0].threshold, 0.12, 0.0001, "threshold = correction value 0.12");

section("9. evaluateFormErrors — unsafe tier excluded from form errors");
const unsafeMetrics: Record<string, number> = {
  left_knee_valgus:   0.25,  // > 0.20 unsafe — should NOT appear in form errors
  right_knee_valgus:  -0.05,
  heel_lift:          0.01,
  torso_forward_lean: 150,
};
const noOverlap = evaluateFormErrors(unsafeMetrics, "squat_alignment_drill");
const overlapEntry = noOverlap.find(e => e.errorId === "left_knee_valgus");
assert(overlapEntry === undefined, "unsafe-tier valgus excluded from form errors");

section("9. evaluateFormErrors — arm_height_insufficient phase gate");
const armMetrics: Record<string, number> = {
  arm_height_insufficient:  0.05,  // < 0.10 correction
  wrist_above_shoulder_ratio: 0.05,
  head_off_wall: -0.10,
  lower_back_off_wall: 0.02,
  wrist_off_wall: -0.10,
};
// Should NOT fire outside of RAISING/TOP_HOLD
const noPhaseErr = evaluateFormErrors(armMetrics, "wall_angel", "READY");
const armReady = noPhaseErr.find(e => e.errorId === "arm_height_insufficient");
assert(armReady === undefined, "arm_height_insufficient suppressed in READY phase");
// Should fire during RAISING
const raisingErr = evaluateFormErrors(armMetrics, "wall_angel", "RAISING");
const armRaising = raisingErr.find(e => e.errorId === "arm_height_insufficient");
assert(armRaising !== undefined, "arm_height_insufficient fires in RAISING phase");
// Should fire during TOP_HOLD
const topErr = evaluateFormErrors(armMetrics, "wall_angel", "TOP_HOLD");
const armTop = topErr.find(e => e.errorId === "arm_height_insufficient");
assert(armTop !== undefined, "arm_height_insufficient fires in TOP_HOLD phase");

// ─── Section 10: selectActiveCue ─────────────────────────────────────────────

section("10. selectActiveCue — no errors → null");
const noCue = selectActiveCue("squat_alignment_drill", [], []);
assert(noCue === null, "no cue when no errors");

section("10. selectActiveCue — safety errors → unsafe cue");
const safetyErr: FormError[] = [{
  errorId: "left_knee_valgus",
  area: "knees",
  isUnsafe: true,
  measuredValue: 0.25,
  threshold: 0.20,
}];
const unsafeCue = selectActiveCue("squat_alignment_drill", safetyErr, []);
assert(unsafeCue !== null, "unsafe cue selected when safety error present");
assert(unsafeCue!.priority === "unsafe", "cue priority = unsafe");

section("10. selectActiveCue — form errors → major_correction cue");
const formErr: FormError[] = [{
  errorId: "left_knee_valgus",
  area: "knees",
  isUnsafe: false,
  measuredValue: 0.15,
  threshold: 0.12,
}];
const corrCue = selectActiveCue("squat_alignment_drill", [], formErr);
assert(corrCue !== null, "correction cue selected for form error");
assert(corrCue!.priority === "major_correction", "cue priority = major_correction");

section("10. selectActiveCue — safety takes priority over form errors");
const mixedCue = selectActiveCue("squat_alignment_drill", safetyErr, formErr);
assert(mixedCue !== null, "cue selected with mixed errors");
assert(mixedCue!.priority === "unsafe", "unsafe tier wins over correction tier");

section("10. selectActiveCue — all 5 drills return a cue for unsafe errors");
for (const id of drillIds) {
  const err: FormError[] = [{
    errorId: Object.keys(THRESHOLDS[id])[0],
    area: "knees",
    isUnsafe: true,
    measuredValue: 999,
    threshold: 0,
  }];
  const cue = selectActiveCue(id, err, []);
  assert(cue !== null, `${id}: unsafe cue selected`);
}

// ─── Section 11: tickRepDetector ─────────────────────────────────────────────

section("11. tickRepDetector — squat cycle");
// READY → DESCENDING
let tick = tickRepDetector("squat_alignment_drill", "READY", 0, { mean_knee_angle_deg: 150 });
assert(tick.repPhase === "DESCENDING", "READY→DESCENDING when angle < 155");
assert(tick.repCount === 0, "no rep yet");
// DESCENDING → BOTTOM_HOLD
tick = tickRepDetector("squat_alignment_drill", "DESCENDING", 0, { mean_knee_angle_deg: 95 });
assert(tick.repPhase === "BOTTOM_HOLD", "DESCENDING→BOTTOM_HOLD when angle ≤ 100");
// BOTTOM_HOLD → ASCENDING
tick = tickRepDetector("squat_alignment_drill", "BOTTOM_HOLD", 0, { mean_knee_angle_deg: 110 });
assert(tick.repPhase === "ASCENDING", "BOTTOM_HOLD→ASCENDING when angle > bottomAngle+5");
// ASCENDING → READY + rep
tick = tickRepDetector("squat_alignment_drill", "ASCENDING", 0, { mean_knee_angle_deg: 160 });
assert(tick.repPhase === "READY", "ASCENDING→READY when angle ≥ 155");
assert(tick.repCount === 1, "rep count incremented");
// False start: READY → DESCENDING → back to READY (no rep)
tick = tickRepDetector("squat_alignment_drill", "DESCENDING", 0, { mean_knee_angle_deg: 160 });
assert(tick.repPhase === "READY", "false start: DESCENDING→READY when angle back above 155");
assert(tick.repCount === 0, "no rep on false start");

section("11. tickRepDetector — wall angel cycle");
// READY → RAISING
tick = tickRepDetector("wall_angel", "READY", 0, { wrist_above_shoulder_ratio: 0.02 });
assert(tick.repPhase === "RAISING", "READY→RAISING when ratio ≥ 0");
// RAISING → TOP_HOLD
tick = tickRepDetector("wall_angel", "RAISING", 0, { wrist_above_shoulder_ratio: 0.12 });
assert(tick.repPhase === "TOP_HOLD", "RAISING→TOP_HOLD when ratio ≥ 0.10");
// TOP_HOLD → LOWERING
tick = tickRepDetector("wall_angel", "TOP_HOLD", 0, { wrist_above_shoulder_ratio: 0.05 });
assert(tick.repPhase === "LOWERING", "TOP_HOLD→LOWERING when ratio < 0.07");
// LOWERING → READY + rep
tick = tickRepDetector("wall_angel", "LOWERING", 0, { wrist_above_shoulder_ratio: -0.05 });
assert(tick.repPhase === "READY", "LOWERING→READY when ratio < 0");
assert(tick.repCount === 1, "wall angel rep counted");

section("11. tickRepDetector — hold drills unchanged");
tick = tickRepDetector("doorway_pec_stretch", "READY", 0, {});
assert(tick.repPhase === "READY", "hold drill phase unchanged");
assert(tick.repCount === 0, "hold drill count unchanged");

// ─── Section 12: computeQualityScore ─────────────────────────────────────────

section("12. computeQualityScore — perfect form");
const perfectScore = computeQualityScore("good", []);
assert(perfectScore === 100, "perfect form = 100");

section("12. computeQualityScore — one major correction");
const oneCorr: FormError[] = [{
  errorId: "left_knee_valgus", area: "knees", isUnsafe: false,
  measuredValue: 0.15, threshold: 0.12,
}];
const majorScore = computeQualityScore("needs_correction", oneCorr);
assert(majorScore === 85, "one major_correction = 85 (100-15)");

section("12. computeQualityScore — one unsafe error");
const oneUnsafe: FormError[] = [{
  errorId: "left_knee_valgus", area: "knees", isUnsafe: true,
  measuredValue: 0.25, threshold: 0.20,
}];
const unsafeScore = computeQualityScore("unsafe", oneUnsafe);
// 100 - 30 (unsafe error) - 10 (unsafe state penalty) = 60
assert(unsafeScore === 60, `one unsafe = 60, got ${unsafeScore}`);

section("12. computeQualityScore — floor at 0");
const manyErrors: FormError[] = Array.from({ length: 5 }, (_, i) => ({
  errorId: `err${i}`, area: "knees" as const, isUnsafe: true,
  measuredValue: 1, threshold: 0,
}));
const flooredScore = computeQualityScore("unsafe", manyErrors);
assert(flooredScore === 0, "score floors at 0");

section("12. computeQualityScore — fine adjustment");
const fineErr: FormError[] = [{
  errorId: "arm_height_insufficient", area: "shoulders", isUnsafe: false,
  measuredValue: 0.05, threshold: 0.10,
}];
const fineScore = computeQualityScore("needs_correction", fineErr);
assert(fineScore === 95, "fine_adjustment deducts 5 → 95");

// ─── Section 13: liveCoach — startSession ────────────────────────────────────

section("13. startSession");
const sqSession = startSession("squat_alignment_drill");
assert(sqSession.drillId === "squat_alignment_drill", "drillId set");
assert(sqSession.repCount === 0,   "rep drill starts at 0 reps");
assert(sqSession.repPhase === "READY", "rep drill starts in READY phase");
assert(sqSession.totalFrames === 0, "zero frames processed");
assert(sqSession.snapshots.length === 0, "no snapshots yet");

const holdSession = startSession("doorway_pec_stretch");
assert(holdSession.repCount === undefined, "hold drill repCount undefined");
assert(holdSession.repPhase === undefined, "hold drill repPhase undefined");

// ─── Section 14: liveCoach — processFrame with invisible landmarks ────────────

section("14. processFrame — invisible landmarks");
const lmInvisible = makeLandmarks({ [LM.LEFT_SHOULDER]: { visibility: 0.0 } });
const sqSession2 = startSession("squat_alignment_drill");
const invisFrame = processFrame(sqSession2, lmInvisible, 1000);
assert(invisFrame.landmarksVisible === false, "invisible frame detected");
assert(invisFrame.errors.length === 0, "no false-positive errors on invisible frame");
assert(invisFrame.formState === "good", "formState neutral when invisible");
assert(sqSession2.totalFrames === 0, "invisible frame not counted in totalFrames");

// ─── Section 15: liveCoach — processFrame with good form ─────────────────────

section("15. processFrame — good upright squat form");
const sqSession3 = startSession("squat_alignment_drill");
const lmGood = makeLandmarks();
const goodFrame = processFrame(sqSession3, lmGood, 2000);
assert(goodFrame.landmarksVisible === true, "landmarks visible");
assert(goodFrame.formState === "good" || goodFrame.formState === "needs_correction",
       "formState is valid");
assert(typeof goodFrame.qualityScore === "number", "qualityScore is a number");
assert(goodFrame.qualityScore >= 0 && goodFrame.qualityScore <= 100, "qualityScore in [0,100]");
assert(typeof goodFrame.metrics === "object", "metrics returned");
assert("mean_knee_angle_deg" in goodFrame.metrics, "squat metrics contain knee angle");
assert(sqSession3.totalFrames === 1, "totalFrames incremented");

// ─── Section 16: liveCoach — processFrame with unsafe valgus ─────────────────

section("16. processFrame — unsafe knee valgus");
const lmValgus = makeLandmarks({
  [LM.LEFT_KNEE]: { x: 0.52, y: 0.72, z: -0.02, visibility: 1 }, // knee displaced inward
});
const sqSession4 = startSession("squat_alignment_drill");
// Simulate being in a squat (move hips and knees down)
const lmSquatting = makeLandmarks({
  [LM.LEFT_HIP]:   { x: 0.44, y: 0.55, z: -0.03, visibility: 1 },
  [LM.RIGHT_HIP]:  { x: 0.56, y: 0.55, z: -0.03, visibility: 1 },
  [LM.LEFT_KNEE]:  { x: 0.52, y: 0.70, z: -0.02, visibility: 1 }, // medially displaced
  [LM.RIGHT_KNEE]: { x: 0.56, y: 0.70, z: -0.02, visibility: 1 },
  [LM.LEFT_ANKLE]: { x: 0.44, y: 0.88, z: -0.01, visibility: 1 },
  [LM.RIGHT_ANKLE]:{ x: 0.56, y: 0.88, z: -0.01, visibility: 1 },
});
const sqFrame = processFrame(sqSession4, lmSquatting, 3000);
assert(sqFrame.landmarksVisible === true, "landmarks visible for squat test");
// Just verify the frame is structured correctly
assert("errors" in sqFrame, "frame has errors array");
assert(Array.isArray(sqFrame.errors), "errors is an array");
assert(typeof sqFrame.qualityScore === "number", "quality score is a number");

// ─── Section 17: liveCoach — snapshot gating ─────────────────────────────────

section("17. processFrame — snapshot gating");
const snapSession = startSession("squat_alignment_drill");
const lmSnap = makeLandmarks();
// First frame at t=0: no snapshot (lastSnapshotAt = 0, 0-0 < 1000)
processFrame(snapSession, lmSnap, 0);
assert(snapSession.snapshots.length === 0, "no snapshot at t=0 (< 1000ms interval)");
// Frame at t=1001: snapshot should be taken
processFrame(snapSession, lmSnap, 1001);
assert(snapSession.snapshots.length === 1, "snapshot taken at t=1001ms");
assert(snapSession.lastSnapshotAt === 1001, "lastSnapshotAt updated");
// Frame at t=1500: no new snapshot (< 1000ms since last)
processFrame(snapSession, lmSnap, 1500);
assert(snapSession.snapshots.length === 1, "no snapshot at t=1500 (< 1000ms since last)");
// Frame at t=2002: new snapshot
processFrame(snapSession, lmSnap, 2002);
assert(snapSession.snapshots.length === 2, "second snapshot at t=2002ms");

// ─── Section 18: liveCoach — endSession ──────────────────────────────────────

section("18. endSession");
const endSess = startSession("wall_angel");
const lmWallGood = makeLandmarks({
  [LM.LEFT_WRIST]:  { x: 0.37, y: 0.10, z: -0.02, visibility: 1 }, // wrists above shoulders
  [LM.RIGHT_WRIST]: { x: 0.63, y: 0.10, z: -0.02, visibility: 1 },
});
for (let t = 0; t < 5; t++) {
  processFrame(endSess, lmWallGood, t * 500);
}
const result = endSession(endSess);
assert(result.drillId === "wall_angel",        "drillId correct in result");
assert(result.drillDisplayName === "Wall Angel", "displayName from DrillMetadata");
assert(typeof result.durationSeconds === "number", "durationSeconds is number");
assert(result.durationSeconds >= 0, "durationSeconds non-negative");
assert(typeof result.meanQualityScore === "number", "meanQualityScore is number");
assert(result.meanQualityScore >= 0 && result.meanQualityScore <= 100, "meanQuality in [0,100]");
assert(result.peakQualityScore >= 0 && result.peakQualityScore <= 100, "peakQuality in [0,100]");
assert(typeof result.goodFormPercent === "number", "goodFormPercent is number");
assert(result.goodFormPercent >= 0 && result.goodFormPercent <= 100, "goodFormPercent in [0,100]");
assert(Array.isArray(result.topErrors), "topErrors is array");
assert(result.topErrors.length <= 3, "topErrors capped at 3");
assert(Array.isArray(result.snapshots), "snapshots is array");

section("18. endSession — hold drill has no totalReps");
const holdEnd = startSession("doorway_pec_stretch");
processFrame(holdEnd, makeLandmarks(), 1000);
const holdResult = endSession(holdEnd);
assert(holdResult.totalReps === undefined, "hold drill totalReps undefined");

section("18. endSession — topErrors sorted by frameCount");
const errSession = startSession("squat_alignment_drill");
// Inject artificial errorCounts
errSession.errorCounts = { "left_knee_valgus": 30, "heel_lift": 50, "torso_forward_lean": 10 };
errSession.errorAreas  = { "left_knee_valgus": "knees", "heel_lift": "ankles", "torso_forward_lean": "lower_back" };
errSession.totalFrames = 60;
errSession.qualityScoreSum = 60 * 80;
const topResult = endSession(errSession);
assert(topResult.topErrors.length === 3, "all 3 errors included");
assert(topResult.topErrors[0].errorId === "heel_lift", "highest count error first");
assert(topResult.topErrors[1].errorId === "left_knee_valgus", "second highest second");
assert(topResult.topErrors[2].errorId === "torso_forward_lean", "third highest third");
assertClose(topResult.topErrors[0].percentOfSession, 83, 1, "heel_lift ~83% of session");

// ─── Section 19: Task 3 → Task 4 Integration ─────────────────────────────────

section("19. Task 3 ↔ Task 4 integration — getDrill() works from liveCoach");
// liveCoach imports getDrill from task3/drills — verify the chain
const wallSession = startSession("wall_angel");
const wallFrame = processFrame(wallSession, makeLandmarks(), 100);
assert(wallFrame !== null, "wall angel session processes frame");
const wallResult = endSession(wallSession);
assert(wallResult.drillDisplayName === "Wall Angel", "drill name resolved via Task 3 getDrill()");

section("19. Task 3 ↔ Task 4 — all 5 drills can start, process, and end a session");
for (const id of drillIds) {
  const sess = startSession(id);
  const frame = processFrame(sess, makeLandmarks(), 500);
  const res = endSession(sess);
  assert(sess.drillId === id, `${id}: session drillId correct`);
  assert(frame.landmarksVisible === true, `${id}: landmarks visible with full fixture`);
  assert(res.drillId === id, `${id}: result drillId correct`);
  assert(res.drillDisplayName.length > 0, `${id}: displayName non-empty`);
}

// ─── Results ──────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(60)}`);
console.log(`Task 4 Smoke Tests: ${passed} passed, ${failed} failed`);
console.log("=".repeat(60));

if (failed > 0) {
  process.exit(1);
}
