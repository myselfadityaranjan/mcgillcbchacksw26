import { useState, useEffect, useRef, useCallback } from 'react';
import { PoseEngine } from '../lib/poseEngine';
import type { PoseDetectionResult } from '../lib/poseEngine';

export type { PoseDetectionResult };

export function usePoseEngine() {
  const engineRef = useRef<PoseEngine | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const engine = new PoseEngine();
    engineRef.current = engine;

    setIsLoading(true);
    setError(null);

    engine
      .initialize()
      .then(() => {
        if (!cancelled) {
          setIsLoaded(true);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load pose model',
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const detect = useCallback(
    (video: HTMLVideoElement, timestamp: number): PoseDetectionResult | null => {
      return engineRef.current?.detect(video, timestamp) ?? null;
    },
    [],
  );

  return { isLoaded, isLoading, error, detect } as const;
}
