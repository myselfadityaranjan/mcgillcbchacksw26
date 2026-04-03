// ============================================================================
// StrainSense — Task 4: Cue Engine
//
// Three responsibilities:
//   1. evaluateFormErrors()  — correction-tier threshold checks → FormError[]
//   2. selectActiveCue()     — pick ONE CoachingCue from DrillMetadata per frame
//   3. tickRepDetector()     — advance the rep state machine
//
// Imported by liveCoach.processFrame() only.
//
// Design constraints:
//   - No I/O, no mutation of session state (that lives in liveCoach.ts).
//   - Every function is a pure transformation of its arguments.
//   - Rep detection is angle/ratio-based — no calibration frame required.
// ============================================================================

import type {
  CoachingCue,
  CuePriority,
  DrillId,
  FormError,
  RepPhase,
} from "../types";
import { getDrill } from "../task3/drills";
import { THRESHOLDS } from "./drillThresholds";
import { ERROR_AREAS } from "./safetyRules";

// ─── Cue Priority for Each ErrorId ──────────────────────────────────────────
// Determines which tier of cue to surface when a correction-tier error fires.

export const ERROR_CUE_PRIORITY: Record<string, CuePriority> = {
  // Doorway Pec Stretch
  elbow_above_shoulder:   "major_correction",
  shoulder_elevation:     "major_correction",
  lumbar_arch:            "major_correction",

  // Wall Angel
  head_off_wall:          "major_correction",
  lower_back_off_wall:    "major_correction",
  wrist_off_wall:         "major_correction",
  arm_height_insufficient: "fine_adjustment", // fires only during RAISING/TOP_HOLD

  // Hip Flexor Stretch
  torso_forward_lean:     "major_correction",
  front_knee_over_toes:   "major_correction",

  // Squat Alignment Drill
  left_knee_valgus:       "major_correction",
  right_knee_valgus:      "major_correction",
  heel_lift:              "major_correction",

  // Split Squat Drill
  front_knee_valgus:      "major_correction",
  hip_rotation:           "major_correction",
};

// ─── Threshold Direction — matches safetyRules.ts convention ────────────────

type Direction = "gt" | "lt";

const THRESHOLD_DIRECTION: Record<string, Direction> = {
  elbow_above_shoulder:   "gt",
  shoulder_elevation:     "gt",
  lumbar_arch:            "gt",
  head_off_wall:          "gt",
  lower_back_off_wall:    "gt",
  wrist_off_wall:         "gt",
  arm_height_insufficient: "lt", // fires when ratio < correction (< 0.10)
  torso_forward_lean:     "lt",
  front_knee_over_toes:   "gt",
  left_knee_valgus:       "gt",
  right_knee_valgus:      "lt",
  heel_lift:              "gt",
  front_knee_valgus:      "gt",
  hip_rotation:           "gt",
};

// ─── Rep State Machine Constants ─────────────────────────────────────────────

/** Knee angle (degrees) above which the user is considered at the "top" (upright). */
const SQUAT_TOP_ANGLE    = 155;
/** Knee angle (degrees) below which the user is at the "bottom" of the squat. */
const SQUAT_BOTTOM_ANGLE = 100;
/** Same bottom threshold for split-squat (slightly higher — limited range is normal). */
const SPLIT_BOTTOM_ANGLE = 110;

/**
 * Wrist-above-shoulder ratio above which the user is at the "top" of a wall angel.
 * This matches the arm_height_insufficient correction threshold.
 */
const WALL_TOP_RATIO    = 0.10;
/** Ratio below which the user is considered at the "bottom" (arms lowered). */
const WALL_BOTTOM_RATIO = 0.0;

// ─── Public Types ─────────────────────────────────────────────────────────────

/** Return value of tickRepDetector — new phase + count. */
export interface RepTickResult {
  repPhase: RepPhase;
  repCount: number;
}

// ─── 1. evaluateFormErrors ────────────────────────────────────────────────────

/**
 * Checks the correction-tier thresholds for the given drill.
 * Does NOT re-evaluate unsafe-tier thresholds (those are already in safetyErrors
 * from evaluateSafetyRules). Only returns errors where the correction threshold
 * was exceeded but the unsafe threshold was NOT (i.e. FormError.isUnsafe = false).
 *
 * Special case: arm_height_insufficient (wall angel) only fires during
 * RAISING or TOP_HOLD phases — prevents false positives when arms are at rest.
 *
 * @param metrics   Pre-computed metrics map from computeDrillMetrics().
 * @param drillId   Active drill.
 * @param repPhase  Current rep phase (required for arm_height_insufficient gate).
 * @returns         FormError[] with isUnsafe = false.
 */
