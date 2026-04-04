// ──────────────────────────────────────────────────────────────
// CoachingPage — live drill coaching with form feedback overlay
// ──────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { useApp } from '../state/appContext';
import { useLiveCoaching } from '../hooks/useLiveCoaching';
import { speakCue, speakInstruction, stopSpeech } from '../lib/voiceCoach';
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

  // Guard: if no drill selected, bail early BEFORE hooks
  const drillId = (drill?.id ?? 'squat-alignment-drill') as DrillId;
  const drillEnabled = !!drill;

  const { currentFrame, session, elapsed, finishSession, reset } = useLiveCoaching({
    videoRef,
    canvasRef,
    detect,
    drillId,
    enabled: drillEnabled,
    sessionDuration: drill?.durationSeconds ?? 45,
  });

  // Speak drill name on mount
  useEffect(() => {
    if (drill) {
      speakInstruction(`Starting ${drill.name}. ${drill.coachingCues[0] ?? ''}`);
    }
    return () => stopSpeech();
  }, [drill]);

  // Speak cues when form state changes to red
  useEffect(() => {
    if (currentFrame?.formState === 'red' && currentFrame.cue) {
      speakCue(currentFrame.cue.text);
    }
  }, [currentFrame?.formState, currentFrame?.cue?.text]);

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

  // IMPORTANT: when body is lost (currentFrame null), do NOT default to green
  const bodyDetected = currentFrame !== null;
  const formState    = bodyDetected ? currentFrame.formState : null;
  const qualityScore = bodyDetected ? currentFrame.qualityScore : 0;

  return (
    <div className="page coaching-page">
      {/* Top bar */}
      <div className="coaching-top-bar">
        <button
          className="btn ghost btn-sm"
          onClick={() => { reset(); stopSpeech(); navigate('drill-detail'); }}
        >
          ← Exit
        </button>
        <div className="coaching-drill-name">{drill.name}</div>
        <div className={`coaching-timer ${remaining <= 10 ? 'urgent' : ''}`}>
          {remaining}s
        </div>
      </div>

      {/* Camera feed */}
      <div className={`camera-wrap coaching-camera ${formState ? `form-${formState}` : ''}`}>
        <video ref={videoRef} playsInline muted className="camera-feed" />
        <canvas ref={canvasRef} className="skeleton-overlay" />

        {/* Body not detected — clear warning, NOT green */}
        {!bodyDetected && (
          <div className="overlay-box prompts warn">
            <p className="prompt-line">Body not detected — step back so you're fully visible</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="coaching-progress-wrap">
        <div
          className={`coaching-progress-bar ${formState ? `form-bar-${formState}` : 'form-bar-green'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Quality row */}
      <div className="coaching-quality-row">
        <div className={`quality-indicator ${formState ? `form-${formState}` : 'form-lost'}`}>
          <span className="quality-dot" />
          <span className="quality-label">
            {!bodyDetected
              ? 'No body detected'
              : formState === 'green'
                ? 'Good form'
                : formState === 'yellow'
                  ? 'Needs correction'
                  : 'Fix your form'}
          </span>
        </div>
        <div className="quality-score">{bodyDetected ? qualityScore : '—'}</div>
      </div>

      <button className="btn ghost btn-sm coaching-finish" onClick={finishSession}>
        Finish &amp; see score
      </button>
    </div>
  );
}
