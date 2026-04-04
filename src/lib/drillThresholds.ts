// ──────────────────────────────────────────────────────────────
// drillThresholds.ts — per-drill target ranges and form metrics
// ──────────────────────────────────────────────────────────────

import type { NormalizedLandmark } from '../types/pose';
import type { DrillId } from '../types/plan';
import { LM } from './landmarks';

export interface DrillMetrics {
  [key: string]: number;
}

/** Given the current landmarks, compute drill-specific metrics */
export type MetricFn = (lms: NormalizedLandmark[]) => DrillMetrics;

/** Thresholds that classify form state for each metric */
export interface Threshold {
  green: number;   // value at or below this = green
  yellow: number;  // value at or below this = yellow, else red
}

export interface DrillThresholds {
  metricFn: MetricFn;
  thresholds: Record<string, Threshold>;
}

// ── Helpers ──────────────────────────────────────────────────

const ZERO_LM: NormalizedLandmark = { x: 0, y: 0, z: 0, visibility: 0 };

function lm(lms: NormalizedLandmark[], idx: number): NormalizedLandmark {
  return lms[idx] ?? ZERO_LM;
}

// ── Per-drill definitions ─────────────────────────────────────

const doorwayPecStretch: DrillThresholds = {
  metricFn(lms) {
    const ls = lm(lms, LM.LEFT_SHOULDER);
    const rs = lm(lms, LM.RIGHT_SHOULDER);
    const nose = lm(lms, LM.NOSE);
    const le = lm(lms, LM.LEFT_EAR);
    const re = lm(lms, LM.RIGHT_EAR);

    // Head forward: ear X vs shoulder X (from the front)
    // In front view: check if ears are approximately over shoulders
    const leftEarShoulderDiff = Math.abs(le.x - ls.x);
    const rightEarShoulderDiff = Math.abs(re.x - rs.x);
    const headForward = Math.max(leftEarShoulderDiff, rightEarShoulderDiff);

    // Shoulder height symmetry
    const shoulderSymmetry = Math.abs(ls.y - rs.y);

    // Head tilt from centre
    const shoulderMidX = (ls.x + rs.x) / 2;
    const headTilt = Math.abs(nose.x - shoulderMidX);

    return { headForward, shoulderSymmetry, headTilt };
  },
  thresholds: {
    headForward:       { green: 0.04,  yellow: 0.08 },
    shoulderSymmetry:  { green: 0.025, yellow: 0.05 },
    headTilt:          { green: 0.02,  yellow: 0.04 },
  },
};

const wallAngel: DrillThresholds = {
  metricFn(lms) {
    const ls = lm(lms, LM.LEFT_SHOULDER);
    const rs = lm(lms, LM.RIGHT_SHOULDER);
    const lw = lm(lms, LM.LEFT_WRIST);
    const rw = lm(lms, LM.RIGHT_WRIST);
    const le = lm(lms, LM.LEFT_ELBOW);
    const re = lm(lms, LM.RIGHT_ELBOW);
    const nose = lm(lms, LM.NOSE);

    // Arms should be at or above shoulder height (y decreases upward)
    const leftArmHeight = ls.y - lw.y;   // positive = wrist above shoulder
    const rightArmHeight = rs.y - rw.y;
    const armLowness = Math.max(0, -Math.min(leftArmHeight, rightArmHeight));

    // Elbow symmetry (both elbows should be at similar height)
    const elbowSymmetry = Math.abs(le.y - re.y);

    // Head forward (in front view: nose should be centred over shoulders)
    const shoulderMidX = (ls.x + rs.x) / 2;
    const headDrift = Math.abs(nose.x - shoulderMidX);

    // Arm symmetry left-right
    const armSymmetry = Math.abs(lw.y - rw.y);

    return { armLowness, elbowSymmetry, headDrift, armSymmetry };
  },
  thresholds: {
    armLowness:    { green: 0.03,  yellow: 0.07 },
    elbowSymmetry: { green: 0.03,  yellow: 0.06 },
    headDrift:     { green: 0.025, yellow: 0.05 },
    armSymmetry:   { green: 0.03,  yellow: 0.06 },
  },
};

const hipFlexorStretch: DrillThresholds = {
  metricFn(lms) {
    const ls = lm(lms, LM.LEFT_SHOULDER);
    const rs = lm(lms, LM.RIGHT_SHOULDER);
    const lh = lm(lms, LM.LEFT_HIP);
    const rh = lm(lms, LM.RIGHT_HIP);
    const lk = lm(lms, LM.LEFT_KNEE);

    // Torso lean: shoulders should be over hips (no forward lean)
    const shoulderMidX = (ls.x + rs.x) / 2;
    const hipMidX = (lh.x + rh.x) / 2;
    const torsoLean = Math.abs(shoulderMidX - hipMidX);

    // Shoulder height symmetry
    const shoulderSymmetry = Math.abs(ls.y - rs.y);

    // Hip height: the trailing knee should be lower than the leading hip
    const hipMidY = (lh.y + rh.y) / 2;
    const kneeDropDepth = Math.max(0, hipMidY - lk.y); // expect knee below hip

    return { torsoLean, shoulderSymmetry, kneeDropDepth };
  },
  thresholds: {
    torsoLean:        { green: 0.04,  yellow: 0.08 },
    shoulderSymmetry: { green: 0.025, yellow: 0.05 },
    kneeDropDepth:    { green: 0.04,  yellow: 0.08 },
  },
};

