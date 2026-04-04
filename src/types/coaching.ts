// ──────────────────────────────────────────────────────────────
// Coaching types — Task 4 live-coaching engine output
// ──────────────────────────────────────────────────────────────

/** Traffic-light form quality state */
export type FormState = 'green' | 'yellow' | 'red';

/** Priority ordering for cue selection */
export type CuePriority = 'unsafe' | 'major' | 'fine';

export interface ArrowVector {
  /** MediaPipe landmark index the arrow originates from */
  fromLandmark: number;
  /** Normalised canvas direction (−1 to 1, x=right, y=down) */
  dx: number;
  dy: number;
}

export interface LiveCue {
  text: string;
  priority: CuePriority;
  /** Landmarks to highlight with the issue colour */
  affectedLandmarks?: number[];
  arrows?: ArrowVector[];
}

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
}
