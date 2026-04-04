// ──────────────────────────────────────────────────────────────
// RomArc — animated semicircular gauge for a single ROM angle.
// Shows healthy range band, current measurement needle,
// and degree label.
// ──────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import type { RomThreshold } from '../lib/romCalculator';
import { romStatus } from '../lib/romCalculator';

interface RomArcProps {
  value: number;
  threshold: RomThreshold;
}

const STATUS_COLOUR = {
  good: '#5BA37A',
  warn: '#D97B35',
  poor: '#C05A52',
};

const TRACK_COLOUR  = 'rgba(255,255,255,0.07)';
const HEALTHY_COLOUR = 'rgba(91,163,122,0.22)';

// Map an angle-domain value [arcMin, arcMax] → SVG path angle [180°, 0°]
// (semicircle drawn left→right = 180°→0° in SVG polar coordinates)
function domainToSvg(val: number, arcMin: number, arcMax: number): number {
  const frac = Math.max(0, Math.min(1, (val - arcMin) / (arcMax - arcMin)));
  return 180 - frac * 180; // 180° (left) → 0° (right)
}


export function RomArc({ value, threshold }: RomArcProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const startTime = useRef<number>(0);

  const status = romStatus(value, threshold);
  const colour = STATUS_COLOUR[status];

  const { arcMin, arcMax, healthyMin, healthyMax, label, unit } = threshold;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = 160, H = 90;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const cx = W / 2, cy = H - 10, r = 68;
    const duration = 900; // ms

    startTime.current = performance.now();

    function draw(now: number) {
      if (!ctx) return;
      const elapsed = now - startTime.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      const animatedValue = arcMin + (value - arcMin) * ease;

      ctx.clearRect(0, 0, W, H);

      // ── Track arc (full semicircle) ──────────────────────────
      ctx.beginPath();
      ctx.strokeStyle = TRACK_COLOUR;
      ctx.lineWidth   = 8;
      ctx.lineCap     = 'round';
      ctx.arc(cx, cy, r, Math.PI, 0, false);
      ctx.stroke();

      // ── Healthy range band ───────────────────────────────────
      const healthyStartDeg = domainToSvg(healthyMax, arcMin, arcMax); // smaller domain → larger svg angle
      const healthyEndDeg   = domainToSvg(healthyMin, arcMin, arcMax);
      ctx.beginPath();
      ctx.strokeStyle = HEALTHY_COLOUR;
      ctx.lineWidth   = 8;
      const hsRad = (healthyStartDeg * Math.PI) / 180;
      const heRad = (healthyEndDeg   * Math.PI) / 180;
      ctx.arc(cx, cy, r, hsRad, heRad, false);
      ctx.stroke();

      // ── Measured arc fill ────────────────────────────────────
      const measureEndDeg = domainToSvg(animatedValue, arcMin, arcMax);
      ctx.beginPath();
      ctx.strokeStyle = colour;
      ctx.lineWidth   = 8;
      ctx.shadowColor = colour;
      ctx.shadowBlur  = 12;
      ctx.arc(cx, cy, r, Math.PI, (measureEndDeg * Math.PI) / 180, false);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── Needle tip dot ───────────────────────────────────────
      const needleRad = (measureEndDeg * Math.PI) / 180;
      const nx = cx + r * Math.cos(needleRad);
      const ny = cy + r * Math.sin(needleRad);
      ctx.beginPath();
      ctx.fillStyle = colour;
      ctx.shadowColor = colour;
      ctx.shadowBlur  = 16;
      ctx.arc(nx, ny, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // ── Degree label in center ───────────────────────────────
      const displayVal = Math.round(animatedValue);
      ctx.fillStyle   = colour;
      ctx.font        = `bold 22px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${displayVal}${unit}`, cx, cy - 18);

      // ── Min/max labels ───────────────────────────────────────
      ctx.fillStyle    = 'rgba(255,255,255,0.3)';
      ctx.font         = `10px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textBaseline = 'top';
      ctx.textAlign    = 'left';
      ctx.fillText(`${arcMin}${unit}`, 2, cy + 6);
      ctx.textAlign    = 'right';
      ctx.fillText(`${arcMax}${unit}`, W - 2, cy + 6);

      if (t < 1) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <canvas ref={canvasRef} />
      <span className="text-[11px] font-semibold text-text-2">{label}</span>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${
        status === 'good' ? 'text-success' : status === 'warn' ? 'text-warning' : 'text-danger'
      }`}>
        {status === 'good' ? 'Healthy range' : status === 'warn' ? 'Slight restriction' : 'Restricted'}
      </span>
    </div>
  );
}
