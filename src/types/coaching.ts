// ──────────────────────────────────────────────────────────────
// Coaching types — Task 4 live-coaching engine output
// ──────────────────────────────────────────────────────────────

/** Traffic-light form quality state */
export type FormState = 'green' | 'yellow' | 'red';

/** Alias for backward compatibility */
export type FormQuality = FormState;

/** Priority ordering for cue selection */
export type CuePriority = 'unsafe' | 'major' | 'minor' | 'fine';

export interface ArrowVector {
  /** MediaPipe landmark index the arrow originates from */
  fromLandmark: number;
  /** Normalised canvas direction (−1 to 1, x=right, y=down) */
  dx: number;
  dy: number;
}

export interface LiveCue {
  /** Cue identifier — used for debouncing in speech hooks */
  id?: string;
  text: string;
  priority: CuePriority;
  /** Joint/region names for overlay highlights (legacy overlay system) */
  joints?: string[];
  /** Arrow direction for legacy overlay system */
  arrowDirection?: 'up' | 'down' | 'left' | 'right' | 'outward' | 'inward';
  arrowTargetJoint?: string;
  /** Landmarks to highlight with the issue colour (new overlay renderer) */
  affectedLandmarks?: number[];
  /** Directional correction arrows (new overlay renderer) */
  arrows?: ArrowVector[];
}

// ── New coaching frame (used by liveCoach.ts / useLiveCoaching) ──────────

export interface CoachingFrame {
  formState: FormState;
  cue: LiveCue | null;
  /** Instantaneous quality score 0–100 for this frame */
  qualityScore: number;
  /** Raw drill-specific metric values used for this frame */
  metrics: Record<string, number>;
}

export interface CoachingSession {
  drillId: string;
  startTime: number;
  /** Time spent in each state (ms) */
  timeInGreen: number;
  timeInYellow: number;
  timeInRed: number;
  /** Final 0–100 session score */
  finalScore: number;
  isComplete: boolean;
  /** Best cue surfaced (most recent red → yellow → green progression cue) */
  lastCue: LiveCue | null;
  /** Seconds of continuous good form at session end (0 if ended in non-green) */
  currentStreak: number;
  /** Peak consecutive good-form streak this session, in seconds */
  bestStreak: number;
  /** Number of times the user recovered form from yellow/red back to green */
  recoveries: number;
}

// ── Legacy coaching frame (used by old Coaching.tsx + store) ─────────────

import type { PoseFrame } from './pose'
import type { DrillId } from './drills'

/** Per-frame coaching state produced by the live coach engine */
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
  correctionsMade: number
  unsafeEvents: number
}

/** Lifecycle state of the coaching mode */
export type CoachingStatus =
  | 'idle'
  | 'setup'
  | 'active'
  | 'paused'
  | 'complete'

/** Input contract that a coaching engine must satisfy */
export interface ICoachingEngine {
  init(drillId: DrillId): Promise<void>
  processFrame(frame: PoseFrame): CoachingFrameState
  getStats(): CoachingSessionStats
  reset(): void
}
