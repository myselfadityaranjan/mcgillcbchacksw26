/**
 * Task 6 — Mock landmark generator.
 * Produces realistic-looking 33-landmark arrays so the overlay system
 * looks impressive from frame one, with no real MediaPipe data needed.
 *
 * Supports two poses:
 *   'standing' — neutral anatomical stance (used in calibration / assessment)
 *   'squat'    — bottom of squat position (used in coaching)
 *
 * All positions oscillate with subtle natural motion to simulate live detection.
 */

import { PoseLandmarkIndex } from '@/types/pose'
import type { RawLandmarkArray, NormalizedLandmark } from '@/types/pose'

export type MockPose = 'standing' | 'squat' | 'overhead'

/** Base normalized positions for a standing person */
const STANDING_BASE: Record<number, [number, number]> = {
  [PoseLandmarkIndex.NOSE]:             [0.500, 0.070],
  [PoseLandmarkIndex.LEFT_EYE_INNER]:   [0.515, 0.062],
  [PoseLandmarkIndex.LEFT_EYE]:         [0.528, 0.060],
  [PoseLandmarkIndex.LEFT_EYE_OUTER]:   [0.542, 0.062],
  [PoseLandmarkIndex.RIGHT_EYE_INNER]:  [0.485, 0.062],
  [PoseLandmarkIndex.RIGHT_EYE]:        [0.472, 0.060],
  [PoseLandmarkIndex.RIGHT_EYE_OUTER]:  [0.458, 0.062],
  [PoseLandmarkIndex.LEFT_EAR]:         [0.555, 0.070],
  [PoseLandmarkIndex.RIGHT_EAR]:        [0.445, 0.070],
  [PoseLandmarkIndex.LEFT_MOUTH]:       [0.516, 0.090],
  [PoseLandmarkIndex.RIGHT_MOUTH]:      [0.484, 0.090],

  [PoseLandmarkIndex.LEFT_SHOULDER]:    [0.610, 0.225],
  [PoseLandmarkIndex.RIGHT_SHOULDER]:   [0.390, 0.225],
  [PoseLandmarkIndex.LEFT_ELBOW]:       [0.650, 0.360],
  [PoseLandmarkIndex.RIGHT_ELBOW]:      [0.350, 0.360],
  [PoseLandmarkIndex.LEFT_WRIST]:       [0.660, 0.495],
  [PoseLandmarkIndex.RIGHT_WRIST]:      [0.340, 0.495],
  [PoseLandmarkIndex.LEFT_PINKY]:       [0.672, 0.525],
  [PoseLandmarkIndex.RIGHT_PINKY]:      [0.328, 0.525],
  [PoseLandmarkIndex.LEFT_INDEX]:       [0.668, 0.515],
  [PoseLandmarkIndex.RIGHT_INDEX]:      [0.332, 0.515],
  [PoseLandmarkIndex.LEFT_THUMB]:       [0.650, 0.508],
  [PoseLandmarkIndex.RIGHT_THUMB]:      [0.350, 0.508],

  [PoseLandmarkIndex.LEFT_HIP]:         [0.570, 0.530],
  [PoseLandmarkIndex.RIGHT_HIP]:        [0.430, 0.530],
  [PoseLandmarkIndex.LEFT_KNEE]:        [0.575, 0.700],
  [PoseLandmarkIndex.RIGHT_KNEE]:       [0.425, 0.700],
  [PoseLandmarkIndex.LEFT_ANKLE]:       [0.570, 0.870],
  [PoseLandmarkIndex.RIGHT_ANKLE]:      [0.430, 0.870],
  [PoseLandmarkIndex.LEFT_HEEL]:        [0.565, 0.895],
  [PoseLandmarkIndex.RIGHT_HEEL]:       [0.435, 0.895],
  [PoseLandmarkIndex.LEFT_FOOT_INDEX]:  [0.578, 0.915],
  [PoseLandmarkIndex.RIGHT_FOOT_INDEX]: [0.422, 0.915],
}

/** Squat position — knees bent, torso leaning slightly forward */
const SQUAT_BASE: Record<number, [number, number]> = {
  [PoseLandmarkIndex.NOSE]:             [0.500, 0.155],
  [PoseLandmarkIndex.LEFT_EYE_INNER]:   [0.515, 0.147],
  [PoseLandmarkIndex.LEFT_EYE]:         [0.528, 0.145],
  [PoseLandmarkIndex.LEFT_EYE_OUTER]:   [0.542, 0.147],
  [PoseLandmarkIndex.RIGHT_EYE_INNER]:  [0.485, 0.147],
  [PoseLandmarkIndex.RIGHT_EYE]:        [0.472, 0.145],
  [PoseLandmarkIndex.RIGHT_EYE_OUTER]:  [0.458, 0.147],
  [PoseLandmarkIndex.LEFT_EAR]:         [0.555, 0.155],
  [PoseLandmarkIndex.RIGHT_EAR]:        [0.445, 0.155],
  [PoseLandmarkIndex.LEFT_MOUTH]:       [0.516, 0.170],
  [PoseLandmarkIndex.RIGHT_MOUTH]:      [0.484, 0.170],

  [PoseLandmarkIndex.LEFT_SHOULDER]:    [0.625, 0.310],
  [PoseLandmarkIndex.RIGHT_SHOULDER]:   [0.375, 0.310],
  [PoseLandmarkIndex.LEFT_ELBOW]:       [0.680, 0.430],
  [PoseLandmarkIndex.RIGHT_ELBOW]:      [0.320, 0.430],
  [PoseLandmarkIndex.LEFT_WRIST]:       [0.610, 0.510],
  [PoseLandmarkIndex.RIGHT_WRIST]:      [0.390, 0.510],
  [PoseLandmarkIndex.LEFT_PINKY]:       [0.618, 0.535],
  [PoseLandmarkIndex.RIGHT_PINKY]:      [0.382, 0.535],
  [PoseLandmarkIndex.LEFT_INDEX]:       [0.615, 0.528],
  [PoseLandmarkIndex.RIGHT_INDEX]:      [0.385, 0.528],
  [PoseLandmarkIndex.LEFT_THUMB]:       [0.600, 0.522],
  [PoseLandmarkIndex.RIGHT_THUMB]:      [0.400, 0.522],

  [PoseLandmarkIndex.LEFT_HIP]:         [0.595, 0.560],
  [PoseLandmarkIndex.RIGHT_HIP]:        [0.405, 0.560],
  [PoseLandmarkIndex.LEFT_KNEE]:        [0.640, 0.730],
  [PoseLandmarkIndex.RIGHT_KNEE]:       [0.360, 0.730],
  [PoseLandmarkIndex.LEFT_ANKLE]:       [0.590, 0.870],
  [PoseLandmarkIndex.RIGHT_ANKLE]:      [0.410, 0.870],
  [PoseLandmarkIndex.LEFT_HEEL]:        [0.578, 0.892],
  [PoseLandmarkIndex.RIGHT_HEEL]:       [0.422, 0.892],
  [PoseLandmarkIndex.LEFT_FOOT_INDEX]:  [0.602, 0.910],
  [PoseLandmarkIndex.RIGHT_FOOT_INDEX]: [0.398, 0.910],
}

