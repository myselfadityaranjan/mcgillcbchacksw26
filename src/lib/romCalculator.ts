// ──────────────────────────────────────────────────────────────
// romCalculator.ts — computes range-of-motion angles from peak
// frames captured during the arm-raise and squat steps.
// All angles in degrees.
// ──────────────────────────────────────────────────────────────

import type { AssessmentResult, NormalizedLandmark } from '../types/pose';
import { LM } from './landmarks';

export interface RomData {
  /** Left shoulder elevation (0° = arm at side, 180° = fully overhead) */
  leftShoulderElevation:  number | null;
  /** Right shoulder elevation */
  rightShoulderElevation: number | null;
  /** Hip joint angle at deepest squat (180° = standing, ~90° = parallel) */
  hipSquatAngle:          number | null;
  /** Left knee flexion angle at deepest squat (0° = straight, ~90° = parallel) */
  leftKneeFlexion:        number | null;
  /** Right knee flexion angle */
  rightKneeFlexion:       number | null;
}

// ── Helpers ───────────────────────────────────────────────────

function vis(lm: NormalizedLandmark | undefined, min = 0.35): NormalizedLandmark | null {
  return lm && lm.visibility >= min ? lm : null;
}

/**
 * Angle between two vectors (A→B) and (A→C), in degrees [0, 180].
 * Returns null if either vector is too short to be reliable.
 */
function angleBetween(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark,
): number | null {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const ac = { x: c.x - a.x, y: c.y - a.y };
  const lenAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const lenAC = Math.sqrt(ac.x * ac.x + ac.y * ac.y);
  if (lenAB < 0.04 || lenAC < 0.04) return null;
  const dot = (ab.x * ac.x + ab.y * ac.y) / (lenAB * lenAC);
  return Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
}

/**
 * Shoulder elevation: angle of the arm from the downward vertical.
 *   0°  = arm at side
 *   90° = arm horizontal
 *  180° = arm fully overhead
 * Uses the shoulder-to-wrist vector vs the downward direction (0, +1).
 */
function shoulderElevation(
  shoulder: NormalizedLandmark,
  wrist: NormalizedLandmark,
): number | null {
  const dx = wrist.x - shoulder.x;
  const dy = wrist.y - shoulder.y;   // negative when wrist is above shoulder (y-down)
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.05) return null;
  // acos(dy / len): dy > 0 → arm down → 0°; dy < 0 → arm up → 180°
  return Math.acos(Math.max(-1, Math.min(1, dy / len))) * (180 / Math.PI);
}

// ── Main export ───────────────────────────────────────────────

export function computeRom(result: AssessmentResult): RomData {
  const rom: RomData = {
    leftShoulderElevation:  null,
    rightShoulderElevation: null,
    hipSquatAngle:          null,
    leftKneeFlexion:        null,
    rightKneeFlexion:       null,
  };

  const byStep = new Map(result.captures.map((c) => [c.stepId, c]));

  // ── Arm-raise: shoulder elevation ──────────────────────────
  const armFrame = byStep.get('arm-raise')?.representativeFrame;
  if (armFrame) {
    const lms = armFrame.normalizedLandmarks;
    const ls = vis(lms[LM.LEFT_SHOULDER]);
    const lw = vis(lms[LM.LEFT_WRIST]);
    const rs = vis(lms[LM.RIGHT_SHOULDER]);
    const rw = vis(lms[LM.RIGHT_WRIST]);

    if (ls && lw) rom.leftShoulderElevation  = shoulderElevation(ls, lw);
    if (rs && rw) rom.rightShoulderElevation = shoulderElevation(rs, rw);
  }

  // ── Squat: hip angle + knee flexion at deepest point ───────
  const squatFrame = byStep.get('squat')?.representativeFrame;
  if (squatFrame) {
    const lms = squatFrame.normalizedLandmarks;
    const ls = vis(lms[LM.LEFT_SHOULDER]);
    const rs = vis(lms[LM.RIGHT_SHOULDER]);
    const lh = vis(lms[LM.LEFT_HIP]);
    const rh = vis(lms[LM.RIGHT_HIP]);
    const lk = vis(lms[LM.LEFT_KNEE]);
    const rk = vis(lms[LM.RIGHT_KNEE]);
    const la = vis(lms[LM.LEFT_ANKLE]);
    const ra = vis(lms[LM.RIGHT_ANKLE]);

    // Hip angle: angle at the hip midpoint between shoulder-mid and knee-mid
    if (ls && rs && lh && rh && lk && rk) {
      const hipMid:      NormalizedLandmark = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2, z: 0, visibility: 1 };
      const shoulderMid: NormalizedLandmark = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2, z: 0, visibility: 1 };
      const kneeMid:     NormalizedLandmark = { x: (lk.x + rk.x) / 2, y: (lk.y + rk.y) / 2, z: 0, visibility: 1 };
      rom.hipSquatAngle = angleBetween(hipMid, shoulderMid, kneeMid);
    }

    // Knee flexion: angle at knee between hip and ankle vectors
    if (lh && lk && la) rom.leftKneeFlexion  = angleBetween(lk, lh, la);
    if (rh && rk && ra) rom.rightKneeFlexion = angleBetween(rk, rh, ra);
  }

  return rom;
}

// ── Thresholds for display ────────────────────────────────────

export interface RomThreshold {
  label:       string;
  unit:        string;
  healthyMin:  number;
  healthyMax:  number;
  arcMin:      number;
  arcMax:      number;
  higherIsBetter: boolean;
}

export const ROM_THRESHOLDS: Record<keyof RomData, RomThreshold> = {
  leftShoulderElevation: {
    label: 'Left Shoulder', unit: '°', healthyMin: 160, healthyMax: 180,
    arcMin: 0, arcMax: 180, higherIsBetter: true,
  },
  rightShoulderElevation: {
    label: 'Right Shoulder', unit: '°', healthyMin: 160, healthyMax: 180,
    arcMin: 0, arcMax: 180, higherIsBetter: true,
  },
  hipSquatAngle: {
    label: 'Hip Depth', unit: '°', healthyMin: 80, healthyMax: 110,
    arcMin: 60, arcMax: 180, higherIsBetter: false,
  },
  leftKneeFlexion: {
    label: 'Left Knee', unit: '°', healthyMin: 90, healthyMax: 130,
    arcMin: 60, arcMax: 180, higherIsBetter: false,
  },
  rightKneeFlexion: {
    label: 'Right Knee', unit: '°', healthyMin: 90, healthyMax: 130,
    arcMin: 60, arcMax: 180, higherIsBetter: false,
  },
};

export function romStatus(value: number, threshold: RomThreshold): 'good' | 'warn' | 'poor' {
  const { healthyMin, healthyMax, higherIsBetter } = threshold;
  if (value >= healthyMin && value <= healthyMax) return 'good';
  if (higherIsBetter) {
    return value >= healthyMin * 0.85 ? 'warn' : 'poor';
  }
  return value <= healthyMax * 1.15 ? 'warn' : 'poor';
}
