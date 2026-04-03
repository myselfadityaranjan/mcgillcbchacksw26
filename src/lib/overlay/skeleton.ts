/**
 * Task 6 — Skeleton renderer.
 * Draws MediaPipe BlazePose landmarks as a connected skeleton on a canvas.
 *
 * - Bones are colored by group and blended toward quality color
 * - Joints pulse based on form quality
 * - Low-visibility landmarks are faded
 * - Highlighted joints (from coaching cues) get a larger pulsing ring
 */

import { PoseLandmarkIndex } from '@/types/pose'
import type { FormQuality } from '@/types/coaching'
import type { DrawContext, BoneConnection, NormPoint } from './types'
import { getBoneColor, getJointColor, BRAND, DIM } from './colors'

// ─── MediaPipe BlazePose bone connections ─────────────────────────────────────
const BONES: BoneConnection[] = [
  // Face
  { from: PoseLandmarkIndex.LEFT_EYE_INNER,  to: PoseLandmarkIndex.LEFT_EYE,       group: 'face' },
  { from: PoseLandmarkIndex.LEFT_EYE,        to: PoseLandmarkIndex.LEFT_EYE_OUTER,  group: 'face' },
  { from: PoseLandmarkIndex.RIGHT_EYE_INNER, to: PoseLandmarkIndex.RIGHT_EYE,       group: 'face' },
  { from: PoseLandmarkIndex.RIGHT_EYE,       to: PoseLandmarkIndex.RIGHT_EYE_OUTER, group: 'face' },
  { from: PoseLandmarkIndex.LEFT_EYE_OUTER,  to: PoseLandmarkIndex.LEFT_EAR,        group: 'face' },
  { from: PoseLandmarkIndex.RIGHT_EYE_OUTER, to: PoseLandmarkIndex.RIGHT_EAR,       group: 'face' },
  { from: PoseLandmarkIndex.LEFT_MOUTH,      to: PoseLandmarkIndex.RIGHT_MOUTH,     group: 'face' },

  // Torso
  { from: PoseLandmarkIndex.LEFT_SHOULDER,  to: PoseLandmarkIndex.RIGHT_SHOULDER, group: 'torso' },
  { from: PoseLandmarkIndex.LEFT_SHOULDER,  to: PoseLandmarkIndex.LEFT_HIP,       group: 'torso' },
  { from: PoseLandmarkIndex.RIGHT_SHOULDER, to: PoseLandmarkIndex.RIGHT_HIP,      group: 'torso' },
  { from: PoseLandmarkIndex.LEFT_HIP,       to: PoseLandmarkIndex.RIGHT_HIP,      group: 'torso' },

  // Left arm
  { from: PoseLandmarkIndex.LEFT_SHOULDER, to: PoseLandmarkIndex.LEFT_ELBOW,  group: 'arm_left' },
  { from: PoseLandmarkIndex.LEFT_ELBOW,    to: PoseLandmarkIndex.LEFT_WRIST,  group: 'arm_left' },
  { from: PoseLandmarkIndex.LEFT_WRIST,    to: PoseLandmarkIndex.LEFT_PINKY,  group: 'arm_left' },
  { from: PoseLandmarkIndex.LEFT_WRIST,    to: PoseLandmarkIndex.LEFT_INDEX,  group: 'arm_left' },
  { from: PoseLandmarkIndex.LEFT_WRIST,    to: PoseLandmarkIndex.LEFT_THUMB,  group: 'arm_left' },

  // Right arm
  { from: PoseLandmarkIndex.RIGHT_SHOULDER, to: PoseLandmarkIndex.RIGHT_ELBOW,  group: 'arm_right' },
  { from: PoseLandmarkIndex.RIGHT_ELBOW,    to: PoseLandmarkIndex.RIGHT_WRIST,  group: 'arm_right' },
  { from: PoseLandmarkIndex.RIGHT_WRIST,    to: PoseLandmarkIndex.RIGHT_PINKY,  group: 'arm_right' },
  { from: PoseLandmarkIndex.RIGHT_WRIST,    to: PoseLandmarkIndex.RIGHT_INDEX,  group: 'arm_right' },
  { from: PoseLandmarkIndex.RIGHT_WRIST,    to: PoseLandmarkIndex.RIGHT_THUMB,  group: 'arm_right' },

  // Left leg
  { from: PoseLandmarkIndex.LEFT_HIP,   to: PoseLandmarkIndex.LEFT_KNEE,  group: 'leg_left' },
  { from: PoseLandmarkIndex.LEFT_KNEE,  to: PoseLandmarkIndex.LEFT_ANKLE, group: 'leg_left' },

  // Right leg
  { from: PoseLandmarkIndex.RIGHT_HIP,   to: PoseLandmarkIndex.RIGHT_KNEE,  group: 'leg_right' },
  { from: PoseLandmarkIndex.RIGHT_KNEE,  to: PoseLandmarkIndex.RIGHT_ANKLE, group: 'leg_right' },

  // Feet
  { from: PoseLandmarkIndex.LEFT_ANKLE,  to: PoseLandmarkIndex.LEFT_HEEL,       group: 'foot' },
  { from: PoseLandmarkIndex.LEFT_HEEL,   to: PoseLandmarkIndex.LEFT_FOOT_INDEX,  group: 'foot' },
  { from: PoseLandmarkIndex.RIGHT_ANKLE, to: PoseLandmarkIndex.RIGHT_HEEL,       group: 'foot' },
  { from: PoseLandmarkIndex.RIGHT_HEEL,  to: PoseLandmarkIndex.RIGHT_FOOT_INDEX, group: 'foot' },
]