/** Overhead raise — arms lifted */
const OVERHEAD_BASE: Record<number, [number, number]> = {
  ...STANDING_BASE,
  [PoseLandmarkIndex.LEFT_ELBOW]:       [0.620, 0.130],
  [PoseLandmarkIndex.RIGHT_ELBOW]:      [0.380, 0.130],
  [PoseLandmarkIndex.LEFT_WRIST]:       [0.600, 0.040],
  [PoseLandmarkIndex.RIGHT_WRIST]:      [0.400, 0.040],
  [PoseLandmarkIndex.LEFT_PINKY]:       [0.598, 0.018],
  [PoseLandmarkIndex.RIGHT_PINKY]:      [0.402, 0.018],
  [PoseLandmarkIndex.LEFT_INDEX]:       [0.595, 0.022],
  [PoseLandmarkIndex.RIGHT_INDEX]:      [0.405, 0.022],
  [PoseLandmarkIndex.LEFT_THUMB]:       [0.610, 0.028],
  [PoseLandmarkIndex.RIGHT_THUMB]:      [0.390, 0.028],
}

const POSE_MAP: Record<MockPose, Record<number, [number, number]>> = {
  standing: STANDING_BASE,
  squat:    SQUAT_BASE,
  overhead: OVERHEAD_BASE,
}

/** Per-landmark oscillation amplitude (subtle, different per landmark for naturalness) */
const OSCILLATION: Record<number, [number, number, number]> = {
  // [amplitudeX, amplitudeY, phaseOffset]
  [PoseLandmarkIndex.NOSE]:            [0.002, 0.002, 0.0],
  [PoseLandmarkIndex.LEFT_SHOULDER]:   [0.003, 0.002, 0.3],
  [PoseLandmarkIndex.RIGHT_SHOULDER]:  [0.003, 0.002, 0.6],
  [PoseLandmarkIndex.LEFT_ELBOW]:      [0.005, 0.004, 0.9],
  [PoseLandmarkIndex.RIGHT_ELBOW]:     [0.005, 0.004, 1.2],
  [PoseLandmarkIndex.LEFT_WRIST]:      [0.007, 0.006, 1.5],
  [PoseLandmarkIndex.RIGHT_WRIST]:     [0.007, 0.006, 1.8],
  [PoseLandmarkIndex.LEFT_HIP]:        [0.002, 0.001, 0.5],
  [PoseLandmarkIndex.RIGHT_HIP]:       [0.002, 0.001, 0.8],
  [PoseLandmarkIndex.LEFT_KNEE]:       [0.003, 0.003, 1.1],
  [PoseLandmarkIndex.RIGHT_KNEE]:      [0.003, 0.003, 1.4],
  [PoseLandmarkIndex.LEFT_ANKLE]:      [0.002, 0.001, 1.7],
  [PoseLandmarkIndex.RIGHT_ANKLE]:     [0.002, 0.001, 2.0],
}

const DEFAULT_OSC: [number, number, number] = [0.001, 0.001, 0]

/**
 * Generate a complete 33-landmark array for the given pose and time.
 *
 * @param pose  Which pose to generate
 * @param t     Current time in seconds (for oscillation)
 * @param freq  Oscillation frequency (default 0.6 Hz — natural sway)
 */
export function generateMockLandmarks(
  pose: MockPose,
  t: number,
  freq = 0.6
): RawLandmarkArray {
  const base = POSE_MAP[pose]
  const landmarks: NormalizedLandmark[] = []

  for (let i = 0; i < 33; i++) {
    const pos = base[i]
    if (!pos) {
      // Interpolate for any missing landmark from standing
      const fallback = STANDING_BASE[i] ?? [0.5, 0.5]
      landmarks.push({ x: fallback[0], y: fallback[1], z: 0, visibility: 0.5 })
      continue
    }

    const [ax, ay, phase] = OSCILLATION[i] ?? DEFAULT_OSC
    const theta = 2 * Math.PI * freq * t + phase

    landmarks.push({
      x: pos[0] + ax * Math.sin(theta),
      y: pos[1] + ay * Math.cos(theta * 0.7),
      z: 0,
      visibility: 0.92 + 0.08 * Math.sin(theta * 0.3 + phase),
    })
  }

  return landmarks
}
