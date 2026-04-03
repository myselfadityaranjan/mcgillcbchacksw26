// ============================================================================
// StrainSense — Task 4: Pose Utilities
// Pure geometric helpers operating on PoseLandmark[].
// Zero drill-specific logic. Zero side effects.
// Imported by drillThresholds.ts and cueEngine.ts (rep detection).
// ============================================================================

import type { PoseLandmark, DrillId } from "../types";

// ─── MediaPipe Landmark Index Constants ─────────────────────────────────────
// Only indices actually used across the 5 MVP drills are included.

export const LM = {
  NOSE:             0,
  LEFT_EYE:         2,
  RIGHT_EYE:        5,
  LEFT_EAR:         7,
  RIGHT_EAR:        8,
  LEFT_SHOULDER:   11,
  RIGHT_SHOULDER:  12,
  LEFT_ELBOW:      13,
  RIGHT_ELBOW:     14,
  LEFT_WRIST:      15,
  RIGHT_WRIST:     16,
  LEFT_HIP:        23,
  RIGHT_HIP:       24,
  LEFT_KNEE:       25,
  RIGHT_KNEE:      26,
  LEFT_ANKLE:      27,
  RIGHT_ANKLE:     28,
  LEFT_HEEL:       29,
  RIGHT_HEEL:      30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

// ─── Required Landmark Indices Per Drill ─────────────────────────────────────
// liveCoach.ts uses this to gate processFrame() — if any required landmark
// is below MIN_LANDMARK_VISIBILITY, the frame is skipped (no false positives).

export const REQUIRED_LANDMARKS: Record<DrillId, number[]> = {
  doorway_pec_stretch: [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
    LM.LEFT_ELBOW,    LM.RIGHT_ELBOW,
    LM.LEFT_HIP,      LM.RIGHT_HIP,
    LM.LEFT_EAR,      LM.RIGHT_EAR,
  ],
  wall_angel: [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
    LM.LEFT_WRIST,    LM.RIGHT_WRIST,
    LM.LEFT_HIP,      LM.RIGHT_HIP,
    LM.LEFT_EAR,      LM.RIGHT_EAR,
  ],
  hip_flexor_stretch: [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
    LM.LEFT_HIP,      LM.RIGHT_HIP,
    LM.LEFT_KNEE,     LM.RIGHT_KNEE,
    LM.LEFT_ANKLE,    LM.RIGHT_ANKLE,
  ],
  squat_alignment_drill: [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
    LM.LEFT_HIP,      LM.RIGHT_HIP,
    LM.LEFT_KNEE,     LM.RIGHT_KNEE,
    LM.LEFT_ANKLE,    LM.RIGHT_ANKLE,
    LM.LEFT_HEEL,     LM.RIGHT_HEEL,
    LM.LEFT_FOOT_INDEX, LM.RIGHT_FOOT_INDEX,
  ],
  split_squat_drill: [
    LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
    LM.LEFT_HIP,      LM.RIGHT_HIP,
    LM.LEFT_KNEE,     LM.RIGHT_KNEE,
    LM.LEFT_ANKLE,    LM.RIGHT_ANKLE,
  ],
};

/** Default visibility threshold for landmark quality checks. */
export const MIN_VISIBILITY = 0.5;

// ─── Visibility Check ────────────────────────────────────────────────────────

/**
 * Returns true when ALL listed landmark indices have visibility >= threshold.
 * Call this before any geometric computation to prevent nonsense results on
 * occluded or partially-visible frames.
 */
export function landmarksVisible(
  lm: PoseLandmark[],
  indices: number[],
  threshold = MIN_VISIBILITY
): boolean {
  for (const idx of indices) {
    if (lm.length <= idx || lm[idx].visibility < threshold) return false;
  }
  return true;
}

// ─── Geometric Primitives ────────────────────────────────────────────────────

/**
 * Euclidean distance between two landmarks in normalised image space (x, y only).
 * Result is in [0,1] units — same as coordinate inputs.
 * Use as a denominator for ratio computations.
 */
export function dist2D(a: PoseLandmark, b: PoseLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Midpoint of two landmarks. Averages x, y, z, and visibility.
 */
export function midpoint(a: PoseLandmark, b: PoseLandmark): PoseLandmark {
  return {
    x: (a.x + b.x) * 0.5,
    y: (a.y + b.y) * 0.5,
    z: (a.z + b.z) * 0.5,
    visibility: (a.visibility + b.visibility) * 0.5,
  };
}

/**
 * Angle at vertex B, formed by rays B→A and B→C, in degrees [0, 180].
 * Uses the dot-product formula in 2D (x, y only).
 * Returns 0 if either ray has zero length (degenerate input guard).
 */
export function angleDeg(
  a: PoseLandmark,
  b: PoseLandmark,
  c: PoseLandmark
): number {
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const lenBA = Math.sqrt(baX * baX + baY * baY);
  const lenBC = Math.sqrt(bcX * bcX + bcY * bcY);

  if (lenBA < 1e-9 || lenBC < 1e-9) return 0;

  const cosAngle = (baX * bcX + baY * bcY) / (lenBA * lenBC);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
}

/**
 * Signed lateral offset ratio of point P from the directed line A→B.
 *
 * Returns the 2D cross-product of (AB, AP) divided by |AB|².
 * Positive:  P is to the right of the direction A→B (clockwise).
 * Negative:  P is to the left of the direction A→B (counter-clockwise).
 *
 * The division by |AB|² makes the result scale-invariant relative to the
 * reference segment: a value of 0.12 means P is 12% of |AB| laterally
 * displaced from the line.
 *
 * Used for knee valgus detection: P = knee, A = hip, B = ankle.
 *   Positive result = knee displaced toward right of hip-to-ankle direction
 *   (in a forward-facing camera, this corresponds to left-leg medial collapse).
 */
export function lateralOffsetRatio(
  p: PoseLandmark,
  lineA: PoseLandmark,
  lineB: PoseLandmark
): number {
  const abX = lineB.x - lineA.x;
  const abY = lineB.y - lineA.y;
  const apX = p.x - lineA.x;
  const apY = p.y - lineA.y;

  const abLenSq = abX * abX + abY * abY;
  if (abLenSq < 1e-12) return 0;

  // 2D cross product: abX * apY - abY * apX
  return (abX * apY - abY * apX) / abLenSq;
}

/**
 * Exponential moving average.
 * alpha ∈ (0, 1]: higher = more reactive, lower = smoother.
 * Returns the new EMA value. Caller holds the previous value in session state.
 */
export function ema(previous: number, current: number, alpha: number): number {
  return previous + alpha * (current - previous);
}