const squatAlignmentDrill: DrillThresholds = {
  metricFn(lms) {
    const lh = lm(lms, LM.LEFT_HIP);
    const lk = lm(lms, LM.LEFT_KNEE);
    const la = lm(lms, LM.LEFT_ANKLE);
    const rh = lm(lms, LM.RIGHT_HIP);
    const rk = lm(lms, LM.RIGHT_KNEE);
    const ra = lm(lms, LM.RIGHT_ANKLE);
    const ls = lm(lms, LM.LEFT_SHOULDER);
    const rs = lm(lms, LM.RIGHT_SHOULDER);

    // Knee valgus: knee x deviates inside hip-ankle line
    const leftValgus = Math.max(0, lk.x - (lh.x + la.x) / 2);
    const rightValgus = Math.max(0, (rh.x + ra.x) / 2 - rk.x);

    // Torso upright: shoulder-hip alignment
    const shoulderMidX = (ls.x + rs.x) / 2;
    const hipMidX = (lh.x + rh.x) / 2;
    const torsoForward = Math.abs(shoulderMidX - hipMidX);

    return { leftValgus, rightValgus, torsoForward };
  },
  thresholds: {
    leftValgus:   { green: 0.02,  yellow: 0.05 },
    rightValgus:  { green: 0.02,  yellow: 0.05 },
    torsoForward: { green: 0.04,  yellow: 0.08 },
  },
};

const splitSquatDrill: DrillThresholds = {
  metricFn(lms) {
    const lh = lm(lms, LM.LEFT_HIP);
    const lk = lm(lms, LM.LEFT_KNEE);
    const la = lm(lms, LM.LEFT_ANKLE);
    const rh = lm(lms, LM.RIGHT_HIP);
    const rk = lm(lms, LM.RIGHT_KNEE);
    const ra = lm(lms, LM.RIGHT_ANKLE);
    const ls = lm(lms, LM.LEFT_SHOULDER);
    const rs = lm(lms, LM.RIGHT_SHOULDER);

    // Front knee alignment (right leg forward in default setup)
    const rightValgus = Math.max(0, (rh.x + ra.x) / 2 - rk.x);
    const leftValgus  = Math.max(0, lk.x - (lh.x + la.x) / 2);

    // Torso lean
    const shoulderMidX = (ls.x + rs.x) / 2;
    const hipMidX = (lh.x + rh.x) / 2;
    const torsoLean = Math.abs(shoulderMidX - hipMidX);

    // Shoulder height symmetry (indicates torso rotation / lateral lean)
    const shoulderSymmetry = Math.abs(ls.y - rs.y);

    return { rightValgus, leftValgus, torsoLean, shoulderSymmetry };
  },
  thresholds: {
    rightValgus:      { green: 0.025, yellow: 0.055 },
    leftValgus:       { green: 0.025, yellow: 0.055 },
    torsoLean:        { green: 0.04,  yellow: 0.08 },
    shoulderSymmetry: { green: 0.025, yellow: 0.05 },
  },
};

const chinTuckExercise: DrillThresholds = {
  metricFn(lms) {
    const nose = lm(lms, LM.NOSE);
    const ls   = lm(lms, LM.LEFT_SHOULDER);
    const rs   = lm(lms, LM.RIGHT_SHOULDER);
    const le   = lm(lms, LM.LEFT_EAR);
    const re   = lm(lms, LM.RIGHT_EAR);

    const shoulderMidX = (ls.x + rs.x) / 2;
    const earMidX      = (le.x + re.x) / 2;

    // Head forward offset from front view: ear should sit over shoulder midline
    const headForward = Math.abs(earMidX - shoulderMidX);

    // Lateral head tilt: nose should be centered over shoulder midpoint
    const headTilt = Math.abs(nose.x - shoulderMidX);

    // Shoulder level
    const shoulderSymmetry = Math.abs(ls.y - rs.y);

    return { headForward, headTilt, shoulderSymmetry };
  },
  thresholds: {
    headForward:      { green: 0.03, yellow: 0.07 },
    headTilt:         { green: 0.02, yellow: 0.04 },
    shoulderSymmetry: { green: 0.025, yellow: 0.05 },
  },
};

const catCowStretch: DrillThresholds = {
  metricFn(lms) {
    const ls = lm(lms, LM.LEFT_SHOULDER);
    const rs = lm(lms, LM.RIGHT_SHOULDER);
    const lh = lm(lms, LM.LEFT_HIP);
    const rh = lm(lms, LM.RIGHT_HIP);

    // Shoulder and hip level symmetry (relevant when viewed from front/side)
    const shoulderSymmetry = Math.abs(ls.y - rs.y);
    const hipSymmetry      = Math.abs(lh.y - rh.y);

    // Torso lateral alignment: shoulder mid should be over hip mid
    const shoulderMidX = (ls.x + rs.x) / 2;
    const hipMidX      = (lh.x + rh.x) / 2;
    const torsoLateral = Math.abs(shoulderMidX - hipMidX);

    return { shoulderSymmetry, hipSymmetry, torsoLateral };
  },
  thresholds: {
    shoulderSymmetry: { green: 0.03, yellow: 0.06 },
    hipSymmetry:      { green: 0.03, yellow: 0.06 },
    torsoLateral:     { green: 0.05, yellow: 0.10 },
  },
};

export const DRILL_THRESHOLDS: Record<DrillId, DrillThresholds> = {
  'doorway-pec-stretch':   doorwayPecStretch,
  'wall-angel':            wallAngel,
  'hip-flexor-stretch':    hipFlexorStretch,
  'squat-alignment-drill': squatAlignmentDrill,
  'split-squat-drill':     splitSquatDrill,
  'chin-tuck-exercise':    chinTuckExercise,
  'cat-cow-stretch':       catCowStretch,
};
