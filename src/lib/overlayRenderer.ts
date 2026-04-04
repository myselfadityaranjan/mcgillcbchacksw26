// ──────────────────────────────────────────────────────────────
// overlayRenderer.ts — polished Task-6 visual overlay system
//   Renders skeleton, alignment lines, joint highlights,
//   correction arrows, and form-state colour coding.
// ──────────────────────────────────────────────────────────────

import type { NormalizedLandmark } from '../types/pose';
import type { FormState, LiveCue } from '../types/coaching';
import { SKELETON_CONNECTIONS } from './landmarks';

// ── Colour palette ────────────────────────────────────────────

export const COLOURS = {
  green:   '#00ff88',
  yellow:  '#fbbf24',
  red:     '#ff4444',
  dim:     'rgba(255,255,255,0.18)',
  bone:    'rgba(0,255,136,0.55)',
  highlight: '#ffffff',
  arrow:   '#fbbf24',
  shadow:  'rgba(0,0,0,0.55)',
} as const;

function formColour(state: FormState): string {
  return state === 'green' ? COLOURS.green : state === 'yellow' ? COLOURS.yellow : COLOURS.red;
}

// ── Helpers ───────────────────────────────────────────────────

function px(lm: NormalizedLandmark, w: number, h: number): [number, number] {
  return [lm.x * w, lm.y * h];
}

/** Draw an arrow from (x1,y1) in direction (dx,dy)*length */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  dx: number,
  dy: number,
  length: number,
  colour: string,
): void {
  const x2 = x1 + dx * length;
  const y2 = y1 + dy * length;
  const angle = Math.atan2(dy, dx);
  const headLen = length * 0.35;

  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.shadowColor = COLOURS.shadow;
  ctx.shadowBlur = 6;

  // Shaft
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle - Math.PI / 6),
    y2 - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle + Math.PI / 6),
    y2 - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.stroke();
  ctx.restore();
}

