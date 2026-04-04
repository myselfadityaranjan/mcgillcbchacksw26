// ──────────────────────────────────────────────────────────────
// CoachingPage — live drill coaching with form feedback overlay
// The <video> lives in App.tsx (persistent). This page renders
// the canvas overlay + coaching UI.
// ──────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { useApp } from '../state/appContext';
import { useLiveCoaching } from '../hooks/useLiveCoaching';
import type { PoseDetectionResult } from '../lib/poseEngine';
import type { DrillId } from '../types/plan';

interface CoachingPageProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  detect: (video: HTMLVideoElement, ts: number) => PoseDetectionResult | null;
}

export function CoachingPage({ videoRef, detect }: CoachingPageProps) {
  const { state, navigate, completeCoaching } = useApp();
  const drill     = state.selectedDrill;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { currentFrame, session, elapsed, finishSession, reset } = useLiveCoaching({
    videoRef,
    canvasRef,
    detect,
    drillId: (drill?.id ?? 'squat-alignment-drill') as DrillId,
    enabled: !!drill,
    sessionDuration: drill?.durationSeconds ?? 45,
  });

  useEffect(() => {
    if (session?.isComplete) {
      completeCoaching(session);
    }
  }, [session, completeCoaching]);

  if (!drill) {
    navigate('results');
    return null;
  }

  const totalSeconds = drill.durationSeconds;
  const remaining    = Math.max(0, totalSeconds - elapsed);
  const progress     = Math.min(1, elapsed / totalSeconds);
  const formState    = currentFrame?.formState ?? 'green';
  const qualityScore = currentFrame?.qualityScore ?? 100;

  return (
    <div className="page coaching-page">
      {/* Top bar */}
      <div className="coaching-top-bar">
        <button
          className="btn ghost btn-sm"
          onClick={() => { reset(); navigate('drill-detail'); }}
        >
          ← Exit
        </button>
        <div className="coaching-drill-name">{drill.name}</div>
        <div className={`coaching-timer ${remaining <= 10 ? 'urgent' : ''}`}>
          {remaining}s
        </div>
      </div>

      {/* Camera feed — stream re-attached by useCamera on mount */}
      <div className={`camera-wrap coaching-camera form-${formState}`}>
        <video ref={videoRef} playsInline muted className="camera-feed" />
        <canvas ref={canvasRef} className="skeleton-overlay" />

        {/* No body detected warning */}
        {!currentFrame && (
          <div className="overlay-box prompts warn">
            <p className="prompt-line">Step back so your full body is visible</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="coaching-progress-wrap">
        <div
          className={`coaching-progress-bar form-bar-${formState}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Quality row */}
      <div className="coaching-quality-row">
        <div className={`quality-indicator form-${formState}`}>
          <span className="quality-dot" />
          <span className="quality-label">
            {formState === 'green'
              ? 'Good form'
              : formState === 'yellow'
                ? 'Needs correction'
                : 'Fix your form'}
          </span>
        </div>
        <div className="quality-score">{qualityScore}</div>
      </div>

      <button className="btn ghost btn-sm coaching-finish" onClick={finishSession}>
        Finish &amp; see score
      </button>
    </div>
  );
}
