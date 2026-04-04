// ──────────────────────────────────────────────────────────────
// DrillDetailPage — drill instructions + "Why this drill?" block
// ──────────────────────────────────────────────────────────────

import { useApp } from '../state/appContext';
import type { Severity } from '../types/analysis';

const SEVERITY_COLOUR: Record<Severity, string> = {
  significant: 'var(--red)',
  moderate:    'var(--yellow)',
  mild:        'var(--blue)',
};

export function DrillDetailPage() {
  const { state, navigate } = useApp();
  const drill    = state.selectedDrill;
  const plan     = state.plan;
  const analysis = state.analysis;

  if (!drill) {
    navigate('results');
    return null;
  }

  // Find this drill's recommendation to surface the personalised "why"
  const rec = plan?.recommendations.find((r) => r.drill.id === drill.id);

  // Issues that this drill addresses, with their severity from the analysis
  const targetedIssues = analysis?.issues.filter(
    (i) => rec?.targetIssueIds.includes(i.id),
  ) ?? [];

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

        {/* ── Why this drill? ──────────────────────────────── */}
        {rec && (
          <div className="detail-block why-block">
            <h3>Why this drill?</h3>
            <p className="why-reason">{rec.reason}</p>

            {targetedIssues.length > 0 && (
              <div className="why-targets">
                {targetedIssues.map((issue) => (
                  <div key={issue.id} className="why-target-row">
                    <span
                      className="why-target-dot"
                      style={{ background: SEVERITY_COLOUR[issue.severity] }}
                    />
                    <div className="why-target-info">
                      <span className="why-target-name">{issue.name}</span>
                      <span
                        className="why-target-sev"
                        style={{ color: SEVERITY_COLOUR[issue.severity] }}
                      >
                        {issue.severity} · {Math.round(issue.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Setup ─────────────────────────────────────────── */}
        <div className="detail-block">
          <h3>Targets</h3>
          <div className="drill-target-issues">
            {drill.targetIssues.map((id) => (
              <span key={id} className="drill-target-tag">{id.replace(/-/g, ' ')}</span>
            ))}
          </div>
        </div>

        <div className="detail-block">
          <h3>Setup</h3>
          <p>{drill.setupInstructions}</p>
        </div>

        {/* ── Coaching cues ──────────────────────────────────── */}
        <div className="detail-block">
          <h3>Key cues to focus on</h3>
          <ol className="cue-list">
            {drill.coachingCues.map((cue, i) => (
              <li key={i}>{cue}</li>
            ))}
          </ol>
        </div>

        {/* ── Duration / reps ────────────────────────────────── */}
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

        {/* ── Safety ─────────────────────────────────────────── */}
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
