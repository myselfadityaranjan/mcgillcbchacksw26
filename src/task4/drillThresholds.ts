// ============================================================================
// StrainSense — Task 4: Drill Thresholds + Metric Computation
//
// Two responsibilities:
//   1. THRESHOLDS — named threshold constants per drill, per errorId.
//      { correction: number, unsafe: number } where unsafe > correction.
//      All values are in the normalised units described per-threshold.
//
//   2. computeDrillMetrics() — derives the scalar metrics that the threshold
//      checks consume. Called ONCE per frame in liveCoach.processFrame().
//      safetyRules.ts and cueEngine.ts both receive the resulting Record.
//
// Coordinate system (MediaPipe convention):
//   x: 0 = left edge of image,  1 = right edge
//   y: 0 = top edge of image,   1 = bottom edge   (y INCREASES downward)
//   z: MediaPipe body-normalised depth; negative = closer to camera.
//      Less reliable than x/y but usable for coarse wall-contact checks.
//
// Normalisation strategies used:
//   A. Hip-width ratio: divide by dist2D(LEFT_HIP, RIGHT_HIP)
//   B. Shoulder-width ratio: divide by dist2D(LEFT_SHOULDER, RIGHT_SHOULDER)
//   C. Segment-length ratio: divide by the length of the reference segment
//      (used by lateralOffsetRatio — already embedded in the function)
//   D. Angle in degrees: output of angleDeg() — scale-independent
//   E. Raw z delta: MediaPipe z units — coarse proxy for depth
//
// ============================================================================

import type { DrillId, PoseLandmark } from "../types";
import { LM, dist2D, midpoint, angleDeg, lateralOffsetRatio } from "./poseUtils";

// ─── Threshold Shape ─────────────────────────────────────────────────────────

/**
 * A threshold pair for a single errorId.
 * correction: the value at which a major_correction cue fires.
 * unsafe:     the value at which the formState becomes "unsafe".
 *
 * For ratio-based checks: correction < unsafe (both positive; more = worse).
 * For angle-based checks (where smaller angle = worse): correction > unsafe.
 * For negative-direction checks (e.g. right_knee_valgus): correction > unsafe
 *   (both negative; more negative = worse).
 * For z-depth checks: correction < unsafe (less negative = further from wall).
 */
export interface ThresholdPair {
  correction: number;
  unsafe: number;
}

export type DrillThresholds = Readonly<Record<string, ThresholdPair>>;

// ─── Per-Drill Threshold Tables ──────────────────────────────────────────────

/**
 * Doorway Pec Stretch thresholds.
 *
 * elbow_above_shoulder:
 *   metric = mean of (LEFT_SHOULDER.y - LEFT_ELBOW.y) and
 *            (RIGHT_SHOULDER.y - RIGHT_ELBOW.y), normalised by shoulder_width.
 *   In MediaPipe y-down convention, SHOULDER.y - ELBOW.y > 0 means elbow is
 *   ABOVE the shoulder. Threshold is a negative value (elbow should be level).
 *   correction: elbow > 10% shoulder-width above shoulder = needs adjustment
 *   unsafe:     elbow > 25% above = impingement risk
 *
 * shoulder_elevation (shrug):
 *   metric = (LEFT_EAR.y - LEFT_SHOULDER.y + RIGHT_EAR.y - RIGHT_SHOULDER.y) / 2
 *            normalised by shoulder_width.
 *   In y-down: EAR.y - SHOULDER.y > 0 means ear is BELOW shoulder = shrug.
 *   Positive and large = shoulders raised toward ears.
 *   correction: shrug ratio > 0.30
 *   unsafe:     shrug ratio > 0.50
 *
 * lumbar_arch (z-based):
 *   metric = hip_mid.z - shoulder_mid.z
 *   Positive = hips further from camera than shoulders = lower-back arch.
 *   correction: > 0.08
 *   unsafe:     > 0.15
 */
export const DOORWAY_PEC_THRESHOLDS: DrillThresholds = {
  elbow_above_shoulder: { correction: 0.10, unsafe: 0.25 },
  shoulder_elevation:   { correction: 0.30, unsafe: 0.50 },
  lumbar_arch:          { correction: 0.08, unsafe: 0.15 },
};

