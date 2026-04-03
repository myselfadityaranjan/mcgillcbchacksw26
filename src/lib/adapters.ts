/**
 * Adapter contracts — defines the interfaces that Person 1 (pose engine)
 * and Person 2 (coaching engine) must implement to plug into this frontend.
 *
 * The UI layer NEVER imports MediaPipe or coaching logic directly.
 * Instead it calls these interfaces. Swapping implementations = zero UI changes.
 */

import type { PoseFrame, CalibrationState, AssessmentSession, AnalysisResult } from '@/types'

/**
 * IPoseEngine — implemented by Person 1 (Task 1 + Task 2).
 *
 * Lifecycle:
 *   init() → calibrate() [polling] → startCapture() → [frames flow in] → stopCapture() → analyze()
 */
export interface IPoseEngine {
  /** Initialize MediaPipe and request camera access */
  init(videoElement: HTMLVideoElement): Promise<void>

  /** Read calibration state from the current video frame */
  getCalibrationState(): CalibrationState

  /** Start capturing pose frames for a movement step */
  startCapture(): void

  /** Stop capturing and return buffered frames */
  stopCapture(): PoseFrame[]

  /** Run the full posture/asymmetry analysis on a completed session */
  analyze(session: AssessmentSession): Promise<AnalysisResult>

  /** Tear down resources */
  destroy(): void

  /** Whether the engine is ready to process frames */
  readonly isReady: boolean
}

/**
 * Mock pose engine — used during development and demos.
 * Person 1 replaces this with their real implementation.
 */
export class MockPoseEngine implements IPoseEngine {
  isReady = true
  private _capturing = false
  private _frames: PoseFrame[] = []

  async init(_videoElement: HTMLVideoElement): Promise<void> {
    // No-op in mock
    await new Promise((r) => setTimeout(r, 500))
  }

  getCalibrationState(): CalibrationState {
    return {
      isFullBodyVisible: true,
      isDistanceOk: true,
      isLightingOk: true,
      isCentered: true,
      landmarks: null,
      message: 'Mock: ready',
      isReady: true,
    }
  }

  startCapture(): void {
    this._capturing = true
    this._frames = []
  }

  stopCapture(): PoseFrame[] {
    this._capturing = false
    return this._frames
  }

  async analyze(_session: AssessmentSession): Promise<AnalysisResult> {
    await new Promise((r) => setTimeout(r, 2500))
    // Return a mock result with all 5 issues
    return {
      sessionId: _session.id,
      analyzedAt: Date.now(),
      overallScore: 62,
      evidenceFrames: {},
      issues: [
        {
          id: 'rounded_shoulders',
          severity: 'moderate',
          confidence: 'high',
          side: 'bilateral',
          primaryRegion: 'shoulders',
          affectedRegions: ['shoulders', 'thoracic_spine'],
          metrics: {
            primaryDeviation: 18,
            primaryDeviationLabel: 'shoulder protraction angle',
            raw: { shoulderProtraction: 18, upperBackRound: 12 },
          },
          evidenceStepId: 'front_stance',
          evidenceFrameTimestamp: Date.now(),
          strainMap: { shoulders: 0.8, thoracic_spine: 0.5, head_neck: 0.3 },
        },
        {
          id: 'forward_head_posture',
          severity: 'mild',
          confidence: 'high',
          side: 'none',
          primaryRegion: 'head_neck',
          affectedRegions: ['head_neck', 'thoracic_spine'],
          metrics: {
            primaryDeviation: 3.2,
            primaryDeviationLabel: 'head forward offset (cm)',
            raw: { headForwardCm: 3.2, neckAngle: 22 },
          },
          evidenceStepId: 'side_stance',
          evidenceFrameTimestamp: Date.now(),
          strainMap: { head_neck: 0.7, thoracic_spine: 0.4 },
        },
        {
          id: 'anterior_pelvic_tilt',
          severity: 'mild',
          confidence: 'medium',
          side: 'none',
          primaryRegion: 'hips_pelvis',
          affectedRegions: ['hips_pelvis', 'lumbar_spine'],
          metrics: {
            primaryDeviation: 11,
            primaryDeviationLabel: 'pelvic tilt angle (°)',
            raw: { pelvicAngle: 11 },
          },
          evidenceStepId: 'side_stance',
          evidenceFrameTimestamp: Date.now(),
          strainMap: { hips_pelvis: 0.6, lumbar_spine: 0.5 },
        },
        {
          id: 'knee_valgus',
          severity: 'moderate',
          confidence: 'high',
          side: 'bilateral',
          primaryRegion: 'knees',
          affectedRegions: ['knees', 'hips_pelvis', 'ankles_feet'],
          metrics: {
            primaryDeviation: 14,
            primaryDeviationLabel: 'knee valgus angle (°)',
            raw: { leftKneeAngle: 14, rightKneeAngle: 12 },
          },
          evidenceStepId: 'bodyweight_squat',
          evidenceFrameTimestamp: Date.now(),
          strainMap: { knees: 0.85, hips_pelvis: 0.4, ankles_feet: 0.3 },
        },
      ],
    }
  }

  destroy(): void {
    this._capturing = false
    this._frames = []
  }
}
