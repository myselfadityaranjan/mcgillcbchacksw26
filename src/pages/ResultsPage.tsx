// ──────────────────────────────────────────────────────────────
// ResultsPage — issue cards + drill recommendations
// ──────────────────────────────────────────────────────────────

import { useApp } from '../state/appContext';
import type { DetectedIssue, Severity } from '../types/analysis';
import type { DrillRecommendation } from '../types/plan';

// ── Sub-components ────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`severity-badge severity-${severity}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function IssueCard({ issue }: { issue: DetectedIssue }) {
  return (
    <div className={`issue-card issue-${issue.severity}`}>
      <div className="issue-card-header">
        <h3>{issue.name}</h3>
        <SeverityBadge severity={issue.severity} />
      </div>
      <p className="issue-explanation">{issue.explanation}</p>
      <p className="issue-meaning">{issue.meaning}</p>
      {issue.evidenceImageUrl && (
        <div className="issue-evidence">
          <img
            src={issue.evidenceImageUrl}
            alt={`Evidence frame for ${issue.name}`}
            className="evidence-img"
          />
          <span className="evidence-label">Evidence frame — {issue.evidenceStepId.replace('-', ' ')}</span>
        </div>
      )}
    </div>
  );
}

function DrillCard({ rec, onSelect }: { rec: DrillRecommendation; onSelect: () => void }) {
  return (
    <div className="drill-card" onClick={onSelect} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}>
      <div className="drill-card-header">
        <span className="drill-priority">#{rec.priority}</span>
        <div>
          <h3>{rec.drill.name}</h3>
          <span className="drill-area">{rec.drill.bodyArea}</span>
        </div>
        <span className="drill-arrow">→</span>
      </div>
      <p className="drill-reason">{rec.reason}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export function ResultsPage() {
  const { state, selectDrill, navigate, reset } = useApp();
  const { analysis, plan } = state;

  if (!analysis || !plan) return null;

  const noIssues = analysis.issues.length === 0;

  return (
    <div className="page results-page">
      <div className="results-header">
        <h2>Your Movement Report</h2>
        <p className="results-summary">{plan.summary}</p>
      </div>

      {noIssues ? (
        <div className="no-issues-card">
          <span className="no-issues-icon">✓</span>
          <h3>No significant patterns detected</h3>
          <p>Your posture and movement look well-aligned. Keep it up!</p>
        </div>
      ) : (
        <>
          <section className="results-section">
            <h3 className="section-label">
              {analysis.issues.length} Pattern{analysis.issues.length !== 1 ? 's' : ''} Detected
            </h3>
            <div className="issue-list">
              {analysis.issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </section>

          {plan.recommendations.length > 0 && (
            <section className="results-section">
              <h3 className="section-label">Corrective Plan</h3>
              <p className="section-sub">Select a drill to begin live coaching</p>
              <div className="drill-list">
                {plan.recommendations.map((rec) => (
                  <DrillCard
                    key={rec.drill.id}
                    rec={rec}
                    onSelect={() => selectDrill(rec.drill)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="results-footer">
        <button className="btn ghost" onClick={() => navigate('assessment')}>
          Re-scan
        </button>
        <button className="btn ghost btn-sm" onClick={reset}>
          Start over
        </button>
      </div>
    </div>
  );
}
