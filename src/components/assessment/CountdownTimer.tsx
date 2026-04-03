import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressRing } from '@/components/ui/ProgressBar'

interface CountdownTimerProps {
  seconds: number
  onComplete: () => void
  label?: string
  autoStart?: boolean
}

export function CountdownTimer({ seconds, onComplete, label, autoStart = true }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const [started, setStarted] = useState(autoStart)

  useEffect(() => {
    if (!started) return
    if (remaining <= 0) {
      onComplete()
      return
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining, started, onComplete])

  useEffect(() => {
    if (autoStart) {
      setRemaining(seconds)
      setStarted(true)
    }
  }, [seconds, autoStart])

  return (
    <div className="flex flex-col items-center gap-3">
      <ProgressRing
        value={remaining}
        max={seconds}
        size={80}
        strokeWidth={5}
        variant={remaining <= 2 ? 'success' : 'brand'}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={remaining}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-mono font-bold text-text-1 tabular-nums"
          >
            {remaining}
          </motion.span>
        </AnimatePresence>
      </ProgressRing>
      {label && <p className="text-text-2 text-sm text-center">{label}</p>}
    </div>
  )
}

/** Compact inline countdown for use in capture windows */
export function CaptureTimer({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) { onComplete(); return }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, onComplete])

  return (
    <div className="inline-flex items-center gap-1.5 bg-success/10 border border-success/30 rounded-full px-2.5 py-1">
      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
      <span className="text-success text-xs font-mono font-semibold">
        Capturing {remaining}s
      </span>
    </div>
  )
}
