import { useRef, useState, useEffect, useCallback } from 'react'
import type { IPoseEngine, CalibrationState } from '@/types'
import { MockPoseEngine } from '@/lib/adapters'
import { useUiStore } from '@/store'

/**
 * Pose engine adapter hook.
 *
 * During development / when VITE_ENABLE_MOCK_POSE=true, uses MockPoseEngine.
 * Person 1 provides their real IPoseEngine implementation and it gets
 * injected here — zero changes to any page or component.
 *
 * Usage:
 *   const { engine, calibration, isReady } = usePoseEngine(videoRef)
 */
export function usePoseEngine(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const engineRef = useRef<IPoseEngine | null>(null)
  const calibrationPollRef = useRef<number | null>(null)
  const flags = useUiStore((s) => s.flags)

  const [isReady, setIsReady] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [calibration, setCalibration] = useState<CalibrationState>({
    isFullBodyVisible: false,
    isDistanceOk: false,
    isLightingOk: false,
    isCentered: false,
    landmarks: null,
    message: 'Initializing camera...',
    isReady: false,
  })
  const [error, setError] = useState<string | null>(null)

  const initEngine = useCallback(async () => {
    if (!videoRef.current) return
    setIsInitializing(true)
    setError(null)

    try {
      // Dependency injection: swap MockPoseEngine for the real engine here
      // when Person 1 delivers their implementation:
      //
      //   import { RealPoseEngine } from '@/lib/poseEngine'
      //   const engine = flags.enableMockPose ? new MockPoseEngine() : new RealPoseEngine()
      //
      const engine: IPoseEngine = new MockPoseEngine()
      await engine.init(videoRef.current)
      engineRef.current = engine
      setIsReady(true)

      // Start polling calibration state at 10fps
      calibrationPollRef.current = window.setInterval(() => {
        if (engineRef.current?.isReady) {
          setCalibration(engineRef.current.getCalibrationState())
        }
      }, 100)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pose engine failed to initialize'
      setError(msg)
    } finally {
      setIsInitializing(false)
    }
  }, [videoRef, flags.enableMockPose])

  const startCapture = useCallback(() => {
    engineRef.current?.startCapture()
  }, [])

  const stopCapture = useCallback(() => {
    return engineRef.current?.stopCapture() ?? []
  }, [])

  const getEngine = useCallback(() => engineRef.current, [])

  useEffect(() => {
    return () => {
      if (calibrationPollRef.current !== null) {
        clearInterval(calibrationPollRef.current)
      }
      engineRef.current?.destroy()
    }
  }, [])

  return {
    initEngine,
    startCapture,
    stopCapture,
    getEngine,
    isReady,
    isInitializing,
    calibration,
    error,
  }
}
