/**
 * Coaching types — the live feedback layer (Task 4 / Person 2).
 * Per-frame coaching state drives the UI overlays and cue cards.
 */

import type { DrillId } from './drills'
import type { PoseFrame } from './pose'

/** Traffic-light form quality */
export type FormQuality = 'green' | 'yellow' | 'red'

/** Priority level of a coaching cue */
export type CuePriority = 'unsafe' | 'major' | 'minor'

/** A single live coaching cue surfaced to the user */
export interface LiveCue {
  id: string
  text: string
  priority: CuePriority
  joints: string[]          // joint/region names for overlay highlights
  arrowDirection?: 'up' | 'down' | 'left' | 'right' | 'outward' | 'inward'
  arrowTargetJoint?: string
}

/** Per-frame coaching state produced by Person 2's live coach engine */
export interface CoachingFrameState {
  timestamp: number
  drillId: DrillId
  frame: PoseFrame

  /** Computed metrics for the current frame, keyed by metric name */
  metrics: Record<string, number>

  /** Overall form quality for this frame */
  quality: FormQuality

  /** The single highest-priority cue to surface this frame */
  activeCue: LiveCue | null

  /** All cues that fired this frame (sorted by priority) */
  allCues: LiveCue[]

  /** Whether the system has detected an unsafe state */
  isUnsafe: boolean
  unsafeReason?: string

  /** Quality score for this frame (0–100) */
  frameScore: number
}

/** Aggregated session quality stats */
export interface CoachingSessionStats {
  drillId: DrillId
  startedAt: number
  endedAt: number | null
  totalFrames: number
  greenFrames: number
  yellowFrames: number
  redFrames: number
  peakScore: number
  averageScore: number
  totalReps: number
  longestGoodHoldMs: number
  correctionsMade: number      // times form went red → yellow/green
  unsafeEvents: number
}

/** Lifecycle state of the coaching mode */
export type CoachingStatus =
  | 'idle'
  | 'setup'           // waiting for user to get into start position
  | 'active'          // actively coaching
  | 'paused'          // user paused (e.g. unsafe state)
  | 'complete'        // session done

/** Input contract that Person 2's live coach engine must satisfy */
export interface ICoachingEngine {
  /** Initialize for a given drill */
  init(drillId: DrillId): Promise<void>

  /** Process a single pose frame and return coaching state */
  processFrame(frame: PoseFrame): CoachingFrameState

  /** Get aggregated stats for the current session */
  getStats(): CoachingSessionStats

  /** Reset for a new session */
  reset(): void
}
