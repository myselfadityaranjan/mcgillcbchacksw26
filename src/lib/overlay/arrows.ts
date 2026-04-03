/**
 * Task 6 — Correction arrow renderer.
 * Draws directional correction arrows on specific joints.
 * Each arrow corresponds to a LiveCue with an arrowDirection field.
 *
 * Arrows are animated (oscillating opacity + offset) to draw the eye.
 */

import { PoseLandmarkIndex } from '@/types/pose'
import type { LiveCue } from '@/types/coaching'
import type { DrawContext, NormPoint } from './types'
import { normToPixel } from './skeleton'
import { ARROW_COLORS, ANNOTATION_BG } from './colors'

const JOINT_NAME_TO_ANCHOR: Record<string, number[]> = {
  knees:          [PoseLandmarkIndex.LEFT_KNEE,     PoseLandmarkIndex.RIGHT_KNEE],
  left_knee:      [PoseLandmarkIndex.LEFT_KNEE],
  right_knee:     [PoseLandmarkIndex.RIGHT_KNEE],
  shoulders:      [PoseLandmarkIndex.LEFT_SHOULDER,  PoseLandmarkIndex.RIGHT_SHOULDER],
  left_shoulder:  [PoseLandmarkIndex.LEFT_SHOULDER],
  right_shoulder: [PoseLandmarkIndex.RIGHT_SHOULDER],
  hips:           [PoseLandmarkIndex.LEFT_HIP,       PoseLandmarkIndex.RIGHT_HIP],
  thoracic_spine: [PoseLandmarkIndex.LEFT_SHOULDER,  PoseLandmarkIndex.RIGHT_SHOULDER],
  head_neck:      [PoseLandmarkIndex.NOSE],
  ankles:         [PoseLandmarkIndex.LEFT_ANKLE,     PoseLandmarkIndex.RIGHT_ANKLE],
  wrists:         [PoseLandmarkIndex.LEFT_WRIST,     PoseLandmarkIndex.RIGHT_WRIST],
  elbows:         [PoseLandmarkIndex.LEFT_ELBOW,     PoseLandmarkIndex.RIGHT_ELBOW],
}

/** Direction vector + arrow offset for each direction type */
const DIRECTION_VECTORS: Record<string, { dx: number; dy: number; offsetDir: number }> = {
  up:      { dx: 0,  dy: -1, offsetDir: -1 },
  down:    { dx: 0,  dy:  1, offsetDir:  1 },
  left:    { dx: -1, dy:  0, offsetDir: -1 },
  right:   { dx:  1, dy:  0, offsetDir:  1 },
  outward: { dx: 0,  dy:  0, offsetDir:  0 }, // handled as special case
  inward:  { dx: 0,  dy:  0, offsetDir:  0 }, // handled as special case
}

/**
 * Draw a single arrowhead at (x, y) pointing in direction (dx, dy).
 * The shaft goes from (x - dx*len, y - dy*len) to (x, y).
 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  length: number,
  headSize: number,
  dpr: number
): void {
  const shaftX = x - dx * length
  const shaftY = y - dy * length

  // Shaft
  ctx.beginPath()
  ctx.moveTo(shaftX, shaftY)
  ctx.lineTo(x, y)
  ctx.stroke()

  // Arrowhead
  const angle = Math.atan2(dy, dx)
  const spread = Math.PI / 5

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(
    x - headSize * dpr * Math.cos(angle - spread),
    y - headSize * dpr * Math.sin(angle - spread)
  )
  ctx.moveTo(x, y)
  ctx.lineTo(
    x - headSize * dpr * Math.cos(angle + spread),
    y - headSize * dpr * Math.sin(angle + spread)
  )
  ctx.stroke()
}

/**
 * Draw a short label pill near a joint.
 */
function drawLabelPill(
  dc: DrawContext,
  x: number,
  y: number,
  text: string,
  color: string
): void {
  const { ctx, dpr } = dc
  const fontSize = 9.5 * dpr
  ctx.font = `600 ${fontSize}px Inter, sans-serif`
  const metrics = ctx.measureText(text)
  const padX = 7 * dpr
  const padY = 4 * dpr
  const boxW = metrics.width + padX * 2
  const boxH = fontSize + padY * 2
  const bx = x - boxW / 2
  const by = y - boxH / 2

  ctx.save()
  ctx.fillStyle = ANNOTATION_BG
  ctx.strokeStyle = color
  ctx.lineWidth = 1 * dpr
  roundRect(ctx, bx, by, boxW, boxH, 4 * dpr)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
  ctx.restore()
}

