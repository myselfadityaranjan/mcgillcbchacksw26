// ──────────────────────────────────────────────────────────────
// CompletionPage — session summary after coaching completes
// ──────────────────────────────────────────────────────────────

import { useApp } from '../state/appContext';
import type { Drill } from '../types/plan';
import { scoreLabel, scoreMessage } from '../lib/qualityScore';

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

  const totalMs = session.timeInGreen + session.timeInYellow + session.timeInRed;
  const pctGreen  = totalMs ? Math.round((session.timeInGreen  / totalMs) * 100) : 0;
  const pctYellow = totalMs ? Math.round((session.timeInYellow / totalMs) * 100) : 0;
  const pctRed    = totalMs ? Math.round((session.timeInRed    / totalMs) * 100) : 0;

  // Next recommended drill (the one after the current one in priority)
  const nextRec = plan?.recommendations.find(
    (r) => r.drill.id !== drill.id,
  );

  return (
    <div className="page completion-page">
      <div className="completion-header">
        <div className={`score-ring score-${finalScore >= 85 ? 'great' : finalScore >= 65 ? 'good' : 'needs-work'}`}>
          <span className="score-number">{finalScore}</span>
          <span className="score-max">/100</span>
        </div>
        <h2>{label}</h2>
        <p className="completion-message">{message}</p>
      </div>

      <div className="completion-stats">
        <div className="stat-row">
          <span className="stat-label">Time in good form</span>
          <div className="stat-bar-wrap">
            <div className="stat-bar green-bar" style={{ width: `${pctGreen}%` }} />
          </div>
          <span className="stat-pct">{pctGreen}%</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Needs correction</span>
          <div className="stat-bar-wrap">
            <div className="stat-bar yellow-bar" style={{ width: `${pctYellow}%` }} />
          </div>
          <span className="stat-pct">{pctYellow}%</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Form issues</span>
          <div className="stat-bar-wrap">
            <div className="stat-bar red-bar" style={{ width: `${pctRed}%` }} />
          </div>
          <span className="stat-pct">{pctRed}%</span>
        </div>
      </div>

      {session.lastCue && (
        <div className="completion-tip">
          <span className="tip-label">Top cue to remember</span>
          <p>"{session.lastCue.text}"</p>
        </div>
      )}

      <div className="completion-actions">
        {nextRec ? (
          <button
            className="btn primary btn-lg"
            onClick={() => selectDrill(nextRec.drill as Drill)}
          >
            Next drill: {nextRec.drill.name} →
          </button>
        ) : (
          <button className="btn primary btn-lg" onClick={() => navigate('results')}>
            Back to results
          </button>
        )}
        <button className="btn ghost" onClick={() => navigate('drill-detail')}>
          Redo this drill
        </button>
        <button className="btn ghost btn-sm" onClick={() => navigate('results')}>
          Results
        </button>
      </div>
    </div>
  );
}
