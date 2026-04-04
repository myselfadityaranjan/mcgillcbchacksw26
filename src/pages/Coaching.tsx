import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, Pause, Play, CheckCircle2, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CameraFeed } from '@/components/camera/CameraFeed'
import { PoseCanvas } from '@/components/camera/PoseCanvas'
import { LiveCueCard } from '@/components/coaching/LiveCueCard'
import { QualityScore } from '@/components/coaching/QualityScore'
import { SafetyAlert } from '@/components/coaching/SafetyAlert'
import { HoldTimer } from '@/components/coaching/HoldTimer'
import { StatusBar } from '@/components/ui/StatusIndicator'
import { MetricPill } from '@/components/ui/MetricPill'
import { useCamera } from '@/hooks/useCamera'
import { useCoaching } from '@/hooks/useCoaching'
import { useOverlayRenderer } from '@/hooks/useOverlayRenderer'
import { useSpeechCue } from '@/hooks/useSpeechCue'
import { useCoachingStore, useUiStore } from '@/store'
import { getDrillById } from '@/data/drills'
import { cn } from '@/lib/cn'
import type { DrillId, CoachingFrameState, FormQuality } from '@/types'
import { ROUTES } from '@/lib/constants'

/** Mock coaching engine that generates realistic-looking per-frame state */
function useMockCoachingEngine(drillId: DrillId | null, onFrame: (f: CoachingFrameState) => void) {
  const rafRef = useRef<number | null>(null)
  const frameRef = useRef(0)

  useEffect(() => {
    if (!drillId) return

    const tick = () => {
      frameRef.current++
      const t = frameRef.current

      // Oscillate quality over time for demo
      const cycle = Math.sin(t / 40)
      const score = Math.round(50 + cycle * 35)
      const quality: FormQuality = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red'
      const isUnsafe = score < 25

      const cues = [
        { id: 'push_knees', text: 'Push knees outward', priority: 'major' as const, joints: ['knees'], arrowDirection: 'outward' as const },
        { id: 'chest_up', text: 'Lift your chest', priority: 'minor' as const, joints: ['thoracic_spine'], arrowDirection: 'up' as const },
        { id: 'unsafe_knee', text: 'Stop — knee collapsing inward', priority: 'unsafe' as const, joints: ['knees'] },
      ]

      const activeCue =
        isUnsafe ? cues[2] :
        quality === 'yellow' ? cues[0] :
        quality === 'green' ? null : cues[1]

      onFrame({
        timestamp: Date.now(),
        drillId,
        frame: { timestamp: Date.now(), landmarks: [], confidence: 0.9, isFullBodyVisible: true },
        metrics: { kneeValgusAngle: Math.round(cycle * 15) },
        quality,
        activeCue,
        allCues: activeCue ? [activeCue] : [],
        isUnsafe,
        unsafeReason: isUnsafe ? 'Knee valgus exceeds safe threshold' : undefined,
        frameScore: score,
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [drillId, onFrame])
}

export default function Coaching() {
  const { drillId } = useParams<{ drillId: string }>()
  const navigate = useNavigate()
  const { videoRef, state: cameraState, startCamera, stopCamera } = useCamera('user')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [repCount, setRepCount] = useState(0)
  const { audioFeedback, toggleAudioFeedback } = useUiStore()

  const {
    status,
    currentFrame,
    smoothedScore,
    scoreHistory,
    isSafetyAlertVisible,
    begin,
    onFrame,
    finish,
    pauseDrill,
    resumeDrill,
    dismissSafetyAlert,
  } = useCoaching()

  const drill = drillId ? getDrillById(drillId) : null

  // Task 6 — overlay renderer
  const { pushCoachingFrame } = useOverlayRenderer({
    canvasRef,
    videoRef,
    enabled: cameraState.permission === 'granted',
  })

  // Audio coaching cues
  const { speak, speakRaw } = useSpeechCue()

  // Start camera
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  // Start coaching
  useEffect(() => {
    if (drill) begin(drill.id as DrillId)
  }, [drill, begin])

  // Mock coaching engine (Person 2 replaces with real engine)
  const stableOnFrame = useCallback(onFrame, [onFrame])
  useMockCoachingEngine(drill?.id as DrillId ?? null, stableOnFrame)

  // Track reps, speak cues, push overlay state
  const prevQualityRef = useRef<string | null>(null)
  const prevCueIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!currentFrame) return

    // Rep counting
    if (prevQualityRef.current === 'yellow' && currentFrame.quality === 'green') {
      setRepCount((r) => r + 1)
    }

    // Audio: speak quality transitions
    if (prevQualityRef.current !== currentFrame.quality) {
      if (currentFrame.quality === 'green' && prevQualityRef.current !== null) {
        speakRaw('Good form', 0.9)
      } else if (currentFrame.quality === 'red') {
        speakRaw('Stop — check your form', 1.05)
      }
    }
    prevQualityRef.current = currentFrame.quality

    // Audio: speak new coaching cues (debounced inside hook)
    const cue = currentFrame.activeCue
    if (cue && cue.id !== prevCueIdRef.current) {
      speak(cue)
      prevCueIdRef.current = cue.id
    } else if (!cue) {
      prevCueIdRef.current = null
    }

    // Overlay
    pushCoachingFrame(
      currentFrame.quality,
      currentFrame.activeCue,
      currentFrame.frame.landmarks.length > 0 ? currentFrame.frame.landmarks : null,
      currentFrame.frame.confidence
    )
  }, [currentFrame, pushCoachingFrame, speak, speakRaw])

  if (!drill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-text-2">
        Drill not found. <Button onClick={() => navigate(-1)} variant="ghost" className="ml-2">Go back</Button>
      </div>
    )
  }

  const quality = currentFrame?.quality ?? 'green'
  const activeCue = currentFrame?.activeCue ?? null

  const borderColorMap: Record<FormQuality, string> = {
    green: 'shadow-glow-success',
    yellow: 'shadow-glow-warning',
    red: 'shadow-glow-danger',
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border z-20 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { stopCamera(); navigate(-1) }}
          leftIcon={<X size={14} />}
        >
          End
        </Button>
        <div className="text-center">
          <p className="text-text-1 text-sm font-bold">{drill.name}</p>
          <p className="text-text-3 text-xs">{drill.reps ? `${drill.reps} reps` : `${drill.durationSeconds}s hold`}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAudioFeedback}
            leftIcon={audioFeedback ? <Volume2 size={14} className="text-brand" /> : <VolumeX size={14} />}
            title={audioFeedback ? 'Voice cues on' : 'Voice cues off'}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => status === 'paused' ? resumeDrill() : pauseDrill()}
            leftIcon={status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
          >
            {status === 'paused' ? 'Resume' : 'Pause'}
          </Button>
        </div>
      </div>

      {/* Camera + overlay area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Camera column */}
        <div
          className={cn(
            'flex-1 relative bg-black min-h-[55vh] lg:min-h-0 transition-shadow duration-300',
            borderColorMap[quality]
          )}
        >
          {cameraState.permission === 'granted' && (
            <>
              <CameraFeed ref={videoRef} stream={cameraState.stream} />
              <PoseCanvas ref={canvasRef} />
            </>
          )}

          {/* Safety alert — absolute positioned inside camera area */}
          <SafetyAlert
            isVisible={isSafetyAlertVisible}
            reason={currentFrame?.unsafeReason}
            onDismiss={dismissSafetyAlert}
          />

          {/* Quality status indicator top-right */}
          <div className="absolute top-3 right-3 pointer-events-none">
            <div
              className={cn(
                'px-3 py-1.5 rounded-full backdrop-blur-sm border text-xs font-semibold',
                quality === 'green' ? 'bg-success/15 border-success/35 text-success' :
                quality === 'yellow' ? 'bg-warning/15 border-warning/35 text-warning' :
                'bg-danger/15 border-danger/35 text-danger'
              )}
            >
              {quality === 'green' ? 'Good Form' : quality === 'yellow' ? 'Adjust' : 'Stop'}
            </div>
          </div>
        </div>

        {/* Coaching sidebar */}
        <div className="lg:w-72 flex flex-col border-t lg:border-t-0 lg:border-l border-border">
          {/* Metrics row */}
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            <div className="flex flex-col items-center py-3 px-2 gap-1">
              <QualityScore score={smoothedScore} history={scoreHistory} size="sm" />
            </div>
            <div className="flex flex-col items-center justify-center py-3 px-2 gap-1">
              <MetricPill label="Reps" value={repCount} size="sm" />
            </div>
            <div className="flex flex-col items-center justify-center py-3 px-2">
              {drill.reps ? (
                <MetricPill
                  label="Target"
                  value={drill.reps}
                  size="sm"
                  variant={repCount >= drill.reps ? 'success' : 'default'}
                />
              ) : (
                <HoldTimer
                  targetSeconds={drill.durationSeconds}
                  isActive={status === 'active'}
                  onComplete={() => {
                    finish({
                      drillId: drill.id as DrillId,
                      startedAt: Date.now() - drill.durationSeconds * 1000,
                      endedAt: Date.now(),
                      totalFrames: 300,
                      greenFrames: 180,
                      yellowFrames: 90,
                      redFrames: 30,
                      peakScore: 92,
                      averageScore: smoothedScore,
                      totalReps: 0,
                      longestGoodHoldMs: 8000,
                      correctionsMade: 3,
                      unsafeEvents: 0,
                    })
                    navigate(ROUTES.COMPLETE)
                  }}
                />
              )}
            </div>
          </div>

          {/* Live cue */}
          <div className="p-4 flex-1 flex flex-col justify-between gap-4">
            <div>
              <p className="text-text-3 text-xs font-semibold uppercase tracking-wide mb-2">
                Live Coaching
              </p>
              <LiveCueCard cue={activeCue} quality={quality} />
            </div>

            {/* All cues queue */}
            <div className="space-y-2">
              <p className="text-text-3 text-xs">Focus cues for this drill:</p>
              {drill.cues.map((cue) => (
                <div key={cue.id} className="flex items-start gap-2 text-xs text-text-2">
                  <span className="shrink-0 w-1 h-1 rounded-full bg-text-3 mt-1.5" />
                  {cue.text}
                </div>
              ))}
            </div>

            {/* Complete button */}
            <Button
              variant="success"
              size="md"
              fullWidth
              leftIcon={<CheckCircle2 size={16} />}
              onClick={() => {
                finish({
                  drillId: drill.id as DrillId,
                  startedAt: Date.now() - 60_000,
                  endedAt: Date.now(),
                  totalFrames: 600,
                  greenFrames: 400,
                  yellowFrames: 150,
                  redFrames: 50,
                  peakScore: 94,
                  averageScore: smoothedScore,
                  totalReps: repCount,
                  longestGoodHoldMs: 12_000,
                  correctionsMade: 4,
                  unsafeEvents: 0,
                })
                navigate(ROUTES.COMPLETE)
              }}
            >
              Complete Drill
            </Button>
          </div>

          {/* Status bar */}
          <StatusBar quality={quality} />
        </div>
      </div>
    </div>
  )
}
