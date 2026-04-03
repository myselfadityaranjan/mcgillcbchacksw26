// ============================================================================
// StrainSense — Shared Type Definitions
// Single source of truth for all 6 tasks.
// Every module imports from here: import type { ... } from "../types"
// ============================================================================

// ─── Primitive / Discriminated Union Types ──────────────────────────────────

/** The 5 postural issues the system can detect. */
export type IssueType =
  | "rounded_shoulders"
  | "forward_head_posture"
  | "apt_tendency"
  | "knee_valgus"
  | "left_right_asymmetry";

/** The 5 corrective drills in the MVP drill library. */
export type DrillId =
  | "doorway_pec_stretch"
  | "wall_angel"
  | "hip_flexor_stretch"
  | "squat_alignment_drill"
  | "split_squat_drill";

/**
 * Severity of a detected issue.
 * mild     = detectable but not urgent
 * moderate = noticeable; recommend addressing soon
 * severe   = significant deviation; prioritise immediately
 */
export type Severity = "mild" | "moderate" | "severe";

/** Body regions — used by Task 2 detection, Task 3 cards, Task 6 overlays. */
export type BodyArea =
  | "neck"
  | "shoulders"
  | "upper_back"
  | "lower_back"
  | "pelvis"
  | "hips"
  | "knees"
  | "ankles"
  | "core";

/** Required starting position for a drill — consumed by Task 4 coaching. */
export type DrillPosition =
  | "standing"
  | "kneeling"
  | "half_kneeling"
  | "lying"
  | "wall_supported";

/** The 5 guided assessment steps that Task 1 executes. */
export type AssessmentStepId =
  | "front_stance"
  | "side_stance"
  | "arm_raise"
  | "squat"
  | "single_leg_balance";

/**
 * Visual form-state for live coaching (Task 4) and overlays (Task 6).
 * good              = within acceptable range
 * needs_correction  = deviation detected; cue the user
 * unsafe            = threshold exceeded; warn immediately
 */
export type FormState = "good" | "needs_correction" | "unsafe";

/**
 * Priority tier for live coaching cues.
 * Task 4 surfaces exactly ONE cue per frame, choosing the highest tier
 * that is currently triggered.
 */
export type CuePriority = "unsafe" | "major_correction" | "fine_adjustment";

// ─── Task 1 Output Types ────────────────────────────────────────────────────
// Produced by camera.ts / poseEngine.ts / assessmentFlow.ts
// Consumed by Task 2 (analysisEngine.ts)

/**
 * A single MediaPipe pose landmark.
 * x, y, z are normalised to [0, 1] relative to image dimensions.
 * visibility is a [0, 1] confidence score for the landmark.
 */
export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

/**
 * One captured moment during a specific assessment step.
 * The landmarks array follows MediaPipe's 33-landmark index ordering.
 */
export interface AssessmentFrame {
  stepId: AssessmentStepId;
  timestampMs: number;
  /** 33 MediaPipe landmarks in standard index order. */
  landmarks: PoseLandmark[];
  /** Optional base64 data URL snapshot for evidence display on results page. */
  frameDataUrl?: string;
}

/**
 * The complete output of Task 1.
 * Passed directly to Task 2's analysisEngine as input.
 */
export interface PoseCaptureResult {
  capturedAt: number; // Unix epoch ms
  /** All captured frames across all assessment steps. */
  frames: AssessmentFrame[];
  /**
   * One representative frame per step — the "best" frame chosen by Task 1
   * (e.g. most stable / highest landmark visibility).
   * May be missing an entry if a step was skipped or failed.
   */
  representativeFrames: Partial<Record<AssessmentStepId, AssessmentFrame>>;
}

// ─── Task 2 Output Types ────────────────────────────────────────────────────
// Produced by analysisEngine.ts
// Consumed by Task 3 (planBuilder.ts) — this is the critical interface boundary

/**
 * A single detected postural issue with measurement evidence.
 * All language here is measurement-based, not diagnostic.
 */
export interface DetectedIssue {
  type: IssueType;
  severity: Severity;

  /**
   * [0, 1] confidence score. Task 3 filters out issues below
   * MIN_CONFIDENCE_THRESHOLD (0.4) to avoid misleading recommendations.
   */
  confidence: number;

