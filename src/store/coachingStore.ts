/**
 * Coaching store — drives the live drill coaching session.
 * Receives per-frame state from Person 2's coaching engine via the adapter hook.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  CoachingStatus,
  CoachingFrameState,
  CoachingSessionStats,
  DrillId,
} from '@/types'

interface CoachingState {
  status: CoachingStatus
  activeDrillId: DrillId | null
  currentFrame: CoachingFrameState | null
  stats: CoachingSessionStats | null
  /** Rolling quality score (smoothed over last N frames) */
  smoothedScore: number
  /** History of recent scores for sparkline display */
  scoreHistory: number[]
  /** How many unsafe events have fired this session */
  unsafeCount: number
  /** Is the safety alert banner currently showing */
  isSafetyAlertVisible: boolean
  error: string | null

  // Actions
  startDrill: (drillId: DrillId) => void
  pushFrame: (frame: CoachingFrameState) => void
  pauseDrill: () => void
  resumeDrill: () => void
  completeDrill: (stats: CoachingSessionStats) => void
  dismissSafetyAlert: () => void
  setError: (error: string) => void
  reset: () => void
}

const SCORE_HISTORY_MAX = 60  // keep last 60 frames (~2s at 30fps)
const SCORE_SMOOTHING = 0.15  // exponential moving average factor

export const useCoachingStore = create<CoachingState>()(
  immer((set) => ({
    status: 'idle',
    activeDrillId: null,
    currentFrame: null,
    stats: null,
    smoothedScore: 0,
    scoreHistory: [],
    unsafeCount: 0,
    isSafetyAlertVisible: false,
    error: null,

    startDrill: (drillId) =>
      set((state) => {
        state.status = 'setup'
        state.activeDrillId = drillId
        state.currentFrame = null
        state.stats = null
        state.smoothedScore = 0
        state.scoreHistory = []
        state.unsafeCount = 0
        state.isSafetyAlertVisible = false
        state.error = null
      }),

    pushFrame: (frame) =>
      set((state) => {
        state.currentFrame = frame
        state.status = 'active'

        // Smooth the score with EMA
        const prev = state.smoothedScore
        state.smoothedScore =
          prev + SCORE_SMOOTHING * (frame.frameScore - prev)

        // Maintain rolling history for sparkline
        state.scoreHistory.push(frame.frameScore)
        if (state.scoreHistory.length > SCORE_HISTORY_MAX) {
          state.scoreHistory.shift()
        }

        // Safety alert logic
        if (frame.isUnsafe) {
          state.unsafeCount += 1
          state.isSafetyAlertVisible = true
          state.status = 'paused'
        }
      }),

    pauseDrill: () =>
      set((state) => {
        state.status = 'paused'
      }),

    resumeDrill: () =>
      set((state) => {
        state.status = 'active'
        state.isSafetyAlertVisible = false
      }),

    completeDrill: (stats) =>
      set((state) => {
        state.status = 'complete'
        state.stats = stats
      }),

    dismissSafetyAlert: () =>
      set((state) => {
        state.isSafetyAlertVisible = false
        state.status = 'active'
      }),

    setError: (error) =>
      set((state) => {
        state.error = error
        state.status = 'idle'
      }),

    reset: () =>
      set((state) => {
        state.status = 'idle'
        state.activeDrillId = null
        state.currentFrame = null
        state.stats = null
        state.smoothedScore = 0
        state.scoreHistory = []
        state.unsafeCount = 0
        state.isSafetyAlertVisible = false
        state.error = null
      }),
  }))
)
