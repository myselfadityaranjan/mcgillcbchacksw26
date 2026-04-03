/**
 * Pose types — mirrors MediaPipe Pose landmark format.
 * Person 1 (Task 1) produces NormalizedLandmark arrays each frame.
 * All downstream code consumes this contract, never raw MediaPipe types.
 */

export interface NormalizedLandmark {
  x: number    // 0.0 – 1.0, normalized to frame width
  y: number    // 0.0 – 1.0, normalized to frame height
  z: number    // depth relative to hips; smaller = closer to camera
  visibility?: number  // 0.0 – 1.0 confidence
}

/** 33-landmark body model — matches MediaPipe BlazePose topology */
export interface PoseLandmarks {
  nose: NormalizedLandmark
  leftEyeInner: NormalizedLandmark
  leftEye: NormalizedLandmark
  leftEyeOuter: NormalizedLandmark
  rightEyeInner: NormalizedLandmark
  rightEye: NormalizedLandmark
  rightEyeOuter: NormalizedLandmark
  leftEar: NormalizedLandmark
  rightEar: NormalizedLandmark
  leftMouth: NormalizedLandmark
  rightMouth: NormalizedLandmark
  leftShoulder: NormalizedLandmark
  rightShoulder: NormalizedLandmark
  leftElbow: NormalizedLandmark
  rightElbow: NormalizedLandmark
  leftWrist: NormalizedLandmark
  rightWrist: NormalizedLandmark
  leftPinky: NormalizedLandmark
  rightPinky: NormalizedLandmark
  leftIndex: NormalizedLandmark
  rightIndex: NormalizedLandmark
  leftThumb: NormalizedLandmark
  rightThumb: NormalizedLandmark
  leftHip: NormalizedLandmark
  rightHip: NormalizedLandmark
  leftKnee: NormalizedLandmark
  rightKnee: NormalizedLandmark
  leftAnkle: NormalizedLandmark
  rightAnkle: NormalizedLandmark
  leftHeel: NormalizedLandmark
  rightHeel: NormalizedLandmark
  leftFootIndex: NormalizedLandmark
  rightFootIndex: NormalizedLandmark
}

/** Raw flat array (33 items) as returned by MediaPipe, indexed by PoseLandmarkIndex */
export type RawLandmarkArray = NormalizedLandmark[]

/** Landmark indices matching MediaPipe BlazePose ordering */
export const PoseLandmarkIndex = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_MOUTH: 9,
  RIGHT_MOUTH: 10,
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
} as const

export type PoseLandmarkName = keyof typeof PoseLandmarkIndex

/** A single processed frame with pose data */
export interface PoseFrame {
  timestamp: number        // performance.now() at capture time
  landmarks: RawLandmarkArray
  worldLandmarks?: RawLandmarkArray  // 3D world-space, metres from hips
  confidence: number       // overall detection confidence 0–1
  isFullBodyVisible: boolean
}

/** Calibration read from the live feed */
export interface CalibrationState {
  isFullBodyVisible: boolean
  isDistanceOk: boolean       // user ~6–8 ft from camera
  isLightingOk: boolean       // brightness estimate acceptable
  isCentered: boolean         // center of mass near frame centre
  landmarks: RawLandmarkArray | null
  message: string             // human-readable prompt
  isReady: boolean            // all checks pass
}
