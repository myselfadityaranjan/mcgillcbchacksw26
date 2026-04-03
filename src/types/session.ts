/**
 * Session history types — persisted to localStorage, extensible to API.
 * Future: swap localStorage adapter for an API adapter without changing
 * any consumer code.
 */

import type { AnalysisResult } from './issues'
import type { CorrectivePlan } from './drills'
import type { CoachingSessionStats } from './coaching'

/** A single completed drill within a session */
export interface CompletedDrill {
  drillId: string
  startedAt: number
  endedAt: number
  stats: CoachingSessionStats
}

/** A full StrainSense session — assessment + results + drills performed */
export interface StrainSession {
  id: string
  startedAt: number
  completedAt: number | null
  analysis: AnalysisResult | null
  plan: CorrectivePlan | null
  completedDrills: CompletedDrill[]
  overallScore: number | null
}

/** Lightweight summary for the history list */
export interface SessionSummary {
  id: string
  date: string           // ISO date string
  overallScore: number | null
  issueCount: number
  drillsCompleted: number
  durationMinutes: number
}
