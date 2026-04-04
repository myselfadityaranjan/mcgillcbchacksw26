// ──────────────────────────────────────────────────────────────
// AnalyzingPage — runs analysis + builds plan, then auto-advances
// ──────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useApp } from '../state/appContext';
import { runAnalysis } from '../lib/analysisEngine';
import { buildPlan } from '../lib/planBuilder';

export function AnalyzingPage() {
  const { state, completeAnalysis } = useApp();

  useEffect(() => {
    if (!state.assessmentResult) return;

    // Run in the next microtask so the spinner renders first
    const id = setTimeout(() => {
      const analysis = runAnalysis(state.assessmentResult!);
      const plan     = buildPlan(analysis);
      completeAnalysis(analysis, plan);
    }, 800);

    return () => clearTimeout(id);
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
          <span>Posture metrics</span>
          <span>Issue detection</span>
          <span>Corrective plan</span>
        </div>
      </div>
    </div>
  );
}
