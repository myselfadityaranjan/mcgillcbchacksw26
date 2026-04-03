import { useCallback, useRef } from 'react'
import { useCoachingStore } from '@/store'
import { useAnalytics } from './useAnalytics'
import type { DrillId, CoachingFrameState, CoachingSessionStats } from '@/types'

/**
 * Coaching session controller hook.
 * Person 2's coaching engine feeds frames here via pushFrame.
 */
export function useCoaching() {
  const { track } = useAnalytics()
  const sessionStartRef = useRef<number | null>(null)

  const {
    status,
    activeDrillId,
    currentFrame,
    stats,
    smoothedScore,
    scoreHistory,
    unsafeCount,
    isSafetyAlertVisible,
    error,
    startDrill,
    pushFrame,
    pauseDrill,
    resumeDrill,
    completeDrill,
    dismissSafetyAlert,
    setError,
    reset,
  } = useCoachingStore()

  const begin = useCallback(
    (drillId: DrillId) => {
      startDrill(drillId)
      sessionStartRef.current = Date.now()
      track('drill_started', { drillId })
    },
    [startDrill, track]
  )

  const onFrame = useCallback(
    (frame: CoachingFrameState) => {
      pushFrame(frame)

      if (frame.isUnsafe) {
        track('coaching_unsafe_event', {
          drillId: frame.drillId,
          reason: frame.unsafeReason ?? 'unknown',
        })
      }

      if (frame.activeCue?.priority === 'unsafe') {
        track('coaching_cue_fired', {
          drillId: frame.drillId,
          cueId: frame.activeCue.id,
          priority: 'unsafe',
        })
      }
    },
    [pushFrame, track]
  )

  const finish = useCallback(
    (finalStats: CoachingSessionStats) => {
      completeDrill(finalStats)
      track('drill_completed', {
        drillId: finalStats.drillId,
        averageScore: finalStats.averageScore,
        totalReps: finalStats.totalReps,
        correctionsMade: finalStats.correctionsMade,
      })
    },
    [completeDrill, track]
  )

  const onCorrectionMade = useCallback(() => {
    if (activeDrillId) {
      track('coaching_correction_made', { drillId: activeDrillId })
    }
  }, [activeDrillId, track])

  return {
    status,
    activeDrillId,
    currentFrame,
    stats,
    smoothedScore,
    scoreHistory,
    unsafeCount,
    isSafetyAlertVisible,
    error,
    begin,
    onFrame,
    finish,
    pauseDrill,
    resumeDrill,
    dismissSafetyAlert,
    onCorrectionMade,
    setError,
    reset,
  }
}
