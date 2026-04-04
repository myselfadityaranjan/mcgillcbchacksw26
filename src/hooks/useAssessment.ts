// ──────────────────────────────────────────────────────────────
// useAssessment — orchestrates the full guided-scan pipeline:
//   camera frames → pose detection → calibration → state machine
//   → frame capture → skeleton overlay → assessment result
// ──────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react';
import { AssessmentFlow } from '../lib/assessmentFlow';
import { checkCalibration, computeStability } from '../lib/calibration';
import { captureVideoFrame } from '../lib/snapshot';
import { renderAssessmentOverlay } from '../lib/overlayRenderer';
import { speakInstruction } from '../lib/voiceCoach';
import type { PoseDetectionResult } from '../lib/poseEngine';
import type {
  AssessmentState,
  AssessmentResult,
  CalibrationStatus,
  NormalizedLandmark,
} from '../types/pose';

// ── Hook options ─────────────────────────────────────────────

export interface UseAssessmentOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  detect: (video: HTMLVideoElement, ts: number) => PoseDetectionResult | null;
  /** Only run the rAF loop when camera + model are both ready */
  enabled: boolean;
}

/** Max time (ms) in calibrating with no detection before showing warning */
const CALIBRATION_TIMEOUT = 20_000;

// ── Hook ─────────────────────────────────────────────────────

export function useAssessment({
  videoRef,
  canvasRef,
  detect,
  enabled,
}: UseAssessmentOptions) {
  const flowRef = useRef<AssessmentFlow>(new AssessmentFlow());

  const [state, setState] = useState<AssessmentState>(
    flowRef.current.getState(),
  );
  const [calibration, setCalibration] = useState<CalibrationStatus | null>(
    null,
  );
  const [currentLandmarks, setCurrentLandmarks] = useState<
    NormalizedLandmark[] | null
  >(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [detectionLost, setDetectionLost] = useState(false);

  // History ring-buffer for stability computation
  const historyRef = useRef<NormalizedLandmark[][]>([]);
  const rafRef = useRef(0);
  const lastSnapshotRef = useRef(0);
  const calibrationStartRef = useRef(0);
  const lastDetectionRef = useRef(0);

  /** Snapshot every 400 ms during capture (higher frequency for better peaks) */
  const SNAPSHOT_INTERVAL = 400;

  // ── Sync React state from the flow machine ─────────────
  const sync = useCallback(() => {
    const s = flowRef.current.getState();
    setState(s);
    if (s.phase === 'complete') {
      setResult(flowRef.current.getResult());
    }
  }, []);

  // ── Public controls ────────────────────────────────────

  const start = useCallback(() => {
    flowRef.current = new AssessmentFlow();
    flowRef.current.start();
    historyRef.current = [];
    lastSnapshotRef.current = 0;
    calibrationStartRef.current = performance.now();
    lastDetectionRef.current = performance.now();
    setResult(null);
    setCalibration(null);
    setDetectionLost(false);
    sync();
  }, [sync]);

  const reset = useCallback(() => {
    flowRef.current = new AssessmentFlow();
    historyRef.current = [];
    lastSnapshotRef.current = 0;
    setResult(null);
    setCalibration(null);
    setCurrentLandmarks(null);
    setDetectionLost(false);
    sync();
  }, [sync]);

  // ── Voice instruction when step changes ────────────────

  useEffect(() => {
    if (state.phase === 'calibrating' && state.currentStep) {
      speakInstruction(state.currentStep.instruction);
      calibrationStartRef.current = performance.now();
    }
  }, [state.phase, state.currentStepIndex, state.currentStep]);

  // ── Auto-advance from step-complete after a short pause ─

  useEffect(() => {
    if (state.phase !== 'step-complete') return;
    const id = setTimeout(() => {
      flowRef.current.nextStep();
      sync();
    }, 1_500); // slightly longer so users can register completion
    return () => clearTimeout(id);
  }, [state.phase, state.completedSteps, sync]);

  // ── Main rAF detection / overlay / state-drive loop ────

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();
      const flow = flowRef.current;

      // ─ Pose detection ─────────────────────────────────
      const detection = detect(video, now);

      // ─ Canvas overlay ─────────────────────────────────
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (
            canvas.width !== video.videoWidth ||
            canvas.height !== video.videoHeight
          ) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (detection) {
            renderAssessmentOverlay(
              ctx,
              canvas.width,
              canvas.height,
              detection.normalizedLandmarks,
            );
          }
        }
      }

      // ─ Landmark history (always maintain when we have data) ──
      if (detection) {
        setCurrentLandmarks(detection.normalizedLandmarks);
        lastDetectionRef.current = now;
        setDetectionLost(false);
        historyRef.current.push(detection.normalizedLandmarks);
        if (historyRef.current.length > 30) {
          historyRef.current.shift();
        }
      } else if (now - lastDetectionRef.current > 3_000) {
        // No detection for 3 seconds — warn the user
        setDetectionLost(true);
      }

      // ─ Phase-specific logic ───────────────────────────
      const phase = flow.getState().phase;

      if (phase === 'calibrating') {
        if (detection) {
          const step = flow.getState().currentStep;
          const reqLM = step?.requiredLandmarks;
          const stability = computeStability(historyRef.current);
          const cal = checkCalibration(
            detection.normalizedLandmarks,
            stability,
            reqLM,
          );
          setCalibration(cal);

          if (cal.isReady) {
            flow.onCalibrationReady(now);
          } else {
            flow.onCalibrationLost();
          }
        } else {
          flow.onCalibrationLost();
          // Show timeout warning after CALIBRATION_TIMEOUT
          if (now - calibrationStartRef.current > CALIBRATION_TIMEOUT) {
            setCalibration({
              isReady: false,
              fullBodyVisible: false,
              distance: 'ok',
              centering: 'ok',
              stability: false,
              prompts: ['Cannot detect your body. Try improving lighting or stepping further back.'],
            });
          }
        }
        sync();
      } else if (phase === 'countdown') {
        flow.tickCountdown(now);
        sync();
      } else if (phase === 'capturing') {
        if (detection) {
          const shouldSnap =
            now - lastSnapshotRef.current >= SNAPSHOT_INTERVAL;

          flow.addFrame({
            normalizedLandmarks: detection.normalizedLandmarks,
            worldLandmarks: detection.worldLandmarks,
            timestamp: now,
            imageDataUrl: shouldSnap
              ? captureVideoFrame(video)
              : undefined,
          });

          if (shouldSnap) lastSnapshotRef.current = now;
        }
        flow.tickCapture(now);
        sync();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, videoRef, canvasRef, detect, sync]);

  return {
    state,
    calibration,
    currentLandmarks,
    result,
    detectionLost,
    start,
    reset,
  } as const;
}
