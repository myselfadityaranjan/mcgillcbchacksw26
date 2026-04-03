import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { AssessmentStepState } from '@/types'

interface AssessmentProgressProps {
  steps: AssessmentStepState[]
  currentIndex: number
}

export function AssessmentProgress({ steps, currentIndex }: AssessmentProgressProps) {
  return (
    <div className="flex items-center gap-1" aria-label="Assessment progress">
      {steps.map((stepState, i) => {
        const isComplete = stepState.status === 'complete'
        const isCurrent = i === currentIndex
        const isSkipped = stepState.status === 'skipped'
        const isPending = stepState.status === 'pending'

        return (
          <div key={stepState.step.id} className="flex items-center gap-1">
            {/* Dot */}
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-300',
                isComplete && 'bg-success/20 border border-success/40 text-success',
                isCurrent && !isComplete && 'bg-brand/20 border-2 border-brand text-brand',
                isSkipped && 'bg-bg-elevated border border-border text-text-3',
                isPending && !isCurrent && 'bg-bg-elevated border border-border text-text-3',
              )}
              aria-label={`Step ${i + 1}: ${stepState.step.label} — ${stepState.status}`}
            >
              {isComplete ? <Check size={12} strokeWidth={3} /> : i + 1}
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-px w-4 transition-all duration-300',
                  (isComplete || (isCurrent && i > 0)) ? 'bg-success/40' : 'bg-border'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
