/**
 * Task 6 — Alignment lines renderer.
 * Draws reference geometry: vertical plumb line, shoulder level,
 * hip level, knee tracking lines, and ankle base line.
 *
 * These lines convert the raw skeleton into instantly readable
 * postural alignment feedback — a hallmark of physical therapy tools.
 */

import { PoseLandmarkIndex } from '@/types/pose'
import type { DrawContext, NormPoint } from './types'
import { normToPixel } from './skeleton'
import {
  ALIGNMENT_PLUMB,
  ALIGNMENT_SHOULDER,
  ALIGNMENT_HIP,
  ALIGNMENT_KNEE,
  ALIGNMENT_PLUMB_GOOD,
  ALIGNMENT_PLUMB_BAD,
  BRAND,
} from './colors'

/** Deviation threshold (normalized units) to flag a line as misaligned */
const ALIGNMENT_DEVIATION_THRESHOLD = 0.03

/** Draw a dashed horizontal level line across the full canvas width */
function drawLevelLine(
  dc: DrawContext,
  y: number,         // physical pixel y
  color: string,
  lineWidth: number,
  dashPattern: number[],
  label?: string
): void {
  const { ctx, physWidth } = dc
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.setLineDash(dashPattern.map((d) => d * dc.dpr))
  ctx.globalAlpha = 1

  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(physWidth, y)
  ctx.stroke()

  if (label) {
    ctx.setLineDash([])
    ctx.globalAlpha = 0.6
    ctx.fillStyle = color
    ctx.font = `${10 * dc.dpr}px "JetBrains Mono", monospace`
    ctx.textBaseline = 'bottom'
    ctx.fillText(label, 6 * dc.dpr, y - 3 * dc.dpr)
  }

  ctx.restore()
}

/** Draw a dashed vertical line at a given x */
function drawVerticalLine(
  dc: DrawContext,
  x: number,
  color: string,
  lineWidth: number,
  dashPattern: number[]
): void {
  const { ctx, physHeight } = dc
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.setLineDash(dashPattern.map((d) => d * dc.dpr))

  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, physHeight)
  ctx.stroke()

  ctx.restore()
}

/** Get midpoint x between two normalized landmarks */
function midX(a: NormPoint | undefined, b: NormPoint | undefined): number | null {
  if (!a || !b) return null
  if ((a.visibility ?? 1) < 0.3 || (b.visibility ?? 1) < 0.3) return null
  return (a.x + b.x) / 2
}

/** Get midpoint y between two normalized landmarks */
function midY(a: NormPoint | undefined, b: NormPoint | undefined): number | null {
  if (!a || !b) return null
  if ((a.visibility ?? 1) < 0.3 || (b.visibility ?? 1) < 0.3) return null
  return (a.y + b.y) / 2
}

/**
 * Main alignment lines draw call.
 */
