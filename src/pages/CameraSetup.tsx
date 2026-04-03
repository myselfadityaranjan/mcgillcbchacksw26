import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, ChevronRight, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CameraFeed } from '@/components/camera/CameraFeed'
import { CalibrationOverlay } from '@/components/camera/CalibrationOverlay'
import { PoseCanvas } from '@/components/camera/PoseCanvas'
import { SafetyDisclaimer } from '@/components/layout/SafetyDisclaimer'
import { PageTransition } from '@/components/layout/PageTransition'
import { useCamera } from '@/hooks/useCamera'
import { usePoseEngine } from '@/hooks/usePoseEngine'
import { useAssessmentStore } from '@/store'
import { ROUTES } from '@/lib/constants'

export default function CameraSetup() {
  const navigate = useNavigate()
  const { videoRef, state: cameraState, startCamera, stopCamera } = useCamera('user')
  const { initEngine, calibration, isInitializing } = usePoseEngine(videoRef)
  const startAssessment = useAssessmentStore((s) => s.startAssessment)

  // Start camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  // Init pose engine once camera is running
  useEffect(() => {
    if (cameraState.permission === 'granted') {
      initEngine()
    }
  }, [cameraState.permission, initEngine])

  function handleContinue() {
    startAssessment()
    navigate(ROUTES.SCAN)
  }

  const isReady = calibration.isReady && cameraState.permission === 'granted'

  return (
    <PageTransition className="min-h-screen flex flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.HOME)}>
          ← Back
        </Button>
        <span className="text-text-2 text-sm font-medium">Camera Setup</span>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Camera panel */}
        <div className="flex-1 relative bg-black flex items-center justify-center min-h-[50vh] lg:min-h-0">
          {cameraState.permission === 'denied' || cameraState.permission === 'unavailable' ? (
            <div className="flex flex-col items-center gap-4 p-8 text-center max-w-sm">
              <AlertCircle size={40} className="text-danger" />
              <div>
                <p className="text-text-1 font-semibold">Camera Access Required</p>
                <p className="text-text-2 text-sm mt-1">{cameraState.error}</p>
              </div>
              <Button
                variant="secondary"
                leftIcon={<RotateCcw size={15} />}
                onClick={() => startCamera()}
              >
                Try Again
              </Button>
            </div>
          ) : cameraState.permission === 'requesting' || cameraState.permission === 'idle' ? (
            <div className="flex flex-col items-center gap-3 text-text-2">
              <Camera size={40} className="animate-pulse" />
              <p className="text-sm">Requesting camera access...</p>
            </div>
          ) : (
            <>
              <CameraFeed
                ref={videoRef}
                stream={cameraState.stream}
                className="w-full h-full object-cover"
              />
              <PoseCanvas className="absolute inset-0" />
              <CalibrationOverlay calibration={calibration} isInitializing={isInitializing} />
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 flex flex-col p-6 gap-6 border-t lg:border-t-0 lg:border-l border-border">
          <div>
            <h1 className="text-text-1 text-xl font-bold">Set Up Your Camera</h1>
            <p className="text-text-2 text-sm mt-1.5">
              Position yourself so all 4 checks pass, then continue to the assessment.
            </p>
          </div>

          {/* Checklist status */}
          <div className="space-y-2">
            {[
              { label: 'Full body in frame', passed: calibration.isFullBodyVisible },
              { label: 'Good distance (~6 ft)', passed: calibration.isDistanceOk },
              { label: 'Good lighting', passed: calibration.isLightingOk },
              { label: 'Centered in frame', passed: calibration.isCentered },
            ].map(({ label, passed }) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-lg p-3 border transition-colors duration-300 ${
                  passed
                    ? 'bg-success/8 border-success/25'
                    : 'bg-bg-elevated border-border'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    passed ? 'bg-success' : 'bg-text-3'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    passed ? 'text-success' : 'text-text-2'
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Camera tips */}
          <div className="bg-bg-elevated rounded-lg p-3 space-y-1.5">
            <p className="text-text-3 text-xs font-semibold uppercase tracking-wide">Tips</p>
            {[
              'Stand 6–8 feet from your device',
              'Camera at chest/waist height works best',
              'Wear fitted clothing so your joints are visible',
              'Clear the area around you for the squat',
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-2 text-xs text-text-2">
                <span className="shrink-0 w-1 h-1 rounded-full bg-text-3 mt-1.5" />
                {tip}
              </div>
            ))}
          </div>

          <div className="mt-auto space-y-3">
            <Button
              fullWidth
              size="lg"
              onClick={handleContinue}
              disabled={!isReady}
              rightIcon={<ChevronRight size={18} />}
            >
              {isReady ? 'Begin Assessment' : 'Waiting for camera...'}
            </Button>

            {/* Skip calibration for demo */}
            {cameraState.permission === 'granted' && !isReady && (
              <button
                onClick={handleContinue}
                className="w-full text-center text-xs text-text-3 hover:text-text-2 transition-colors py-1"
              >
                Skip checks (demo mode)
              </button>
            )}

            <SafetyDisclaimer variant="banner" />
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
