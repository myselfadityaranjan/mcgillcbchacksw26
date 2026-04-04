import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../state/appContext';
import { runAnalysis } from '../lib/analysisEngine';
import { buildPlan } from '../lib/planBuilder';

const MIN_DISPLAY_MS = 400;

const steps = [
  { label: 'Posture metrics', icon: '📐' },
  { label: 'Issue detection', icon: '🔍' },
  { label: 'Corrective plan', icon: '🎯' },
];

export function AnalyzingPage() {
  const { state, completeAnalysis } = useApp();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!state.assessmentResult) return;

    const startTime = performance.now();
    const t1 = setTimeout(() => setStep(1), 150);
    const t2 = setTimeout(() => setStep(2), 300);

    const analysis = runAnalysis(state.assessmentResult);
    const plan = buildPlan(analysis);

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
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8 px-6"
      >
        {/* Spinner */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-[3px] border-elevated" />
          <div className="absolute inset-0 rounded-full border-[3px] border-brand border-t-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border-[2px] border-brand/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-text-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Analyzing your movement...
          </h2>
          <p className="text-sm text-text-2 mt-2">Measuring joint angles, asymmetry, and movement patterns</p>
        </div>

        {/* Steps */}
        <div className="flex justify-center gap-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-all duration-300 ${
                i <= step
                  ? 'bg-brand/10 border-brand/20 text-brand'
                  : 'bg-surface border-border text-text-3'
              }`}
            >
              <span>{s.icon}</span>
              {s.label}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
