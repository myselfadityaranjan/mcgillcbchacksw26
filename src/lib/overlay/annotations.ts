/**
 * Task 6 — Floating issue annotations renderer.
 * Shows issue labels attached to body regions during the results/assessment phase.
 * Also renders the quality glow border effect around the canvas.
 */

import { PoseLandmarkIndex } from '@/types/pose'
import type { DetectedIssue } from '@/types/issues'
import type { FormQuality } from '@/types/coaching'
import type { DrawContext, NormPoint } from './types'
import { normToPixel } from './skeleton'
import { GLOW_COLORS, GLOW_ALPHA, ANNOTATION_BG, DANGER, WARNING, BRAND } from './colors'

/** Map issue id to the primary landmark used as anchor */
const ISSUE_LANDMARK_ANCHOR: Record<string, number[]> = {
  rounded_shoulders:     [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER],
  forward_head_posture:  [PoseLandmarkIndex.NOSE],
  anterior_pelvic_tilt:  [PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP],
  knee_valgus:           [PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.RIGHT_KNEE],
  lateral_asymmetry:     [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER],
}

const ISSUE_LABELS: Record<string, string> = {
  rounded_shoulders:    'Rounded Shoulders',
  forward_head_posture: 'Forward Head',
  anterior_pelvic_tilt: 'Pelvic Tilt',
  knee_valgus:          'Knee Valgus',
  lateral_asymmetry:    'Asymmetry',
}

const SEVERITY_COLORS: Record<string, string> = {
  significant: DANGER,
  moderate:    WARNING,
  mild:        BRAND,
}

/** Polyfill roundRect */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/** Draw a floating annotation pill at (px, py) offset by (offsetX, offsetY) */
function drawAnnotationPill(
  dc: DrawContext,
  px: number,
  py: number,
  label: string,
  severity: string,
  fadeAlpha: number
): void {
  const { ctx, dpr, physWidth } = dc
  const color = SEVERITY_COLORS[severity] ?? BRAND
  const fontSize = 9 * dpr
  ctx.font = `600 ${fontSize}px Inter, sans-serif`
  const textW = ctx.measureText(label).width
  const padX = 8 * dpr
  const padY = 4 * dpr
  const boxW = textW + padX * 2
  const boxH = fontSize + padY * 2

  // Keep pill inside canvas
  const clampedX = Math.max(boxW / 2 + 4 * dpr, Math.min(physWidth - boxW / 2 - 4 * dpr, px))
  const pillX = clampedX - boxW / 2
  const pillY = py - 36 * dpr - boxH

  ctx.save()
  ctx.globalAlpha = fadeAlpha

  // Connector line
  ctx.strokeStyle = color
  ctx.lineWidth = 1 * dpr
  ctx.setLineDash([2 * dpr, 3 * dpr])
  ctx.globalAlpha = fadeAlpha * 0.5
  ctx.beginPath()
  ctx.moveTo(clampedX, py - 10 * dpr)
  ctx.lineTo(clampedX, pillY + boxH)
  ctx.stroke()
  ctx.setLineDash([])

  // Pill background
  ctx.globalAlpha = fadeAlpha
  ctx.fillStyle = ANNOTATION_BG
  ctx.strokeStyle = color
  ctx.lineWidth = 1 * dpr
  roundRect(ctx, pillX, pillY, boxW, boxH, 4 * dpr)
  ctx.fill()
  ctx.stroke()

  // Dot indicator
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(pillX + 8 * dpr, pillY + boxH / 2, 3 * dpr, 0, Math.PI * 2)
  ctx.fill()

  // Text
  ctx.fillStyle = '#FFFFFF'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.font = `500 ${fontSize}px Inter, sans-serif`
  ctx.fillText(label, pillX + padX + 6 * dpr, pillY + boxH / 2)

  ctx.restore()
}

/**
 * Draw floating issue annotation pills anchored to the relevant body regions.
 */
export function drawIssueAnnotations(
  dc: DrawContext,
  landmarks: NormPoint[],
  issues: DetectedIssue[],
  fadeAlpha = 1
): void {
  for (const issue of issues) {
    const anchorIndices = ISSUE_LANDMARK_ANCHOR[issue.id]
    if (!anchorIndices) continue

    // Find the best-visible anchor
    let bestLm: NormPoint | null = null
    let bestVis = 0
    for (const idx of anchorIndices) {
      const lm = landmarks[idx]
      if (lm && (lm.visibility ?? 1) > bestVis) {
        bestVis = lm.visibility ?? 1
        bestLm = lm
      }
    }
    if (!bestLm || bestVis < 0.2) continue

    const { px, py } = normToPixel(bestLm, dc)
    const label = ISSUE_LABELS[issue.id] ?? issue.id
    drawAnnotationPill(dc, px, py, label, issue.severity, fadeAlpha)
  }
}

/**
 * Draw a quality-driven glow border around the full canvas.
 * Uses multiple inset gradient strokes to create a soft halo effect.
 */
export function drawQualityGlow(
  dc: DrawContext,
  quality: FormQuality,
  pulsePhase: number
): void {
  const { ctx, physWidth, physHeight, dpr } = dc
  const color = GLOW_COLORS[quality]
  const baseAlpha = GLOW_ALPHA[quality]

  // Pulse the glow intensity
  const pulseAlpha = baseAlpha * (0.75 + 0.25 * Math.sin(pulsePhase))
  const glowWidth = quality === 'red' ? 32 * dpr : 22 * dpr

  ctx.save()

  // Multiple passes with decreasing width and alpha for soft falloff
  const passes = [
    { inset: 0,              alpha: pulseAlpha * 0.15, width: glowWidth * 3.0 },
    { inset: glowWidth * 0.5, alpha: pulseAlpha * 0.35, width: glowWidth * 1.8 },
    { inset: glowWidth * 0.9, alpha: pulseAlpha * 0.60, width: glowWidth * 0.9 },
    { inset: glowWidth * 1.2, alpha: pulseAlpha * 0.80, width: glowWidth * 0.4 },
  ]

  for (const pass of passes) {
    const gradient = ctx.createLinearGradient(0, 0, 0, physHeight)
    gradient.addColorStop(0,   color + toHex(pass.alpha))
    gradient.addColorStop(0.5, 'transparent')
    gradient.addColorStop(1,   color + toHex(pass.alpha))

    ctx.strokeStyle = color
    ctx.lineWidth = pass.width
    ctx.globalAlpha = pass.alpha
    ctx.shadowColor = color
    ctx.shadowBlur = pass.width * 2

    ctx.strokeRect(
      pass.inset,
      pass.inset,
      physWidth - pass.inset * 2,
      physHeight - pass.inset * 2
    )
  }

  ctx.restore()
}

/** Convert 0–1 alpha to 2-digit hex suffix */
function toHex(alpha: number): string {
  return Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase()
}

/**
 * Draw a pulsing "No Pose" indicator when landmarks are unavailable.
 */
export function drawNoPoseIndicator(
  dc: DrawContext,
  pulsePhase: number
): void {
  const { ctx, physWidth, physHeight, dpr } = dc
  const alpha = 0.4 + 0.2 * Math.sin(pulsePhase)

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#4F8EF7'
  ctx.font = `${11 * dpr}px "JetBrains Mono", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Detecting pose…', physWidth / 2, physHeight * 0.92)
  ctx.restore()
}