/**
 * Wall Angel thresholds.
 *
 * head_off_wall:
 *   metric = (LEFT_EAR.z + RIGHT_EAR.z) / 2
 *   In MediaPipe z, being pressed against the wall = more negative z.
 *   Head leaving the wall → z moves toward 0 or positive.
 *   correction: > -0.04  (ears mostly off wall plane)
 *   unsafe:     > 0.02   (head clearly forward)
 *
 * lower_back_off_wall:
 *   metric = hip_mid.z - shoulder_mid.z
 *   Positive = hips further back (arch off wall).
 *   correction: > 0.06
 *   unsafe:     > 0.12
 *
 * wrist_off_wall:
 *   metric = (LEFT_WRIST.z + RIGHT_WRIST.z) / 2
 *   Same convention as head_off_wall.
 *   correction: > -0.03
 *   unsafe:     > 0.03
 *
 * arm_height_insufficient:
 *   metric = wrist_above_shoulder_ratio (the rep-driving metric):
 *     (mean_shoulder_y - mean_wrist_y) / shoulder_width
 *   Positive = wrists above shoulders. Only fires during RAISING/TOP_HOLD phase.
 *   This is a fine_adjustment tier cue, so unsafe is set to Infinity.
 *   correction: < 0.10 while in RAISING/TOP_HOLD phase
 *   (unsafe = Infinity, never triggered by safetyRules)
 */
export const WALL_ANGEL_THRESHOLDS: DrillThresholds = {
  head_off_wall:            { correction: -0.04, unsafe: 0.02 },
  lower_back_off_wall:      { correction:  0.06, unsafe: 0.12 },
  wrist_off_wall:           { correction: -0.03, unsafe: 0.03 },
  arm_height_insufficient:  { correction:  0.10, unsafe: Infinity },
};

/**
 * Hip Flexor Stretch thresholds.
 *
 * lumbar_arch:
 *   Same z-proxy as doorway_pec.
 *   correction: > 0.07
 *   unsafe:     > 0.14
 *
 * torso_forward_lean:
 *   metric = angleDeg(shoulder_mid, hip_mid, knee_mid) in degrees.
 *   Standing upright = ~170°. Leaning forward = smaller angle.
 *   correction: < 155°
 *   unsafe:     < 135°
 *
 * front_knee_over_toes:
 *   metric = (front_knee.x - front_ankle.x) normalised by hip_width.
 *   Positive in non-mirrored view = front knee forward of ankle = valgus stress.
 *   correction: > 0.15
 *   unsafe:     > 0.25
 */
export const HIP_FLEXOR_THRESHOLDS: DrillThresholds = {
  lumbar_arch:         { correction: 0.07,  unsafe: 0.14 },
  torso_forward_lean:  { correction: 155,   unsafe: 135 },
  front_knee_over_toes: { correction: 0.15, unsafe: 0.25 },
};

/**
 * Squat Alignment Drill thresholds.
 *
 * left_knee_valgus:
 *   metric = lateralOffsetRatio(LEFT_KNEE, LEFT_HIP, LEFT_ANKLE)
 *   Positive = left knee displaced medially (inward collapse).
 *   correction: > 0.12   (12% of hip-to-ankle segment length)
 *   unsafe:     > 0.20
 *
 * right_knee_valgus:
 *   metric = lateralOffsetRatio(RIGHT_KNEE, RIGHT_HIP, RIGHT_ANKLE)
 *   Negative = right knee displaced medially (mirror of left).
 *   correction: < -0.12
 *   unsafe:     < -0.20
 *
 * heel_lift:
 *   metric = LEFT_FOOT_INDEX.y - LEFT_HEEL.y (left side check)
 *            and RIGHT_FOOT_INDEX.y - RIGHT_HEEL.y (right side)
 *   Positive = toes lower than heel = heel lifting.
 *   correction: > 0.03
 *   unsafe:     > 0.06
 *
 * torso_forward_lean:
 *   metric = angleDeg(shoulder_mid, hip_mid, ankle_mid)
 *   Standing straight = ~170°. Leaning forward = smaller.
 *   correction: < 130°
 *   unsafe:     < 110°
 */
export const SQUAT_ALIGNMENT_THRESHOLDS: DrillThresholds = {
  left_knee_valgus:    { correction:  0.12, unsafe:  0.20 },
  right_knee_valgus:   { correction: -0.12, unsafe: -0.20 },
  heel_lift:           { correction:  0.03, unsafe:  0.06 },
  torso_forward_lean:  { correction:  130,  unsafe:  110 },
};

