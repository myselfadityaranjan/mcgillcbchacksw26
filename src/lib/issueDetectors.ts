// ──────────────────────────────────────────────────────────────
// issueDetectors.ts — rule-based heuristics that classify
// detected issues from computed posture metrics.
// Each detector returns a DetectedIssue or null.
// ──────────────────────────────────────────────────────────────

import type { PostureMetrics, DetectedIssue, Severity } from '../types/analysis';
import type { AssessmentResult } from '../types/pose';
import { LM } from './landmarks';

// ── Severity helper ──────────────────────────────────────────

function severity(value: number, mild: number, mod: number): Severity {
  if (value >= mod) return 'significant';
  if (value >= mild) return 'moderate';
  return 'mild';
}

function confidence(value: number, floor: number, ceiling: number): number {
  return Math.min(1, Math.max(0, (value - floor) / (ceiling - floor)));
}

// ── Evidence image helper ────────────────────────────────────

function evidenceImage(result: AssessmentResult, stepId: string): string | undefined {
  const capture = result.captures.find((c) => c.stepId === stepId);
  return capture?.representativeFrame?.imageDataUrl;
}

// ── Individual detectors ─────────────────────────────────────

/**
 * Rounded shoulders — detected from elevated shoulder height
 * relative to ear and from lateral asymmetry in shoulder position.
 * Primary evidence: front-stance representative frame.
 */
export function detectRoundedShoulders(
  m: PostureMetrics,
  result: AssessmentResult,
): DetectedIssue | null {
  // Proxy: shoulder height diff AND arm asymmetry in raise both suggest imbalance
  // Main indicator: sidePoseConfidence + torsoForwardLean (shoulders forward of hips)
  const raw = m.sidePoseConfidence > 0.5 ? m.torsoForwardLean : m.shoulderHeightDiff * 2;
  const MILD = 0.025;
  const MOD = 0.05;

  if (raw < MILD) return null;

  return {
    id: 'rounded-shoulders',
    name: 'Rounded Shoulder Pattern',
    severity: severity(raw, MILD, MOD),
    confidence: confidence(raw, MILD, 0.10) * (m.sidePoseConfidence > 0.4 ? 1 : 0.7),
    explanation: `Your shoulders appear to sit forward of the ideal alignment line${m.shoulderHeightDiff > 0.025 ? ', with a slight left-right height difference' : ''}.`,
    meaning: 'This pattern is consistent with shortened pectoral muscles and can contribute to upper back tension and impingement over time.',
    affectedLandmarks: [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_ELBOW, LM.RIGHT_ELBOW],
    evidenceStepId: m.sidePoseConfidence > 0.4 ? 'side-stance' : 'front-stance',
    evidenceImageUrl: evidenceImage(result, m.sidePoseConfidence > 0.4 ? 'side-stance' : 'front-stance'),
    metrics: {
      torsoForwardLean: m.torsoForwardLean,
      shoulderHeightDiff: m.shoulderHeightDiff,
      armSymmetry: m.armSymmetry,
    },
  };
}

/**
 * Forward head posture — detected from side-stance when the ear
 * is significantly anterior to the shoulder.
 */
