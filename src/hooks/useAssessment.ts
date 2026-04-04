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

  // History ring-buffer for stability computation
  const historyRef = useRef<NormalizedLandmark[][]>([]);
  const rafRef = useRef(0);
  const lastSnapshotRef = useRef(0);

  /** Snapshot every 500 ms during capture */
  const SNAPSHOT_INTERVAL = 500;

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
    setResult(null);
    setCalibration(null);
    sync();
  }, [sync]);

  const reset = useCallback(() => {
    flowRef.current = new AssessmentFlow();
    historyRef.current = [];
    setResult(null);
    setCalibration(null);
    setCurrentLandmarks(null);
    sync();
  }, [sync]);

  // ── Auto-advance from step-complete after a short pause ─

  useEffect(() => {
    if (state.phase !== 'step-complete') return;
    const id = setTimeout(() => {
      flowRef.current.nextStep();
      sync();
    }, 1_200);
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
          // Resize canvas only when needed
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
        historyRef.current.push(detection.normalizedLandmarks);
        if (historyRef.current.length > 30) {
          historyRef.current.shift();
        }
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
          setCalibration(null);
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
    start,
    reset,
  } as const;
}
