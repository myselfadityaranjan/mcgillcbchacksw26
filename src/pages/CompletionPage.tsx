import { motion } from 'framer-motion';
import { Trophy, Flame, RotateCcw, ArrowRight, MessageSquare } from 'lucide-react';
import { useApp } from '../state/appContext';
import { Button } from '../components/ui/Button';
import { scoreLabel, scoreMessage } from '../lib/qualityScore';
import type { Drill } from '../types/plan';

export function CompletionPage() {
  const { state, navigate, selectDrill } = useApp();
  const session = state.coachingSession;
  const drill   = state.selectedDrill;
  const plan    = state.plan;

  if (!session || !drill) {
    navigate('results');
    return null;
  }

  const { finalScore } = session;
  const label   = scoreLabel(finalScore);
  const message = scoreMessage(finalScore);

  const totalMs   = session.timeInGreen + session.timeInYellow + session.timeInRed;
  const pctGreen  = totalMs ? Math.round((session.timeInGreen  / totalMs) * 100) : 0;
  const pctYellow = totalMs ? Math.round((session.timeInYellow / totalMs) * 100) : 0;
  const pctRed    = totalMs ? Math.round((session.timeInRed    / totalMs) * 100) : 0;

  const nextRec = plan?.recommendations.find((r) => r.drill.id !== drill.id);

  const scoreVariant =
    finalScore >= 85 ? 'text-success' :
    finalScore >= 65 ? 'text-warning' : 'text-danger';

  const ringColor =
    finalScore >= 85 ? 'stroke-success' :
    finalScore >= 65 ? 'stroke-warning' : 'stroke-danger';

  const fmtStreak = (s: number) => s >= 10 ? `${Math.floor(s)}s` : `${s.toFixed(1)}s`;

  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference * (1 - finalScore / 100);

  return (
    <div className="max-w-lg mx-auto px-5 py-8 space-y-8">
      {/* Score ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center space-y-4"
      >
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
            <circle cx="48" cy="48" r="42" fill="none" stroke="var(--color-elevated)" strokeWidth="6" />
            <motion.circle
              cx="48" cy="48" r="42" fill="none"
              className={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black font-mono tabular-nums ${scoreVariant}`}>{finalScore}</span>
            <span className="text-[10px] text-text-3">/100</span>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-1" style={{ fontFamily: "'DM Serif Display', serif" }}>{label}</h2>
          <p className="text-sm text-text-2 mt-1">{message}</p>
        </div>
      </motion.div>

      {/* Time distribution */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-text-3">Form Distribution</h3>
        <StatBar label="Good form" pct={pctGreen} color="bg-success" />
        <StatBar label="Needs correction" pct={pctYellow} color="bg-warning" />
        <StatBar label="Form issues" pct={pctRed} color="bg-danger" />
      </div>

      {/* Streak summary */}
      {(session.bestStreak > 0 || session.recoveries > 0) && (
        <div className="flex items-center justify-center gap-6 py-3">
          <div className="flex items-center gap-2 text-text-2">
            <Trophy size={16} className="text-warning" />
            <span className="font-bold text-sm tabular-nums">{fmtStreak(session.bestStreak)}</span>
            <span className="text-xs text-text-3">best streak</span>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2 text-text-2">
            <RotateCcw size={14} className="text-text-3" />
            <span className="font-bold text-sm tabular-nums">{session.recoveries}</span>
            <span className="text-xs text-text-3">{session.recoveries === 1 ? 'recovery' : 'recoveries'}</span>
          </div>
          {pctGreen > 0 && (
            <>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-2 text-text-2">
                <Flame size={14} className="text-success" />
                <span className="font-bold text-sm tabular-nums text-success">{pctGreen}%</span>
                <span className="text-xs text-text-3">in green</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Top cue */}
      {session.lastCue && (
        <div className="bg-brand/5 border border-brand/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-brand" />
            <span className="text-xs font-bold uppercase tracking-wide text-brand">Top cue to remember</span>
          </div>
          <p className="text-sm text-text-1 italic">"{session.lastCue.text}"</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {nextRec ? (
          <Button fullWidth size="lg" onClick={() => selectDrill(nextRec.drill as Drill)} rightIcon={<ArrowRight size={18} />}>
            Next drill: {nextRec.drill.name}
          </Button>
        ) : (
          <Button fullWidth size="lg" onClick={() => navigate('results')}>
            Back to results
          </Button>
        )}
        <div className="flex gap-3">
          <Button fullWidth variant="secondary" onClick={() => navigate('drill-detail')}>
            Redo this drill
          </Button>
          <Button fullWidth variant="ghost" onClick={() => navigate('results')}>
            Results
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-2 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-elevated rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <span className="text-xs font-bold text-text-1 w-10 text-right tabular-nums">{pct}%</span>
    </div>
  );
}