/**
 * Split Squat Drill thresholds.
 *
 * front_knee_valgus:
 *   Same lateralOffsetRatio logic as squat, applied to the front knee only.
 *   Front knee = the one with lower y (higher in image = not on ground).
 *   If front leg is the left leg: positive valgus ratio = correction.
 *   If front leg is the right leg: negative valgus ratio = correction.
 *   We store the ABSOLUTE value (abs) in the metric for a unified threshold.
 *   correction: > 0.12
 *   unsafe:     > 0.22
 *
 * torso_forward_lean:
 *   metric = angleDeg(shoulder_mid, hip_mid, front_knee)
 *   Standing in split = ~165°. Leaning forward = smaller.
 *   correction: < 145°
 *   unsafe:     < 120°
 *
 * hip_rotation:
 *   metric = |LEFT_HIP.z - RIGHT_HIP.z| / dist2D(LEFT_HIP, RIGHT_HIP)
 *   Zero = hips square. Positive = one hip rotated forward/back.
 *   correction: > 0.10
 *   unsafe:     > 0.18
 */
export const SPLIT_SQUAT_THRESHOLDS: DrillThresholds = {
  front_knee_valgus:  { correction: 0.12, unsafe: 0.22 },
  torso_forward_lean: { correction: 145,  unsafe: 120 },
  hip_rotation:       { correction: 0.10, unsafe: 0.18 },
};

/**
 * Master threshold table — one entry per DrillId.
 * Import this in safetyRules.ts and cueEngine.ts.
 */
export const THRESHOLDS: Readonly<Record<DrillId, DrillThresholds>> = {
  doorway_pec_stretch:   DOORWAY_PEC_THRESHOLDS,
  wall_angel:            WALL_ANGEL_THRESHOLDS,
  hip_flexor_stretch:    HIP_FLEXOR_THRESHOLDS,
  squat_alignment_drill: SQUAT_ALIGNMENT_THRESHOLDS,
  split_squat_drill:     SPLIT_SQUAT_THRESHOLDS,
};

// ─── Metric Computation ──────────────────────────────────────────────────────

/**
 * Computes all scalar metrics for the given drill from one frame of landmarks.
 * Returns a Record<string, number> where keys match errorId names plus
 * additional rep-driving metrics (e.g. "mean_knee_angle_deg").
 *
 * Precondition: landmark visibility for the drill's required indices has
 * already been verified by liveCoach.ts. If a required landmark is missing,
 * affected metric values will be NaN — threshold checks must guard against NaN.
 *
 * Called once per frame in liveCoach.processFrame(); the result is passed to
 * safetyRules.evaluateSafetyRules(), cueEngine.evaluateFormErrors(),
 * and returned in LiveCoachingFrame.metrics for Task 6.
 */
export function computeDrillMetrics(
  lm: PoseLandmark[],
  drillId: DrillId
): Record<string, number> {
  switch (drillId) {
    case "doorway_pec_stretch":   return computeDoorwayPecMetrics(lm);
    case "wall_angel":            return computeWallAngelMetrics(lm);
    case "hip_flexor_stretch":    return computeHipFlexorMetrics(lm);
    case "squat_alignment_drill": return computeSquatMetrics(lm);
    case "split_squat_drill":     return computeSplitSquatMetrics(lm);
  }
}

// ─── Per-Drill Metric Functions ───────────────────────────────────────────────

function computeDoorwayPecMetrics(lm: PoseLandmark[]): Record<string, number> {
  const ls = lm[LM.LEFT_SHOULDER];
  const rs = lm[LM.RIGHT_SHOULDER];
  const le = lm[LM.LEFT_ELBOW];
  const re = lm[LM.RIGHT_ELBOW];
  const lh = lm[LM.LEFT_HIP];
  const rh = lm[LM.RIGHT_HIP];
  const lear = lm[LM.LEFT_EAR];
  const rear = lm[LM.RIGHT_EAR];

  const shoulderMid = midpoint(ls, rs);
  const hipMid = midpoint(lh, rh);
  const shoulderWidth = dist2D(ls, rs);

  // Elbow height above shoulder: SHOULDER.y - ELBOW.y, positive = above
  const leftAbove  = (ls.y - le.y) / shoulderWidth;
  const rightAbove = (rs.y - re.y) / shoulderWidth;
  const elbowAboveShoulder = (leftAbove + rightAbove) / 2;

  // Shoulder elevation (shrug): EAR.y - SHOULDER.y, positive = ear below shoulder
  const leftShrug  = (lear.y - ls.y) / shoulderWidth;
  const rightShrug = (rear.y - rs.y) / shoulderWidth;
  const shoulderElevation = (leftShrug + rightShrug) / 2;

  // Lumbar arch via z: hip z - shoulder z (positive = hips further from camera)
  const lumbarArch = hipMid.z - shoulderMid.z;

  return {
    elbow_above_shoulder: elbowAboveShoulder,
    shoulder_elevation:   shoulderElevation,
    lumbar_arch:          lumbarArch,
  };
}