export function evaluateFormErrors(
  metrics: Record<string, number>,
  drillId: DrillId,
  repPhase?: RepPhase
): FormError[] {
  const drillThresholds = THRESHOLDS[drillId];
  const errors: FormError[] = [];

  for (const [errorId, pair] of Object.entries(drillThresholds)) {
    // Phase gate: arm_height_insufficient only fires during raising/top phases
    if (errorId === "arm_height_insufficient") {
      if (repPhase !== "RAISING" && repPhase !== "TOP_HOLD") continue;
    }

    const value = metrics[errorId];
    if (value === undefined || isNaN(value)) continue;

    const direction = THRESHOLD_DIRECTION[errorId] ?? "gt";

    // Correction-tier check
    const correctionViolated =
      direction === "gt"
        ? value > pair.correction
        : value < pair.correction;

    if (!correctionViolated) continue;

    // Exclude if the unsafe tier was ALSO crossed (safetyRules already emits those)
    const unsafeViolated = isFinite(pair.unsafe)
      ? direction === "gt"
        ? value > pair.unsafe
        : value < pair.unsafe
      : false;

    if (unsafeViolated) continue;

    errors.push({
      errorId,
      area: ERROR_AREAS[errorId] ?? "core",
      isUnsafe: false,
      measuredValue: value,
      threshold: pair.correction,
    });
  }

  return errors;
}

// ─── 2. selectActiveCue ───────────────────────────────────────────────────────

/**
 * Picks exactly ONE cue to display this frame, or null when form is good.
 *
 * Priority order:
 *   1. Any unsafe errors → pick the best "unsafe" cue from drill.coachingCues
 *   2. Any correction errors mapping to "major_correction" → pick best correction cue
 *   3. Any correction errors mapping to "fine_adjustment" → pick best fine cue
 *   4. No errors → null
 *
 * Within each tier, area-matching is preferred: the cue whose targetArea appears
 * in the active error set is chosen first. If no area match, the first cue of
 * that tier is used as a fallback.
 */
export function selectActiveCue(
  drillId: DrillId,
  safetyErrors: FormError[],
  formErrors: FormError[]
): CoachingCue | null {
  const drill = getDrill(drillId);
  const cues = drill.coachingCues;

  // ── Tier 1: unsafe ────────────────────────────────────────────────────────
  if (safetyErrors.length > 0) {
    const cue = findBestCue(cues, "unsafe", safetyErrors);
    if (cue) return cue;
  }

  // ── Tier 2: major_correction ─────────────────────────────────────────────
  const majorErrors = formErrors.filter(
    (e) => (ERROR_CUE_PRIORITY[e.errorId] ?? "major_correction") === "major_correction"
  );
  if (majorErrors.length > 0) {
    const cue = findBestCue(cues, "major_correction", majorErrors);
    if (cue) return cue;
  }

  // ── Tier 3: fine_adjustment ───────────────────────────────────────────────
  const fineErrors = formErrors.filter(
    (e) => ERROR_CUE_PRIORITY[e.errorId] === "fine_adjustment"
  );
  if (fineErrors.length > 0) {
    const cue = findBestCue(cues, "fine_adjustment", fineErrors);
    if (cue) return cue;
  }

  return null;
}

/**
 * Finds the best cue of the given priority tier, preferring area-matched cues.
 */
function findBestCue(
  cues: readonly CoachingCue[],
  priority: CuePriority,
  errors: FormError[]
): CoachingCue | null {
  const tieredCues = cues.filter((c) => c.priority === priority);
  if (tieredCues.length === 0) return null;

  const affectedAreas = new Set(errors.map((e) => e.area));

  // Prefer cue whose targetArea matches an active error area
  const areaMatch = tieredCues.find((c) => affectedAreas.has(c.targetArea));
  return areaMatch ?? tieredCues[0];
}

// ─── 3. tickRepDetector ───────────────────────────────────────────────────────

/**
 * Advances the rep-detection state machine by one frame.
 * Returns the new phase and rep count (unchanged if no transition occurred).
 *
 * Supported rep-based drills:
 *   - squat_alignment_drill → DESCENDING/BOTTOM_HOLD/ASCENDING cycle
 *   - split_squat_drill     → same cycle, different bottom angle
 *   - wall_angel            → RAISING/TOP_HOLD/LOWERING cycle
 *
 * Hold drills (doorway_pec_stretch, hip_flexor_stretch) return the inputs
 * unchanged — liveCoach does not call this function for hold drills.
 *
 * @param drillId   Active drill.
 * @param prevPhase Previous rep phase.
 * @param prevCount Previous rep count.
 * @param metrics   Pre-computed metrics from computeDrillMetrics().
 */