/** Key joints that get drawn as larger dots */
const KEY_JOINTS = new Set([
  PoseLandmarkIndex.NOSE,
  PoseLandmarkIndex.LEFT_SHOULDER,
  PoseLandmarkIndex.RIGHT_SHOULDER,
  PoseLandmarkIndex.LEFT_ELBOW,
  PoseLandmarkIndex.RIGHT_ELBOW,
  PoseLandmarkIndex.LEFT_WRIST,
  PoseLandmarkIndex.RIGHT_WRIST,
  PoseLandmarkIndex.LEFT_HIP,
  PoseLandmarkIndex.RIGHT_HIP,
  PoseLandmarkIndex.LEFT_KNEE,
  PoseLandmarkIndex.RIGHT_KNEE,
  PoseLandmarkIndex.LEFT_ANKLE,
  PoseLandmarkIndex.RIGHT_ANKLE,
])

/** Convert normalized [0,1] landmark to canvas pixel coordinates */
export function normToPixel(
  point: NormPoint,
  dc: DrawContext
): { px: number; py: number } {
  const px = dc.mirror
    ? (1 - point.x) * dc.physWidth
    : point.x * dc.physWidth
  const py = point.y * dc.physHeight
  return { px, py }
}

/**
 * Main skeleton draw call.
 *
 * @param dc        Canvas draw context
 * @param landmarks Raw 33-landmark array
 * @param quality   Current form quality (drives colors)
 * @param highlighted Set of joint indices to render with a highlight ring (from active cues)
 * @param pulsePhase Oscillation phase [0, 2π] for animated highlights
 */