  /**
   * Short measurement-grounded description of what was found.
   * Uses non-diagnostic language: "a pattern consistent with", "tendency toward".
   * Example: "Head sits approximately 4 cm anterior to shoulder line."
   */
  evidenceSummary: string;

  /** Body regions affected — passed through to IssueCard and Task 6 strain map. */
  affectedAreas: BodyArea[];

  /** The assessment step where the deviation was most clearly visible. */
  evidenceFrameId: AssessmentStepId;

  /**
   * Optional annotated snapshot for display on the results page.
   * Task 3 passes this through to IssueCard unchanged.
   * Task 6 draws annotations on top of this image.
   */
  evidenceFrameDataUrl?: string;

  /**
   * Raw computed measurements — retained for transparency and Task 6 annotations.
   * Keys are metric names (e.g. "headForwardOffsetCm", "kneeValgusAngleDeg").
   */
  rawMetrics: Record<string, number>;
}

/**
 * Full output of Task 2.
 * This is the single object Task 3's buildCorrectivePlan() receives.
 */
export interface AnalysisResult {
  /** May be empty if no issues detected or scan quality was too poor. */
  detectedIssues: DetectedIssue[];

  /**
   * Mean confidence across all detected issues (0–1).
   * 0 if no issues detected.
   */
  overallConfidence: number;

  analysedAt: number; // Unix epoch ms

  /**
   * Self-assessment of scan quality.
   * good    = all 5 steps captured with sufficient landmark visibility
   * partial = some steps missing or low-visibility
   * poor    = most steps missing; results should be treated cautiously
   */
  scanQuality: "good" | "partial" | "poor";

  /**
   * Human-readable warnings emitted by Task 2.
   * e.g. "single_leg_balance step skipped", "side_stance landmarks partially occluded"
   * Task 3 forwards these to CorrectivePlan.scanQualityWarning if non-empty.
   */
  warnings: string[];
}

// ─── Task 3 Output Types ────────────────────────────────────────────────────
// Produced by planBuilder.ts
// Consumed by Task 4 (liveCoach), Task 5 (ResultsPage, DrillPage), Task 6 (overlays)

/**
 * A single live coaching cue for a specific drill.
 * Task 4 evaluates all cues each frame and surfaces the highest-priority triggered cue.
 * Task 6 uses targetArea to position correction arrows.
 */
export interface CoachingCue {
  priority: CuePriority;
  /** Concise imperative instruction shown to the user. e.g. "Push knees outward." */
  text: string;
  /** The body region this cue targets — drives arrow placement in Task 6. */
  targetArea: BodyArea;
}

/**
 * Conditions under which Task 4 should trigger a red (unsafe) state.
 * affectedArea tells Task 6 which joint to highlight red.
 */
export interface UnsafeCondition {
  /** What constitutes an unsafe state. e.g. "Knee collapses more than 20° inward." */
  description: string;
  affectedArea: BodyArea;
}

/**
 * Full metadata for one corrective drill.
 * Defined once in drills.ts; consumed by Task 3, Task 4, Task 5, and Task 6.
 */
export interface DrillMetadata {
  id: DrillId;
  displayName: string;
  /** Issues this drill directly addresses — used by recommendationEngine. */
  targetIssues: IssueType[];
  /** Primary body area — drives Task 6 emphasis during coaching. */
  primaryBodyArea: BodyArea;
  secondaryBodyAreas: BodyArea[];
  requiredPosition: DrillPosition;
  /** 1–2 sentence description shown on the DrillPage. */
  shortDescription: string;
  /** Explains the mechanism — shown inside the IssueCard rationale block. */
  whyItHelps: string;
  /** Path to demo GIF/video asset in /public. e.g. "/assets/drills/wall_angel.gif" */
  demoAssetPath: string;
  /**
   * Ordered list of coaching cues for Task 4.
   * Task 4 evaluates all cues and surfaces exactly one per frame
   * (highest-priority triggered cue wins).
   */
  coachingCues: CoachingCue[];
  /** Conditions that trigger a red safety warning in Task 4. */
  unsafeConditions: UnsafeCondition[];
  /** Default hold duration in seconds (for time-based drills). */
  durationSeconds: number;
  /**
   * Number of reps (for rep-based drills).
   * Undefined for time-based holds.
   */
  reps?: number;
}

/**
 * One issue card on the Results page.
 * Built by issueCopy.ts; rendered by Task 5's ResultsPage.
 * Uses non-diagnostic language throughout (per spec §6).
 */