export function tickRepDetector(
  drillId: DrillId,
  prevPhase: RepPhase,
  prevCount: number,
  metrics: Record<string, number>
): RepTickResult {
  switch (drillId) {
    case "squat_alignment_drill":
      return tickSquatPhase(prevPhase, prevCount, metrics["mean_knee_angle_deg"], SQUAT_BOTTOM_ANGLE);
    case "split_squat_drill":
      return tickSquatPhase(prevPhase, prevCount, metrics["front_knee_angle_deg"], SPLIT_BOTTOM_ANGLE);
    case "wall_angel":
      return tickWallAngelPhase(prevPhase, prevCount, metrics["wrist_above_shoulder_ratio"]);
    default:
      // Hold drills — no rep detection
      return { repPhase: prevPhase, repCount: prevCount };
  }
}

/**
 * State machine for knee-angle-based rep drills (squat, split squat).
 *
 *   READY       → DESCENDING   when kneeAngle < SQUAT_TOP_ANGLE
 *   DESCENDING  → BOTTOM_HOLD  when kneeAngle <= bottomAngle
 *   DESCENDING  → READY        if angle climbs back to top (false start, no rep)
 *   BOTTOM_HOLD → ASCENDING    when kneeAngle > bottomAngle + 5°
 *   ASCENDING   → READY+rep    when kneeAngle >= SQUAT_TOP_ANGLE
 *   ASCENDING   → BOTTOM_HOLD  if angle dips back below bottom
 */
function tickSquatPhase(
  phase: RepPhase,
  count: number,
  kneeAngle: number,
  bottomAngle: number
): RepTickResult {
  // Guard: missing / degenerate measurement
  if (kneeAngle === undefined || isNaN(kneeAngle)) {
    return { repPhase: phase, repCount: count };
  }

  switch (phase) {
    case "READY":
      if (kneeAngle < SQUAT_TOP_ANGLE) return { repPhase: "DESCENDING", repCount: count };
      return { repPhase: "READY", repCount: count };

    case "DESCENDING":
      if (kneeAngle <= bottomAngle)      return { repPhase: "BOTTOM_HOLD", repCount: count };
      if (kneeAngle >= SQUAT_TOP_ANGLE)  return { repPhase: "READY",       repCount: count }; // false start
      return { repPhase: "DESCENDING", repCount: count };

    case "BOTTOM_HOLD":
      if (kneeAngle > bottomAngle + 5)   return { repPhase: "ASCENDING",   repCount: count };
      return { repPhase: "BOTTOM_HOLD", repCount: count };

    case "ASCENDING":
      if (kneeAngle >= SQUAT_TOP_ANGLE)  return { repPhase: "READY",       repCount: count + 1 };
      if (kneeAngle <= bottomAngle)      return { repPhase: "BOTTOM_HOLD", repCount: count }; // went back down
      return { repPhase: "ASCENDING", repCount: count };

    default:
      // Fallback — reset to READY for any wall-angel phase that leaked in
      return { repPhase: "READY", repCount: count };
  }
}

/**
 * State machine for wall angel (wrist-height-ratio based).
 *
 *   READY     → RAISING    when ratio >= WALL_BOTTOM_RATIO (arms start moving up)
 *   RAISING   → TOP_HOLD   when ratio >= WALL_TOP_RATIO (arms fully raised)
 *   RAISING   → READY      if ratio drops below 0 (gave up without reaching top)
 *   TOP_HOLD  → LOWERING   when ratio < WALL_TOP_RATIO - 0.03 (arms start coming down)
 *   LOWERING  → READY+rep  when ratio < WALL_BOTTOM_RATIO (arms fully lowered)
 *   LOWERING  → TOP_HOLD   if ratio climbs back above TOP_RATIO (changed direction)
 */
function tickWallAngelPhase(
  phase: RepPhase,
  count: number,
  wristRatio: number
): RepTickResult {
  if (wristRatio === undefined || isNaN(wristRatio)) {
    return { repPhase: phase, repCount: count };
  }

  switch (phase) {
    case "READY":
      if (wristRatio >= WALL_BOTTOM_RATIO)       return { repPhase: "RAISING",   repCount: count };
      return { repPhase: "READY", repCount: count };

    case "RAISING":
      if (wristRatio >= WALL_TOP_RATIO)          return { repPhase: "TOP_HOLD",  repCount: count };
      if (wristRatio < WALL_BOTTOM_RATIO - 0.02) return { repPhase: "READY",     repCount: count }; // gave up
      return { repPhase: "RAISING", repCount: count };

    case "TOP_HOLD":
      if (wristRatio < WALL_TOP_RATIO - 0.03)   return { repPhase: "LOWERING",  repCount: count };
      return { repPhase: "TOP_HOLD", repCount: count };

    case "LOWERING":
      if (wristRatio < WALL_BOTTOM_RATIO)        return { repPhase: "READY",     repCount: count + 1 };
      if (wristRatio >= WALL_TOP_RATIO)          return { repPhase: "TOP_HOLD",  repCount: count }; // went back up
      return { repPhase: "LOWERING", repCount: count };

    default:
      // Fallback — reset to READY for any squat phase that leaked in
      return { repPhase: "READY", repCount: count };
  }
}