function computeWallAngelMetrics(lm: PoseLandmark[]): Record<string, number> {
  const ls = lm[LM.LEFT_SHOULDER];
  const rs = lm[LM.RIGHT_SHOULDER];
  const lw = lm[LM.LEFT_WRIST];
  const rw = lm[LM.RIGHT_WRIST];
  const lh = lm[LM.LEFT_HIP];
  const rh = lm[LM.RIGHT_HIP];
  const lear = lm[LM.LEFT_EAR];
  const rear = lm[LM.RIGHT_EAR];

  const shoulderMid = midpoint(ls, rs);
  const hipMid = midpoint(lh, rh);
  const shoulderWidth = dist2D(ls, rs);

  // Head off wall: mean ear z (more positive = further from wall = further from camera)
  const headOffWall = (lear.z + rear.z) / 2;

  // Lower back off wall: hip z - shoulder z
  const lowerBackOffWall = hipMid.z - shoulderMid.z;

  // Wrist off wall: mean wrist z
  const wristOffWall = (lw.z + rw.z) / 2;

  // Wrist above shoulder (rep driver): (mean shoulder y - mean wrist y) / shoulder_width
  // Positive = wrists above shoulders
  const meanShoulderY = (ls.y + rs.y) / 2;
  const meanWristY = (lw.y + rw.y) / 2;
  const wristAboveShoulderRatio = (meanShoulderY - meanWristY) / shoulderWidth;

  return {
    head_off_wall:               headOffWall,
    lower_back_off_wall:         lowerBackOffWall,
    wrist_off_wall:              wristOffWall,
    arm_height_insufficient:     wristAboveShoulderRatio, // note: this key name is inverted for threshold logic
    wrist_above_shoulder_ratio:  wristAboveShoulderRatio, // clean name for rep driver
  };
}

function computeHipFlexorMetrics(lm: PoseLandmark[]): Record<string, number> {
  const ls = lm[LM.LEFT_SHOULDER];
  const rs = lm[LM.RIGHT_SHOULDER];
  const lh = lm[LM.LEFT_HIP];
  const rh = lm[LM.RIGHT_HIP];
  const lk = lm[LM.LEFT_KNEE];
  const rk = lm[LM.RIGHT_KNEE];
  const la = lm[LM.LEFT_ANKLE];
  const ra = lm[LM.RIGHT_ANKLE];

  const shoulderMid = midpoint(ls, rs);
  const hipMid = midpoint(lh, rh);
  const kneeMid = midpoint(lk, rk);
  const hipWidth = dist2D(lh, rh);

  // Lumbar arch: same z-proxy as doorway_pec
  const lumbarArch = hipMid.z - shoulderMid.z;

  // Torso forward lean: angle at hip between shoulder-hip-knee
  const torsoForwardLean = angleDeg(shoulderMid, hipMid, kneeMid);

  // Front knee determination: lower y = higher in image = front leg
  const frontIsLeft = lk.y < rk.y;
  const frontKnee  = frontIsLeft ? lk : rk;
  const frontAnkle = frontIsLeft ? la : ra;
  const frontHip   = frontIsLeft ? lh : rh;

  // Front knee forward of ankle: (front_knee.x - front_ankle.x) / hip_width
  // Positive = knee ahead of ankle in image space
  const frontKneeOverToes = (frontKnee.x - frontAnkle.x) / hipWidth;

  // Front knee angle (for rep driver)
  const frontKneeAngleDeg = angleDeg(frontHip, frontKnee, frontAnkle);

  return {
    lumbar_arch:          lumbarArch,
    torso_forward_lean:   torsoForwardLean,
    front_knee_over_toes: frontKneeOverToes,
    front_knee_angle_deg: frontKneeAngleDeg, // rep driver
    front_is_left:        frontIsLeft ? 1 : 0,
  };
}

