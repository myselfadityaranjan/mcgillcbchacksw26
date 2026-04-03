/**
 * Drill types — the corrective plan layer (Task 3 / Person 2).
 * Defines the drill library schema and recommendation output.
 */

import type { IssueId, BodyRegion } from './issues'

/** The 5 supported corrective drills */
export type DrillId =
  | 'doorway_pec_stretch'
  | 'wall_angel'
  | 'hip_flexor_stretch'
  | 'squat_alignment_drill'
  | 'split_squat_control'

/** Physical position required to perform this drill */
export type DrillPosition =
  | 'standing'
  | 'kneeling'
  | 'seated'
  | 'floor'
  | 'wall'

export type DrillDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type DrillCategory = 'stretch' | 'mobility' | 'stability' | 'strength'

/** A key cue the live coach monitors during this drill */
export interface DrillCue {
  id: string
  text: string                  // e.g. "Keep chest lifted"
  joints: BodyRegion[]          // which joints / regions this cue targets
  correctionArrowDirection?: 'up' | 'down' | 'left' | 'right' | 'outward' | 'inward'
}

/** Threshold definition for live coaching */
export interface DrillThreshold {
  metric: string               // metric key from CoachingMetrics
  greenMin: number
  greenMax: number
  yellowMin?: number
  yellowMax?: number
  // Outside yellow = red (unsafe)
}

/** Static configuration for a drill — does not change at runtime */
export interface Drill {
  id: DrillId
  name: string
  shortName: string
  description: string
  targetIssues: IssueId[]
  primaryRegion: BodyRegion
  affectedRegions: BodyRegion[]
  position: DrillPosition
  difficulty: DrillDifficulty
  category: DrillCategory
  durationSeconds: number       // suggested hold time or rep cycle
  reps?: number                 // if rep-based
  sets?: number
  cues: DrillCue[]
  thresholds: DrillThreshold[]
  setupInstructions: string[]
  unsafeConditions: string[]    // human-readable red-state descriptions
  demoAsset?: string            // asset path for animation/image
}

/** A prioritised recommendation — output of Person 2's recommendation engine */
export interface DrillRecommendation {
  drill: Drill
  issueIds: IssueId[]           // which issues this addresses for this user
  priority: number              // 1 = highest, lower number = do first
  reason: string                // e.g. "Addresses primary issue: rounded shoulders"
}

/** The full corrective plan output from Person 2's recommendation engine */
export interface CorrectivePlan {
  sessionId: string
  generatedAt: number
  recommendations: DrillRecommendation[]
  totalEstimatedMinutes: number
}
