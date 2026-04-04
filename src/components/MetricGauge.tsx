// ──────────────────────────────────────────────────────────────
// MetricGauge — horizontal bar chart comparing a raw posture
// metric against a healthy threshold, with animated fill.
// ──────────────────────────────────────────────────────────────

import { motion } from 'framer-motion';
import type { Severity } from '../types/analysis';

interface MetricGaugeProps {
  label:          string;
  value:          number;
  healthyMax:     number;
  scaleMax:       number;
  unit?:          string;
  severity:       Severity;
  delay?:         number;
}

const SEV_COLOUR: Record<Severity, string> = {
  significant: 'bg-danger',
  moderate:    'bg-warning',
  mild:        'bg-[#5B8CB0]',
};

const SEV_TEXT: Record<Severity, string> = {
  significant: 'text-danger',
  moderate:    'text-warning',
  mild:        'text-[#5B8CB0]',
};

export function MetricGauge({
  label, value, healthyMax, scaleMax, unit = '%', severity, delay = 0,
}: MetricGaugeProps) {
  // Display in a human-readable scaled unit
  const displayValue   = Math.round(value     * 100 * 10) / 10;
  const displayHealthy = Math.round(healthyMax * 100 * 10) / 10;
  const displayMax     = Math.round(scaleMax   * 100 * 10) / 10;

  const valuePct   = Math.min(1, value   / scaleMax) * 100;
  const threshPct  = Math.min(1, healthyMax / scaleMax) * 100;
  const isHealthy  = value <= healthyMax;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-2">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${SEV_TEXT[severity]}`}>
          {displayValue}{unit}
          <span className="text-text-3 font-normal"> / healthy ≤{displayHealthy}{unit}</span>
        </span>
      </div>

      <div className="relative h-2.5 bg-elevated rounded-full overflow-visible">
        {/* Healthy zone green tint */}
        <div
          className="absolute inset-y-0 left-0 bg-success/15 rounded-full"
          style={{ width: `${threshPct}%` }}
        />

        {/* Measured bar */}
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${SEV_COLOUR[severity]}`}
          initial={{ width: 0 }}
          animate={{ width: `${valuePct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay }}
          style={{ opacity: isHealthy ? 0.6 : 1 }}
        />

        {/* Threshold marker line */}
        <div
          className="absolute inset-y-0 w-0.5 bg-success/80"
          style={{ left: `${threshPct}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      <div className="flex justify-between text-[9px] text-text-3">
        <span>0{unit}</span>
        <span className="text-success/70">healthy ≤{displayHealthy}{unit}</span>
        <span>{displayMax}{unit}</span>
      </div>
    </div>
  );
}

// ── Per-issue metric config ───────────────────────────────────

interface MetricConfig {
  key:        string;
  label:      string;
  healthyMax: number;
  scaleMax:   number;
}

export const ISSUE_METRICS: Record<string, MetricConfig[]> = {
  'forward-head-posture': [
    { key: 'headForwardOffset', label: 'Head Forward Offset', healthyMax: 0.030, scaleMax: 0.12 },
    { key: 'torsoForwardLean',  label: 'Torso Forward Lean',  healthyMax: 0.025, scaleMax: 0.10 },
  ],
  'rounded-shoulders': [
    { key: 'torsoForwardLean',   label: 'Forward Shoulder Lean',   healthyMax: 0.025, scaleMax: 0.10 },
    { key: 'shoulderHeightDiff', label: 'Shoulder Height Diff',    healthyMax: 0.015, scaleMax: 0.06 },
  ],
  'anterior-pelvic-tilt': [
    { key: 'hipForwardPosition', label: 'Hip Forward Position', healthyMax: 0.025, scaleMax: 0.10 },
    { key: 'torsoForwardLean',   label: 'Torso Lean',           healthyMax: 0.025, scaleMax: 0.10 },
  ],
  'knee-valgus': [
    { key: 'leftKneeValgus',  label: 'Left Knee Inward Drift',  healthyMax: 0.020, scaleMax: 0.09 },
    { key: 'rightKneeValgus', label: 'Right Knee Inward Drift', healthyMax: 0.020, scaleMax: 0.09 },
  ],
  'lateral-asymmetry': [
    { key: 'shoulderHeightDiff', label: 'Shoulder Height',    healthyMax: 0.015, scaleMax: 0.06 },
    { key: 'hipHeightDiff',      label: 'Hip Height',         healthyMax: 0.015, scaleMax: 0.06 },
    { key: 'lateralShift',       label: 'Lateral Shift',      healthyMax: 0.020, scaleMax: 0.08 },
  ],
};
