// ──────────────────────────────────────────────────────────────
// Calibration — validate that the user's body is properly
// positioned before starting a capture step
// ──────────────────────────────────────────────────────────────

import type { NormalizedLandmark, CalibrationStatus } from '../types/pose';
import { LM, DEFAULT_REQUIRED_LANDMARKS } from './landmarks';

// ── Thresholds ───────────────────────────────────────────────

/** Minimum per-landmark visibility score to consider it "visible" */
const VISIBILITY_THRESHOLD = 0.6;

/** Fraction of required landmarks that must be visible */
const VISIBILITY_QUORUM = 0.75;

/** Body height (as fraction of frame height) — acceptable range */
const BODY_HEIGHT_MIN = 0.30;
const BODY_HEIGHT_MAX = 0.85;

/** How close the body centre-x must be to 0.5 */
const CENTER_TOLERANCE = 0.15;

/** Frame margin — landmarks shouldn't be within this fraction of edges */
const EDGE_MARGIN = 0.03;

/** Per-landmark average movement (normalised coords) below which we consider stable */
const STABILITY_THRESHOLD = 0.008;

// ── Public API ───────────────────────────────────────────────

/**
 * Check whether the user's body is properly positioned for capture.
 *
 * @param landmarks  Current frame's normalised landmarks (33 items)
 * @param stability  Average per-landmark inter-frame movement from {@link computeStability}
 * @param requiredIndices  Override which landmark indices must be visible (for side-stance etc.)
 */
export function checkCalibration(
  landmarks: NormalizedLandmark[],
  stability: number,
  requiredIndices: readonly number[] = DEFAULT_REQUIRED_LANDMARKS,
): CalibrationStatus {
  const prompts: string[] = [];

  // 1. Full-body visibility (quorum-based so side-stance is forgiving)
  const visibleCount = requiredIndices.filter(
    (idx) => (landmarks[idx]?.visibility ?? 0) >= VISIBILITY_THRESHOLD,
  ).length;
  const fullBodyVisible = visibleCount >= Math.ceil(requiredIndices.length * VISIBILITY_QUORUM);

  if (!fullBodyVisible) {
    prompts.push('Make sure your full body is visible');
  }

  // 2. Distance — body height as fraction of frame
  const shoulderY = Math.min(
    landmarks[LM.LEFT_SHOULDER]!.y,
    landmarks[LM.RIGHT_SHOULDER]!.y,
  );
  const ankleY = Math.max(
    landmarks[LM.LEFT_ANKLE]!.y,
    landmarks[LM.RIGHT_ANKLE]!.y,
  );
  const bodyHeight = ankleY - shoulderY;

  let distance: CalibrationStatus['distance'] = 'ok';
  if (bodyHeight < BODY_HEIGHT_MIN) {
    distance = 'too-far';
    prompts.push('Step closer to the camera');
  } else if (bodyHeight > BODY_HEIGHT_MAX) {
    distance = 'too-close';
    prompts.push('Step further from the camera');
  }

  // 3. Centering — midpoint of hips should be near frame centre
  const centreX =
    (landmarks[LM.LEFT_HIP]!.x + landmarks[LM.RIGHT_HIP]!.x) / 2;

  let centering: CalibrationStatus['centering'] = 'ok';
  if (centreX < 0.5 - CENTER_TOLERANCE) {
    centering = 'off-left';
    prompts.push('Move slightly to the right');
  } else if (centreX > 0.5 + CENTER_TOLERANCE) {
    centering = 'off-right';
    prompts.push('Move slightly to the left');
  }

  // 4. Edge clipping — warn if key landmarks are too close to the frame edge
  const keyIndices = [
    LM.NOSE,
    LM.LEFT_SHOULDER,
    LM.RIGHT_SHOULDER,
    LM.LEFT_ANKLE,
    LM.RIGHT_ANKLE,
  ];
  const clipped = keyIndices.some((idx) => {
    const l = landmarks[idx]!;
    return (
      l.x < EDGE_MARGIN ||
      l.x > 1 - EDGE_MARGIN ||
      l.y < EDGE_MARGIN ||
      l.y > 1 - EDGE_MARGIN
    );
  });
  if (clipped) {
    prompts.push('Step back so your body isn\'t cut off at the edges');
  }

  // 5. Stability
  const isStable = stability < STABILITY_THRESHOLD;
  if (!isStable) {
    prompts.push('Hold still');
  }

  const isReady =
    fullBodyVisible &&
    distance === 'ok' &&
    centering === 'ok' &&
    !clipped &&
    isStable;

  return {
    isReady,
    fullBodyVisible,
    distance,
    centering,
    stability: isStable,
    prompts,
  };
}

// ── Stability helper ─────────────────────────────────────────

/**
 * Compute average per-landmark movement across the last N frames.
 * Returns 0 if fewer than 2 frames are available.
 */
export function computeStability(
  history: NormalizedLandmark[][],
  keyIndices: readonly number[] = DEFAULT_REQUIRED_LANDMARKS,
): number {
  if (history.length < 2) return 0;

  // Use up to the last 15 frames (~0.5 s at 30 fps)
  const window = history.slice(-15);
  let totalMovement = 0;

  for (let i = 1; i < window.length; i++) {
    const prev = window[i - 1]!;
    const curr = window[i]!;

    for (const idx of keyIndices) {
      const p = prev[idx]!;
      const c = curr[idx]!;
      const dx = c.x - p.x;
      const dy = c.y - p.y;
      totalMovement += Math.sqrt(dx * dx + dy * dy);
    }
  }

  return totalMovement / ((window.length - 1) * keyIndices.length);
}
