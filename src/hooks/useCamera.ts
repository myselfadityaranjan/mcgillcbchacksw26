import { useRef, useState, useCallback, useEffect } from 'react';
import { CameraManager } from '../lib/camera';

export function useCamera() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const managerRef  = useRef<CameraManager>(null);

  // Lazy-init: exactly one CameraManager per hook mount
  if (managerRef.current === null) {
    managerRef.current = new CameraManager();
  }

  const [isActive, setIsActive] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ── Re-attach the stream whenever videoRef.current changes ─
  // This handles page transitions where a new <video> element mounts
  // while the MediaStream is already running.
  useEffect(() => {
    const video  = videoRef.current;
    const stream = managerRef.current?.getStream();
    if (!video || !stream) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
      video.play().catch(() => {/* autoplay policy; user interaction already happened */});
    }
  }); // Intentionally no deps — runs after every render to catch ref changes

  const start = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      setError('Video element not mounted');
      return;
    }
    try {
      setError(null);
      await managerRef.current!.start(video);
      setIsActive(true);
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access and try again.'
          : err instanceof Error
            ? err.message
            : 'Failed to access camera';
      setError(msg);
    }
  }, []);

  const stop = useCallback(() => {
    managerRef.current!.stop();
    setIsActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const mgr = managerRef.current!;
    return () => mgr.stop();
  }, []);

  return { videoRef, isActive, error, start, stop } as const;
}
