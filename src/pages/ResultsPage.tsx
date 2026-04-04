// ──────────────────────────────────────────────────────────────
// ResultsPage — issue cards + drill recommendations
// Shows data quality, confidence scores, metric readouts,
// and evidence frames with highlighted joints.
// ──────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { useApp } from '../state/appContext';
import type { DetectedIssue, Severity } from '../types/analysis';
import type { DrillRecommendation } from '../types/plan';

// ── Annotated evidence canvas ────────────────────────────────

function AnnotatedEvidence({ issue }: { issue: DetectedIssue }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!issue.evidenceImageUrl) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
    img.src = issue.evidenceImageUrl;
  });

  function draw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the video frame (mirrored to match the live view)
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // We don't have landmarks stored on the issue, but we have
    // affectedLandmarks indices. Draw highlight circles at approximate
    // positions based on the issue type.
    drawIssueHighlights(ctx, canvas.width, canvas.height, issue);
  }

  if (!issue.evidenceImageUrl) return null;

  return (
    <div className="evidence-wrap">
      <canvas ref={canvasRef} className="evidence-canvas" />
      <span className="evidence-label">
        {issue.evidenceStepId.replace(/-/g, ' ')} — annotated
      </span>
    </div>
  );
}

function drawIssueHighlights(
  ctx: CanvasRenderingContext2D,
  _w: number,
  _h: number,
  issue: DetectedIssue,
): void {
  // Draw severity indicator bar on the left edge
  const colour =
    issue.severity === 'significant'
      ? '#ff4444'
      : issue.severity === 'moderate'
        ? '#fbbf24'
        : '#00ff88';

  ctx.save();
  ctx.fillStyle = colour;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, 0, 5, _h);
  ctx.restore();

  // Severity label overlay
  ctx.save();
  const fontSize = Math.max(12, _w * 0.025);
  ctx.font = `700 ${fontSize}px -apple-system, sans-serif`;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  const label = issue.severity.toUpperCase();
  const labelW = ctx.measureText(label).width + 16;
  ctx.beginPath();
  ctx.roundRect(8, 8, labelW, fontSize + 10, 4);
  ctx.fill();
  ctx.fillStyle = colour;
  ctx.textBaseline = 'top';
  ctx.fillText(label, 16, 13);
  ctx.restore();
}

// ── Sub-components ────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`severity-badge severity-${severity}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="confidence-meter">
      <div className="confidence-bar" style={{ width: `${pct}%` }} />
      <span className="confidence-label">Confidence: {pct}%</span>
    </div>
  );
}

function MetricReadout({ metrics }: { metrics: Record<string, number> }) {
  return (
    <div className="metric-readout">
      {Object.entries(metrics).map(([key, val]) => (
        <div key={key} className="metric-item">
          <span className="metric-name">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
          <span className="metric-value">{(val * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
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
      <ConfidenceMeter value={issue.confidence} />
      <MetricReadout metrics={issue.metrics} />
      <AnnotatedEvidence issue={issue} />
    </div>
  );
}

function DrillCard({ rec, onSelect }: { rec: DrillRecommendation; onSelect: () => void }) {
  const urgencyClass =
    rec.priority === 1 ? 'urgent' : rec.priority === 2 ? 'moderate' : '';

  return (
    <div
      className={`drill-card ${urgencyClass}`}
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
      <p className="drill-reason">{rec.reason}</p>
      <div className="drill-targets">
        {rec.targetIssueIds.map((id) => (
          <span key={id} className="drill-target-tag">{id.replace(/-/g, ' ')}</span>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export function ResultsPage() {
  const { state, selectDrill, navigate, reset } = useApp();
  const { analysis, plan } = state;

  if (!analysis || !plan) return null;

  const noIssues = analysis.issues.length === 0;
  const lowQuality = analysis.dataQuality < 0.5;

  return (
    <div className="page results-page">
      <div className="results-header">
        <h2>Your Movement Report</h2>
        <p className="results-summary">{plan.summary}</p>
      </div>

      {/* Data quality warning */}
      {lowQuality && (
        <div className="banner error">
          Low data quality detected ({Math.round(analysis.dataQuality * 100)}%).
          Some landmarks were not clearly visible. Consider re-scanning
          with better lighting and full-body framing for more accurate results.
        </div>
      )}

      {noIssues ? (
        <div className="no-issues-card">
          <span className="no-issues-icon">✓</span>
          <h3>
            {lowQuality
              ? 'Insufficient data to detect patterns'
              : 'No significant patterns detected'}
          </h3>
          <p>
            {lowQuality
              ? 'We couldn\'t gather enough clear data to make confident assessments. Try re-scanning with better visibility.'
              : 'Your posture and movement look well-aligned based on this scan. Consider reassessing periodically.'}
          </p>
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
        <button className="btn primary" onClick={() => navigate('assessment')}>
          Re-scan
        </button>
        <button className="btn ghost btn-sm" onClick={reset}>
          Start over
        </button>
      </div>
    </div>
  );
}
