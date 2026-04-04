// ──────────────────────────────────────────────────────────────
// AssessmentPage — guided 5-step movement scan
// The <video> element lives in App.tsx (persistent across pages).
// This page renders only the canvas overlay and UI.
// ──────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { useApp } from '../state/appContext';
import { useAssessment } from '../hooks/useAssessment';
import type { PoseDetectionResult } from '../lib/poseEngine';

interface AssessmentPageProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  detect: (video: HTMLVideoElement, ts: number) => PoseDetectionResult | null;
}

export function AssessmentPage({ videoRef, detect }: AssessmentPageProps) {
  const { completeAssessment } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { state, calibration, result, detectionLost, start, reset } = useAssessment({
    videoRef,
    canvasRef,
    detect,
    enabled: true,
  });

  // Trigger analysis when assessment completes
  useEffect(() => {
    if (state.phase === 'complete' && result) {
      completeAssessment(result);
    }
  }, [state.phase, result, completeAssessment]);

  // Auto-start on mount
  useEffect(() => {
    start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showCalibration = state.phase === 'calibrating';
  const showCountdown   = state.phase === 'countdown';
  const showCapture     = state.phase === 'capturing';
  const showComplete    = state.phase === 'step-complete';

  return (
    <div className="page assessment-page">
      {/* Step progress indicator */}
      <div className="step-progress-track">
        {Array.from({ length: state.totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`step-progress-dot ${
              i < state.completedSteps
                ? 'done'
                : i === state.currentStepIndex
                  ? 'active'
                  : ''
            }`}
          />
        ))}
      </div>

      {/* Camera feed — stream is re-attached here by useCamera on mount */}
      <div className="camera-wrap">
        <video ref={videoRef} playsInline muted className="camera-feed" />
        <canvas ref={canvasRef} className="skeleton-overlay" />

        {/* Calibration overlay */}
        {showCalibration && calibration && (
          <div className={`overlay-box prompts ${calibration.isReady ? 'ok' : 'warn'}`}>
            {calibration.prompts.length > 0 ? (
              calibration.prompts.map((p) => (
                <p key={p} className="prompt-line">{p}</p>
              ))
            ) : (
              <p className="prompt-line ok">Hold still…</p>
            )}
          </div>
        )}

        {/* Countdown */}
        {showCountdown && (
          <div className="overlay-box countdown">
            <span>{state.countdownSecondsLeft}</span>
          </div>
        )}

        {/* Capture progress bar */}
        {showCapture && (
          <div className="capture-bar-wrap">
            <div
              className="capture-bar"
              style={{ width: `${state.captureProgress * 100}%` }}
            />
            <span className="capture-label">Recording…</span>
          </div>
        )}

        {/* Step complete flash */}
        {showComplete && (
          <div className="overlay-box step-done">
            <span className="step-done-check">✓</span>
            <p>Step {state.completedSteps} done</p>
          </div>
        )}

        {/* Detection lost warning */}
        {detectionLost && !showCalibration && !showComplete && (
          <div className="overlay-box prompts warn">
            <p className="prompt-line">Body not detected — ensure you're fully in frame</p>
          </div>
        )}
      </div>

      {/* Step instruction card */}
      {state.currentStep && state.phase !== 'complete' && (
        <div className="step-card">
          <div className="step-card-header">
            <span className="step-number">
              Step {state.currentStepIndex + 1} / {state.totalSteps}
            </span>
            <span className="step-name">{state.currentStep.name}</span>
          </div>
          <p className="step-instruction">{state.currentStep.instruction}</p>
        </div>
      )}

      <button className="btn ghost btn-sm assessment-reset" onClick={reset}>
        Restart
      </button>
    </div>
  );
}
