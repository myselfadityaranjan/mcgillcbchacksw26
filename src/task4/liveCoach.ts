// ============================================================================
// StrainSense — Task 4: Live Coach (Frame Orchestrator)
//
// The sole public API for Task 4.  Three functions:
//   startSession(drillId)         → CoachingSession
//   processFrame(session, lm, ts) → LiveCoachingFrame   (mutates session)
//   endSession(session)           → FinalSessionResult
//
// Per-frame pipeline (processFrame):
//   1. Check landmark visibility          [poseUtils.landmarksVisible]
//   2. computeDrillMetrics()              [drillThresholds]
//   3. evaluateSafetyRules()              [safetyRules]
//   4. evaluateFormErrors()               [cueEngine]
//   5. Derive formState
//   6. selectActiveCue()                  [cueEngine]
//   7. tickRepDetector() for rep drills   [cueEngine]
//   8. computeQualityScore()              [qualityScore]
//   9. EMA smooth                         [poseUtils.ema]
//  10. Update session accumulators
//  11. Snapshot (1/s gate)
//  12. Return LiveCoachingFrame
//
// Invariants:
//   - computeDrillMetrics() is called ONCE per frame; result is shared.
//   - No drill-specific logic lives here — this file is drill-agnostic.
//   - Session is mutated in-place; the caller holds the reference.
// ============================================================================

import type {
  CoachingSession,
  DrillId,
  FinalSessionResult,
  FormError,
  FormState,
  LiveCoachingFrame,
  PoseLandmark,
  RepPhase,
  SessionSnapshot,
} from "../types";
import { getDrill } from "../task3/drills";
import {
  REQUIRED_LANDMARKS,
  landmarksVisible,
  ema,
} from "./poseUtils";
import { computeDrillMetrics } from "./drillThresholds";
import { evaluateSafetyRules } from "./safetyRules";
import {
  evaluateFormErrors,
  selectActiveCue,
  tickRepDetector,
} from "./cueEngine";
import { computeQualityScore } from "./qualityScore";

// ─── Constants ───────────────────────────────────────────────────────────────

/** EMA smoothing factor for the displayed quality score. Lower = smoother. */
const EMA_ALPHA = 0.15;

/** Milliseconds between snapshots captured into session.snapshots. */
const SNAPSHOT_INTERVAL_MS = 1000;

/** Initial quality score assumed at session start (neutral baseline). */
const INITIAL_QUALITY_SCORE = 70;

/** Drills that track reps (vs. time-based holds). */
const REP_DRILLS = new Set<DrillId>([
  "wall_angel",
  "squat_alignment_drill",
  "split_squat_drill",
]);

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Creates a fresh CoachingSession for the given drill.
 * Call this once when the user taps "Start Drill".
 */
export function startSession(drillId: DrillId): CoachingSession {
  const isRepDrill = REP_DRILLS.has(drillId);
  return {
    drillId,
    startedAt: Date.now(),
    snapshots: [],
    lastSnapshotAt: 0,
    repCount:  isRepDrill ? 0 : undefined,
    repPhase:  isRepDrill ? "READY" : undefined,
    totalFrames:         0,
    goodFormFrames:      0,
    qualityScoreSum:     0,
    smoothedQualityScore: INITIAL_QUALITY_SCORE,
    peakQualityScore:    0,
    errorCounts: {},
    errorAreas:  {},
  };
}

/**
 * Processes one camera frame against the active coaching session.
 * Mutates session in-place (accumulators, rep state, snapshots).
 * Returns a LiveCoachingFrame consumed by Task 5 and Task 6 each animation frame.
 *
 * @param session  Mutable session returned by startSession().
 * @param lm       33 MediaPipe landmarks for this frame.
 * @param nowMs    Current timestamp in milliseconds (Date.now() or performance.now() offset).
 */
