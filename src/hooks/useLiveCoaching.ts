// ──────────────────────────────────────────────────────────────
// useLiveCoaching — orchestrates Task 4 live coaching loop:
//   camera frames → pose detection → evaluateFrame → overlay
// ──────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react';
import { evaluateFrame, resetCoachState } from '../lib/liveCoach';
import { renderOverlay } from '../lib/overlayRenderer';
import { finaliseSession } from '../lib/qualityScore';
import type { PoseDetectionResult } from '../lib/poseEngine';
import type { DrillId } from '../types/plan';
import type { CoachingFrame, CoachingSession, LiveCue } from '../types/coaching';

export interface UseLiveCoachingOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  detect: (video: HTMLVideoElement, ts: number) => PoseDetectionResult | null;
  drillId: DrillId;
  enabled: boolean;
  /** Seconds before the session auto-completes (default: 60) */
  sessionDuration?: number;
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
  const [session, setSession] = useState<CoachingSession | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const rafRef      = useRef(0);
  const startRef    = useRef<number | null>(null);
  const inGreenRef  = useRef(0);
  const inYellowRef = useRef(0);
  const inRedRef    = useRef(0);
  const lastFrameTs = useRef(0);
  const lastCueRef  = useRef<LiveCue | null>(null);

  const finishSession = useCallback(() => {
    if (startRef.current === null) return;
    const partial: Omit<CoachingSession, 'finalScore' | 'isComplete'> = {
      drillId,
      startTime: startRef.current,
      timeInGreen:  inGreenRef.current,
      timeInYellow: inYellowRef.current,
      timeInRed:    inRedRef.current,
      lastCue: lastCueRef.current,
    };
    setSession(finaliseSession(partial));
  }, [drillId]);

  const reset = useCallback(() => {
    startRef.current = null;
    inGreenRef.current = 0;
    inYellowRef.current = 0;
    inRedRef.current = 0;
    lastCueRef.current = null;
    lastFrameTs.current = 0;
    resetCoachState();
    setCurrentFrame(null);
    setSession(null);
    setElapsed(0);
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
      const dt = lastFrameTs.current > 0 ? now - lastFrameTs.current : 16;
      lastFrameTs.current = now;

      // Initialise session start time on first real frame
      if (startRef.current === null) startRef.current = now;

      const elapsedMs = now - startRef.current;
      setElapsed(Math.floor(elapsedMs / 1000));

      // Auto-complete
      if (elapsedMs >= sessionDuration * 1000) {
        finishSession();
        return;
      }

      // Pose detection
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
              setCurrentFrame(frame);
              lastCueRef.current = frame.cue ?? lastCueRef.current;

              // Accumulate time
              if (frame.formState === 'green')       inGreenRef.current  += dt;
              else if (frame.formState === 'yellow') inYellowRef.current += dt;
              else                                   inRedRef.current    += dt;

              renderOverlay(ctx, canvas.width, canvas.height, {
                landmarks:         detection.normalizedLandmarks,
                formState:         frame.formState,
                cue:               frame.cue,
                qualityScore:      frame.qualityScore,
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

  return { currentFrame, session, elapsed, finishSession, reset } as const;
}
