/**
 * Assessment store — drives the guided scan flow.
 * Owns state from camera setup through analysis completion.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  AssessmentStatus,
  AssessmentSession,
  AssessmentStepState,
  AssessmentMovement,
  CalibrationState,
  PoseFrame,
  AnalysisResult,
  CorrectivePlan,
} from '@/types'
import { ASSESSMENT_STEPS } from '@/data/assessmentSteps'

interface AssessmentState {
  status: AssessmentStatus
  session: AssessmentSession | null
  currentStepIndex: number
  calibration: CalibrationState
  analysisResult: AnalysisResult | null
  correctivePlan: CorrectivePlan | null
  error: string | null

  // Actions
  startAssessment: () => void
  setCalibration: (cal: CalibrationState) => void
  startStep: (movement: AssessmentMovement) => void
  addFrame: (movement: AssessmentMovement, frame: PoseFrame) => void
  completeStep: (movement: AssessmentMovement) => void
  skipStep: (movement: AssessmentMovement) => void
  advanceStep: () => void
  completeAssessment: () => void
  setAnalysisResult: (result: AnalysisResult) => void
  setCorrectivePlan: (plan: CorrectivePlan) => void
  setError: (error: string) => void
  reset: () => void
}

const defaultCalibration: CalibrationState = {
  isFullBodyVisible: false,
  isDistanceOk: false,
  isLightingOk: false,
  isCentered: false,
  landmarks: null,
  message: 'Position your full body in frame',
  isReady: false,
}

const buildInitialSteps = (): AssessmentStepState[] =>
  ASSESSMENT_STEPS.map((step) => ({
    step,
    status: 'pending',
    frames: [],
    representativeFrame: null,
    startedAt: null,
    completedAt: null,
  }))

export const useAssessmentStore = create<AssessmentState>()(
  immer((set, get) => ({
    status: 'idle',
    session: null,
    currentStepIndex: 0,
    calibration: defaultCalibration,
    analysisResult: null,
    correctivePlan: null,
    error: null,

    startAssessment: () =>
      set((state) => {
        state.status = 'calibrating'
        state.session = {
          id: crypto.randomUUID(),
          startedAt: Date.now(),
          completedAt: null,
          steps: buildInitialSteps(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            cameraLabel: '',
            cameraWidth: 0,
            cameraHeight: 0,
          },
        }
        state.currentStepIndex = 0
        state.error = null
      }),

    setCalibration: (cal) =>
      set((state) => {
        state.calibration = cal
        if (cal.isReady && state.status === 'calibrating') {
          state.status = 'scanning'
        }
      }),

    startStep: (movement) =>
      set((state) => {
        const step = state.session?.steps.find((s) => s.step.id === movement)
        if (step) {
          step.status = 'active'
          step.startedAt = Date.now()
        }
      }),

    addFrame: (movement, frame) =>
      set((state) => {
        const step = state.session?.steps.find((s) => s.step.id === movement)
        if (step) {
          step.frames.push(frame)
          // Keep the highest-confidence frame as representative
          if (
            !step.representativeFrame ||
            frame.confidence > step.representativeFrame.confidence
          ) {
            step.representativeFrame = frame
          }
          if (step.status === 'active') {
            step.status = 'capturing'
          }
        }
      }),

    completeStep: (movement) =>
      set((state) => {
        const step = state.session?.steps.find((s) => s.step.id === movement)
        if (step) {
          step.status = 'complete'
          step.completedAt = Date.now()
        }
      }),

    skipStep: (movement) =>
      set((state) => {
        const step = state.session?.steps.find((s) => s.step.id === movement)
        if (step) {
          step.status = 'skipped'
          step.completedAt = Date.now()
        }
      }),

    advanceStep: () =>
      set((state) => {
        const totalSteps = state.session?.steps.length ?? 0
        if (state.currentStepIndex < totalSteps - 1) {
          state.currentStepIndex += 1
        }
      }),

    completeAssessment: () =>
      set((state) => {
        state.status = 'complete'
        if (state.session) {
          state.session.completedAt = Date.now()
        }
      }),

    setAnalysisResult: (result) =>
      set((state) => {
        state.analysisResult = result
      }),

    setCorrectivePlan: (plan) =>
      set((state) => {
        state.correctivePlan = plan
      }),

    setError: (error) =>
      set((state) => {
        state.error = error
        state.status = 'error'
      }),

    reset: () =>
      set((state) => {
        state.status = 'idle'
        state.session = null
        state.currentStepIndex = 0
        state.calibration = defaultCalibration
        state.analysisResult = null
        state.correctivePlan = null
        state.error = null
      }),
  }))
)

// Selectors
export const selectCurrentStep = (state: AssessmentState) =>
  state.session?.steps[state.currentStepIndex] ?? null

export const selectCompletedStepCount = (state: AssessmentState) =>
  state.session?.steps.filter((s) => s.status === 'complete').length ?? 0

export const selectIsLastStep = (state: AssessmentState) =>
  state.currentStepIndex === (state.session?.steps.length ?? 1) - 1
