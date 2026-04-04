import { motion } from 'framer-motion';
import { RotateCcw, ChevronRight } from 'lucide-react';
import { useApp } from '../state/appContext';
import { Button } from '../components/ui/Button';
import { BodyStrainMap } from '../components/BodyStrainMap';
import { AnnotatedEvidence } from '../components/AnnotatedEvidence';
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08, duration: 0.35 }}
      className="bg-surface border border-border rounded-xl p-5 space-y-3"
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
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${Math.round(issue.confidence * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-text-3">Confidence: {Math.round(issue.confidence * 100)}%</p>
      </div>

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
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
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
  const { analysis, plan } = state;

  if (!analysis || !plan) return null;

  const noIssues = analysis.issues.length === 0;

  return (
    <div className="max-w-3xl mx-auto px-5 py-6 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-text-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Your Movement Report
        </h2>
        <p className="text-sm text-text-2">{plan.summary}</p>
      </motion.div>

      {/* Low quality warning */}
      {analysis.dataQuality < 0.5 && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 text-warning text-sm">
          Low data quality detected ({Math.round(analysis.dataQuality * 100)}%).
          Some landmarks were not clearly visible. Consider re-scanning with better lighting.
        </div>
      )}

      {noIssues ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-success/5 border border-success/20 rounded-xl p-8 text-center space-y-3">
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
          {/* Body Strain Map — signature visual */}
          <BodyStrainMap issues={analysis.issues} />

          {/* Detected patterns */}
          <div className="space-y-4">
            <div>
              <h3 className="text-text-1 font-bold text-lg">
                {analysis.issues.length} Pattern{analysis.issues.length !== 1 ? 's' : ''} Detected
              </h3>
              <p className="text-text-3 text-xs mt-1">
                Language reflects patterns consistent with these posture tendencies, not clinical diagnoses.
              </p>
            </div>
            {analysis.issues.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} rank={i + 1} />
            ))}
          </div>

          {/* Corrective plan */}
          {plan.recommendations.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-text-1 font-bold text-base">Your Corrective Plan</h3>
                <p className="text-xs text-text-3 mt-0.5">Select a drill to begin live coaching</p>
              </div>
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

      {/* Footer */}
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
