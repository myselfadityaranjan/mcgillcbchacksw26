import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Flame, Trophy, RotateCcw } from 'lucide-react';
import { useApp } from '../state/appContext';
import { useLiveCoaching } from '../hooks/useLiveCoaching';
import { speakCue, speakInstruction, stopSpeech } from '../lib/voiceCoach';
import { Button } from '../components/ui/Button';
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

  const drillId = (drill?.id ?? 'squat-alignment-drill') as DrillId;

  const { currentFrame, session, elapsed, finishSession, reset, streak } = useLiveCoaching({
    videoRef,
    canvasRef,
    detect,
    drillId,
    enabled: !!drill,
    sessionDuration: drill?.durationSeconds ?? 45,
  });

  // Speak drill name on mount
  useEffect(() => {
    if (drill) {
      speakInstruction(`Starting ${drill.name}. ${drill.coachingCues[0] ?? ''}`);
    }
    return () => stopSpeech();
  }, [drill]);

  // Speak cues when form goes red
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

  const bodyDetected = currentFrame !== null;
  const formState    = bodyDetected ? currentFrame.formState : null;
  const qualityScore = bodyDetected ? currentFrame.qualityScore : 0;

  const formColor =
    formState === 'green' ? 'text-success' :
    formState === 'yellow' ? 'text-warning' :
    formState === 'red' ? 'text-danger' : 'text-text-3';

  const fmtStreak = (s: number) => s >= 10 ? `${Math.floor(s)}s` : `${s.toFixed(1)}s`;

  return (
    <div className="min-h-screen flex flex-col bg-[#1C1810]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1C1810]/90 backdrop-blur-sm z-10">
        <button
          onClick={() => { reset(); stopSpeech(); navigate('drill-detail'); }}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm cursor-pointer bg-transparent border-none"
        >
          <X size={16} />
          Exit
        </button>
        <span className="text-white font-semibold text-sm">{drill.name}</span>
        <span className={`text-lg font-black font-mono tabular-nums ${remaining <= 10 ? 'text-danger animate-pulse' : 'text-white'}`}>
          {remaining}s
        </span>
      </div>

      {/* Camera feed */}
      <div className="flex-1 relative mx-3 mb-3 rounded-2xl overflow-hidden bg-[#252017]">
        <video ref={videoRef} playsInline muted className="camera-feed" />
        <canvas ref={canvasRef} className="skeleton-overlay" />

        {!bodyDetected && (
          <div className="overlay-box prompts warn">
            <p className="prompt-line">Body not detected — step back so you're fully visible</p>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="bg-bg rounded-t-3xl px-5 pt-5 pb-6 space-y-4 -mt-3 relative z-10">
        {/* Progress bar */}
        <div className="h-2 bg-elevated rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              formState === 'green' ? 'bg-success' :
              formState === 'yellow' ? 'bg-warning' :
              formState === 'red' ? 'bg-danger' : 'bg-text-3'
            }`}
            style={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Quality row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              formState === 'green' ? 'bg-success shadow-[0_0_8px_rgba(91,163,122,0.5)]' :
              formState === 'yellow' ? 'bg-warning shadow-[0_0_8px_rgba(217,123,53,0.5)]' :
              formState === 'red' ? 'bg-danger shadow-[0_0_8px_rgba(192,90,82,0.5)]' :
              'bg-text-3 animate-pulse'
            }`} />
            <span className={`text-sm font-semibold ${formColor}`}>
              {!bodyDetected ? 'No body detected' :
               formState === 'green' ? 'Good form' :
               formState === 'yellow' ? 'Needs correction' : 'Fix your form'}
            </span>
          </div>
          <span className="text-2xl font-black font-mono tabular-nums text-text-1">
            {bodyDetected ? qualityScore : '—'}
          </span>
        </div>

        {/* Streak HUD */}
        <div className="flex items-center justify-center gap-5 py-2">
          <div className={`flex items-center gap-2 ${formState === 'green' && streak.current > 0 ? 'text-warning' : 'text-text-3'}`}>
            <Flame size={18} className={formState === 'green' && streak.current > 0 ? 'animate-pulse' : ''} />
            <span className="font-bold text-sm tabular-nums">{fmtStreak(streak.current)}</span>
            <span className="text-xs text-text-3">streak</span>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2 text-text-3">
            <Trophy size={14} />
            <span className="font-bold text-sm tabular-nums">{fmtStreak(streak.best)}</span>
            <span className="text-xs">best</span>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2 text-text-3">
            <RotateCcw size={14} />
            <span className="font-bold text-sm tabular-nums">{streak.recoveries}</span>
            <span className="text-xs">recoveries</span>
          </div>
        </div>

        <Button fullWidth variant="ghost" size="sm" onClick={finishSession}>
          Finish & see score
        </Button>
      </div>
    </div>
  );
}
