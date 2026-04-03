/**
 * Task 6 — useOverlayRenderer hook.
 *
 * Wires a canvas ref + video ref into the OverlayRenderer, running a RAF loop
 * that calls renderer.render() each frame with the current overlay state.
 *
 * Features:
 * - Automatically creates and destroys the OverlayRenderer on mount/unmount
 * - Keeps config in sync with Zustand UI preferences (skeleton, alignment lines)
 * - Syncs the canvas dimensions to the video element on each frame
 * - Exposes a stable setFrameState callback for pages to push per-frame data
 * - Zero dependencies on MediaPipe — works entirely off the OverlayFrameState contract
 */

import { useEffect, useRef, useCallback } from 'react'
import { useUiStore } from '@/store'
import { OverlayRenderer } from '@/lib/overlay'
import type { OverlayFrameState } from '@/lib/overlay'

interface UseOverlayRendererOptions {
  /** Canvas element ref (the PoseCanvas component) */
  canvasRef: React.RefObject<HTMLCanvasElement>
  /** Video element ref (the CameraFeed component) — used to match canvas size */
  videoRef?: React.RefObject<HTMLVideoElement>
  /** Manually override mirror instead of reading from uiStore */
  mirror?: boolean
  /** Whether to run the render loop at all (e.g. false when camera is off) */
  enabled?: boolean
}

export function useOverlayRenderer({
  canvasRef,
  videoRef,
  mirror,
  enabled = true,
}: UseOverlayRendererOptions) {
  const rendererRef = useRef<OverlayRenderer | null>(null)
  const frameStateRef = useRef<OverlayFrameState>({
    landmarks: null,
    quality: null,
    activeCue: null,
    confidence: 0.85,
    isFullBodyVisible: true,
  })
  const rafRef = useRef<number | null>(null)

  const showSkeletonOverlay = useUiStore((s) => s.showSkeletonOverlay)
  const showAlignmentLines  = useUiStore((s) => s.showAlignmentLines)
  const mirrorCamera        = useUiStore((s) => s.mirrorCamera)
  const effectiveMirror     = mirror ?? mirrorCamera

  // ── Create / destroy renderer when canvas mounts ──────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new OverlayRenderer(canvas, {
      mirror: effectiveMirror,
      showSkeleton: showSkeletonOverlay,
      showAlignmentLines: showAlignmentLines,
      dpr: window.devicePixelRatio || 1,
    })
    rendererRef.current = renderer

    return () => {
      renderer.destroy()
      rendererRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef])

  // ── Keep config in sync with preferences ─────────────────────────────────
  useEffect(() => {
    rendererRef.current?.updateConfig({
      mirror: effectiveMirror,
      showSkeleton: showSkeletonOverlay,
      showAlignmentLines: showAlignmentLines,
    })
  }, [effectiveMirror, showSkeletonOverlay, showAlignmentLines])

  // ── RAF render loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      rendererRef.current?.clear()
      return
    }

    const loop = () => {
      const renderer = rendererRef.current
      const canvas = canvasRef.current
      const video = videoRef?.current

      if (renderer && canvas) {
        // Sync canvas CSS dimensions to the video container
        if (video && video.videoWidth > 0) {
          const cssW = video.clientWidth
          const cssH = video.clientHeight
          if (canvas.style.width !== `${cssW}px`) {
            canvas.style.width  = `${cssW}px`
            canvas.style.height = `${cssH}px`
          }
        }

        renderer.render(frameStateRef.current)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [enabled, canvasRef, videoRef])

  /**
   * Push updated frame state — call this from your coaching/assessment loop.
   * Stable reference: safe to put in useCallback deps.
   */
  const setFrameState = useCallback((update: Partial<OverlayFrameState>) => {
    frameStateRef.current = { ...frameStateRef.current, ...update }
  }, [])

  /**
   * Convenience: push quality + cue together (the most common call pattern).
   */
  const pushCoachingFrame = useCallback(
    (
      quality: OverlayFrameState['quality'],
      activeCue: OverlayFrameState['activeCue'],
      landmarks?: OverlayFrameState['landmarks'],
      confidence?: number
    ) => {
      frameStateRef.current = {
        ...frameStateRef.current,
        quality,
        activeCue,
        ...(landmarks !== undefined ? { landmarks } : {}),
        ...(confidence !== undefined ? { confidence } : {}),
      }
    },
    []
  )

  /**
   * Convenience: push detected issues for assessment annotation mode.
   */
  const pushAssessmentFrame = useCallback(
    (
      issues: OverlayFrameState['detectedIssues'],
      landmarks?: OverlayFrameState['landmarks'],
      confidence?: number
    ) => {
      frameStateRef.current = {
        ...frameStateRef.current,
        quality: null,
        activeCue: null,
        detectedIssues: issues,
        ...(landmarks !== undefined ? { landmarks } : {}),
        ...(confidence !== undefined ? { confidence } : {}),
      }
    },
    []
  )

  return { setFrameState, pushCoachingFrame, pushAssessmentFrame }
}
