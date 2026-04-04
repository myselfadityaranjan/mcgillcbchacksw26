// ──────────────────────────────────────────────────────────────
// DrillDetailPage — drill instructions before coaching begins
// ──────────────────────────────────────────────────────────────

import { useApp } from '../state/appContext';

export function DrillDetailPage() {
  const { state, navigate } = useApp();
  const drill = state.selectedDrill;

  if (!drill) {
    navigate('results');
    return null;
  }

  return (
    <div className="page drill-detail-page">
      <button className="btn ghost btn-back" onClick={() => navigate('results')}>
        ← Results
      </button>

      <div className="drill-detail-header">
        <span className="drill-detail-area">{drill.bodyArea}</span>
        <h2>{drill.name}</h2>
        <p className="drill-detail-desc">{drill.description}</p>
      </div>

      <div className="drill-detail-body">
        <div className="detail-block">
          <h3>Setup</h3>
          <p>{drill.setupInstructions}</p>
        </div>

        <div className="detail-block">
          <h3>Key cues to focus on</h3>
          <ol className="cue-list">
            {drill.coachingCues.map((cue, i) => (
              <li key={i}>{cue}</li>
            ))}
          </ol>
        </div>

        <div className="detail-block detail-meta">
          <div className="meta-item">
            <span className="meta-label">Duration</span>
            <span className="meta-value">{drill.durationSeconds}s</span>
          </div>
          {drill.reps && (
            <div className="meta-item">
              <span className="meta-label">Reps / sets</span>
              <span className="meta-value">{drill.reps}</span>
            </div>
          )}
        </div>

        {drill.unsafeConditions.length > 0 && (
          <div className="detail-block safety-block">
            <h3>Stop if you experience</h3>
            <ul className="safety-list">
              {drill.unsafeConditions.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        className="btn primary btn-lg"
        onClick={() => navigate('coaching')}
      >
        Start Live Coaching →
      </button>
    </div>
  );
}
