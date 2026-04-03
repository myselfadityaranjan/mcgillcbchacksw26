import { useRef } from 'react';
import { useCamera } from './hooks/useCamera';
import { usePoseEngine } from './hooks/usePoseEngine';
import { useAssessment } from './hooks/useAssessment';

export function App() {
  const { videoRef, isActive, error: camErr, start: startCam } = useCamera();
  const { isLoaded, isLoading, error: modelErr, detect } = usePoseEngine();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { state, calibration, result, start, reset } = useAssessment({
    videoRef,
    canvasRef,
    detect,
    enabled: isActive && isLoaded,
  });

  const ready = isActive && isLoaded;
  const showStep =
    state.phase !== 'idle' && state.phase !== 'complete' && state.currentStep;

  return (
    <div className="app">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="header">
        <h1>StrainSense</h1>
        <p className="subtitle">Real-Time Corrective Movement Intelligence</p>
      </header>

      {/* ── Errors ──────────────────────────────────────── */}
      {(camErr ?? modelErr) && (
        <div className="banner error">{camErr ?? modelErr}</div>
      )}

      {/* ── Pre-camera state ────────────────────────────── */}
      {!isActive && !camErr && (
        <div className="center-col">
          <p>
            StrainSense needs your camera to analyse your posture and movement.
            <br />
            No video is stored or sent to any server.
          </p>
          <button className="btn primary" onClick={startCam}>
            Enable Camera
          </button>
        </div>
      )}

      {/* ── Loading model ───────────────────────────────── */}
      {isActive && isLoading && (
        <div className="banner info">Loading pose model&hellip;</div>
      )}

      {/* ── Camera + overlay ────────────────────────────── */}
      {isActive && (
        <div className="camera-wrap">
          <video
            ref={videoRef}
            playsInline
            muted
            className="camera-feed"
          />
          <canvas ref={canvasRef} className="skeleton-overlay" />

          {/* Calibration prompts */}
          {state.phase === 'calibrating' && calibration && (
            <div className="overlay-box prompts">
              {calibration.prompts.length > 0 ? (
                calibration.prompts.map((p) => <p key={p}>{p}</p>)
              ) : (
                <p className="ok">Hold still&hellip;</p>
              )}
            </div>
          )}

          {/* Countdown */}
          {state.phase === 'countdown' && (
            <div className="overlay-box countdown">
              <span>{state.countdownSecondsLeft}</span>
            </div>
          )}

          {/* Capture progress bar */}
          {state.phase === 'capturing' && (
            <div className="capture-bar-wrap">
              <div
                className="capture-bar"
                style={{ width: `${state.captureProgress * 100}%` }}
              />
              <span className="capture-label">Recording&hellip;</span>
            </div>
          )}

          {/* Step complete flash */}
          {state.phase === 'step-complete' && (
            <div className="overlay-box done">
              <p>Step {state.completedSteps} of {state.totalSteps} complete</p>
            </div>
          )}
        </div>
      )}

      {/* ── Step instruction ────────────────────────────── */}
      {showStep && state.currentStep && (
        <div className="step-card">
          <h2>
            Step {state.currentStepIndex + 1}/{state.totalSteps}:{' '}
            {state.currentStep.name}
          </h2>
          <p>{state.currentStep.instruction}</p>
        </div>
      )}

      {/* ── Start / reset controls ──────────────────────── */}
      {ready && state.phase === 'idle' && (
        <div className="center-col">
          <button className="btn primary" onClick={start}>
            Start Assessment
          </button>
        </div>
      )}

      {/* ── Results summary ─────────────────────────────── */}
      {state.phase === 'complete' && result && (
        <div className="results-card">
          <h2>Assessment Complete</h2>
          <p>
            Captured <strong>{result.captures.length}</strong> movements in{' '}
            <strong>{(result.totalDuration / 1_000).toFixed(1)}s</strong>
          </p>
          <ul>
            {result.captures.map((c) => (
              <li key={c.stepId}>
                {c.stepId} &mdash; {c.frames.length} frames
                {c.representativeFrame?.imageDataUrl && ' (snapshot saved)'}
              </li>
            ))}
          </ul>
          <button className="btn primary" onClick={reset}>
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}
