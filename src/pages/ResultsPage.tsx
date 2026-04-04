import { motion } from 'framer-motion';
import { RotateCcw, ChevronRight, Activity } from 'lucide-react';
import { useApp } from '../state/appContext';
import { Button } from '../components/ui/Button';
import { BodyStrainMap } from '../components/BodyStrainMap';
import { AnnotatedEvidence } from '../components/AnnotatedEvidence';
import { RomArc } from '../components/RomArc';
import { MetricGauge, ISSUE_METRICS } from '../components/MetricGauge';
import { computeRom, ROM_THRESHOLDS } from '../lib/romCalculator';
import type { DetectedIssue, Severity } from '../types/analysis';
import type { DrillRecommendation } from '../types/plan';

const SEV_COLOR: Record<Severity, string> = {
  significant: 'text-danger',
  moderate: 'text-warning',
  mild: 'text-[#5B8CB0]',
};
const SEV_BG: Record<Severity, string> = {
  significant: 'bg-danger/10 border-danger/20 text-danger',
  moderate: 'bg-warning/10 border-warning/20 text-warning',
  mild: 'bg-[#5B8CB0]/10 border-[#5B8CB0]/20 text-[#5B8CB0]',
};

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${SEV_BG[severity]}`}>
      {severity}
    </span>
  );
}

function IssueCard({ issue, rank }: { issue: DetectedIssue; rank: number }) {
  const metricConfigs = ISSUE_METRICS[issue.id] ?? [];
  const visibleMetrics = metricConfigs.filter(
    (cfg) => issue.metrics[cfg.key] !== undefined && (issue.metrics[cfg.key] ?? 0) > 0,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.10, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-surface border border-border rounded-xl p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`text-lg font-black font-mono ${SEV_COLOR[issue.severity]}`}>
            {String(rank).padStart(2, '0')}
          </span>
          <h3 className="text-sm font-bold text-text-1">{issue.name}</h3>
        </div>
        <SeverityBadge severity={issue.severity} />
      </div>

      <p className="text-sm text-text-2">{issue.explanation}</p>
      <p className="text-xs text-text-3 italic">{issue.meaning}</p>

      {/* Confidence bar */}
      <div className="space-y-1">
        <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(issue.confidence * 100)}%` }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: rank * 0.10 + 0.2 }}
          />
        </div>
        <p className="text-[11px] text-text-3">Confidence: {Math.round(issue.confidence * 100)}%</p>
      </div>

      {/* Metric comparison gauges */}
      {visibleMetrics.length > 0 && (
        <div className="space-y-3 pt-1 border-t border-border/50">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-3">
            Measurement vs Healthy Range
          </span>
          {visibleMetrics.map((cfg, i) => (
            <MetricGauge
              key={cfg.key}
              label={cfg.label}
              value={issue.metrics[cfg.key]!}
              healthyMax={cfg.healthyMax}
              scaleMax={cfg.scaleMax}
              severity={issue.severity}
              delay={rank * 0.10 + i * 0.08 + 0.3}
            />
          ))}
        </div>
      )}

      {/* Evidence frame */}
      {issue.evidenceImageUrl && <AnnotatedEvidence issue={issue} />}
    </motion.div>
  );
}

