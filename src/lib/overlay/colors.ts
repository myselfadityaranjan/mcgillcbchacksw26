/**
 * Task 6 — all canvas color constants for the overlay system.
 * Kept in one place so the visual style is instantly tunable.
 */

import type { FormQuality } from '@/types/coaching'

// ─── Brand palette (mirrors tailwind.config.js) ──────────────────────────────
export const BRAND   = '#4F8EF7'
export const SUCCESS = '#10E07C'
export const WARNING = '#FFB72B'
export const DANGER  = '#FF4757'
export const WHITE   = '#FFFFFF'
export const DIM     = 'rgba(255,255,255,0.25)'

// ─── Skeleton bone group colors ───────────────────────────────────────────────
export const BONE_COLORS = {
  face:       'rgba(120,160,255,0.55)',
  torso:      'rgba(79,142,247,0.70)',
  arm_left:   'rgba(79,142,247,0.80)',
  arm_right:  'rgba(79,142,247,0.80)',
  leg_left:   'rgba(79,142,247,0.80)',
  leg_right:  'rgba(79,142,247,0.80)',
  foot:       'rgba(79,142,247,0.50)',
} as const

/** Blend bone color toward quality color based on quality state */
export function getBoneColor(
  group: keyof typeof BONE_COLORS,
  quality: FormQuality | null
): string {
  if (!quality || quality === 'green') return BONE_COLORS[group]
  if (quality === 'yellow') {
    if (group === 'face') return 'rgba(255,183,43,0.45)'
    return 'rgba(255,183,43,0.70)'
  }
  // red
  if (group === 'face') return 'rgba(255,71,87,0.40)'
  return 'rgba(255,71,87,0.70)'
}

/** Joint fill color based on quality */
export function getJointColor(quality: FormQuality | null): string {
  if (!quality || quality === 'green') return BRAND
  if (quality === 'yellow') return WARNING
  return DANGER
}

// ─── Alignment line colors ─────────────────────────────────────────────────
export const ALIGNMENT_PLUMB      = 'rgba(79,142,247,0.30)'
export const ALIGNMENT_SHOULDER   = 'rgba(79,142,247,0.40)'
export const ALIGNMENT_HIP        = 'rgba(79,142,247,0.35)'
export const ALIGNMENT_KNEE       = 'rgba(79,142,247,0.30)'
export const ALIGNMENT_PLUMB_GOOD = 'rgba(16,224,124,0.35)'
export const ALIGNMENT_PLUMB_BAD  = 'rgba(255,71,87,0.40)'

// ─── Quality glow colors ──────────────────────────────────────────────────
export const GLOW_COLORS: Record<FormQuality, string> = {
  green:  SUCCESS,
  yellow: WARNING,
  red:    DANGER,
}

export const GLOW_ALPHA: Record<FormQuality, number> = {
  green:  0.55,
  yellow: 0.50,
  red:    0.65,
}

// ─── Annotation / arrow colors ────────────────────────────────────────────
export const ARROW_COLORS = {
  unsafe: DANGER,
  major:  WARNING,
  minor:  BRAND,
} as const

export const ANNOTATION_BG  = 'rgba(6,8,18,0.82)'
export const ANNOTATION_BORDER_UNSAFE = 'rgba(255,71,87,0.70)'
export const ANNOTATION_BORDER_MAJOR  = 'rgba(255,183,43,0.65)'
export const ANNOTATION_BORDER_MINOR  = 'rgba(79,142,247,0.60)'
