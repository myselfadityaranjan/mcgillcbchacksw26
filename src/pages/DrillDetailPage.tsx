import { motion } from 'framer-motion';
import { ChevronLeft, Clock, Repeat, AlertTriangle, Play } from 'lucide-react';
import { useApp } from '../state/appContext';
import { Button } from '../components/ui/Button';
import { getDrillVideo } from '../lib/drillVideos';


export function DrillDetailPage() {
  const { state, navigate } = useApp();
  const drill    = state.selectedDrill;
  const plan     = state.plan;
  const analysis = state.analysis;

  if (!drill) {
    navigate('results');
    return null;
  }

  const rec = plan?.recommendations.find((r) => r.drill.id === drill.id);
  const targetedIssues = analysis?.issues.filter(
    (i) => rec?.targetIssueIds.includes(i.id),
  ) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('results')} leftIcon={<ChevronLeft size={14} />}>
        Results
      </Button>

      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-brand uppercase tracking-wide">{drill.bodyArea}</span>
        <h2 className="text-2xl font-bold text-text-1 mt-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
          {drill.name}
        </h2>
        <p className="text-sm text-text-2 mt-2">{drill.description}</p>
      </div>

      {/* Video demo */}
      {getDrillVideo(drill.id) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden border border-border bg-[#1C1810] relative"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1810] border-b border-white/10">
            <Play size={12} className="text-brand" />
            <span className="text-xs font-semibold text-white/70">Demo Video</span>
          </div>
          <video
            src={getDrillVideo(drill.id)!}
            autoPlay
            loop
            muted
            playsInline
            className="w-full max-h-[360px] object-contain bg-[#1C1810]"
          />
        </motion.div>
      )}

      {/* Why this drill */}
      {rec && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand/5 border border-brand/15 rounded-xl p-5 space-y-3"
        >
          <h3 className="text-xs font-bold uppercase tracking-wide text-brand">Why this drill?</h3>
          <p className="text-sm text-text-2">{rec.reason}</p>
          {targetedIssues.length > 0 && (
            <div className="space-y-2">
              {targetedIssues.map((issue) => (
                <div key={issue.id} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    issue.severity === 'significant' ? 'bg-danger' : issue.severity === 'moderate' ? 'bg-warning' : 'bg-[#5B8CB0]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-1">{issue.name}</span>
                    <span className="text-xs text-text-3 ml-2">{issue.severity} · {Math.round(issue.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Targets */}
      <div className="flex flex-wrap gap-2">
        {drill.targetIssues.map((id) => (
          <span key={id} className="text-xs font-medium px-3 py-1 rounded-full bg-elevated border border-border text-text-2 capitalize">
            {id.replace(/-/g, ' ')}
          </span>
        ))}
      </div>

      {/* Setup */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-text-3 mb-3">Setup</h3>
        <p className="text-sm text-text-2 leading-relaxed">{drill.setupInstructions}</p>
      </div>

      {/* Coaching cues */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-text-3 mb-3">Key cues</h3>
        <ol className="space-y-3">
          {drill.coachingCues.map((cue, i) => (
            <li key={i} className="flex gap-3 text-sm text-text-2">
              <span className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              {cue}
            </li>
          ))}
        </ol>
      </div>

      {/* Meta */}
      <div className="flex gap-3">
        <div className="flex-1 bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
          <Clock size={16} className="text-text-3" />
          <div>
            <p className="text-xs text-text-3">Duration</p>
            <p className="text-sm font-bold text-text-1">{drill.durationSeconds}s</p>
          </div>
        </div>
        {drill.reps && (
          <div className="flex-1 bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
            <Repeat size={16} className="text-text-3" />
            <div>
              <p className="text-xs text-text-3">Reps</p>
              <p className="text-sm font-bold text-text-1">{drill.reps}</p>
            </div>
          </div>
        )}
      </div>

      {/* Safety */}
      {drill.unsafeConditions.length > 0 && (
        <div className="bg-danger/5 border border-danger/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-danger" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-danger">Stop if you experience</h3>
          </div>
          <ul className="space-y-2">
            {drill.unsafeConditions.map((c, i) => (
              <li key={i} className="text-sm text-text-2 flex gap-2">
                <span className="text-danger">•</span>{c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button fullWidth size="lg" onClick={() => navigate('coaching')}>
        Start Live Coaching →
      </Button>
    </div>
  );
}
