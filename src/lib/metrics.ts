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
    neckAngleDeg: 0,
    thoracicAngleDeg: 0,
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
  // However we also try the left side and pick whichever has more
  // visible landmarks, providing a robust bilateral fallback.
  //
  // Right side to camera: body "front" is at lower x values.
  //   headForwardOffset = rShoulder.x − rEar.x  (positive = ear forward)
  //   torsoForwardLean  = rHip.x − rShoulder.x  (positive = shoulder forward)
  //   hipForwardPosition = rKnee.x − rHip.x     (positive = hip forward)
  //
  // Left side to camera: body "front" is at higher x values (mirrored).
  //   headForwardOffset = lEar.x − lShoulder.x
  //   torsoForwardLean  = lShoulder.x − lHip.x
  //   hipForwardPosition = lHip.x − lKnee.x
  {
    const frame = byStep.get('side-stance')?.representativeFrame;
    if (frame) {
      const lms = frame.normalizedLandmarks;

      // Right-side candidates
      const rEar      = lm(lms, LM.RIGHT_EAR);
      const rShoulder = lm(lms, LM.RIGHT_SHOULDER);
      const rHip      = lm(lms, LM.RIGHT_HIP);
      const rKnee     = lm(lms, LM.RIGHT_KNEE);
      const rightVisible = [rEar, rShoulder, rHip, rKnee].filter(Boolean).length;

      // Left-side candidates (fallback when user faces the other way)
      const lEar      = lm(lms, LM.LEFT_EAR);
      const lShoulder = lm(lms, LM.LEFT_SHOULDER);
      const lHip      = lm(lms, LM.LEFT_HIP);
      const lKnee     = lm(lms, LM.LEFT_KNEE);
      const leftVisible = [lEar, lShoulder, lHip, lKnee].filter(Boolean).length;

      // Choose the side with more visible landmarks
      const useLeft = leftVisible > rightVisible;
      const ear      = useLeft ? lEar      : rEar;
      const shoulder = useLeft ? lShoulder : rShoulder;
      const hip      = useLeft ? lHip      : rHip;
      const knee     = useLeft ? lKnee     : rKnee;

      m.sidePoseConfidence = Math.max(leftVisible, rightVisible) / 4;

      if (ear && shoulder) {
        // Signed forward offset (positive = ear ahead of shoulder)
        m.headForwardOffset = useLeft
          ? Math.max(0, ear.x - shoulder.x)
          : Math.max(0, shoulder.x - ear.x);

        // Neck angle from vertical (degrees): 0° = ideal, higher = more forward tilt
        const neckDx = Math.abs(ear.x - shoulder.x);
        const neckDy = Math.abs(shoulder.y - ear.y); // ear should sit above shoulder
        m.neckAngleDeg = neckDy > 0.001
          ? Math.atan2(neckDx, neckDy) * (180 / Math.PI)
          : 0;
      }

      if (shoulder && hip) {
        // Shoulder forward of hip in sagittal plane
        m.torsoForwardLean = useLeft
          ? Math.max(0, shoulder.x - hip.x)
          : Math.max(0, hip.x - shoulder.x);

        // Thoracic angle from vertical (degrees): how much the trunk leans forward
        const tDx = Math.abs(shoulder.x - hip.x);
        const tDy = Math.abs(hip.y - shoulder.y); // hip should be below shoulder
        m.thoracicAngleDeg = tDy > 0.001
          ? Math.atan2(tDx, tDy) * (180 / Math.PI)
          : 0;
      }

      if (hip && knee) {
        // Hip forward of knee line (APT proxy)
        m.hipForwardPosition = useLeft
          ? Math.max(0, hip.x - knee.x)
          : Math.max(0, knee.x - hip.x);
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
