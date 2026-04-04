import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useApp } from '../state/appContext';
import { useAssessment } from '../hooks/useAssessment';
import { Button } from '../components/ui/Button';
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

  useEffect(() => {
    if (state.phase === 'complete' && result) {
      completeAssessment(result);
    }
  }, [state.phase, result, completeAssessment]);

  useEffect(() => {
    start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showCalibration = state.phase === 'calibrating';
  const showCountdown   = state.phase === 'countdown';
  const showCapture     = state.phase === 'capturing';
  const showComplete    = state.phase === 'step-complete';

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      {/* Step progress */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: state.totalSteps }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`h-2 rounded-full transition-all duration-300 ${
              i < state.completedSteps
                ? 'w-8 bg-success'
                : i === state.currentStepIndex
                  ? 'w-8 bg-brand'
                  : 'w-4 bg-elevated'
            }`}
          />
        ))}
      </div>

      {/* Camera feed */}
      <div className="camera-wrap">
        <video ref={videoRef} playsInline muted className="camera-feed" />
        <canvas ref={canvasRef} className="skeleton-overlay" />

        {showCalibration && calibration && (
          <div className={`overlay-box prompts ${calibration.isReady ? 'ok' : 'warn'}`}>
            {calibration.prompts.length > 0 ? (
              calibration.prompts.map((p) => (
                <p key={p} className="prompt-line">{p}</p>
              ))
            ) : (
              <p className="prompt-line ok">Hold still...</p>
            )}
          </div>
        )}

        {showCountdown && (
          <div className="overlay-box countdown">
            <span>{state.countdownSecondsLeft}</span>
          </div>
        )}

        {showCapture && (
          <div className="capture-bar-wrap">
            <div className="capture-bar" style={{ width: `${state.captureProgress * 100}%` }} />
            <span className="capture-label">Recording...</span>
          </div>
        )}

        {showComplete && (
          <div className="overlay-box step-done">
            <span className="step-done-check">✓</span>
            <p>Step {state.completedSteps} done</p>
          </div>
        )}

        {detectionLost && !showCalibration && !showComplete && (
          <div className="overlay-box prompts warn">
            <p className="prompt-line">Body not detected — ensure you're fully in frame</p>
          </div>
        )}
      </div>

      {/* Step instruction card */}
      {state.currentStep && state.phase !== 'complete' && (
        <motion.div
          key={state.currentStepIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-brand">
              Step {state.currentStepIndex + 1} / {state.totalSteps}
            </span>
            <span className="text-sm font-bold text-text-1">{state.currentStep.name}</span>
          </div>
          <p className="text-sm text-text-2">{state.currentStep.instruction}</p>
        </motion.div>
      )}

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={reset} leftIcon={<RotateCcw size={14} />}>
          Restart
        </Button>
      </div>
    </div>
  );
}