export function processFrame(
  session: CoachingSession,
  lm: PoseLandmark[],
  nowMs: number
): LiveCoachingFrame {
  const { drillId } = session;

  // ── Step 1: Landmark visibility gate ───────────────────────────────────────
  const requiredIndices = REQUIRED_LANDMARKS[drillId];
  const isVisible = landmarksVisible(lm, requiredIndices);

  if (!isVisible) {
    // Return a "no-data" frame — no false positives, no score change
    return buildInvisibleFrame(session, nowMs);
  }

  // ── Step 2: Compute metrics ────────────────────────────────────────────────
  const metrics = computeDrillMetrics(lm, drillId);

  // ── Step 3: Safety rules ───────────────────────────────────────────────────
  const safetyErrors = evaluateSafetyRules(metrics, drillId);

  // ── Step 4: Form errors ────────────────────────────────────────────────────
  const repPhase = session.repPhase;
  const formErrors = evaluateFormErrors(metrics, drillId, repPhase);

  // ── Step 5: Derive formState ───────────────────────────────────────────────
  const formState: FormState =
    safetyErrors.length > 0
      ? "unsafe"
      : formErrors.length > 0
      ? "needs_correction"
      : "good";

  // ── Step 6: Select active cue ──────────────────────────────────────────────
  const activeCue = selectActiveCue(drillId, safetyErrors, formErrors);

  // ── Step 7: Tick rep detector ──────────────────────────────────────────────
  let newRepCount = session.repCount;
  let newRepPhase = session.repPhase;

  if (REP_DRILLS.has(drillId) && session.repPhase !== undefined) {
    const tick = tickRepDetector(
      drillId,
      session.repPhase,
      session.repCount ?? 0,
      metrics
    );
    newRepPhase = tick.repPhase;
    newRepCount = tick.repCount;
  }

  // ── Step 8: Compute quality score ─────────────────────────────────────────
  const allErrors: FormError[] = [...safetyErrors, ...formErrors];
  const rawScore = computeQualityScore(formState, allErrors);

  // ── Step 9: EMA smoothing ──────────────────────────────────────────────────
  const smoothed = ema(session.smoothedQualityScore, rawScore, EMA_ALPHA);

  // ── Step 10: Update session accumulators ───────────────────────────────────
  session.totalFrames        += 1;
  session.qualityScoreSum    += rawScore;
  session.smoothedQualityScore = smoothed;
  session.repCount           = newRepCount;
  session.repPhase           = newRepPhase;

  if (formState === "good") session.goodFormFrames += 1;
  if (smoothed > session.peakQualityScore) session.peakQualityScore = smoothed;

  // Accumulate error frequency map
  for (const err of allErrors) {
    session.errorCounts[err.errorId] = (session.errorCounts[err.errorId] ?? 0) + 1;
    if (!(err.errorId in session.errorAreas)) {
      session.errorAreas[err.errorId] = err.area;
    }
  }

  // ── Step 11: Snapshot gate (1 per second) ─────────────────────────────────
  if (nowMs - session.lastSnapshotAt >= SNAPSHOT_INTERVAL_MS) {
    const snapshot: SessionSnapshot = {
      timestampMs: nowMs,
      formState,
      qualityScore: smoothed,
      errors: allErrors,
      repCount: newRepCount,
    };
    session.snapshots.push(snapshot);
    session.lastSnapshotAt = nowMs;
  }

  // ── Step 12: Return frame ──────────────────────────────────────────────────
  return {
    timestampMs:      nowMs,
    formState,
    activeCue,
    errors:           allErrors,
    qualityScore:     smoothed,
    metrics,
    repCount:         newRepCount,
    repPhase:         newRepPhase,
    landmarksVisible: true,
  };
}

/**
 * Finalises the session and returns the analytics summary.
 * Call this when the user taps "Stop" or the drill timer expires.
 * The session object must NOT be used after calling this function.
 */
export function endSession(session: CoachingSession): FinalSessionResult {
  const endedAt = Date.now();
  const drill   = getDrill(session.drillId);

  const durationSeconds = Math.max(
    0,
    Math.round((endedAt - session.startedAt) / 1000)
  );

  const meanQualityScore =
    session.totalFrames > 0
      ? Math.round(session.qualityScoreSum / session.totalFrames)
      : 0;

  const goodFormPercent =
    session.totalFrames > 0
      ? Math.round((session.goodFormFrames / session.totalFrames) * 100)
      : 0;

  // Build top-errors list (up to 3, sorted by frameCount descending)
  const topErrors = Object.entries(session.errorCounts)
    .map(([errorId, frameCount]) => ({
      errorId,
      area: session.errorAreas[errorId],
      frameCount,
      percentOfSession:
        session.totalFrames > 0
          ? Math.round((frameCount / session.totalFrames) * 100)
          : 0,
    }))
    .sort((a, b) => b.frameCount - a.frameCount)
    .slice(0, 3);

  return {
    drillId:          session.drillId,
    drillDisplayName: drill.displayName,
    startedAt:        session.startedAt,
    endedAt,
    durationSeconds,
    meanQualityScore,
    peakQualityScore: Math.round(session.peakQualityScore),
    totalReps:        session.repCount,
    goodFormPercent,
    topErrors,
    snapshots:        session.snapshots,
  };
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Returns a LiveCoachingFrame indicating landmarks were not sufficiently visible.
 * Does not update any session accumulators — invisible frames are excluded from
 * analytics to prevent score degradation due to occlusion, not form deviation.
 */
function buildInvisibleFrame(
  session: CoachingSession,
  nowMs: number
): LiveCoachingFrame {
  return {
    timestampMs:      nowMs,
    formState:        "good",  // no false-positive state during occlusion
    activeCue:        null,
    errors:           [],
    qualityScore:     session.smoothedQualityScore, // hold current score
    metrics:          {},
    repCount:         session.repCount,
    repPhase:         session.repPhase,
    landmarksVisible: false,
  };
}
