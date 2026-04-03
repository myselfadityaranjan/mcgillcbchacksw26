/**
 * Task 6 — Visual Overlay, Annotation, Demo Polish
 * Shared types for the canvas overlay rendering system.
 */

import type { RawLandmarkArray } from '@/types/pose'
import type { FormQuality, LiveCue } from '@/types/coaching'
import type { DetectedIssue } from '@/types/issues'

/** Configuration that drives every rendering pass */
export interface OverlayConfig {
  /** Show skeleton bones and joint dots */
  showSkeleton: boolean
  /** Show alignment reference lines (plumb, shoulder level, hip level) */
  showAlignmentLines: boolean
  /** Show floating issue/cue annotations */
  showAnnotations: boolean
  /** Show directional correction arrows */
  showArrows: boolean
  /** Show quality glow border around the canvas */
  showQualityGlow: boolean
  /** Mirror the canvas horizontally (matches CameraFeed mirror) */
  mirror: boolean
  /** Device pixel ratio for crisp rendering on HiDPI */
  dpr: number
}

/** What gets passed to each frame's render call */
export interface OverlayFrameState {
  /** Raw 33-landmark array from MediaPipe. null = show mock landmarks */
  landmarks: RawLandmarkArray | null
  /** Current form quality (drives glow color and skeleton coloring) */
  quality: FormQuality | null
  /** Active coaching cue with arrow direction */
  activeCue: LiveCue | null
  /** Issues detected during assessment (shown as floating labels) */
  detectedIssues?: DetectedIssue[]
  /** Overall confidence of the pose detection (fades skeleton if low) */
  confidence?: number
  /** Whether full body is visible */
  isFullBodyVisible?: boolean
}

/** Canvas draw context with dimensions pre-computed */
export interface DrawContext {
  ctx: CanvasRenderingContext2D
  /** CSS width of the canvas element */
  cssWidth: number
  /** CSS height of the canvas element */
  cssHeight: number
  /** Physical pixel width (cssWidth * dpr) */
  physWidth: number
  /** Physical pixel height (cssHeight * dpr) */
  physHeight: number
  dpr: number
  mirror: boolean
}

/** A rendered arrow annotation */
export interface ArrowAnnotation {
  jointIndex: number
  direction: 'up' | 'down' | 'left' | 'right' | 'outward' | 'inward'
  label: string
  priority: 'unsafe' | 'major' | 'minor'
}

/** Normalized [0,1] point in canvas space */
export interface NormPoint {
  x: number
  y: number
  visibility?: number
}

/** A bone connection between two landmark indices */
export interface BoneConnection {
  from: number
  to: number
  /** Visual group for color theming */
  group: 'face' | 'torso' | 'arm_left' | 'arm_right' | 'leg_left' | 'leg_right' | 'foot'
}
