// ──────────────────────────────────────────────────────────────
// AssessmentFlow — deterministic state machine for the guided
// movement scan.  All time values are passed in from the caller
// so the machine stays pure and testable.
// ──────────────────────────────────────────────────────────────

import type {
  AssessmentPhase,
  AssessmentState,
  AssessmentStepConfig,
  AssessmentStepId,
  AssessmentResult,
  StepCapture,
  PoseFrame,
} from '../types/pose';
import { LM } from './landmarks';

// ── Step definitions ─────────────────────────────────────────

export const ASSESSMENT_STEPS: AssessmentStepConfig[] = [
  {
    id: 'front-stance',
    name: 'Front Neutral Stance',
    instruction:
      'Stand facing the camera with your feet hip-width apart and arms relaxed at your sides.',
    captureDuration: 3_000,
    type: 'static',
  },
  {
    id: 'side-stance',
    name: 'Side Neutral Stance',
    instruction:
      'Turn to your left so your right side faces the camera. Stand naturally with arms at your sides.',
    captureDuration: 3_000,
    type: 'static',
    requiredLandmarks: [
      LM.NOSE,
      LM.RIGHT_SHOULDER,
      LM.RIGHT_HIP,
      LM.RIGHT_KNEE,
      LM.RIGHT_ANKLE,
    ],
  },
  {
    id: 'arm-raise',
    name: 'Overhead Arm Raise',
    instruction:
      'Face the camera. When recording starts, slowly raise both arms overhead and hold briefly.',
    captureDuration: 5_000,
    type: 'dynamic',
  },
  {
    id: 'squat',
    name: 'Bodyweight Squat',
    instruction:
      'Face the camera. When recording starts, perform one slow, controlled squat and return to standing.',
    captureDuration: 6_000,
    type: 'dynamic',
  },
  {
    id: 'single-leg-balance',
    name: 'Single-Leg Balance',
    instruction:
      'Face the camera. When recording starts, lift your right foot off the ground and balance on your left leg.',
    captureDuration: 5_000,
    type: 'static',
  },
];

// ── Timing constants ─────────────────────────────────────────

/** User must hold passing calibration for this long before we proceed */
const CALIBRATION_HOLD_MS = 1_200;

/** 3-2-1 countdown before capture begins */
const COUNTDOWN_MS = 3_000;

// ── State machine ────────────────────────────────────────────

export class AssessmentFlow {
  // ── internal state ──────────────────────────────────────
  private phase: AssessmentPhase = 'idle';
  private stepIndex = 0;
  private readonly steps: AssessmentStepConfig[];
  private captures: StepCapture[] = [];
  private currentFrames: PoseFrame[] = [];

  // ── timing bookkeeping (all in ms, performance.now scale) ──
  private assessmentStartTime = 0;
  private calibrationReadySince = 0; // 0 = not ready
  private phaseStartTime = 0;

  constructor(steps: AssessmentStepConfig[] = ASSESSMENT_STEPS) {
    this.steps = steps;
  }

  // ── Read state ──────────────────────────────────────────

  getState(): AssessmentState {
    const now = performance.now();
    return {
      phase: this.phase,
      currentStepIndex: this.stepIndex,
      currentStep: this.steps[this.stepIndex] ?? null,
      totalSteps: this.steps.length,
      countdownSecondsLeft: this.countdownSecondsLeft(now),
      captureProgress: this.captureProgress(now),
      completedSteps: this.captures.length,
    };
  }

  getResult(): AssessmentResult {
    const now = performance.now();
    return {
      captures: [...this.captures],
      startedAt: this.assessmentStartTime,
      completedAt: now,
      totalDuration: now - this.assessmentStartTime,
    };
  }

  getSteps(): readonly AssessmentStepConfig[] {
    return this.steps;
  }

  // ── Phase transitions ──────────────────────────────────

  /** idle → calibrating (step 0) */
  start(): void {
    if (this.phase !== 'idle') return;
    this.phase = 'calibrating';
    this.stepIndex = 0;
    this.captures = [];
    this.calibrationReadySince = 0;
    this.assessmentStartTime = performance.now();
  }

  /**
   * Call every frame while in `calibrating` phase when calibration passes.
   * After a sustained hold, automatically transitions to `countdown`.
   */
  onCalibrationReady(now: number): void {
    if (this.phase !== 'calibrating') return;
    if (this.calibrationReadySince === 0) {
      this.calibrationReadySince = now;
    }
    if (now - this.calibrationReadySince >= CALIBRATION_HOLD_MS) {
      this.phase = 'countdown';
      this.phaseStartTime = now;
    }
  }

  /** Call when calibration fails — resets the hold timer. */
  onCalibrationLost(): void {
    this.calibrationReadySince = 0;
  }

