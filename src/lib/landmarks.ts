// ──────────────────────────────────────────────────────────────
// MediaPipe Pose landmark indices (33 landmarks)
// https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
// ──────────────────────────────────────────────────────────────

export const LM = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

/** Key landmarks that must be visible for a full-body calibration pass */
export const DEFAULT_REQUIRED_LANDMARKS = [
  LM.NOSE,
  LM.LEFT_SHOULDER,
  LM.RIGHT_SHOULDER,
  LM.LEFT_HIP,
  LM.RIGHT_HIP,
  LM.LEFT_KNEE,
  LM.RIGHT_KNEE,
  LM.LEFT_ANKLE,
  LM.RIGHT_ANKLE,
] as const;

/** Bone connections for skeleton rendering */
export const SKELETON_CONNECTIONS: readonly (readonly [number, number])[] = [
  // Torso
  [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
  [LM.LEFT_SHOULDER, LM.LEFT_HIP],
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP, LM.RIGHT_HIP],

  // Left arm
  [LM.LEFT_SHOULDER, LM.LEFT_ELBOW],
  [LM.LEFT_ELBOW, LM.LEFT_WRIST],

  // Right arm
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
  [LM.RIGHT_ELBOW, LM.RIGHT_WRIST],

  // Left leg
  [LM.LEFT_HIP, LM.LEFT_KNEE],
  [LM.LEFT_KNEE, LM.LEFT_ANKLE],
  [LM.LEFT_ANKLE, LM.LEFT_HEEL],
  [LM.LEFT_ANKLE, LM.LEFT_FOOT_INDEX],

  // Right leg
  [LM.RIGHT_HIP, LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  [LM.RIGHT_ANKLE, LM.RIGHT_HEEL],
  [LM.RIGHT_ANKLE, LM.RIGHT_FOOT_INDEX],

  // Face (minimal — nose to ears for head orientation)
  [LM.NOSE, LM.LEFT_EAR],
  [LM.NOSE, LM.RIGHT_EAR],

  // Neck lines (ear → shoulder — visualises head-forward posture)
  [LM.LEFT_EAR,  LM.LEFT_SHOULDER],
  [LM.RIGHT_EAR, LM.RIGHT_SHOULDER],

  // Left hand triangle
  [LM.LEFT_WRIST,  LM.LEFT_PINKY],
  [LM.LEFT_WRIST,  LM.LEFT_INDEX],
  [LM.LEFT_PINKY,  LM.LEFT_INDEX],

  // Right hand triangle
  [LM.RIGHT_WRIST, LM.RIGHT_PINKY],
  [LM.RIGHT_WRIST, LM.RIGHT_INDEX],
  [LM.RIGHT_PINKY, LM.RIGHT_INDEX],

  // Foot closure
  [LM.LEFT_HEEL,  LM.LEFT_FOOT_INDEX],
  [LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX],
];