export function drawAlignmentLines(
  dc: DrawContext,
  landmarks: NormPoint[]
): void {
  const { physHeight, physWidth, dpr } = dc

  const ls = landmarks[PoseLandmarkIndex.LEFT_SHOULDER]
  const rs = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER]
  const lh = landmarks[PoseLandmarkIndex.LEFT_HIP]
  const rh = landmarks[PoseLandmarkIndex.RIGHT_HIP]
  const lk = landmarks[PoseLandmarkIndex.LEFT_KNEE]
  const rk = landmarks[PoseLandmarkIndex.RIGHT_KNEE]
  const la = landmarks[PoseLandmarkIndex.LEFT_ANKLE]
  const ra = landmarks[PoseLandmarkIndex.RIGHT_ANKLE]

  // ── 1. Vertical plumb line through centre of mass ────────────────────────
  const shoulderCX = midX(ls, rs)
  const hipCX = midX(lh, rh)

  if (shoulderCX !== null && hipCX !== null) {
    const deviation = Math.abs(shoulderCX - hipCX)
    const plumbColor = deviation > ALIGNMENT_DEVIATION_THRESHOLD
      ? ALIGNMENT_PLUMB_BAD
      : ALIGNMENT_PLUMB_GOOD

    // Plumb line through the average of shoulder+hip midpoints
    const plumbX = ((shoulderCX + hipCX) / 2)
    const px = dc.mirror ? (1 - plumbX) * physWidth : plumbX * physWidth

    drawVerticalLine(dc, px, plumbColor, 1 * dpr, [6, 5])

    // Deviation indicator: small triangle if off-centre
    if (deviation > ALIGNMENT_DEVIATION_THRESHOLD) {
      const shoulderPX = dc.mirror ? (1 - shoulderCX) * physWidth : shoulderCX * physWidth
      const hipPX = dc.mirror ? (1 - hipCX) * physWidth : hipCX * physWidth
      const midPY = physHeight * 0.5

      dc.ctx.save()
      dc.ctx.strokeStyle = ALIGNMENT_PLUMB_BAD
      dc.ctx.lineWidth = 1.5 * dpr
      dc.ctx.setLineDash([])
      dc.ctx.globalAlpha = 0.55

      dc.ctx.beginPath()
      dc.ctx.moveTo(shoulderPX, midPY - 20 * dpr)
      dc.ctx.lineTo(hipPX, midPY + 20 * dpr)
      dc.ctx.stroke()

      dc.ctx.restore()
    }
  } else {
    // Fallback: draw plumb at canvas center
    drawVerticalLine(dc, physWidth / 2, ALIGNMENT_PLUMB, 1 * dpr, [6, 5])
  }

  // ── 2. Shoulder level line ───────────────────────────────────────────────
  const shoulderY = midY(ls, rs)
  if (shoulderY !== null) {
    const py = shoulderY * physHeight
    const tilt = ls && rs ? Math.abs(ls.y - rs.y) : 0
    const color = tilt > ALIGNMENT_DEVIATION_THRESHOLD ? '#FFB72B' : ALIGNMENT_SHOULDER
    drawLevelLine(dc, py, color, 1 * dpr, [8, 6], 'shoulders')
  }

  // ── 3. Hip level line ────────────────────────────────────────────────────
  const hipY = midY(lh, rh)
  if (hipY !== null) {
    const py = hipY * physHeight
    const tilt = lh && rh ? Math.abs(lh.y - rh.y) : 0
    const color = tilt > ALIGNMENT_DEVIATION_THRESHOLD ? '#FFB72B' : ALIGNMENT_HIP
    drawLevelLine(dc, py, color, 1 * dpr, [6, 5], 'hips')
  }

  // ── 4. Knee level line ────────────────────────────────────────────────────
  const kneeY = midY(lk, rk)
  if (kneeY !== null) {
    const py = kneeY * physHeight
    drawLevelLine(dc, py, ALIGNMENT_KNEE, 0.8 * dpr, [4, 6])
  }

  // ── 5. Knee tracking dots — show where knees sit relative to ankles ──────
  if (lk && la && (lk.visibility ?? 1) > 0.4 && (la.visibility ?? 1) > 0.4) {
    const { px: lkx, py: lky } = normToPixel(lk, dc)
    const { px: lax } = normToPixel(la, dc)
    const offset = lkx - lax

    dc.ctx.save()
    dc.ctx.strokeStyle = Math.abs(offset) > 20 * dpr ? '#FF4757' : BRAND
    dc.ctx.lineWidth = 1.5 * dpr
    dc.ctx.setLineDash([3 * dpr, 4 * dpr])
    dc.ctx.globalAlpha = 0.45
    dc.ctx.beginPath()
    dc.ctx.moveTo(lkx, lky)
    dc.ctx.lineTo(lax, lky)
    dc.ctx.stroke()
    dc.ctx.restore()
  }

  if (rk && ra && (rk.visibility ?? 1) > 0.4 && (ra.visibility ?? 1) > 0.4) {
    const { px: rkx, py: rky } = normToPixel(rk, dc)
    const { px: rax } = normToPixel(ra, dc)
    const offset = rkx - rax

    dc.ctx.save()
    dc.ctx.strokeStyle = Math.abs(offset) > 20 * dpr ? '#FF4757' : BRAND
    dc.ctx.lineWidth = 1.5 * dpr
    dc.ctx.setLineDash([3 * dpr, 4 * dpr])
    dc.ctx.globalAlpha = 0.45
    dc.ctx.beginPath()
    dc.ctx.moveTo(rkx, rky)
    dc.ctx.lineTo(rax, rky)
    dc.ctx.stroke()
    dc.ctx.restore()
  }

  // ── 6. Ankle base line ────────────────────────────────────────────────────
  const ankleY = midY(la, ra)
  if (ankleY !== null) {
    const py = ankleY * physHeight
    drawLevelLine(dc, py, ALIGNMENT_KNEE, 0.7 * dpr, [2, 6])
  }
}
