// ──────────────────────────────────────────────────────────────
// ResultsPage — body strain map + enhanced issue cards +
//               "why this drill?" cards + drill recommendations
// ──────────────────────────────────────────────────────────────

import { useApp } from '../state/appContext';
import type { DetectedIssue, Severity } from '../types/analysis';
import type { DrillRecommendation } from '../types/plan';
import { BodyStrainMap } from '../components/BodyStrainMap';
import { AnnotatedEvidence } from '../components/AnnotatedEvidence';

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
      {/* Annotated evidence frame — replaces plain <img> */}
      {issue.evidenceImageUrl && <AnnotatedEvidence issue={issue} />}
    </div>
  );
}

function DrillCard({
  rec,
  issues,
  onSelect,
}: {
  rec: DrillRecommendation;
  issues: DetectedIssue[];
  onSelect: () => void;
}) {
  // Find the detected issues that this drill targets
  const targeted = issues.filter((i) => rec.targetIssueIds.includes(i.id));

  return (
    <div
      className="drill-card"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <div className="drill-card-header">
        <span className="drill-priority">#{rec.priority}</span>
        <div>
          <h3>{rec.drill.name}</h3>
          <span className="drill-area">{rec.drill.bodyArea}</span>
        </div>
        <span className="drill-arrow">→</span>
      </div>

      {/* Why this drill was chosen */}
      <p className="drill-reason">{rec.reason}</p>

      {/* Targeted issue chips */}
      {targeted.length > 0 && (
        <div className="drill-targets">
          <span className="drill-targets-label">Addresses:</span>
          <div className="drill-target-chips">
            {targeted.map((issue) => (
              <span
                key={issue.id}
                className={`drill-target-chip chip-${issue.severity}`}
              >
                {issue.name}
                <span className="chip-sev"> · {issue.severity}</span>
              </span>
            ))}
          </div>
        </div>
      )}
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
          {/* ── Body strain map ────────────────────────────── */}
          <BodyStrainMap issues={analysis.issues} />

          {/* ── Detected patterns ─────────────────────────── */}
          <section className="results-section">
            <h3 className="section-label">
              {analysis.issues.length} Pattern
              {analysis.issues.length !== 1 ? 's' : ''} Detected
            </h3>
            <div className="issue-list">
              {analysis.issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </section>

          {/* ── Corrective plan ────────────────────────────── */}
          {plan.recommendations.length > 0 && (
            <section className="results-section">
              <h3 className="section-label">Corrective Plan</h3>
              <p className="section-sub">Select a drill to begin live coaching</p>
              <div className="drill-list">
                {plan.recommendations.map((rec) => (
                  <DrillCard
                    key={rec.drill.id}
                    rec={rec}
                    issues={analysis.issues}
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
