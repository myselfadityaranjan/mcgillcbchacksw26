import { useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessmentStore } from '@/store'
import { useAnalytics } from './useAnalytics'
import { ROUTES } from '@/lib/constants'
import type { AssessmentMovement } from '@/types'

/**
 * Assessment flow controller hook.
 * Orchestrates the countdown → capture → advance sequence for each step.
 */
export function useAssessment() {
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const timerRef = useRef<number | null>(null)

  const {
    status,
    session,
    currentStepIndex,
    analysisResult,
    correctivePlan,
    startAssessment,
    startStep,
    completeStep,
    skipStep,
    advanceStep,
    completeAssessment,
    setAnalysisResult,
    setCorrectivePlan,
    setError,
    reset,
  } = useAssessmentStore()

  const currentStep = session?.steps[currentStepIndex] ?? null

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /** Begin the assessment, navigate to scan page */
  const begin = useCallback(() => {
    startAssessment()
    track('assessment_started')
    navigate(ROUTES.SCAN)
  }, [startAssessment, track, navigate])

  /** Run a single step: countdown then capture window */
  const runStep = useCallback(
    (movement: AssessmentMovement, onCapture: () => void, onComplete: () => void) => {
      clearTimer()
      startStep(movement)
      track('assessment_step_started', { movement })

      // The countdown is driven by the UI component (CountdownTimer)
      // This hook only manages the capture window timing
      const step = session?.steps.find((s) => s.step.id === movement)
      const captureMs = (step?.step.captureSeconds ?? 3) * 1000

      onCapture()

      timerRef.current = window.setTimeout(() => {
        completeStep(movement)
        track('assessment_step_completed', { movement })
        onComplete()
      }, captureMs)
    },
    [clearTimer, startStep, completeStep, track, session]
  )

  /** Skip the current step */
  const skip = useCallback(
    (movement: AssessmentMovement) => {
      clearTimer()
      skipStep(movement)
      track('assessment_step_skipped', { movement })
      advanceStep()
    },
    [clearTimer, skipStep, advanceStep, track]
  )

  /** Called when all steps are done — trigger analysis */
  const finishScan = useCallback(() => {
    clearTimer()
    completeAssessment()
    track('assessment_completed')
    navigate(ROUTES.ANALYZING)
  }, [clearTimer, completeAssessment, track, navigate])

  /** Called by the Analyzing page once analysis is done */
  const onAnalysisComplete = useCallback(
    (result: Parameters<typeof setAnalysisResult>[0]) => {
      setAnalysisResult(result)
      track('analysis_completed', { issueCount: result.issues.length })
    },
    [setAnalysisResult, track]
  )

  const onPlanGenerated = useCallback(
    (plan: Parameters<typeof setCorrectivePlan>[0]) => {
      setCorrectivePlan(plan)
    },
    [setCorrectivePlan]
  )

  const onError = useCallback(
    (message: string) => {
      setError(message)
      track('analysis_failed', { message })
    },
    [setError, track]
  )

  useEffect(() => {
    return clearTimer
  }, [clearTimer])

  return {
    status,
    session,
    currentStep,
    currentStepIndex,
    analysisResult,
    correctivePlan,
    begin,
    runStep,
    skip,
    finishScan,
    onAnalysisComplete,
    onPlanGenerated,
    onError,
    reset,
  }
}