export function detectForwardHeadPosture(
  m: PostureMetrics,
  result: AssessmentResult,
): DetectedIssue | null {
  if (m.sidePoseConfidence < 0.5) return null;

  const raw = m.headForwardOffset;
  const MILD = 0.03;
  const MOD = 0.065;

  if (raw < MILD) return null;

  return {
    id: 'forward-head-posture',
    name: 'Forward Head Posture',
    severity: severity(raw, MILD, MOD),
    confidence: confidence(raw, MILD, 0.12) * m.sidePoseConfidence,
    explanation: `Your ear sits approximately ${(raw * 100).toFixed(0)}% of frame width ahead of your shoulder line in the side view.`,
    meaning: 'Each inch of forward head posture adds roughly 10 lbs of effective load to the neck, contributing to tension headaches and cervical strain.',
    affectedLandmarks: [LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR, LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
    evidenceStepId: 'side-stance',
    evidenceImageUrl: evidenceImage(result, 'side-stance'),
    metrics: {
      headForwardOffset: m.headForwardOffset,
      torsoForwardLean: m.torsoForwardLean,
    },
  };
}

/**
 * Anterior pelvic tilt tendency — detected from side-stance when
 * the hip sits notably anterior to the knee vertical line.
 */
export function detectAnteriorPelvicTilt(
  m: PostureMetrics,
  result: AssessmentResult,
): DetectedIssue | null {
  if (m.sidePoseConfidence < 0.5) return null;

  const raw = m.hipForwardPosition;
  const MILD = 0.025;
  const MOD = 0.055;

  if (raw < MILD) return null;

  return {
    id: 'anterior-pelvic-tilt',
    name: 'Anterior Pelvic Tilt Tendency',
    severity: severity(raw, MILD, MOD),
    confidence: confidence(raw, MILD, 0.10) * m.sidePoseConfidence,
    explanation: 'Your pelvis appears to tilt forward from the neutral position, creating an exaggerated lumbar curve.',
    meaning: 'This pattern often involves tight hip flexors and weak glutes, and may contribute to low back discomfort and hip impingement.',
    affectedLandmarks: [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE],
    evidenceStepId: 'side-stance',
    evidenceImageUrl: evidenceImage(result, 'side-stance'),
    metrics: {
      hipForwardPosition: m.hipForwardPosition,
      torsoForwardLean: m.torsoForwardLean,
    },
  };
}

/**
 * Knee valgus — detected from the squat when one or both knees
 * drift inside the hip–ankle alignment line.
 */
export function detectKneeValgus(
  m: PostureMetrics,
  result: AssessmentResult,
): DetectedIssue | null {
  if (m.squatPoseConfidence < 0.5) return null;

  const worst = Math.max(m.leftKneeValgus, m.rightKneeValgus);
  const MILD = 0.02;
  const MOD = 0.05;

  if (worst < MILD) return null;

  const side =
    m.leftKneeValgus > m.rightKneeValgus
      ? 'left'
      : m.rightKneeValgus > m.leftKneeValgus
        ? 'right'
        : 'both';

  const sideLabel = side === 'both' ? 'both knees' : `the ${side} knee`;

  return {
    id: 'knee-valgus',
    name: 'Knee Valgus (Knee Collapse)',
    severity: severity(worst, MILD, MOD),
    confidence: confidence(worst, MILD, 0.09) * m.squatPoseConfidence,
    explanation: `During your squat, ${sideLabel} drift${side === 'both' ? '' : 's'} inward past the hip–ankle alignment line.`,
    meaning: 'Knee valgus during loading movements increases medial knee stress and is associated with ACL and meniscal injury risk.',
    affectedLandmarks:
      side === 'left'
        ? [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE]
        : side === 'right'
          ? [LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE]
          : [LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_HIP, LM.RIGHT_HIP],
    evidenceStepId: 'squat',
    evidenceImageUrl: evidenceImage(result, 'squat'),
    metrics: {
      leftKneeValgus: m.leftKneeValgus,
      rightKneeValgus: m.rightKneeValgus,
    },
  };
}

/**
 * Lateral asymmetry — detected from front-stance when one side
 * of the body is consistently higher or more loaded than the other.
 */
export function detectLateralAsymmetry(
  m: PostureMetrics,
  result: AssessmentResult,
): DetectedIssue | null {
  const raw = Math.max(m.shoulderHeightDiff, m.hipHeightDiff, m.lateralShift);
  const MILD = 0.02;
  const MOD = 0.045;

  if (raw < MILD) return null;

  const drivers: string[] = [];
  if (m.shoulderHeightDiff >= MILD) drivers.push('shoulder height');
  if (m.hipHeightDiff >= MILD) drivers.push('hip height');
  if (m.lateralShift >= MILD) drivers.push('weight distribution');

  return {
    id: 'lateral-asymmetry',
    name: 'Left–Right Asymmetry',
    severity: severity(raw, MILD, MOD),
    confidence: confidence(raw, MILD, 0.08),
    explanation: `A measurable left–right imbalance is visible in your ${drivers.join(' and ')}.`,
    meaning: 'Persistent lateral asymmetry can indicate unilateral muscle tightness or weakness, and may increase cumulative load on one side of the body.',
    affectedLandmarks: [
      LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
      LM.LEFT_HIP, LM.RIGHT_HIP,
    ],
    evidenceStepId: 'front-stance',
    evidenceImageUrl: evidenceImage(result, 'front-stance'),
    metrics: {
      shoulderHeightDiff: m.shoulderHeightDiff,
      hipHeightDiff: m.hipHeightDiff,
      lateralShift: m.lateralShift,
      armSymmetry: m.armSymmetry,
    },
  };
}
