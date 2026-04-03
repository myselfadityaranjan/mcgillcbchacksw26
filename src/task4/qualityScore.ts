// ============================================================================
// StrainSense — Task 4: Quality Score
//
// Pure function — computes a per-frame quality score [0, 100] from the
// current form state and active errors.
//
// Scoring model:
//   Base score: 100
//   Deductions:
//     - Each unsafe error:      -30 (capped so score never goes below 0)
//     - Each major_correction:  -15
//     - Each fine_adjustment:   -5
//   FormState bonus/penalty:
//     - "good":            0 (deductions only from errors above)
//     - "needs_correction": already captured by error deductions
//     - "unsafe":         additional -10 (safety penalty on top of error deductions)
//
// Rationale: unsafe errors are heavily penalised because they represent joint
// risk, not just technique deviation. Multiple simultaneous unsafe errors are
// uncommon — most drills have at most one unsafe condition active at a time.
//
// EMA smoothing (α = 0.15) is applied in liveCoach.ts, NOT here.
// This function returns the raw per-frame score.
// ============================================================================

import type { FormError, FormState } from "../types";
import { ERROR_CUE_PRIORITY } from "./cueEngine";

// ─── Deduction Constants ────────────────────────────────────────────────────

const DEDUCTION_UNSAFE     = 30;
const DEDUCTION_MAJOR      = 15;
const DEDUCTION_FINE       = 5;
const UNSAFE_STATE_PENALTY = 10;

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Computes a per-frame quality score [0, 100] from the active form state and errors.
 *
 * This is intentionally a pure function — it receives exactly what it needs
 * and returns a single number. EMA smoothing is applied by the caller.
 *
 * @param formState  Derived form state for this frame.
 * @param errors     All active FormErrors (safety + correction combined).
 * @returns          Raw quality score [0, 100].
 */
export function computeQualityScore(
  formState: FormState,
  errors: FormError[]
): number {
  let score = 100;

  for (const error of errors) {
    if (error.isUnsafe) {
      score -= DEDUCTION_UNSAFE;
    } else {
      const tier = ERROR_CUE_PRIORITY[error.errorId] ?? "major_correction";
      if (tier === "major_correction") {
        score -= DEDUCTION_MAJOR;
      } else {
        score -= DEDUCTION_FINE;
      }
    }
  }

  // Additional penalty when the overall state is "unsafe"
  if (formState === "unsafe") {
    score -= UNSAFE_STATE_PENALTY;
  }

  return Math.max(0, Math.min(100, score));
}
