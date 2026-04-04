/**
 * Task 6 — all canvas color constants for the overlay system.
 *
 * The canvas draws over a dark video feed, so the skeleton/glow colors
 * stay bright/saturated. The quality glow border is tuned to complement
 * the new warm-light UI surrounding the camera panel.
 */

import type { FormQuality } from '@/types/coaching'

// ─── Brand palette (matches tailwind.config.js redesign) ─────────────────────
export const BRAND   = '#7BC27A'   // lighter sage for canvas (video is dark bg)
export const SUCCESS = '#5EC989'   // soft forest green
export const WARNING = '#E8924A'   // warm amber/terracotta
export const DANGER  = '#E06B64'   // warm muted red
export const WHITE   = '#FFFFFF'
export const DIM     = 'rgba(255,255,255,0.30)'

// ─── Skeleton bone group colors ───────────────────────────────────────────────
// Slightly warmer/lighter than the old neon palette — still readable on video
export const BONE_COLORS = {
  face:       'rgba(160,210,170,0.50)',
  torso:      'rgba(123,194,122,0.70)',
  arm_left:   'rgba(123,194,122,0.78)',
  arm_right:  'rgba(123,194,122,0.78)',
  leg_left:   'rgba(123,194,122,0.78)',
  leg_right:  'rgba(123,194,122,0.78)',
  foot:       'rgba(123,194,122,0.48)',
} as const

/** Blend bone color toward quality color based on quality state */
export function getBoneColor(
  group: keyof typeof BONE_COLORS,
  quality: FormQuality | null
): string {
  if (!quality || quality === 'green') return BONE_COLORS[group]
  if (quality === 'yellow') {
    if (group === 'face') return 'rgba(232,146,74,0.45)'
    return 'rgba(232,146,74,0.72)'
  }
  // red
  if (group === 'face') return 'rgba(224,107,100,0.42)'
  return 'rgba(224,107,100,0.72)'
}

/** Joint fill color based on quality */
export function getJointColor(quality: FormQuality | null): string {
  if (!quality || quality === 'green') return BRAND
  if (quality === 'yellow') return WARNING
  return DANGER
}

// ─── Alignment line colors ─────────────────────────────────────────────────
export const ALIGNMENT_PLUMB      = 'rgba(123,194,122,0.28)'
export const ALIGNMENT_SHOULDER   = 'rgba(123,194,122,0.38)'
export const ALIGNMENT_HIP        = 'rgba(123,194,122,0.32)'
export const ALIGNMENT_KNEE       = 'rgba(123,194,122,0.28)'
export const ALIGNMENT_PLUMB_GOOD = 'rgba(94,201,137,0.40)'
export const ALIGNMENT_PLUMB_BAD  = 'rgba(224,107,100,0.45)'

// ─── Quality glow colors — warmer, softer than original neon ──────────────
export const GLOW_COLORS: Record<FormQuality, string> = {
  green:  '#5EC989',
  yellow: '#E8924A',
  red:    '#E06B64',
}

export const GLOW_ALPHA: Record<FormQuality, number> = {
  green:  0.50,
  yellow: 0.48,
  red:    0.62,
}

// ─── Annotation / arrow colors ────────────────────────────────────────────
export const ARROW_COLORS = {
  unsafe: DANGER,
  major:  WARNING,
  minor:  BRAND,
} as const

export const ANNOTATION_BG  = 'rgba(28,24,16,0.84)'
export const ANNOTATION_BORDER_UNSAFE = 'rgba(224,107,100,0.72)'
export const ANNOTATION_BORDER_MAJOR  = 'rgba(232,146,74,0.68)'
export const ANNOTATION_BORDER_MINOR  = 'rgba(123,194,122,0.62)'