// ── Skeleton ──────────────────────────────────────────────────

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  lms: NormalizedLandmark[],
  w: number,
  h: number,
  highlightIndices: Set<number>,
  formState: FormState,
): void {
  const stateColour = formColour(formState);

  // Bones
  ctx.lineCap = 'round';
  for (const [i, j] of SKELETON_CONNECTIONS) {
    const a = lms[i]!, b = lms[j]!;
    const minVis = Math.min(a.visibility, b.visibility);
    if (minVis < 0.2) continue;

    const isHighlighted = highlightIndices.has(i) || highlightIndices.has(j);
    ctx.globalAlpha = minVis >= 0.5 ? (isHighlighted ? 0.9 : 0.55) : 0.22;
    ctx.strokeStyle = isHighlighted ? stateColour : COLOURS.bone;
    ctx.lineWidth = isHighlighted ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(...px(a, w, h));
    ctx.lineTo(...px(b, w, h));
    ctx.stroke();
  }

  // Joints
  for (let idx = 0; idx < lms.length; idx++) {
    const l = lms[idx]!;
    if (l.visibility < 0.2) continue;
    const isHighlighted = highlightIndices.has(idx);
    const [x, y] = px(l, w, h);
    const radius = isHighlighted ? 7 : 4;

    ctx.globalAlpha = l.visibility >= 0.5 ? 1 : 0.3;

    if (isHighlighted) {
      // Glow ring
      ctx.save();
      ctx.shadowColor = stateColour;
      ctx.shadowBlur = 14;
      ctx.fillStyle = stateColour;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = COLOURS.bone;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

// ── Alignment lines ───────────────────────────────────────────

function drawAlignmentLines(
  ctx: CanvasRenderingContext2D,
  lms: NormalizedLandmark[],
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.setLineDash([6, 8]);
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#ffffff';

  // Shoulder line
  const ls = lms[11]!, rs = lms[12]!;
  if (ls.visibility > 0.5 && rs.visibility > 0.5) {
    ctx.beginPath();
    ctx.moveTo(...px(ls, w, h));
    ctx.lineTo(...px(rs, w, h));
    ctx.stroke();
  }

  // Hip line
  const lh = lms[23]!, rh = lms[24]!;
  if (lh.visibility > 0.5 && rh.visibility > 0.5) {
    ctx.beginPath();
    ctx.moveTo(...px(lh, w, h));
    ctx.lineTo(...px(rh, w, h));
    ctx.stroke();
  }

  ctx.restore();
}

// ── Cue text box ──────────────────────────────────────────────

function drawCueBox(
  ctx: CanvasRenderingContext2D,
  cue: LiveCue,
  w: number,
  h: number,
  formState: FormState,
): void {
  const colour = formColour(formState);
  const text = cue.text;
  const fontSize = Math.max(14, Math.round(w * 0.022));

  ctx.save();
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const boxW = Math.min(textWidth + 32, w - 32);
  const boxH = fontSize + 24;
  const boxX = (w - boxW) / 2;
  const boxY = h - boxH - 16;

  // Background pill
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 10);
  ctx.fill();

  // Colour bar on left
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, 4, boxH, [4, 0, 0, 4]);
  ctx.fill();

  // Text
  ctx.fillStyle = colour;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 4;
  ctx.fillText(text, boxX + boxW / 2, boxY + boxH / 2, boxW - 16);
  ctx.restore();
}

// ── Correction arrows ─────────────────────────────────────────

function drawCorrectionArrows(
  ctx: CanvasRenderingContext2D,
  cue: LiveCue,
  lms: NormalizedLandmark[],
  w: number,
  h: number,
): void {
  if (!cue.arrows) return;
  const colour = cue.priority === 'unsafe' ? COLOURS.red : COLOURS.yellow;
  const arrowLength = w * 0.06;

  for (const arrow of cue.arrows) {
    const lm = lms[arrow.fromLandmark];
    if (!lm || lm.visibility < 0.3) continue;
    const [x, y] = px(lm, w, h);
    drawArrow(ctx, x, y, arrow.dx, arrow.dy, arrowLength, colour);
  }
}

// ── Form state indicator ──────────────────────────────────────

function drawFormIndicator(
  ctx: CanvasRenderingContext2D,
  state: FormState,
  score: number,
  w: number,
  _h: number,
): void {
  const colour = formColour(state);
  const label =
    state === 'green' ? 'Good form' : state === 'yellow' ? 'Needs correction' : 'Fix form';

  const fontSize = Math.max(12, Math.round(w * 0.018));

  ctx.save();
  ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'right';

  // Dot
  const dotR = fontSize * 0.5;
  const dotX = w - 16 - dotR;
  const dotY = 16 + dotR;

  ctx.save();
  ctx.shadowColor = colour;
  ctx.shadowBlur = 10;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 4;
  ctx.fillText(`${label} — ${score}`, w - 16 - dotR * 2 - 8, 14);
  ctx.restore();
}

// ── Public API ────────────────────────────────────────────────

export interface OverlayOptions {
  landmarks: NormalizedLandmark[];
  formState?: FormState;
  cue?: LiveCue | null;
  qualityScore?: number;
  highlightLandmarks?: number[];
  showAlignmentLines?: boolean;
  showFormIndicator?: boolean;
}

/**
 * Render the full coaching overlay onto a canvas context.
 * Call this every animation frame.
 */
export function renderOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: OverlayOptions,
): void {
  const {
    landmarks,
    formState = 'green',
    cue = null,
    qualityScore = 100,
    highlightLandmarks = [],
    showAlignmentLines = true,
    showFormIndicator = true,
  } = opts;

  ctx.clearRect(0, 0, w, h);

  if (landmarks.length < 33) return;

  const highlighted = new Set(highlightLandmarks);

  drawSkeleton(ctx, landmarks, w, h, highlighted, formState);

  if (showAlignmentLines) {
    drawAlignmentLines(ctx, landmarks, w, h);
  }

  if (cue) {
    drawCorrectionArrows(ctx, cue, landmarks, w, h);
    drawCueBox(ctx, cue, w, h, formState);
  }

  if (showFormIndicator) {
    drawFormIndicator(ctx, formState, qualityScore, w, h);
  }
}

/**
 * Lightweight skeleton-only overlay for the assessment phase.
 */
export function renderAssessmentOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: NormalizedLandmark[],
): void {
  ctx.clearRect(0, 0, w, h);
  if (landmarks.length < 33) return;
  drawSkeleton(ctx, landmarks, w, h, new Set(), 'green');
  drawAlignmentLines(ctx, landmarks, w, h);
}
