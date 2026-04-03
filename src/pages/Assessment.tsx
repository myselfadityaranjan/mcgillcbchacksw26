import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CameraFeed } from '@/components/camera/CameraFeed'
import { PoseCanvas } from '@/components/camera/PoseCanvas'
import { StepGuide } from '@/components/assessment/StepGuide'
import { CountdownTimer, CaptureTimer } from '@/components/assessment/CountdownTimer'
import { AssessmentProgress } from '@/components/assessment/AssessmentProgress'
import { StepTransition } from '@/components/layout/PageTransition'
import { useCamera } from '@/hooks/useCamera'
import { usePoseEngine } from '@/hooks/usePoseEngine'
import { useOverlayRenderer } from '@/hooks/useOverlayRenderer'
import { useAssessmentStore, selectCurrentStep } from '@/store'
import { ROUTES } from '@/lib/constants'

type Phase = 'countdown' | 'capturing' | 'complete'

export default function Assessment() {
  const navigate = useNavigate()
  const { videoRef, state: cameraState, startCamera, stopCamera } = useCamera('user')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { initEngine, startCapture, stopCapture } = usePoseEngine(videoRef)

  // Task 6 — overlay renderer (assessment mode: no quality glow, show skeleton + alignment)
  useOverlayRenderer({
    canvasRef,
    videoRef,
    enabled: cameraState.permission === 'granted',
  })

  const {
    session,
    currentStepIndex,
    startStep,
    addFrame: _addFrame,
    completeStep,
    skipStep,
    advanceStep,
    completeAssessment,
  } = useAssessmentStore()

  const currentStepState = useAssessmentStore(selectCurrentStep)
  const [phase, setPhase] = useState<Phase>('countdown')
  const [countdownKey, setCountdownKey] = useState(0)

  const currentStep = currentStepState?.step

  // Start camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  useEffect(() => {
    if (cameraState.permission === 'granted') initEngine()
  }, [cameraState.permission, initEngine])

  // Reset phase when step changes
  useEffect(() => {
    setPhase('countdown')
    setCountdownKey((k) => k + 1)
  }, [currentStepIndex])

  // Guard: if no session or steps, go back to setup
  useEffect(() => {
    if (!session) navigate(ROUTES.SETUP, { replace: true })
  }, [session, navigate])

  if (!session || !currentStep || !currentStepState) return null

  function handleCountdownComplete() {
    if (!currentStep) return
    setPhase('capturing')
    startCapture()
    startStep(currentStep.id)
  }

  function handleCaptureComplete() {
    if (!currentStep) return
    setPhase('complete')
    stopCapture()
    completeStep(currentStep.id)

    // Brief pause to show completion, then advance
    setTimeout(() => {
      if (session && currentStepIndex >= session.steps.length - 1) {
        completeAssessment()
        navigate(ROUTES.ANALYZING)
      } else {
        advanceStep()
      }
    }, 800)
  }

  function handleSkip() {
    if (!currentStep) return
    stopCapture()
    skipStep(currentStep.id)

    if (session && currentStepIndex >= session.steps.length - 1) {
      completeAssessment()
      navigate(ROUTES.ANALYZING)
    } else {
      advanceStep()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.SETUP)}>
          ← Exit
        </Button>
        {session && (
          <AssessmentProgress steps={session.steps} currentIndex={currentStepIndex} />
        )}
        <span className="text-text-3 text-xs font-mono">
          {currentStepIndex + 1} / {session.steps.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Camera */}
        <div className="flex-1 relative bg-black min-h-[50vh] lg:min-h-0">
          {cameraState.permission === 'granted' && (
            <>
              <CameraFeed ref={videoRef} stream={cameraState.stream} />
              <PoseCanvas ref={canvasRef} />
            </>
          )}

          {/* Step label overlay */}
          <div className="absolute top-3 left-3 bg-bg/80 backdrop-blur-sm border border-border rounded-full px-3 py-1">
            <span className="text-xs font-semibold text-text-1">{currentStep.label}</span>
          </div>

          {/* Phase badge */}
          <div className="absolute top-3 right-3">
            {phase === 'capturing' && (
              <CaptureTimer
                seconds={currentStep.captureSeconds}
                onComplete={handleCaptureComplete}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 flex flex-col p-6 gap-6 border-t lg:border-t-0 lg:border-l border-border">
          <AnimatePresence mode="wait">
            <StepTransition stepKey={`${currentStepIndex}-${phase}`}>
              <div className="space-y-6">
                {/* Step guide */}
                <StepGuide step={currentStep} phase={phase} />

                {/* Countdown */}
                {phase === 'countdown' && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-text-3 text-xs text-center">Get into position</p>
                    <CountdownTimer
                      key={countdownKey}
                      seconds={currentStep.countdownSeconds}
                      onComplete={handleCountdownComplete}
                      label="seconds to get ready"
                    />
                  </div>
                )}

                {/* Skip */}
                {phase === 'countdown' && currentStep.isOptional && (
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    leftIcon={<SkipForward size={14} />}
                    onClick={handleSkip}
                  >
                    Skip this step
                  </Button>
                )}

                {!currentStep.isOptional && phase === 'countdown' && (
                  <button
                    onClick={handleSkip}
                    className="text-center text-xs text-text-3 hover:text-text-2 transition-colors"
                  >
                    Skip anyway
                  </button>
                )}
              </div>
            </StepTransition>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
