import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface SafetyAlertProps {
  isVisible: boolean
  reason?: string
  onDismiss: () => void
}

export function SafetyAlert({ isVisible, reason, onDismiss }: SafetyAlertProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-x-0 top-0 z-20 p-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-danger/20 backdrop-blur-sm border border-danger/50 rounded-xl p-4 shadow-glow-danger">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center">
                <AlertTriangle size={16} className="text-danger" />
              </div>
              <div className="flex-1">
                <p className="text-danger font-bold text-sm">Stop — Unsafe Form</p>
                <p className="text-danger/80 text-xs mt-0.5 leading-relaxed">
                  {reason ?? 'Dangerous movement pattern detected. Rest, reset your position, then continue.'}
                </p>
              </div>
              <button
                onClick={onDismiss}
                className="shrink-0 p-1 rounded text-danger/60 hover:text-danger transition-colors"
                aria-label="Dismiss safety alert"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="danger" size="sm" onClick={onDismiss}>
                Reset &amp; Continue
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
