// ──────────────────────────────────────────────────────────────
// overlayRenderer.ts — polished Task-6 visual overlay system
//   Renders skeleton, alignment lines, joint highlights,
//   correction arrows, strain zones, and form-state colour coding.
//
//   All landmarks are MIRRORED (x = 1 − x) before rendering so
//   the canvas can sit un-mirrored on top of the CSS-mirrored
//   <video>, keeping text readable.
// ──────────────────────────────────────────────────────────────

import type { NormalizedLandmark } from '../types/pose';
import type { FormState, LiveCue } from '../types/coaching';
import { SKELETON_CONNECTIONS, LM } from './landmarks';

// ── Colour palette ────────────────────────────────────────────

export const COLOURS = {
  green:      '#00ff88',
  yellow:     '#fbbf24',
  red:        '#ff4444',
  dim:        'rgba(255,255,255,0.18)',
  bone:       'rgba(0,255,136,0.80)',
  boneDim:    'rgba(0,255,136,0.22)',
  highlight:  '#ffffff',
  arrow:      '#fbbf24',
  shadow:     'rgba(0,0,0,0.55)',
  strain:     'rgba(255,68,68,0.18)',
  strainEdge: 'rgba(255,68,68,0.45)',
} as const;

function formColour(state: FormState): string {
  return state === 'green' ? COLOURS.green : state === 'yellow' ? COLOURS.yellow : COLOURS.red;
}

// ── Landmark mirroring ────────────────────────────────────────

function mirror(lms: NormalizedLandmark[]): NormalizedLandmark[] {
  return lms.map((l) => ({ ...l, x: 1 - l.x }));
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
  lineWidth = 3.5,
): void {
  const x2 = x1 + dx * length;
  const y2 = y1 + dy * length;
  const angle = Math.atan2(dy, dx);
  const headLen = length * 0.38;

  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = COLOURS.shadow;
  ctx.shadowBlur = 8;

  // Shaft
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Filled arrowhead
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle - Math.PI / 6),
    y2 - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    x2 - headLen * Math.cos(angle + Math.PI / 6),
    y2 - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ── Word-wrap helper ──────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
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
    if (minVis < 0.10) continue;

    const isHighlighted = highlightIndices.has(i) || highlightIndices.has(j);
    ctx.globalAlpha = minVis >= 0.5 ? (isHighlighted ? 0.95 : 0.55) : 0.2;
    ctx.strokeStyle = isHighlighted ? stateColour : COLOURS.bone;
    ctx.lineWidth = isHighlighted ? 4 : 3;

    if (isHighlighted) {
      ctx.shadowColor = stateColour;
      ctx.shadowBlur = 8;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.moveTo(...px(a, w, h));
    ctx.lineTo(...px(b, w, h));
    ctx.stroke();
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Joints
  for (let idx = 0; idx < lms.length; idx++) {
    const l = lms[idx]!;
    if (l.visibility < 0.10) continue;
    const isHighlighted = highlightIndices.has(idx);
    const [x, y] = px(l, w, h);

    ctx.globalAlpha = l.visibility >= 0.5 ? 1 : 0.3;

    if (isHighlighted) {
      // Outer glow ring
      const glowRadius = 14;
      ctx.save();
      ctx.shadowColor = stateColour;
      ctx.shadowBlur = 20;
      ctx.fillStyle = stateColour;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Inner solid dot
      ctx.save();
      ctx.shadowColor = stateColour;
      ctx.shadowBlur = 12;
      ctx.fillStyle = stateColour;
      ctx.globalAlpha = l.visibility >= 0.5 ? 1 : 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      // White center
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Subtle white halo so joints pop against any background
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.20)';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Larger inner dot
      ctx.fillStyle = COLOURS.bone;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

// ── Strain zone ───────────────────────────────────────────────

function drawStrainZone(
  ctx: CanvasRenderingContext2D,
  lms: NormalizedLandmark[],
  w: number,
  h: number,
  indices: number[],
  colour: string,
): void {
  const visible = indices.filter((i) => lms[i]!.visibility > 0.3);
  if (visible.length < 2) return;

  // Draw a translucent region around the affected area
  const points = visible.map((i) => px(lms[i]!, w, h));
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  const maxDist = Math.max(
    ...points.map((p) => Math.hypot(p[0] - cx, p[1] - cy)),
  );
  const radius = maxDist + 25;

  ctx.save();
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, colour);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
  const ls = lms[LM.LEFT_SHOULDER]!, rs = lms[LM.RIGHT_SHOULDER]!;
  if (ls.visibility > 0.5 && rs.visibility > 0.5) {
    ctx.beginPath();
    ctx.moveTo(...px(ls, w, h));
    ctx.lineTo(...px(rs, w, h));
    ctx.stroke();
  }

  // Hip line
  const lh = lms[LM.LEFT_HIP]!, rh = lms[LM.RIGHT_HIP]!;
  if (lh.visibility > 0.5 && rh.visibility > 0.5) {
    ctx.beginPath();
    ctx.moveTo(...px(lh, w, h));
    ctx.lineTo(...px(rh, w, h));
    ctx.stroke();
  }

  // Spine line (midpoint of shoulders → midpoint of hips)
  if (ls.visibility > 0.5 && rs.visibility > 0.5 && lh.visibility > 0.5 && rh.visibility > 0.5) {
    const shoulderMidX = (ls.x + rs.x) / 2;
    const shoulderMidY = (ls.y + rs.y) / 2;
    const hipMidX = (lh.x + rh.x) / 2;
    const hipMidY = (lh.y + rh.y) / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(shoulderMidX * w, shoulderMidY * h);
    ctx.lineTo(hipMidX * w, hipMidY * h);
    ctx.stroke();
  }

  // Knee-over-foot lines (vertical reference from knee to ankle)
  const lk = lms[LM.LEFT_KNEE]!, la = lms[LM.LEFT_ANKLE]!;
  const rk = lms[LM.RIGHT_KNEE]!, ra = lms[LM.RIGHT_ANKLE]!;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  if (lk.visibility > 0.5 && la.visibility > 0.5) {
    ctx.beginPath();
    ctx.moveTo(lk.x * w, lk.y * h);
    ctx.lineTo(la.x * w, la.y * h);
    ctx.stroke();
  }
  if (rk.visibility > 0.5 && ra.visibility > 0.5) {
    ctx.beginPath();
    ctx.moveTo(rk.x * w, rk.y * h);
    ctx.lineTo(ra.x * w, ra.y * h);
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
  const fontSize = Math.max(14, Math.round(w * 0.024));
  const padding = 14;

  ctx.save();
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

  // Word-wrap the text
  const maxTextW = Math.min(w * 0.7, 500);
  const lines = wrapText(ctx, cue.text, maxTextW);
  const lineHeight = fontSize * 1.35;
  const boxW = Math.min(
    Math.max(...lines.map((l) => ctx.measureText(l).width)) + padding * 2 + 8,
    w - 24,
  );
  const boxH = lines.length * lineHeight + padding * 2;
  const boxX = (w - boxW) / 2;
  const boxY = h - boxH - 16;

  // Priority badge
  const badge = cue.priority === 'unsafe' ? '⚠ ' : cue.priority === 'major' ? '● ' : '';

  // Background pill
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 10);
  ctx.fill();

  // Left colour bar
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, 5, boxH, [5, 0, 0, 5]);
  ctx.fill();

  // Text lines
  ctx.fillStyle = colour;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 4;

  for (let i = 0; i < lines.length; i++) {
    const text = i === 0 ? badge + lines[i]! : lines[i]!;
    ctx.fillText(text, boxX + boxW / 2, boxY + padding + i * lineHeight, boxW - padding * 2);
  }

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
  const arrowLength = w * 0.07;

  for (const arrow of cue.arrows) {
    const lmk = lms[arrow.fromLandmark];
    if (!lmk || lmk.visibility < 0.25) continue;
    const [x, y] = px(lmk, w, h);
    // Mirror dx because landmarks are already mirrored
    drawArrow(ctx, x, y, -arrow.dx, arrow.dy, arrowLength, colour, 4);
  }
}

