import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertCircle } from 'lucide-react'
import type { CalibrationState } from '@/types'
import { cn } from '@/lib/cn'

interface CalibrationOverlayProps {
  calibration: CalibrationState
  isInitializing?: boolean
}

interface CheckItem {
  label: string
  passed: boolean
  hint: string
}

export function CalibrationOverlay({ calibration, isInitializing }: CalibrationOverlayProps) {
  const checks: CheckItem[] = [
    {
      label: 'Full body visible',
      passed: calibration.isFullBodyVisible,
      hint: 'Step back until head to toe is in frame',
    },
    {
      label: 'Good distance',
      passed: calibration.isDistanceOk,
      hint: 'Stand about 6–8 feet from the camera',
    },
    {
      label: 'Good lighting',
      passed: calibration.isLightingOk,
      hint: 'Move to a well-lit area',
    },
    {
      label: 'Centered in frame',
      passed: calibration.isCentered,
      hint: 'Move to the center of the frame',
    },
  ]

  const failedChecks = checks.filter((c) => !c.passed)

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      {/* Body outline guide */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 200 400"
          className="h-4/5 w-auto opacity-20"
          fill="none"
          stroke={calibration.isReady ? '#10E07C' : '#4F8EF7'}
          strokeWidth="1.5"
          strokeDasharray="6 4"
        >
          {/* Simplified body outline */}
          <ellipse cx="100" cy="40" rx="25" ry="28" />
          <line x1="100" y1="68" x2="100" y2="200" />
          <line x1="100" y1="90" x2="55" y2="160" />
          <line x1="100" y1="90" x2="145" y2="160" />
          <line x1="100" y1="200" x2="75" y2="320" />
          <line x1="100" y1="200" x2="125" y2="320" />
        </svg>
      </div>

      {/* Top: status message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={calibration.message}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={cn(
            'self-center px-4 py-2 rounded-full backdrop-blur-sm',
            'border text-sm font-medium',
            calibration.isReady
              ? 'bg-success/20 border-success/40 text-success'
              : 'bg-bg-elevated/80 border-border text-text-2'
          )}
        >
          {isInitializing ? 'Starting camera...' : calibration.message}
        </motion.div>
      </AnimatePresence>

      {/* Bottom: checklist */}
      <div className="bg-bg/80 backdrop-blur-sm border border-border rounded-lg p-3 space-y-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-2">
            <span
              className={cn(
                'shrink-0 w-5 h-5 rounded-full flex items-center justify-center',
                check.passed
                  ? 'bg-success/20 text-success'
                  : 'bg-bg-elevated text-text-3'
              )}
            >
              {check.passed ? <Check size={11} strokeWidth={3} /> : <X size={11} />}
            </span>
            <span className={cn('text-xs', check.passed ? 'text-text-1' : 'text-text-3')}>
              {check.label}
            </span>
          </div>
        ))}

        {/* Active hint */}
        {failedChecks.length > 0 && (
          <div className="flex items-start gap-1.5 pt-1 border-t border-border">
            <AlertCircle size={12} className="text-warning shrink-0 mt-0.5" />
            <p className="text-warning text-xs">{failedChecks[0].hint}</p>
          </div>
        )}
      </div>
    </div>
  )
}
