// ──────────────────────────────────────────────────────────────
// StrainSense – shared types for the pose capture pipeline
// ──────────────────────────────────────────────────────────────

/** Normalized landmark (0-1 coordinate space, relative to image) */
export interface NormalizedLandmark {
  /** 0.0 (left edge) → 1.0 (right edge) */
  x: number;
  /** 0.0 (top edge)  → 1.0 (bottom edge) */
  y: number;
  /** Depth — negative values are closer to the camera */
  z: number;
  /** Confidence that the landmark is visible, 0.0 → 1.0 */
  visibility: number;
}

/** World-space landmark (meters, origin ≈ hip midpoint) */
export interface WorldLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

// ── Pose frame ───────────────────────────────────────────────

/** A single frame of captured pose data */
export interface PoseFrame {
  normalizedLandmarks: NormalizedLandmark[];
  worldLandmarks: WorldLandmark[];
  /** performance.now() at time of capture */
  timestamp: number;
  /** Base-64 JPEG of the video frame — only present on sampled snapshots */
  imageDataUrl?: string;
}

// ── Assessment step config ───────────────────────────────────

export type AssessmentStepId =
  | 'front-stance'
  | 'side-stance'
  | 'arm-raise'
  | 'squat'
  | 'single-leg-balance';

export interface AssessmentStepConfig {
  id: AssessmentStepId;
  name: string;
  instruction: string;
  /** How long to record pose data (ms) */
  captureDuration: number;
  /** 'static' = user holds a pose; 'dynamic' = user performs a movement */
  type: 'static' | 'dynamic';
  /** Landmark indices that must be visible for this step's calibration.
   *  If omitted the default full-body set is used. */
  requiredLandmarks?: number[];
}

// ── Assessment state (exposed to UI) ─────────────────────────

export type AssessmentPhase =
  | 'idle'
  | 'calibrating'
  | 'countdown'
  | 'capturing'
  | 'step-complete'
  | 'complete';

export interface AssessmentState {
  phase: AssessmentPhase;
  currentStepIndex: number;
  currentStep: AssessmentStepConfig | null;
  totalSteps: number;
  /** Seconds remaining in countdown (0 when not in countdown) */
  countdownSecondsLeft: number;
  /** 0 → 1 progress through current capture window */
  captureProgress: number;
  /** Number of steps already recorded */
  completedSteps: number;
}

// ── Step capture output ──────────────────────────────────────

export interface StepCapture {
  stepId: AssessmentStepId;
  /** Every pose frame recorded during the capture window */
  frames: PoseFrame[];
  /** Best-quality frame (highest avg visibility + has snapshot) */
  representativeFrame: PoseFrame | null;
  startTime: number;
  endTime: number;
}

// ── Full assessment result (consumed by Task 2 analysis) ─────

export interface AssessmentResult {
  captures: StepCapture[];
  startedAt: number;
  completedAt: number;
  /** Wall-clock ms from first step to completion */
  totalDuration: number;
}

// ── Calibration ──────────────────────────────────────────────

export interface CalibrationStatus {
  /** True when every check passes and user is ready to proceed */
  isReady: boolean;
  fullBodyVisible: boolean;
  distance: 'too-close' | 'too-far' | 'ok';
  centering: 'off-left' | 'off-right' | 'ok';
  stability: boolean;
  /** Human-readable prompts to show the user */
  prompts: string[];
}
