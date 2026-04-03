/**
 * Task 6 — OverlayRenderer: main orchestrator.
 * This class owns the canvas 2D context and coordinates all drawing modules.
 *
 * Usage:
 *   const renderer = new OverlayRenderer(canvas, config)
 *   renderer.render(frame)   // called each RAF tick
 *   renderer.destroy()       // called on unmount
 *
 * The renderer is designed to:
 *   - Automatically resize to match the video feed (ResizeObserver)
 *   - Handle device pixel ratio for crisp HiDPI rendering
 *   - Produce a full visual frame with no external dependencies beyond canvas
 */

import type { OverlayConfig, OverlayFrameState, DrawContext, NormPoint } from './types'
import { drawSkeleton, cueJointsToIndices } from './skeleton'
import { drawAlignmentLines } from './alignmentLines'
import { drawCorrectionArrows } from './arrows'
import { drawIssueAnnotations, drawQualityGlow, drawNoPoseIndicator } from './annotations'
import { generateMockLandmarks } from './mockLandmarks'
import type { MockPose } from './mockLandmarks'

export type { OverlayConfig, OverlayFrameState }
export type { MockPose }
export { generateMockLandmarks }

const DEFAULT_CONFIG: OverlayConfig = {
  showSkeleton: true,
  showAlignmentLines: true,
  showAnnotations: true,
  showArrows: true,
  showQualityGlow: true,
  mirror: true,
  dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
}

export class OverlayRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: OverlayConfig
  private resizeObserver: ResizeObserver
  private animationStartTime: number = performance.now()

  constructor(canvas: HTMLCanvasElement, config: Partial<OverlayConfig> = {}) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('OverlayRenderer: cannot get 2D context from canvas')
    this.ctx = ctx
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Keep canvas physical size in sync with its CSS layout size
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        this.resize(width, height)
      }
    })
    this.resizeObserver.observe(canvas)

    // Initial size
    const rect = canvas.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      this.resize(rect.width, rect.height)
    }
  }

  updateConfig(partial: Partial<OverlayConfig>): void {
    this.config = { ...this.config, ...partial }
  }

  private resize(cssWidth: number, cssHeight: number): void {
    const dpr = this.config.dpr
    this.canvas.width = Math.round(cssWidth * dpr)
    this.canvas.height = Math.round(cssHeight * dpr)
  }

  /**
   * Main render call — invoke this each animation frame.
   */
  render(frameState: OverlayFrameState): void {
    const { ctx, canvas, config } = this
    const dpr = config.dpr
    const cssWidth = canvas.width / dpr
    const cssHeight = canvas.height / dpr

    if (canvas.width === 0 || canvas.height === 0) return

    const dc: DrawContext = {
      ctx,
      cssWidth,
      cssHeight,
      physWidth: canvas.width,
      physHeight: canvas.height,
      dpr,
      mirror: config.mirror,
    }

    // ── Clear ──────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // ── Time-based animation ───────────────────────────────────────────────
    const elapsed = (performance.now() - this.animationStartTime) / 1000
    const pulsePhase = (elapsed * 2 * Math.PI * 1.4) % (2 * Math.PI) // 1.4 Hz pulse

    // ── Resolve landmarks (real or mock) ──────────────────────────────────
    const hasRealLandmarks = frameState.landmarks && frameState.landmarks.length === 33
    let landmarks: NormPoint[]

    if (hasRealLandmarks) {
      landmarks = frameState.landmarks!
    } else {
      // Generate mock landmarks matching the coaching context
      const mockPose: MockPose = this.inferMockPose(frameState)
      landmarks = generateMockLandmarks(mockPose, elapsed)
    }

    const confidence = frameState.confidence ?? (hasRealLandmarks ? 1 : 0.85)
    const quality = frameState.quality ?? null

    // ── Quality glow border (drawn before everything else — stays behind) ──
    if (config.showQualityGlow && quality) {
      drawQualityGlow(dc, quality, pulsePhase)
    }

    // ── Alignment lines (drawn beneath skeleton) ──────────────────────────
    if (config.showAlignmentLines && (frameState.isFullBodyVisible !== false || !hasRealLandmarks)) {
      ctx.globalAlpha = confidence
      drawAlignmentLines(dc, landmarks)
      ctx.globalAlpha = 1
    }

    // ── Skeleton ──────────────────────────────────────────────────────────
    if (config.showSkeleton) {
      const activeCue = frameState.activeCue
      const highlighted = activeCue ? cueJointsToIndices(activeCue.joints) : new Set<number>()

      ctx.globalAlpha = confidence
      drawSkeleton(dc, landmarks, quality, highlighted, pulsePhase)
      ctx.globalAlpha = 1
    }

    // ── Correction arrows ─────────────────────────────────────────────────
    if (config.showArrows && frameState.activeCue) {
      drawCorrectionArrows(dc, landmarks, frameState.activeCue, pulsePhase)
    }

    // ── Issue annotations ─────────────────────────────────────────────────
    if (config.showAnnotations && frameState.detectedIssues?.length) {
      drawIssueAnnotations(dc, landmarks, frameState.detectedIssues)
    }

    // ── No pose indicator ─────────────────────────────────────────────────
    if (!hasRealLandmarks && frameState.isFullBodyVisible === false) {
      drawNoPoseIndicator(dc, pulsePhase)
    }
  }

  /** Infer the best mock pose from the current frame state */
  private inferMockPose(frame: OverlayFrameState): MockPose {
    if (!frame.activeCue) return 'standing'
    const joints = frame.activeCue.joints.join(',').toLowerCase()
    if (joints.includes('knee') || joints.includes('hip')) return 'squat'
    if (joints.includes('wrist') || joints.includes('elbow')) return 'overhead'
    return 'standing'
  }

  /** Clear the canvas completely (e.g. when camera is off) */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  destroy(): void {
    this.resizeObserver.disconnect()
    this.clear()
  }
}
