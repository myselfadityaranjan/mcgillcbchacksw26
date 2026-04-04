// ──────────────────────────────────────────────────────────────
// LandingPage — intro screen with pitch and disclaimer
// ──────────────────────────────────────────────────────────────

import { useApp } from '../state/appContext';

export function LandingPage() {
  const { navigate } = useApp();

  return (
    <div className="page landing-page">
      <div className="landing-hero">
        <div className="logo-mark">
          <span className="logo-icon">⊕</span>
        </div>
        <h1 className="landing-title">StrainSense</h1>
        <p className="landing-tagline">
          Real-time corrective movement intelligence
        </p>
      </div>

      <div className="landing-pitch">
        <div className="pitch-row">
          <div className="pitch-card">
            <span className="pitch-icon">👁</span>
            <strong>Sees your body</strong>
            <p>Computer vision detects posture asymmetry and movement patterns in real time</p>
          </div>
          <div className="pitch-card">
            <span className="pitch-icon">⚡</span>
            <strong>Identifies issues</strong>
            <p>Flags forward head, rounded shoulders, knee collapse, and left-right imbalance</p>
          </div>
          <div className="pitch-card">
            <span className="pitch-icon">🎯</span>
            <strong>Coaches you live</strong>
            <p>Visual overlays, correction arrows, and real-time cues while you perform drills</p>
          </div>
        </div>
      </div>

      <div className="landing-disclaimer">
        <p>
          <strong>Not a medical device.</strong> StrainSense is a corrective movement support tool —
          not a diagnostic or clinical tool. Stop and seek professional care if you experience sharp pain.
          All analysis happens in your browser; no video leaves your device.
        </p>
      </div>

      <div className="landing-cta">
        <button className="btn primary btn-lg" onClick={() => navigate('setup')}>
          Start Assessment
        </button>
        <p className="landing-time">Takes about 60 seconds</p>
      </div>
    </div>
  );
}