/** Polyfill for ctx.roundRect (not in all browsers) */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
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

/**
 * Draw correction arrows for the active coaching cue.
 *
 * @param dc         Draw context
 * @param landmarks  Raw landmark array
 * @param cue        The active LiveCue
 * @param pulsePhase Oscillation phase [0, 2π] for animation
 */
export function drawCorrectionArrows(
  dc: DrawContext,
  landmarks: NormPoint[],
  cue: LiveCue,
  pulsePhase: number
): void {
  const { ctx, dpr, physWidth } = dc
  const color = ARROW_COLORS[cue.priority]

  // Animated offset — arrows bob in their direction
  const bobOffset = Math.sin(pulsePhase) * 6 * dpr

  const arrowLength = 28 * dpr
  const headSize = 7

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2 * dpr
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(pulsePhase)

  // ── Special case: outward / inward (affects pairs of joints) ────────────
  if (cue.arrowDirection === 'outward' || cue.arrowDirection === 'inward') {
    for (const jointName of cue.joints) {
      const indices = JOINT_NAME_TO_ANCHOR[jointName.toLowerCase()] ?? []
      const leftIndices = indices.filter((_, i) => i % 2 === 0)
      const rightIndices = indices.filter((_, i) => i % 2 === 1)

      for (const li of leftIndices) {
        const lm = landmarks[li]
        if (!lm || (lm.visibility ?? 1) < 0.3) continue
        const { px, py } = normToPixel(lm, dc)
        const dir = cue.arrowDirection === 'outward' ? -1 : 1
        const offsetX = dir * bobOffset
        const arrowTipX = px + dir * arrowLength
        drawArrow(ctx, arrowTipX + offsetX, py, dir, 0, arrowLength * 0.7, headSize, dpr)
      }

      for (const ri of rightIndices) {
        const lm = landmarks[ri]
        if (!lm || (lm.visibility ?? 1) < 0.3) continue
        const { px, py } = normToPixel(lm, dc)
        const dir = cue.arrowDirection === 'outward' ? 1 : -1
        const offsetX = dir * bobOffset
        const arrowTipX = px + dir * arrowLength
        drawArrow(ctx, arrowTipX + offsetX, py, dir, 0, arrowLength * 0.7, headSize, dpr)
      }
    }

    ctx.restore()
    return
  }

  // ── Standard directional arrows ──────────────────────────────────────────
  const vec = cue.arrowDirection
    ? DIRECTION_VECTORS[cue.arrowDirection]
    : null

  if (!vec) {
    ctx.restore()
    return
  }

  const { dx, dy } = vec

  for (const jointName of cue.joints) {
    const indices = JOINT_NAME_TO_ANCHOR[jointName.toLowerCase()] ?? []

    for (const idx of indices) {
      const lm = landmarks[idx]
      if (!lm || (lm.visibility ?? 1) < 0.3) continue

      const { px, py } = normToPixel(lm, dc)

      // Anchor point: just outside the joint in the arrow direction
      const baseOffset = 18 * dpr
      const ax = px + dx * baseOffset + dx * bobOffset
      const ay = py + dy * baseOffset + dy * bobOffset
      const tipX = ax + dx * arrowLength
      const tipY = ay + dy * arrowLength

      drawArrow(ctx, tipX, tipY, dx, dy, arrowLength * 0.75, headSize, dpr)

      // Label pill above/beside arrow tip
      const labelX = tipX + dx * 22 * dpr
      const labelY = tipY + dy * 20 * dpr
      // Keep label inside canvas
      const clampedX = Math.max(50 * dpr, Math.min(physWidth - 50 * dpr, labelX))
      drawLabelPill(dc, clampedX, labelY, cue.text.length > 18 ? cue.text.slice(0, 16) + '…' : cue.text, color)
    }
  }

  ctx.restore()
}