function DrillCard({ rec, issues, onSelect }: { rec: DrillRecommendation; issues: DetectedIssue[]; onSelect: () => void }) {
  const targeted = issues.filter((i) => rec.targetIssueIds.includes(i.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && onSelect()}
      className="bg-surface border border-border rounded-xl p-5 cursor-pointer hover:border-brand/30 hover:shadow-[0_4px_20px_rgba(107,158,119,0.12)] transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
          <span className="text-brand font-black text-sm">#{rec.priority}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-1">{rec.drill.name}</h3>
            <ChevronRight size={16} className="text-text-3 shrink-0" />
          </div>
          <p className="text-xs text-text-3 mt-0.5">{rec.drill.bodyArea}</p>
          <p className="text-sm text-text-2 mt-2">{rec.reason}</p>

          {targeted.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {targeted.map((issue) => (
                <span key={issue.id} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SEV_BG[issue.severity]}`}>
                  {issue.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ResultsPage() {
  const { state, selectDrill, reset, rescan } = useApp();
  const { analysis, plan, assessmentResult } = state;

  if (!analysis || !plan) return null;

  const noIssues = analysis.issues.length === 0;
  const rom = assessmentResult ? computeRom(assessmentResult) : null;

  // Determine which ROM values we actually have
  const hasShoulderRom = rom && (rom.leftShoulderElevation !== null || rom.rightShoulderElevation !== null);
  const hasSquatRom    = rom && (rom.hipSquatAngle !== null || rom.leftKneeFlexion !== null || rom.rightKneeFlexion !== null);

  return (
    <div className="max-w-3xl mx-auto px-5 py-6 space-y-8">

      {/* ── Dramatic header ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-2"
      >
        <h2 className="text-3xl font-bold text-text-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Your Movement Report
        </h2>
        <p className="text-sm text-text-2">{plan.summary}</p>
        {/* Overall data quality indicator */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div className={`w-2 h-2 rounded-full ${analysis.dataQuality >= 0.7 ? 'bg-success' : analysis.dataQuality >= 0.4 ? 'bg-warning' : 'bg-danger'}`} />
          <span className="text-xs text-text-3">
            Scan quality: {Math.round(analysis.dataQuality * 100)}%
          </span>
        </div>
      </motion.div>

      {/* Low quality warning */}
      {analysis.dataQuality < 0.5 && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 text-warning text-sm">
          Low data quality detected ({Math.round(analysis.dataQuality * 100)}%).
          Some landmarks were not clearly visible. Consider re-scanning with better lighting.
        </div>
      )}

      {noIssues ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-success/5 border border-success/20 rounded-xl p-8 text-center space-y-3"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-success/10 flex items-center justify-center">
            <span className="text-success text-2xl">✓</span>
          </div>
          <h3 className="text-lg font-bold text-text-1">
            {analysis.dataQuality < 0.5 ? 'Insufficient data to detect patterns' : 'No significant patterns detected'}
          </h3>
          <p className="text-sm text-text-2">
            {analysis.dataQuality < 0.5
              ? "We couldn't gather enough clear data. Try re-scanning with better visibility."
              : 'Your posture and movement look well-aligned based on this scan.'}
          </p>
        </motion.div>
      ) : (
        <>
          {/* ── Body Strain Map ──────────────────────────────── */}
          <BodyStrainMap issues={analysis.issues} />

          {/* ── Range of Motion Analysis ─────────────────────── */}
          {(hasShoulderRom || hasSquatRom) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface border border-border rounded-xl p-5 space-y-5"
            >
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-brand" />
                <h3 className="text-sm font-bold text-text-1">Range of Motion Analysis</h3>
              </div>

              {hasShoulderRom && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-3">
                    Shoulder Elevation — Arm Raise Peak
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {rom!.leftShoulderElevation !== null && (
                      <RomArc value={rom!.leftShoulderElevation} threshold={ROM_THRESHOLDS.leftShoulderElevation} />
                    )}
                    {rom!.rightShoulderElevation !== null && (
                      <RomArc value={rom!.rightShoulderElevation} threshold={ROM_THRESHOLDS.rightShoulderElevation} />
                    )}
                  </div>
                  <p className="text-[10px] text-text-3 mt-2 text-center">
                    Healthy range: 160–180° full overhead elevation
                  </p>
                </div>
              )}

              {hasSquatRom && (
                <div className={hasShoulderRom ? 'border-t border-border/50 pt-4' : ''}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-3">
                    Squat Depth — Peak Flexion
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {rom!.hipSquatAngle !== null && (
                      <RomArc value={rom!.hipSquatAngle} threshold={ROM_THRESHOLDS.hipSquatAngle} />
                    )}
                    {rom!.leftKneeFlexion !== null && (
                      <RomArc value={rom!.leftKneeFlexion} threshold={ROM_THRESHOLDS.leftKneeFlexion} />
                    )}
                    {rom!.rightKneeFlexion !== null && (
                      <RomArc value={rom!.rightKneeFlexion} threshold={ROM_THRESHOLDS.rightKneeFlexion} />
                    )}
                  </div>
                  <p className="text-[10px] text-text-3 mt-2 text-center">
                    Healthy squat depth: hip angle 80–110° · knee flexion 90–130°
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Detected patterns ───────────────────────────── */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-text-1 font-bold text-lg">
                {analysis.issues.length} Pattern{analysis.issues.length !== 1 ? 's' : ''} Detected
              </h3>
              <p className="text-text-3 text-xs mt-1">
                Language reflects patterns consistent with these posture tendencies, not clinical diagnoses.
              </p>
            </motion.div>
            {analysis.issues.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} rank={i + 1} />
            ))}
          </div>

          {/* ── Corrective plan ──────────────────────────────── */}
          {plan.recommendations.length > 0 && (
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <h3 className="text-text-1 font-bold text-base">Your Corrective Plan</h3>
                <p className="text-xs text-text-3 mt-0.5">Select a drill to begin live coaching</p>
              </motion.div>
              {plan.recommendations.map((rec) => (
                <DrillCard
                  key={rec.drill.id}
                  rec={rec}
                  issues={analysis.issues}
                  onSelect={() => selectDrill(rec.drill)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 pt-4">
        <Button variant="secondary" onClick={rescan} leftIcon={<RotateCcw size={14} />}>
          Re-scan
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          Start over
        </Button>
      </div>
    </div>
  );
}
