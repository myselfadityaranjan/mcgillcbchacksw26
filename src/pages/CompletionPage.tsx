import { motion } from 'framer-motion';
import { Trophy, Flame, RotateCcw, ArrowRight, MessageSquare, TrendingUp, Star } from 'lucide-react';
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

  const ringColorHex =
    finalScore >= 85 ? '#5BA37A' :
    finalScore >= 65 ? '#D97B35' : '#C05A52';

  const ringColor =
    finalScore >= 85 ? 'stroke-success' :
    finalScore >= 65 ? 'stroke-warning' : 'stroke-danger';

  const fmtStreak = (s: number) => s >= 10 ? `${Math.floor(s)}s` : `${s.toFixed(1)}s`;

  // Larger ring — r=58 in a 128x128 viewbox
  const r = 58;
  const circumference = 2 * Math.PI * r;
  const dashOffset    = circumference * (1 - finalScore / 100);

  // Score tier messaging
  const tierStars = finalScore >= 85 ? 3 : finalScore >= 65 ? 2 : 1;

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">

      {/* ── Score ring ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center text-center space-y-3"
      >
        {/* Stars above ring */}
        <motion.div
          className="flex gap-1 mb-1"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          {[1, 2, 3].map((n) => (
            <Star
              key={n}
              size={18}
              className={n <= tierStars ? 'text-warning fill-warning' : 'text-border'}
            />
          ))}
        </motion.div>

        {/* Big ring */}
        <div className="relative w-44 h-44">
          {/* Outer glow */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 60px 10px ${ringColorHex}28` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
          <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
            {/* Track */}
            <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-elevated)" strokeWidth="8" />
            {/* Animated arc */}
            <motion.circle
              cx="64" cy="64" r={r} fill="none"
              className={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            />
          </svg>
          {/* Center value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={`text-5xl font-black font-mono tabular-nums ${scoreVariant}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {finalScore}
            </motion.span>
            <span className="text-xs text-text-3 font-semibold">/100</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-text-1" style={{ fontFamily: "'DM Serif Display', serif" }}>{label}</h2>
          <p className="text-sm text-text-2 mt-1">{message}</p>
        </motion.div>
      </motion.div>

      {/* ── Form distribution ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="bg-surface border border-border rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-brand" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-text-3">Form Distribution</h3>
        </div>

        <StatBar label="Good form"         pct={pctGreen}  color="bg-success" delay={0.6} />
        <StatBar label="Needs correction"  pct={pctYellow} color="bg-warning" delay={0.7} />
        <StatBar label="Form issues"       pct={pctRed}    color="bg-danger"  delay={0.8} />

        {/* Stacked bar visual */}
        <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mt-1">
          {pctGreen  > 0 && (
            <motion.div
              className="bg-success rounded-l-full"
              initial={{ flex: 0 }}
              animate={{ flex: pctGreen }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
            />
          )}
          {pctYellow > 0 && (
            <motion.div
              className="bg-warning"
              initial={{ flex: 0 }}
              animate={{ flex: pctYellow }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.65 }}
            />
          )}
          {pctRed    > 0 && (
            <motion.div
              className="bg-danger rounded-r-full"
              initial={{ flex: 0 }}
              animate={{ flex: pctRed }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.7 }}
            />
          )}
        </div>
      </motion.div>

      {/* ── Streak summary ────────────────────────────────────── */}
      {(session.bestStreak > 0 || session.recoveries > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-3 gap-3"
        >
          <StatPill
            icon={<Trophy size={16} className="text-warning" />}
            value={fmtStreak(session.bestStreak)}
            label="best streak"
          />
          <StatPill
            icon={<RotateCcw size={15} className="text-text-3" />}
            value={String(session.recoveries)}
            label={session.recoveries === 1 ? 'recovery' : 'recoveries'}
          />
          <StatPill
            icon={<Flame size={15} className="text-success" />}
            value={`${pctGreen}%`}
            label="in green"
            valueClass="text-success"
          />
        </motion.div>
      )}

      {/* ── Top cue ───────────────────────────────────────────── */}
      {session.lastCue && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.4 }}
          className="bg-brand/5 border border-brand/15 rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-brand" />
            <span className="text-xs font-bold uppercase tracking-wide text-brand">Top cue to remember</span>
          </div>
          <p className="text-sm text-text-1 italic">"{session.lastCue.text}"</p>
        </motion.div>
      )}

      {/* ── Actions ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.4 }}
        className="space-y-3"
      >
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
      </motion.div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function StatBar({ label, pct, color, delay }: { label: string; pct: number; color: string; delay: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-2 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-elevated rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay }}
        />
      </div>
      <span className="text-xs font-bold text-text-1 w-10 text-right tabular-nums">{pct}%</span>
    </div>
  );
}

function StatPill({
  icon, value, label, valueClass = 'text-text-1',
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 flex flex-col items-center gap-1.5">
      {icon}
      <span className={`text-lg font-black tabular-nums ${valueClass}`}>{value}</span>
      <span className="text-[10px] text-text-3 text-center">{label}</span>
    </div>
  );
}
