// ──────────────────────────────────────────────────────────────
// Snapshot — capture a JPEG frame from a live <video> element
// ──────────────────────────────────────────────────────────────

/**
 * Draw the current video frame to an off-screen canvas and return a data-URL.
 * @param quality  JPEG quality 0-1 (default 0.8)
 */
export function captureVideoFrame(
  video: HTMLVideoElement,
  quality = 0.8,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', quality);
}
