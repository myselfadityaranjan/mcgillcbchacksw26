// ──────────────────────────────────────────────────────────────
// BodyStrainMap — SVG body silhouette with severity-coded regions.
// Shown on the Results page as the signature visual for detected issues.
// ──────────────────────────────────────────────────────────────

import type { DetectedIssue, IssueId, Severity } from '../types/analysis';

// ── Region → issue mapping ────────────────────────────────────

type RegionId =
  | 'head' | 'neck'
  | 'left-shoulder' | 'right-shoulder'
  | 'upper-back'
  | 'core'
  | 'pelvis'
  | 'left-knee' | 'right-knee';

const REGION_ISSUES: Record<RegionId, IssueId[]> = {
  'head':           ['forward-head-posture'],
  'neck':           ['forward-head-posture'],
  'left-shoulder':  ['rounded-shoulders', 'lateral-asymmetry'],
  'right-shoulder': ['rounded-shoulders', 'lateral-asymmetry'],
  'upper-back':     ['rounded-shoulders'],
  'core':           ['anterior-pelvic-tilt'],
  'pelvis':         ['anterior-pelvic-tilt', 'lateral-asymmetry'],
  'left-knee':      ['knee-valgus'],
  'right-knee':     ['knee-valgus'],
};

const SEVERITY_ORDER: Record<Severity, number> = { significant: 0, moderate: 1, mild: 2 };

const SEVERITY_COLOUR: Record<Severity, string> = {
  significant: '#C05A52',
  moderate:    '#D97B35',
  mild:        '#5B8CB0',
};

function regionInfo(issues: DetectedIssue[], regionId: RegionId) {
  const candidates = issues.filter(
    (i) => REGION_ISSUES[regionId].includes(i.id),
  );
  if (candidates.length === 0) return null;

  const worst = candidates.reduce((a, b) =>
    SEVERITY_ORDER[a.severity] <= SEVERITY_ORDER[b.severity] ? a : b,
  );

  return {
    colour: SEVERITY_COLOUR[worst.severity],
    severity: worst.severity,
    glow: worst.severity === 'significant',
  };
}

// ── Region shape component ────────────────────────────────────

interface RegionProps {
  id: RegionId;
  issues: DetectedIssue[];
  children: React.ReactNode;
}

function Region({ id, issues, children }: RegionProps) {
  const info = regionInfo(issues, id);
  const colour = info ? info.colour : 'rgba(255,255,255,0.12)';
  const fillOpacity = info ? (info.severity === 'significant' ? 0.22 : 0.16) : 0.06;
  const strokeOpacity = info ? 0.75 : 0.20;
  const filter = info?.glow ? `url(#glow-${id})` : undefined;

  return (
    <g
      data-region={id}
      fill={colour}
      fillOpacity={fillOpacity}
      stroke={colour}
      strokeOpacity={strokeOpacity}
      strokeWidth={1.5}
      filter={filter}
    >
      {info?.glow && (
        <defs>
          <filter id={`glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      {children}
    </g>
  );
}

// ── Legend entry ──────────────────────────────────────────────

const ISSUE_DISPLAY: Record<IssueId, string> = {
  'rounded-shoulders':      'Rounded Shoulders',
  'forward-head-posture':   'Forward Head',
  'anterior-pelvic-tilt':  'Pelvic Tilt',
  'knee-valgus':            'Knee Valgus',
  'lateral-asymmetry':      'Lateral Asymmetry',
};

// ── Main component ────────────────────────────────────────────

interface BodyStrainMapProps {
  issues: DetectedIssue[];
}

export function BodyStrainMap({ issues }: BodyStrainMapProps) {
  if (issues.length === 0) return null;

  return (
    <div className="strain-map-wrap">
      <div className="strain-map-header">
        <span className="section-label">Body Strain Map</span>
      </div>

      <div className="strain-map-body">
        {/* ── SVG figure ── */}
        <div className="strain-map-svg-wrap">
          <svg
            viewBox="0 0 160 330"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="strain-map-svg"
            aria-label="Body strain map"
          >
            {/* Shared glow filter for significant issues */}
            <defs>
              <filter id="glow-shared" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Head ── */}
            <Region id="head" issues={issues}>
              <circle cx="80" cy="28" r="21" />
            </Region>

            {/* ── Neck ── */}
            <Region id="neck" issues={issues}>
              <rect x="70" y="49" width="20" height="16" rx="4" />
            </Region>

            {/* ── Left shoulder ── */}
            <Region id="left-shoulder" issues={issues}>
              <ellipse cx="25" cy="80" rx="17" ry="12" />
            </Region>

            {/* ── Right shoulder ── */}
            <Region id="right-shoulder" issues={issues}>
              <ellipse cx="135" cy="80" rx="17" ry="12" />
            </Region>

            {/* ── Upper back / chest ── */}
            <Region id="upper-back" issues={issues}>
              <rect x="42" y="65" width="76" height="52" rx="8" />
            </Region>

            {/* ── Core / lower back ── */}
            <Region id="core" issues={issues}>
              <rect x="46" y="117" width="68" height="44" rx="7" />
            </Region>

            {/* ── Pelvis / hips ── */}
            <Region id="pelvis" issues={issues}>
              <ellipse cx="80" cy="176" rx="38" ry="17" />
            </Region>

            {/* Thighs — structural only (no issue mapping, dim) */}
            <rect x="44" y="192" width="28" height="50" rx="7"
              fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <rect x="88" y="192" width="28" height="50" rx="7"
              fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

            {/* ── Left knee ── */}
            <Region id="left-knee" issues={issues}>
              <circle cx="58" cy="248" r="13" />
            </Region>

            {/* ── Right knee ── */}
            <Region id="right-knee" issues={issues}>
              <circle cx="102" cy="248" r="13" />
            </Region>

            {/* Shins — structural only */}
            <rect x="50" y="261" width="16" height="42" rx="5"
              fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <rect x="94" y="261" width="16" height="42" rx="5"
              fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

            {/* Feet — structural only */}
            <ellipse cx="58" cy="306" rx="12" ry="6"
              fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            <ellipse cx="102" cy="306" rx="12" ry="6"
              fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
          </svg>
        </div>

        {/* ── Legend ── */}
        <div className="strain-map-legend">
          {issues.map((issue) => {
            const colour = SEVERITY_COLOUR[issue.severity];
            return (
              <div key={issue.id} className="strain-legend-item">
                <span
                  className="strain-legend-dot"
                  style={{ background: colour, boxShadow: `0 0 6px ${colour}` }}
                />
                <div className="strain-legend-text">
                  <span className="strain-legend-name">
                    {ISSUE_DISPLAY[issue.id] ?? issue.name}
                  </span>
                  <span
                    className="strain-legend-sev"
                    style={{ color: colour }}
                  >
                    {issue.severity}
                    <span className="strain-legend-conf">
                      {' '}· {Math.round(issue.confidence * 100)}% confidence
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