function computeSquatMetrics(lm: PoseLandmark[]): Record<string, number> {
  const ls = lm[LM.LEFT_SHOULDER];
  const rs = lm[LM.RIGHT_SHOULDER];
  const lh = lm[LM.LEFT_HIP];
  const rh = lm[LM.RIGHT_HIP];
  const lk = lm[LM.LEFT_KNEE];
  const rk = lm[LM.RIGHT_KNEE];
  const la = lm[LM.LEFT_ANKLE];
  const ra = lm[LM.RIGHT_ANKLE];
  const lheel = lm[LM.LEFT_HEEL];
  const rheel = lm[LM.RIGHT_HEEL];
  const lfi = lm[LM.LEFT_FOOT_INDEX];
  const rfi = lm[LM.RIGHT_FOOT_INDEX];

  const shoulderMid = midpoint(ls, rs);
  const hipMid = midpoint(lh, rh);
  const ankleMid = midpoint(la, ra);

  // Left knee valgus: lateralOffsetRatio(LEFT_KNEE, LEFT_HIP, LEFT_ANKLE)
  const leftKneeValgus  = lateralOffsetRatio(lk, lh, la);
  // Right knee valgus: lateralOffsetRatio(RIGHT_KNEE, RIGHT_HIP, RIGHT_ANKLE)
  const rightKneeValgus = lateralOffsetRatio(rk, rh, ra);

  // Heel lift: foot_index.y - heel.y
  // Positive = toes lower than heel = heel lifting (y increases downward)
  const leftHeelLift  = lfi.y - lheel.y;
  const rightHeelLift = rfi.y - rheel.y;
  // Use worst side for the metric
  const heelLift = Math.max(leftHeelLift, rightHeelLift);

  // Torso forward lean: angle at hip between shoulder-hip-ankle
  const torsoForwardLean = angleDeg(shoulderMid, hipMid, ankleMid);

  // Mean knee angle (rep driver)
  const leftKneeAngle  = angleDeg(lh, lk, la);
  const rightKneeAngle = angleDeg(rh, rk, ra);
  const meanKneeAngleDeg = (leftKneeAngle + rightKneeAngle) / 2;

  return {
    left_knee_valgus:    leftKneeValgus,
    right_knee_valgus:   rightKneeValgus,
    heel_lift:           heelLift,
    torso_forward_lean:  torsoForwardLean,
    mean_knee_angle_deg: meanKneeAngleDeg, // rep driver
    left_heel_lift:      leftHeelLift,
    right_heel_lift:     rightHeelLift,
    left_knee_angle_deg: leftKneeAngle,
    right_knee_angle_deg: rightKneeAngle,
  };
}

function computeSplitSquatMetrics(lm: PoseLandmark[]): Record<string, number> {
  const ls = lm[LM.LEFT_SHOULDER];
  const rs = lm[LM.RIGHT_SHOULDER];
  const lh = lm[LM.LEFT_HIP];
  const rh = lm[LM.RIGHT_HIP];
  const lk = lm[LM.LEFT_KNEE];
  const rk = lm[LM.RIGHT_KNEE];
  const la = lm[LM.LEFT_ANKLE];
  const ra = lm[LM.RIGHT_ANKLE];

  const shoulderMid = midpoint(ls, rs);
  const hipMid = midpoint(lh, rh);
  const hipWidth = dist2D(lh, rh);

  // Front leg: lower y = higher in image = the forward (non-kneeling) leg
  const frontIsLeft = lk.y < rk.y;
  const frontKnee  = frontIsLeft ? lk : rk;
  const frontHip   = frontIsLeft ? lh : rh;
  const frontAnkle = frontIsLeft ? la : ra;

  // Front knee valgus: absolute value of lateralOffsetRatio
  // We take abs because valgus threshold applies regardless of which side is front
  const rawValgus     = lateralOffsetRatio(frontKnee, frontHip, frontAnkle);
  const frontKneeValgus = Math.abs(rawValgus);

  // Torso forward lean: angle at hip between shoulder-hip-front_knee
  const torsoForwardLean = angleDeg(shoulderMid, hipMid, frontKnee);

  // Hip rotation: |LEFT_HIP.z - RIGHT_HIP.z| / hip_width
  const hipRotation = Math.abs(lh.z - rh.z) / (hipWidth > 1e-9 ? hipWidth : 1);

  // Front knee angle (rep driver)
  const frontKneeAngleDeg = angleDeg(frontHip, frontKnee, frontAnkle);

  return {
    front_knee_valgus:    frontKneeValgus,
    torso_forward_lean:   torsoForwardLean,
    hip_rotation:         hipRotation,
    front_knee_angle_deg: frontKneeAngleDeg, // rep driver
    front_is_left:        frontIsLeft ? 1 : 0,
  };
}
