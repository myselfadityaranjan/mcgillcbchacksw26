// ──────────────────────────────────────────────────────────────
// AnalyzingPage — runs analysis + builds plan, then auto-advances
// Shows a minimum spinner time (400ms) for perceived quality,
// but the actual analysis runs immediately.
// ──────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useApp } from '../state/appContext';
import { runAnalysis } from '../lib/analysisEngine';
import { buildPlan } from '../lib/planBuilder';

const MIN_DISPLAY_MS = 400;

export function AnalyzingPage() {
  const { state, completeAnalysis } = useApp();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!state.assessmentResult) return;

    const startTime = performance.now();

    // Step through visual indicators
    const t1 = setTimeout(() => setStep(1), 150);
    const t2 = setTimeout(() => setStep(2), 300);

    // Run actual analysis synchronously (it's fast — pure computation)
    const analysis = runAnalysis(state.assessmentResult);
    const plan = buildPlan(analysis);

    // Ensure minimum display time so it doesn't feel instant/fake
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const t3 = setTimeout(() => {
      completeAnalysis(analysis, plan);
    }, remaining);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [state.assessmentResult, completeAnalysis]);

  return (
    <div className="page analyzing-page">
      <div className="analyzing-content">
        <div className="analyzing-spinner">
          <div className="spinner-ring" />
          <div className="spinner-ring ring2" />
        </div>
        <h2>Analyzing your movement…</h2>
        <p>Measuring joint angles, asymmetry, and movement patterns</p>
        <div className="analyzing-steps">
          <span className={step >= 0 ? 'active' : ''}>Posture metrics</span>
          <span className={step >= 1 ? 'active' : ''}>Issue detection</span>
          <span className={step >= 2 ? 'active' : ''}>Corrective plan</span>
        </div>
      </div>
    </div>
  );
}