  /**
   * Call every frame while in `countdown`.
   * Automatically transitions to `capturing` when the countdown expires.
   */
  tickCountdown(now: number): void {
    if (this.phase !== 'countdown') return;
    if (now - this.phaseStartTime >= COUNTDOWN_MS) {
      this.phase = 'capturing';
      this.phaseStartTime = now;
      this.currentFrames = [];
    }
  }

  /** Buffer a pose frame during the `capturing` phase. */
  addFrame(frame: PoseFrame): void {
    if (this.phase !== 'capturing') return;
    this.currentFrames.push(frame);
  }

  /**
   * Call every frame while in `capturing`.
   * Automatically transitions to `step-complete` when the duration elapses.
   */
  tickCapture(now: number): void {
    if (this.phase !== 'capturing') return;
    const step = this.steps[this.stepIndex];
    if (!step) return;
    if (now - this.phaseStartTime >= step.captureDuration) {
      this.finaliseStep(now);
    }
  }

  /**
   * Move from `step-complete` to the next step's `calibrating`,
   * or to `complete` if that was the last step.
   */
  nextStep(): void {
    if (this.phase !== 'step-complete') return;
    this.stepIndex += 1;
    if (this.stepIndex >= this.steps.length) {
      this.phase = 'complete';
    } else {
      this.phase = 'calibrating';
      this.calibrationReadySince = 0;
    }
  }

  // ── Private helpers ────────────────────────────────────

  private finaliseStep(now: number): void {
    const step = this.steps[this.stepIndex];
    if (!step) return;

    const representativeFrame = this.selectRepresentativeFrame(step);

    this.captures.push({
      stepId: step.id,
      frames: [...this.currentFrames],
      representativeFrame,
      startTime: this.phaseStartTime,
      endTime: now,
    });

    this.currentFrames = [];
    this.phase = 'step-complete';
  }

  /**
   * Pick the "best" frame for the results page.
   *
   * For **static** steps → highest average landmark visibility.
   * For **dynamic** steps → frame at approximate movement peak
   *   (deepest squat = lowest hip Y, highest arm raise = lowest wrist Y, etc.)
   *   Falls back to highest visibility if heuristic can't find a clear peak.
   */
  private selectRepresentativeFrame(step: AssessmentStepConfig): PoseFrame | null {
    if (this.currentFrames.length === 0) return null;

    // Only consider frames that have a snapshot image
    const withSnapshot = this.currentFrames.filter((f) => f.imageDataUrl);
    const pool = withSnapshot.length > 0 ? withSnapshot : this.currentFrames;

    if (step.type === 'dynamic') {
      const peakFrame = this.findPeakFrame(step.id, pool);
      if (peakFrame) return peakFrame;
    }

    // Default: highest average visibility
    return this.highestVisibilityFrame(pool);
  }

  private findPeakFrame(stepId: AssessmentStepId, frames: PoseFrame[]): PoseFrame | null {
    switch (stepId) {
      case 'squat': {
        // Deepest squat = frame where average hip Y is highest (lowest in world space)
        let best: PoseFrame | null = null;
        let bestY = -Infinity;
        for (const f of frames) {
          const hipY =
            (f.normalizedLandmarks[LM.LEFT_HIP]!.y +
              f.normalizedLandmarks[LM.RIGHT_HIP]!.y) /
            2;
          if (hipY > bestY) {
            bestY = hipY;
            best = f;
          }
        }
        return best;
      }
      case 'arm-raise': {
        // Peak = frame where average wrist Y is lowest (highest in the image)
        let best: PoseFrame | null = null;
        let bestY = Infinity;
        for (const f of frames) {
          const wristY =
            (f.normalizedLandmarks[LM.LEFT_WRIST]!.y +
              f.normalizedLandmarks[LM.RIGHT_WRIST]!.y) /
            2;
          if (wristY < bestY) {
            bestY = wristY;
            best = f;
          }
        }
        return best;
      }
      default:
        return null;
    }
  }

  private highestVisibilityFrame(frames: PoseFrame[]): PoseFrame | null {
    if (frames.length === 0) return null;
    let best = frames[0]!;
    let bestScore = -1;

    for (const f of frames) {
      const avg =
        f.normalizedLandmarks.reduce((s, l) => s + l.visibility, 0) /
        f.normalizedLandmarks.length;
      if (avg > bestScore) {
        bestScore = avg;
        best = f;
      }
    }

    return best;
  }

  private countdownSecondsLeft(now: number): number {
    if (this.phase !== 'countdown') return 0;
    const remaining = COUNTDOWN_MS - (now - this.phaseStartTime);
    return Math.max(0, Math.ceil(remaining / 1_000));
  }

  private captureProgress(now: number): number {
    if (this.phase !== 'capturing') return 0;
    const step = this.steps[this.stepIndex];
    if (!step) return 0;
    const elapsed = now - this.phaseStartTime;
    return Math.min(1, elapsed / step.captureDuration);
  }
}
