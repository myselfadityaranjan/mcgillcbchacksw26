// ──────────────────────────────────────────────────────────────
// metrics.ts — derive biomechanical measurements from captured
// pose data.  All functions are pure; no side effects.
// ──────────────────────────────────────────────────────────────

import type { NormalizedLandmark, AssessmentResult } from '../types/pose';
import type { PostureMetrics } from '../types/analysis';
import { LM } from './landmarks';

// ── Helpers ──────────────────────────────────────────────────

/** Return a landmark only if its visibility passes the threshold */
function lm(
  landmarks: NormalizedLandmark[],
  idx: number,
  minVis = 0.35,
): NormalizedLandmark | null {
  const l = landmarks[idx];
  return l && l.visibility >= minVis ? l : null;
}

// ── Main export ──────────────────────────────────────────────

/**
 * Compute all posture metrics from the full assessment result.
 * Any value that cannot be computed (e.g. due to low landmark
 * visibility) stays at its default of 0.
 */
export function computeMetrics(result: AssessmentResult): PostureMetrics {
  const m: PostureMetrics = {
    shoulderHeightDiff: 0,
    hipHeightDiff: 0,
    lateralShift: 0,
    headTilt: 0,
    headForwardOffset: 0,
    torsoForwardLean: 0,
    hipForwardPosition: 0,
    sidePoseConfidence: 0,
    leftKneeValgus: 0,
    rightKneeValgus: 0,
    squatPoseConfidence: 0,
    armSymmetry: 0,
  };

  const byStep = new Map(result.captures.map((c) => [c.stepId, c]));

  // ── Front-stance ────────────────────────────────────────────
  {
    const frame = byStep.get('front-stance')?.representativeFrame;
    if (frame) {
      const lms = frame.normalizedLandmarks;
      const ls = lm(lms, LM.LEFT_SHOULDER);
      const rs = lm(lms, LM.RIGHT_SHOULDER);
      const lh = lm(lms, LM.LEFT_HIP);
      const rh = lm(lms, LM.RIGHT_HIP);
      const nose = lm(lms, LM.NOSE);

      if (ls && rs) m.shoulderHeightDiff = Math.abs(ls.y - rs.y);
      if (lh && rh) {
        m.hipHeightDiff = Math.abs(lh.y - rh.y);
        m.lateralShift = Math.abs((lh.x + rh.x) / 2 - 0.5);
      }
      if (nose && ls && rs) {
        m.headTilt = Math.abs(nose.x - (ls.x + rs.x) / 2);
      }
    }
  }

  // ── Side-stance ─────────────────────────────────────────────
  // Instruction: right side faces camera, user looks camera-left.
  // In normalised coords the user's "front" is at lower x values.
  // Forward head posture: ear is at lower x than shoulder.
  // APT proxy: hip is at lower x than knee (hip anterior to knee).
  {
    const frame = byStep.get('side-stance')?.representativeFrame;
    if (frame) {
      const lms = frame.normalizedLandmarks;
      const rEar = lm(lms, LM.RIGHT_EAR);
      const rShoulder = lm(lms, LM.RIGHT_SHOULDER);
      const rHip = lm(lms, LM.RIGHT_HIP);
      const rKnee = lm(lms, LM.RIGHT_KNEE);

      const visible = [rEar, rShoulder, rHip, rKnee].filter(Boolean).length;
      m.sidePoseConfidence = visible / 4;

      if (rEar && rShoulder) {
        // Positive: ear is more forward (lower x) than shoulder → FHP
        m.headForwardOffset = Math.max(0, rShoulder.x - rEar.x);
      }
      if (rShoulder && rHip) {
        // Positive: shoulder is more forward (lower x) than hip → forward lean
        m.torsoForwardLean = Math.max(0, rHip.x - rShoulder.x);
      }
      if (rHip && rKnee) {
        // Positive: hip is more forward (lower x) than knee → APT tendency
        m.hipForwardPosition = Math.max(0, rKnee.x - rHip.x);
      }
    }
  }

  // ── Squat — peak (deepest) frame ────────────────────────────
  // Knee valgus: knee x drifts past the hip–ankle midline toward centre.
  // Left side (lower x): valgus = knee.x > midline.
  // Right side (higher x): valgus = knee.x < midline.
  {
    const frame = byStep.get('squat')?.representativeFrame;
    if (frame) {
      const lms = frame.normalizedLandmarks;
      const lh = lm(lms, LM.LEFT_HIP);
      const lk = lm(lms, LM.LEFT_KNEE);
      const la = lm(lms, LM.LEFT_ANKLE);
      const rh = lm(lms, LM.RIGHT_HIP);
      const rk = lm(lms, LM.RIGHT_KNEE);
      const ra = lm(lms, LM.RIGHT_ANKLE);

      const visible = [lh, lk, la, rh, rk, ra].filter(Boolean).length;
      m.squatPoseConfidence = visible / 6;

      if (lh && lk && la) {
        const mid = (lh.x + la.x) / 2;
        m.leftKneeValgus = Math.max(0, lk.x - mid);
      }
      if (rh && rk && ra) {
        const mid = (rh.x + ra.x) / 2;
        m.rightKneeValgus = Math.max(0, mid - rk.x);
      }
    }
  }

  // ── Arm-raise — peak (arms highest) frame ───────────────────
  {
    const frame = byStep.get('arm-raise')?.representativeFrame;
    if (frame) {
      const lms = frame.normalizedLandmarks;
      const lw = lm(lms, LM.LEFT_WRIST);
      const rw = lm(lms, LM.RIGHT_WRIST);
      if (lw && rw) m.armSymmetry = Math.abs(lw.y - rw.y);
    }
  }

  return m;
}
