// ──────────────────────────────────────────────────────────────
// SkeletonRenderer — draw pose landmarks + bones on a canvas
// Task 6 will replace this with the polished visual system.
// ──────────────────────────────────────────────────────────────

import type { NormalizedLandmark } from '../types/pose';
import { SKELETON_CONNECTIONS } from './landmarks';

export interface SkeletonStyle {
  jointColor: string;
  jointRadius: number;
  boneColor: string;
  boneWidth: number;
  /** Alpha applied to low-visibility landmarks */
  dimAlpha: number;
  /** Visibility below which a landmark is "dim" */
  visibilityThreshold: number;
}

const DEFAULT_STYLE: SkeletonStyle = {
  jointColor: '#00ff88',
  jointRadius: 5,
  boneColor: '#00ff88',
  boneWidth: 2.5,
  dimAlpha: 0.25,
  visibilityThreshold: 0.5,
};

/**
 * Draw skeleton overlay onto a canvas.
 * The canvas should be the same size as the source video.
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  style: Partial<SkeletonStyle> = {},
): void {
  const s: SkeletonStyle = { ...DEFAULT_STYLE, ...style };

  // ── Bones ──────────────────────────────────────────────────
  ctx.lineWidth = s.boneWidth;
  ctx.lineCap = 'round';

  for (const [i, j] of SKELETON_CONNECTIONS) {
    const a = landmarks[i]!;
    const b = landmarks[j]!;
    const minVis = Math.min(a.visibility, b.visibility);

    ctx.globalAlpha = minVis >= s.visibilityThreshold ? 1 : s.dimAlpha;
    ctx.strokeStyle = s.boneColor;
    ctx.beginPath();
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
    ctx.stroke();
  }

  // ── Joints ─────────────────────────────────────────────────
  for (const lm of landmarks) {
    ctx.globalAlpha = lm.visibility >= s.visibilityThreshold ? 1 : s.dimAlpha;
    ctx.fillStyle = s.jointColor;
    ctx.beginPath();
    ctx.arc(lm.x * width, lm.y * height, s.jointRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Reset
  ctx.globalAlpha = 1;
}