export interface IssueCard {
  issueType: IssueType;
  severity: Severity;
  /** e.g. "Rounded Shoulder Pattern — Moderate" */
  headline: string;
  /**
   * What the system measured, grounded in evidenceSummary.
   * Uses language like "a pattern consistent with", never "you have X".
   */
  whatWasDetected: string;
  /** Explains downstream strain risk in plain, non-alarmist language. */
  whyItMatters: string;
  /** Forward-looking risk statement using "may contribute to" language. */
  whatItMayContributeTo: string;
  /** Bridge sentence from issue to the corrective drills. */
  recommendedFocus: string;
  /**
   * Body areas to highlight on the Task 6 strain map.
   * Copied verbatim from DetectedIssue.affectedAreas.
   */
  affectedAreas: BodyArea[];
  /**
   * Annotated evidence frame, passed through from DetectedIssue.
   * Optional — Task 5 must show a placeholder when absent.
   */
  evidenceFrameDataUrl?: string;
}

/**
 * A drill as it appears in the corrective plan — wraps DrillMetadata with
 * plan-specific context generated by recommendationEngine.ts.
 */
export interface RecommendedDrill {
  drill: DrillMetadata;
  /** Issues this drill is the primary recommendation for. */
  primaryForIssues: IssueType[];
  /** Issues this drill also helps as a secondary benefit. */
  alsoHelpsIssues: IssueType[];
  /** 1-based priority rank. Lower number = do first. */
  priorityRank: number;
  /**
   * Generated sentence linking the drill to the user's specific issues.
   * e.g. "Wall angels address both your rounded shoulder pattern and
   *       forward head tendency."
   */
  whyRecommended: string;
  /**
   * True when this drill was deduplicated — i.e. it appeared in the mappings
   * of two or more of the user's issues and was merged into a single entry.
   */
  isDeduped: boolean;
}

/**
 * The top-level output of Task 3.
 * Consumed by Task 5 (ResultsPage renders issueCards and recommendedDrills),
 * and Task 4 (receives the selected DrillId via Task 5).
 */
export interface CorrectivePlan {
  /**
   * One card per detected issue, sorted by severity (severe → moderate → mild),
   * then by confidence descending.
   */
  issueCards: IssueCard[];
  /**
   * Deduplicated, priority-ranked drills (max 3).
   * Empty when hasIssues is false.
   */
  recommendedDrills: RecommendedDrill[];
  /** False when no issues were detected or all issues fell below confidence threshold. */
  hasIssues: boolean;
  /** 1–2 sentence overview of the plan for display at the top of the Results page. */
  summary: string;
  generatedAt: number; // Unix epoch ms
  /**
   * The highest-priority drill ID for quick access by Task 4/5.
   * Equals recommendedDrills[0].drill.id when hasIssues is true; null otherwise.
   */
  priorityDrillId: DrillId | null;
  /**
   * Surfaced from AnalysisResult.warnings (joined as a single string).
   * Task 5 shows a banner when this is non-null.
   * Null when no warnings were emitted by Task 2.
   */
  scanQualityWarning: string | null;
}

// ─── Task 4 Types ────────────────────────────────────────────────────────────
// Produced by liveCoach.ts.
// Consumed by Task 5 (DrillPage / SessionSummaryPage) and Task 6 (overlays).

/**
 * A detected form deviation on a single frame.
 * Distinct from CoachingCue: FormError is the *condition measured*;
 * CoachingCue is the *instruction surfaced to the user*.
 */
export interface FormError {
  /** Biomechanical condition identifier, e.g. "left_knee_valgus", "head_off_wall". */
  errorId: string;
  /** Body region where the deviation occurs — drives Task 6 joint highlights and arrow placement. */
  area: BodyArea;
  /** True when the safety (unsafe) threshold was crossed — drives red state. */
  isUnsafe: boolean;
  /** The actual measured value that triggered this error (ratio, degrees, or raw z). */
  measuredValue: number;
  /** The threshold value that was exceeded. Task 6 can use (measuredValue - threshold) for arrow magnitude. */
  threshold: number;
}

/**
 * Phase within a single rep cycle.
 * Used by the rep-detection state machine in cueEngine.ts / liveCoach.ts.
 *
 * Squat / Split-Squat cycle:
 *   READY → DESCENDING → BOTTOM_HOLD → ASCENDING → READY (rep++)
 *
 * Wall Angel cycle:
 *   READY → RAISING → TOP_HOLD → LOWERING → READY (rep++)
 */