export function drawSkeleton(
  dc: DrawContext,
  landmarks: NormPoint[],
  quality: FormQuality | null,
  highlighted: Set<number>,
  pulsePhase: number
): void {
  const { ctx } = dc
  const jointColor = getJointColor(quality)

  // ── 1. Draw bones ────────────────────────────────────────────────────────
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const bone of BONES) {
    const a = landmarks[bone.from]
    const b = landmarks[bone.to]
    if (!a || !b) continue

    const visA = a.visibility ?? 1
    const visB = b.visibility ?? 1
    const minVis = Math.min(visA, visB)
    if (minVis < 0.1) continue

    const alpha = Math.min(1, minVis * 1.3)
    const boneColor = getBoneColor(bone.group, quality)

    const { px: ax, py: ay } = normToPixel(a, dc)
    const { px: bx, py: by } = normToPixel(b, dc)

    ctx.globalAlpha = alpha
    ctx.strokeStyle = boneColor
    ctx.lineWidth = bone.group === 'face' || bone.group === 'foot' ? 1.5 * dc.dpr : 2.5 * dc.dpr

    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
  }
  ctx.restore()

  // ── 2. Draw joints ───────────────────────────────────────────────────────
  ctx.save()
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i]
    if (!lm) continue
    const vis = lm.visibility ?? 1
    if (vis < 0.15) continue

    const isKey = KEY_JOINTS.has(i)
    const isHighlighted = highlighted.has(i)
    const { px, py } = normToPixel(lm, dc)
    const alpha = Math.min(1, vis * 1.4)

    // Outer glow ring for highlighted joints
    if (isHighlighted) {
      const pulseScale = 1 + 0.35 * Math.sin(pulsePhase)
      const glowRadius = (isKey ? 9 : 6) * dc.dpr * pulseScale

      const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowRadius * 1.8)
      gradient.addColorStop(0, jointColor + 'AA')
      gradient.addColorStop(0.5, jointColor + '44')
      gradient.addColorStop(1, 'transparent')

      ctx.globalAlpha = alpha * 0.75
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(px, py, glowRadius * 1.8, 0, Math.PI * 2)
      ctx.fill()

      // Ring stroke
      ctx.globalAlpha = alpha * 0.90
      ctx.strokeStyle = jointColor
      ctx.lineWidth = 1.5 * dc.dpr
      ctx.beginPath()
      ctx.arc(px, py, glowRadius, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Joint dot
    const dotRadius = isHighlighted
      ? (isKey ? 4.5 : 3) * dc.dpr
      : (isKey ? 3.5 : 2) * dc.dpr

    ctx.globalAlpha = alpha
    ctx.fillStyle = isHighlighted ? jointColor : (isKey ? '#FFFFFF' : DIM)
    ctx.beginPath()
    ctx.arc(px, py, dotRadius, 0, Math.PI * 2)
    ctx.fill()

    // Inner bright center
    if (isKey) {
      ctx.globalAlpha = alpha * 0.9
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(px, py, dotRadius * 0.45, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

/** Map cue joint name strings to landmark indices */
const JOINT_NAME_TO_INDEX: Record<string, number[]> = {
  knees:           [PoseLandmarkIndex.LEFT_KNEE,  PoseLandmarkIndex.RIGHT_KNEE],
  left_knee:       [PoseLandmarkIndex.LEFT_KNEE],
  right_knee:      [PoseLandmarkIndex.RIGHT_KNEE],
  shoulders:       [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER],
  left_shoulder:   [PoseLandmarkIndex.LEFT_SHOULDER],
  right_shoulder:  [PoseLandmarkIndex.RIGHT_SHOULDER],
  hips:            [PoseLandmarkIndex.LEFT_HIP,  PoseLandmarkIndex.RIGHT_HIP],
  thoracic_spine:  [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP],
  head_neck:       [PoseLandmarkIndex.NOSE, PoseLandmarkIndex.LEFT_EAR, PoseLandmarkIndex.RIGHT_EAR],
  ankles:          [PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.RIGHT_ANKLE],
  wrists:          [PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.RIGHT_WRIST],
  elbows:          [PoseLandmarkIndex.LEFT_ELBOW, PoseLandmarkIndex.RIGHT_ELBOW],
}

/** Convert joint name strings from a LiveCue to landmark index sets */
export function cueJointsToIndices(jointNames: string[]): Set<number> {
  const result = new Set<number>()
  for (const name of jointNames) {
    const indices = JOINT_NAME_TO_INDEX[name.toLowerCase()]
    if (indices) indices.forEach((i) => result.add(i))
  }
  return result
}
