// ============================================================================
// StrainSense — Task 4: Safety Rules
//
// Evaluates pre-computed drill metrics against the *unsafe* tier of each
// threshold. Returns a FormError[] where every entry has isUnsafe = true.
//
// Called by liveCoach.processFrame() AFTER computeDrillMetrics() and BEFORE
// evaluateFormErrors(). Safety errors are surfaced before form corrections so
// cueEngine.selectActiveCue() always picks an "unsafe" cue first.
//
// Direction conventions (same as drillThresholds.ts):
//   Most ratio/z metrics:  error fires when value > threshold.unsafe
//   Angle metrics:         error fires when value < threshold.unsafe (smaller = worse)
//   Negative-direction:    right_knee_valgus fires when value < threshold.unsafe (more neg)
//   arm_height_insufficient: safety tier is Infinity — never fires here
// ============================================================================

import type { DrillId, FormError, BodyArea } from "../types";
import { THRESHOLDS } from "./drillThresholds";

// ─── ErrorId → BodyArea Map ──────────────────────────────────────────────────
// Centralised so both safetyRules and cueEngine use identical area assignments.

export const ERROR_AREAS: Record<string, BodyArea> = {
  // Doorway Pec Stretch
  elbow_above_shoulder:   "shoulders",
  shoulder_elevation:     "shoulders",
  lumbar_arch:            "lower_back",

  // Wall Angel
  head_off_wall:          "neck",
  lower_back_off_wall:    "lower_back",
  wrist_off_wall:         "shoulders",
  arm_height_insufficient: "shoulders",

  // Hip Flexor Stretch
  torso_forward_lean:     "lower_back",
  front_knee_over_toes:   "knees",

  // Squat Alignment Drill
  left_knee_valgus:       "knees",
  right_knee_valgus:      "knees",
  heel_lift:              "ankles",

  // Split Squat Drill
  front_knee_valgus:      "knees",
  hip_rotation:           "hips",
};

// ─── Direction of Each ErrorId ───────────────────────────────────────────────
// "gt"  → error fires when metric > threshold (normal ratio/z metrics)
// "lt"  → error fires when metric < threshold (angle metrics, negative-direction)

type ThresholdDirection = "gt" | "lt";

const THRESHOLD_DIRECTION: Record<string, ThresholdDirection> = {
  // Doorway Pec Stretch
  elbow_above_shoulder:   "gt",
  shoulder_elevation:     "gt",
  lumbar_arch:            "gt",

  // Wall Angel
  head_off_wall:          "gt",
  lower_back_off_wall:    "gt",
  wrist_off_wall:         "gt",
  arm_height_insufficient: "lt", // fires when wrist ratio < threshold — but unsafe = Infinity so never in safety

  // Hip Flexor Stretch
  torso_forward_lean:     "lt",  // smaller angle = worse
  front_knee_over_toes:   "gt",

  // Squat Alignment Drill
  left_knee_valgus:       "gt",
  right_knee_valgus:      "lt", // negative direction: error when < -0.20
  heel_lift:              "gt",

  // Split Squat Drill
  front_knee_valgus:      "gt",
  hip_rotation:           "gt",
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Evaluates all unsafe-tier thresholds for the given drill against
 * the pre-computed metrics map.
 *
 * @param metrics  Output of computeDrillMetrics() — must not be recomputed here.
 * @param drillId  The active drill.
 * @returns        Array of FormError with isUnsafe = true. Empty when safe.
 */
export function evaluateSafetyRules(
  metrics: Record<string, number>,
  drillId: DrillId
): FormError[] {
  const drillThresholds = THRESHOLDS[drillId];
  const errors: FormError[] = [];

  for (const [errorId, pair] of Object.entries(drillThresholds)) {
    // Skip if unsafe threshold is Infinity (arm_height_insufficient)
    if (!isFinite(pair.unsafe)) continue;

    const value = metrics[errorId];

    // Skip NaN (landmark missing — upstream visibility gate should prevent this)
    if (value === undefined || isNaN(value)) continue;

    const direction = THRESHOLD_DIRECTION[errorId] ?? "gt";
    const violated =
      direction === "gt"
        ? value > pair.unsafe
        : value < pair.unsafe;

    if (violated) {
      errors.push({
        errorId,
        area: ERROR_AREAS[errorId] ?? "core",
        isUnsafe: true,
        measuredValue: value,
        threshold: pair.unsafe,
      });
    }
  }

  return errors;
}
