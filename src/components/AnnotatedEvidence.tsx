// ──────────────────────────────────────────────────────────────
// AnnotatedEvidence — renders an evidence frame with skeleton
// overlay, joint highlights, and an issue label drawn on top.
// Falls back to a plain <img> when landmark data is unavailable.
// ──────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import type { DetectedIssue } from '../types/analysis';
import { renderOverlay } from '../lib/overlayRenderer';

// ── Per-issue annotation labels ───────────────────────────────

const ANNOTATION_LABELS: Record<string, string> = {
  'rounded-shoulders':     'Shoulder protraction',
  'forward-head-posture':  'Head forward of shoulder line',
  'anterior-pelvic-tilt':  'Anterior pelvic tilt',
  'knee-valgus':           'Knee drift inward',
  'lateral-asymmetry':     'Left–right imbalance',
};

// ── Component ─────────────────────────────────────────────────

interface AnnotatedEvidenceProps {
  issue: DetectedIssue;
}

export function AnnotatedEvidence({ issue }: AnnotatedEvidenceProps) {
  const imgRef    = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !issue.evidenceLandmarks) return;

    const draw = () => {
      canvas.width  = img.naturalWidth  || 640;
      canvas.height = img.naturalHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Choose form state colour by severity
      const formState =
        issue.severity === 'significant' ? 'red' : 'yellow';

      // Draw skeleton + highlighted joints using existing overlay renderer
      renderOverlay(ctx, canvas.width, canvas.height, {
        landmarks:          issue.evidenceLandmarks!,
        formState,
        highlightLandmarks: issue.affectedLandmarks,
        showAlignmentLines: true,
        showFormIndicator:  false,
        cue:                null,
      });

      // Draw annotation label (text is drawn mirrored so that after CSS
      // scaleX(-1) it appears readable — achieved by flipping the context)
      const label    = ANNOTATION_LABELS[issue.id] ?? issue.name;
      const color    = formState === 'red' ? '#ff4444' : '#fbbf24';
      const fontSize = Math.max(13, Math.round(canvas.width * 0.038));

      ctx.save();
      // Flip context so text is un-mirrored after the CSS scaleX(-1) on the canvas
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      const textW = ctx.measureText(label).width;
      const padX  = 12;
      const padY  = 7;
      const boxW  = textW + padX * 2;
      const boxH  = fontSize + padY * 2;
      // Position: top-left of the display (which is top-right in flipped context)
      const boxX  = canvas.width - 12 - boxW;
      const boxY  = 12;

      // Dark background pill
      ctx.fillStyle = 'rgba(0,0,0,0.76)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 6);
      ctx.fill();

      // Colour accent bar on left edge of the label
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, 4, boxH, [4, 0, 0, 4]);
      ctx.fill();

      // Label text
      ctx.fillStyle    = color;
      ctx.textBaseline = 'middle';
      ctx.textAlign    = 'left';
      ctx.shadowColor  = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur   = 4;
      ctx.fillText(label, boxX + padX + 4, boxY + boxH / 2);

      ctx.restore();
    };

    if (img.complete && img.naturalWidth > 0) {
      draw();
    } else {
      img.addEventListener('load', draw, { once: true });
    }
  }, [issue]);

  if (!issue.evidenceImageUrl) return null;

  const stepLabel = issue.evidenceStepId.replace(/-/g, ' ');

  return (
    <div className="annotated-evidence">
      {/* Base image — CSS flipped to match mirrored camera view */}
      <div className="evidence-frame-wrap">
        <img
          ref={imgRef}
          src={issue.evidenceImageUrl}
          alt={`Evidence frame — ${stepLabel}`}
          className="evidence-img"
        />
        {/* Canvas overlay — also CSS flipped, drawn in natural landmark space */}
        {issue.evidenceLandmarks && (
          <canvas ref={canvasRef} className="evidence-overlay" />
        )}
      </div>
      <span className="evidence-label">
        Evidence — {stepLabel}
        {issue.evidenceLandmarks ? '' : ' · no landmark data'}
      </span>
    </div>
  );
}