// ── Form state indicator ──────────────────────────────────────

function drawFormIndicator(
  ctx: CanvasRenderingContext2D,
  state: FormState,
  score: number,
  w: number,
): void {
  const colour = formColour(state);
  const label =
    state === 'green' ? 'Good form' : state === 'yellow' ? 'Adjust' : 'Fix form';

  const fontSize = Math.max(13, Math.round(w * 0.02));

  ctx.save();
  ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

  // Background pill
  const text = `${label}  ${score}`;
  const textW = ctx.measureText(text).width;
  const pillW = textW + 40;
  const pillH = fontSize + 16;
  const pillX = w - pillW - 12;
  const pillY = 12;

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 8);
  ctx.fill();

  // Dot
  const dotR = 5;
  const dotX = pillX + 14;
  const dotY = pillY + pillH / 2;

  ctx.save();
  ctx.shadowColor = colour;
  ctx.shadowBlur = 10;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 3;
  ctx.fillText(label, dotX + 14, dotY);

  // Score on right
  ctx.fillStyle = colour;
  ctx.textAlign = 'right';
  ctx.fillText(`${score}`, pillX + pillW - 12, dotY);

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
 * Landmarks are mirrored internally so text renders correctly
 * on the un-mirrored canvas.
 */
export function renderOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: OverlayOptions,
): void {
  const {
    landmarks: rawLandmarks,
    formState = 'green',
    cue = null,
    qualityScore = 100,
    highlightLandmarks = [],
    showAlignmentLines = true,
    showFormIndicator = true,
  } = opts;

  ctx.clearRect(0, 0, w, h);
  if (rawLandmarks.length < 33) return;

  // Mirror landmarks so they match the CSS-mirrored video
  const landmarks = mirror(rawLandmarks);
  const highlighted = new Set(highlightLandmarks);

  // Strain zone glow around highlighted joints
  if (highlighted.size > 0 && formState !== 'green') {
    const strainColour = formState === 'red' ? COLOURS.strain : 'rgba(251,191,36,0.12)';
    drawStrainZone(ctx, landmarks, w, h, highlightLandmarks, strainColour);
  }

  drawSkeleton(ctx, landmarks, w, h, highlighted, formState);

  if (showAlignmentLines) {
    drawAlignmentLines(ctx, landmarks, w, h);
  }

  if (cue) {
    drawCorrectionArrows(ctx, cue, landmarks, w, h);
    drawCueBox(ctx, cue, w, h, formState);
  }

  if (showFormIndicator) {
    drawFormIndicator(ctx, formState, qualityScore, w);
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
  const mirrored = mirror(landmarks);
  drawSkeleton(ctx, mirrored, w, h, new Set(), 'green');
  drawAlignmentLines(ctx, mirrored, w, h);
}