export type RepPhase =
  | "READY"
  | "DESCENDING"
  | "BOTTOM_HOLD"
  | "ASCENDING"
  | "RAISING"
  | "TOP_HOLD"
  | "LOWERING";

/**
 * Per-second snapshot of session state for analytics and Task 6 timeline replay.
 */
export interface SessionSnapshot {
  timestampMs: number;
  formState: FormState;
  qualityScore: number;
  errors: FormError[];
  repCount?: number;
}

/**
 * Mutable session state managed by liveCoach.ts.
 * Created by startSession(); updated each frame by processFrame();
 * finalised by endSession() which returns FinalSessionResult.
 */
export interface CoachingSession {
  drillId: DrillId;
  startedAt: number;

  /** Per-second snapshots for FinalSessionResult.snapshots and Task 6 replay. */
  snapshots: SessionSnapshot[];

  /** Epoch ms of the last snapshot — gates 1-per-second sampling. */
  lastSnapshotAt: number;

  /** Running rep count (undefined for hold drills). */
  repCount?: number;

  /** Current rep-cycle phase (undefined for hold drills). */
  repPhase?: RepPhase;

  /** Total frames processed this session. */
  totalFrames: number;

  /** Frames where formState was "good". */
  goodFormFrames: number;

  /** Sum of raw quality scores for session mean computation. */
  qualityScoreSum: number;

  /** Current EMA-smoothed quality score for display (α = 0.15). */
  smoothedQualityScore: number;

  /** Peak smoothed quality score reached this session. */
  peakQualityScore: number;

  /**
   * Frequency map: errorId → number of frames it was active.
   * Used to compute FinalSessionResult.topErrors.
   */
  errorCounts: Record<string, number>;

  /**
   * Stores the BodyArea for each errorId (captured on first occurrence).
   * Allows FinalSessionResult to reconstruct topErrors without re-running analysis.
   */
  errorAreas: Record<string, BodyArea>;
}

/**
 * Output of processFrame() — one per animation frame (~16 ms).
 * Task 5 reads this to update the drill UI.
 * Task 6 reads this to update skeleton overlays and correction arrows.
 */
export interface LiveCoachingFrame {
  timestampMs: number;
  /** Overall form state this frame. Drives UI border/background colour. */
  formState: FormState;
  /**
   * Single highest-priority cue to display. Null when form is good.
   * Taken from DrillMetadata.coachingCues, not generated on the fly.
   */
  activeCue: CoachingCue | null;
  /**
   * All triggered errors this frame, safety-first ordering.
   * Task 6 uses this array for per-joint highlights.
   */
  errors: FormError[];
  /** EMA-smoothed quality score [0, 100]. Drives the score ring in Task 5. */
  qualityScore: number;
  /**
   * Drill-specific computed measurements (ratios, angles, z-deltas).
   * Keys match errorId names. Task 6 uses these for correction arrow magnitudes.
   */
  metrics: Record<string, number>;
  /** Current rep count for rep-based drills; undefined for hold drills. */
  repCount?: number;
  /** Current rep phase; undefined for hold drills. */
  repPhase?: RepPhase;
  /**
   * False when required landmarks are not sufficiently visible.
   * Task 5 shows a "Can't see you" banner; no false-positive errors are emitted.
   */
  landmarksVisible: boolean;
}

/**
 * Final analytics summary returned by endSession().
 * Shown on Task 5's SessionSummaryPage.
 */
export interface FinalSessionResult {
  drillId: DrillId;
  drillDisplayName: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  /** Mean raw quality score across all frames [0, 100]. */
  meanQualityScore: number;
  /** Peak EMA-smoothed quality score [0, 100]. */
  peakQualityScore: number;
  /** Total completed reps (undefined for hold drills). */
  totalReps?: number;
  /** Percentage of frames with formState "good" [0, 100]. */
  goodFormPercent: number;
  /**
   * Up to 3 most-frequent error types, sorted by frameCount descending.
   * Used by Task 5 to display "Focus areas for next time".
   */
  topErrors: Array<{
    errorId: string;
    area: BodyArea;
    frameCount: number;
    percentOfSession: number;
  }>;
  /** All per-second snapshots for Task 6 timeline replay. */
  snapshots: SessionSnapshot[];
}
