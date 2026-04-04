import { motion } from 'framer-motion';
import { Users, TrendingUp } from 'lucide-react';
import type { DetectedIssue, IssueId, Severity } from '../types/analysis';

// ── Synthetic population data ─────────────────────────────────
// Percentages represent the proportion of a general population
// (n ≈ 10,000 synthetic profiles) that exhibit each pattern.
// Source: modelled from published epidemiological posture surveys.

const POPULATION_PREVALENCE: Record<IssueId, { prevalence: number; label: string }> = {
  'rounded-shoulders':    { prevalence: 0.62, label: 'Rounded Shoulders' },
  'forward-head-posture': { prevalence: 0.56, label: 'Forward Head Posture' },
  'anterior-pelvic-tilt': { prevalence: 0.41, label: 'Anterior Pelvic Tilt' },
  'knee-valgus':          { prevalence: 0.28, label: 'Knee Valgus' },
  'lateral-asymmetry':    { prevalence: 0.35, label: 'Lateral Asymmetry' },
};

// Synthetic severity distribution within each issue
const SEVERITY_DIST: Record<IssueId, { mild: number; moderate: number; significant: number }> = {
  'rounded-shoulders':    { mild: 0.45, moderate: 0.38, significant: 0.17 },
  'forward-head-posture': { mild: 0.40, moderate: 0.35, significant: 0.25 },
  'anterior-pelvic-tilt': { mild: 0.48, moderate: 0.34, significant: 0.18 },
  'knee-valgus':          { mild: 0.55, moderate: 0.30, significant: 0.15 },
  'lateral-asymmetry':    { mild: 0.50, moderate: 0.32, significant: 0.18 },
};

function computePercentile(issue: DetectedIssue): number {
  const pop = POPULATION_PREVALENCE[issue.id];
  const dist = SEVERITY_DIST[issue.id];
  if (!pop || !dist) return 50;

  // Users WITHOUT this issue are already better off
  const basePercentile = (1 - pop.prevalence) * 100;

  // Among those who have it, rank by severity
  const sevOrder: Severity[] = ['significant', 'moderate', 'mild'];
  const userSevIdx = sevOrder.indexOf(issue.severity);
  let cumulativeBetter = 0;
  for (let i = sevOrder.length - 1; i > userSevIdx; i--) {
    cumulativeBetter += dist[sevOrder[i]];
  }

  // Percentile = people without issue + people with milder severity
  const percentile = Math.round(basePercentile + pop.prevalence * cumulativeBetter * 100);
  return Math.max(1, Math.min(99, percentile));
}

function computeOverallPercentile(issues: DetectedIssue[]): number {
  if (issues.length === 0) return 92; // No issues → top tier
  const percentiles = issues.map(computePercentile);
  // Weight by confidence
  const totalConf = issues.reduce((s, i) => s + i.confidence, 0);
  const weighted = issues.reduce((s, i, idx) => s + percentiles[idx] * i.confidence, 0);
  return Math.round(weighted / totalConf);
}

const SEV_BAR_COLOR: Record<Severity, string> = {
  significant: 'bg-danger',
  moderate: 'bg-warning',
  mild: 'bg-[#5B8CB0]',
};

function PercentileBar({ percentile, label, severity, delay }: { percentile: number; label: string; severity: Severity; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-1 font-medium">{label}</span>
        <span className="text-sm font-bold text-text-1 tabular-nums">{percentile}<sup className="text-[10px] text-text-3">th</sup></span>
      </div>
      <div className="h-2.5 bg-elevated rounded-full overflow-hidden relative">
        {/* Population markers */}
        <div className="absolute top-0 bottom-0 left-1/4 w-px bg-border" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border-strong" />
        <div className="absolute top-0 bottom-0 left-3/4 w-px bg-border" />
        <motion.div
          className={`h-full rounded-full ${SEV_BAR_COLOR[severity]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentile}%` }}
          transition={{ delay: delay + 0.2, duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-3">
        <span>0</span>
        <span>25th</span>
        <span>50th</span>
        <span>75th</span>
        <span>100th</span>
      </div>
    </motion.div>
  );
}

export function PopulationComparison({ issues }: { issues: DetectedIssue[] }) {
  const overall = computeOverallPercentile(issues);
  const issuePercentiles = issues.map((issue) => ({
    issue,
    percentile: computePercentile(issue),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-surface border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-brand/[0.03]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center">
            <Users size={16} className="text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-1">Population Comparison</h3>
            <p className="text-xs text-text-3">How you compare to 10,000+ assessed individuals</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Overall score */}
        <div className="flex items-center gap-4 bg-elevated/50 rounded-xl p-4">
          <div className="relative">
            <svg width="72" height="72" viewBox="0 0 72 72" className="transform -rotate-90">
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(161,143,114,0.15)" strokeWidth="6" />
              <motion.circle
                cx="36" cy="36" r="30" fill="none" stroke="#6B9E77" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 30}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - overall / 100) }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black text-text-1 tabular-nums">{overall}</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-text-1">Overall Percentile</p>
            <p className="text-xs text-text-2 mt-0.5">
              {overall >= 75 ? 'Your movement quality is better than most.' :
               overall >= 50 ? 'You\'re in the middle of the pack — room to improve.' :
               overall >= 25 ? 'Below average — your corrective plan will help.' :
               'Significant patterns detected — follow your plan consistently.'}
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp size={12} className="text-brand" />
              <span className="text-[11px] text-brand font-semibold">Better than {overall}% of users</span>
            </div>
          </div>
        </div>

        {/* Per-issue breakdown */}
        {issuePercentiles.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wide">Per-Pattern Percentile</p>
            {issuePercentiles.map(({ issue, percentile }, i) => (
              <PercentileBar
                key={issue.id}
                percentile={percentile}
                label={POPULATION_PREVALENCE[issue.id]?.label ?? issue.name}
                severity={issue.severity}
                delay={i * 0.1}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-2 text-center py-2">No issues detected — you're in great shape!</p>
        )}

        <p className="text-[11px] text-text-3 text-center">
          Based on synthetic population data modelled from epidemiological surveys · Not a clinical benchmark
        </p>
      </div>
    </motion.div>
  );
}
