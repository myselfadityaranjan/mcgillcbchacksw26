// ──────────────────────────────────────────────────────────────
// Analysis types — Task 2 output, consumed by Tasks 3–6
// ──────────────────────────────────────────────────────────────

import type { NormalizedLandmark } from './pose';

export type IssueId =
  | 'rounded-shoulders'
  | 'forward-head-posture'
  | 'anterior-pelvic-tilt'
  | 'knee-valgus'
  | 'lateral-asymmetry';

export type Severity = 'mild' | 'moderate' | 'significant';

export interface DetectedIssue {
  id: IssueId;
  name: string;
  severity: Severity;
  /** 0–1, higher = more confident in the detection */
  confidence: number;
  /** One sentence: what was observed */
  explanation: string;
  /** One sentence: why it matters clinically */
  meaning: string;
  /** MediaPipe landmark indices to highlight for this issue */
  affectedLandmarks: number[];
  /** Which assessment step provided the evidence */
  evidenceStepId: string;
  /** Base64 JPEG of the representative frame, if available */
  evidenceImageUrl?: string;
  /** Raw metric values used for detection (for debugging / display) */
  metrics: Record<string, number>;
  /** Normalized landmarks from the evidence frame — used by AnnotatedEvidence to draw skeleton overlay */
  evidenceLandmarks?: NormalizedLandmark[];
}

// ── Derived biomechanical metrics ────────────────────────────

export interface PostureMetrics {
  // ── From front-stance ──────────────────────────
  /** |leftShoulder.y − rightShoulder.y| in normalised coords */
  shoulderHeightDiff: number;
  /** |leftHip.y − rightHip.y| */
  hipHeightDiff: number;
  /** Distance of hip midpoint x from 0.5 (frame centre) */
  lateralShift: number;
  /** |nose.x − shoulderMid.x|, non-zero = head tilted */
  headTilt: number;

  // ── From side-stance ───────────────────────────
  /** rightShoulder.x − rightEar.x (positive = ear is forward of shoulder) */
  headForwardOffset: number;
  /** rightHip.x − rightShoulder.x (positive = shoulder forward of hip) */
  torsoForwardLean: number;
  /** rightKnee.x − rightHip.x (positive = hip forward of knee, APT proxy) */
  hipForwardPosition: number;
  /** 0–1: how well the side-stance landmarks were visible */
  sidePoseConfidence: number;

  // ── From squat (peak frame) ────────────────────
  /** leftKnee.x − midline(leftHip.x, leftAnkle.x), positive = valgus */
  leftKneeValgus: number;
  /** midline(rightHip.x, rightAnkle.x) − rightKnee.x, positive = valgus */
  rightKneeValgus: number;
  /** 0–1: how well the squat landmarks were visible */
  squatPoseConfidence: number;

  // ── From arm-raise (peak frame) ────────────────
  /** |leftWrist.y − rightWrist.y| at peak overhead position */
  armSymmetry: number;
}

// ── Final analysis result ────────────────────────────────────

export interface AnalysisResult {
  issues: DetectedIssue[];
  metrics: PostureMetrics;
  analyzedAt: number;
}
