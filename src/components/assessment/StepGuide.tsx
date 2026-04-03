import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import type { AssessmentStep } from '@/types'
import { cn } from '@/lib/cn'

interface StepGuideProps {
  step: AssessmentStep
  phase: 'countdown' | 'capturing' | 'complete'
  className?: string
}

export function StepGuide({ step, phase, className }: StepGuideProps) {
  return (
    <motion.div
      className={cn('space-y-3', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Step name */}
      <div>
        <h2 className="text-text-1 text-xl font-bold">{step.label}</h2>
        <p className="text-text-2 text-sm mt-1">{step.description}</p>
      </div>

      {/* Instruction */}
      <div className="bg-bg-elevated border border-border rounded-lg p-3">
        <p className="text-text-1 text-sm leading-relaxed font-medium">
          {step.instructionText}
        </p>
      </div>

      {/* Tips — only show during countdown */}
      {phase === 'countdown' && step.tips.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-text-3 font-medium">
            <Info size={12} />
            Tips
          </div>
          {step.tips.map((tip) => (
            <div key={tip} className="flex items-start gap-2 text-xs text-text-2">
              <span className="shrink-0 w-1 h-1 rounded-full bg-text-3 mt-1.5" />
              {tip}
            </div>
          ))}
        </div>
      )}

      {/* Capturing state */}
      {phase === 'capturing' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-success/10 border border-success/30 rounded-lg p-3 text-center"
        >
          <p className="text-success text-sm font-semibold">
            Hold still — capturing your position
          </p>
        </motion.div>
      )}

      {/* Complete state */}
      {phase === 'complete' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-brand/10 border border-brand/30 rounded-lg p-3 text-center"
        >
          <p className="text-brand text-sm font-semibold">
            Step captured
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
