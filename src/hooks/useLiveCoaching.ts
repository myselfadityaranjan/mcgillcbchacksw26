// ──────────────────────────────────────────────────────────────
// useLiveCoaching — orchestrates Task 4 live coaching loop:
//   camera frames → pose detection → evaluateFrame → overlay
// ──────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react';
import { evaluateFrame } from '../lib/liveCoach';
import { renderOverlay } from '../lib/overlayRenderer';
import { finaliseSession } from '../lib/qualityScore';
import type { PoseDetectionResult } from '../lib/poseEngine';
import type { DrillId } from '../types/plan';
import type { CoachingFrame, CoachingSession, FormState, LiveCue } from '../types/coaching';

export interface UseLiveCoachingOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  detect: (video: HTMLVideoElement, ts: number) => PoseDetectionResult | null;
  drillId: DrillId;
  enabled: boolean;
  /** Seconds before the session auto-completes (default: 60) */
  sessionDuration?: number;
}

export interface LiveStreakStats {
  /** Seconds of current continuous green-form streak */
  current: number;
  /** Best streak reached so far this session */
  best: number;
  /** Times form was recovered from yellow/red back to green */
  recoveries: number;
}

export function useLiveCoaching({
  videoRef,
  canvasRef,
  detect,
  drillId,
  enabled,
  sessionDuration = 60,
}: UseLiveCoachingOptions) {
  const [currentFrame, setCurrentFrame] = useState<CoachingFrame | null>(null);
  const [session, setSession]           = useState<CoachingSession | null>(null);
  const [elapsed, setElapsed]           = useState(0);
  const [streak, setStreak]             = useState<LiveStreakStats>({ current: 0, best: 0, recoveries: 0 });

  const rafRef           = useRef(0);
  const startRef         = useRef<number | null>(null);
  const inGreenRef       = useRef(0);
  const inYellowRef      = useRef(0);
  const inRedRef         = useRef(0);
  const lastFrameTs      = useRef(0);
  const lastCueRef       = useRef<LiveCue | null>(null);

  // Streak tracking
  const currentStreakRef = useRef(0);   // seconds of current green streak
  const bestStreakRef    = useRef(0);   // peak streak this session
  const recoveriesRef    = useRef(0);   // times transitioned into green from non-green
  const prevStateRef     = useRef<FormState>('green');

  const finishSession = useCallback(() => {
    if (startRef.current === null) return;
    const partial: Omit<CoachingSession, 'finalScore' | 'isComplete'> = {
      drillId,
      startTime:     startRef.current,
      timeInGreen:   inGreenRef.current,
      timeInYellow:  inYellowRef.current,
      timeInRed:     inRedRef.current,
      lastCue:       lastCueRef.current,
      currentStreak: Math.round(currentStreakRef.current * 10) / 10,
      bestStreak:    Math.round(bestStreakRef.current    * 10) / 10,
      recoveries:    recoveriesRef.current,
    };
    setSession(finaliseSession(partial));
  }, [drillId]);

  const reset = useCallback(() => {
    startRef.current         = null;
    inGreenRef.current       = 0;
    inYellowRef.current      = 0;
    inRedRef.current         = 0;
    lastCueRef.current       = null;
    currentStreakRef.current = 0;
    bestStreakRef.current    = 0;
    recoveriesRef.current    = 0;
    prevStateRef.current     = 'green';
    setCurrentFrame(null);
    setSession(null);
    setElapsed(0);
    setStreak({ current: 0, best: 0, recoveries: 0 });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();
      const dt  = lastFrameTs.current > 0 ? now - lastFrameTs.current : 16;
      lastFrameTs.current = now;

      if (startRef.current === null) startRef.current = now;

      const elapsedMs = now - startRef.current;
      setElapsed(Math.floor(elapsedMs / 1000));

      if (elapsedMs >= sessionDuration * 1000) {
        finishSession();
        return;
      }

      const detection = detect(video, now);

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width  = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          if (detection) {
            const frame = evaluateFrame(drillId, detection.normalizedLandmarks);
            if (frame) {
              // ── Streak tracking ─────────────────────────────
              const prevState = prevStateRef.current;
              const newState  = frame.formState;

              if (newState === 'green') {
                currentStreakRef.current += dt / 1000;
                if (currentStreakRef.current > bestStreakRef.current) {
                  bestStreakRef.current = currentStreakRef.current;
                }
                if (prevState !== 'green') {
                  recoveriesRef.current += 1;
                }
              } else {
                currentStreakRef.current = 0;
              }
              prevStateRef.current = newState;

              setCurrentFrame(frame);
              setStreak({
                current:    Math.round(currentStreakRef.current * 10) / 10,
                best:       Math.round(bestStreakRef.current    * 10) / 10,
                recoveries: recoveriesRef.current,
              });

              lastCueRef.current = frame.cue ?? lastCueRef.current;

              if (frame.formState === 'green')       inGreenRef.current  += dt;
              else if (frame.formState === 'yellow') inYellowRef.current += dt;
              else                                   inRedRef.current    += dt;

              renderOverlay(ctx, canvas.width, canvas.height, {
                landmarks:          detection.normalizedLandmarks,
                formState:          frame.formState,
                cue:                frame.cue,
                qualityScore:       frame.qualityScore,
                highlightLandmarks: frame.cue?.affectedLandmarks ?? [],
                showAlignmentLines: true,
                showFormIndicator:  true,
              });
            }
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, videoRef, canvasRef, detect, drillId, sessionDuration, finishSession]);

  return { currentFrame, session, elapsed, finishSession, reset, streak } as const;
}
