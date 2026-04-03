import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/cn'

interface HoldTimerProps {
  targetSeconds: number
  isActive: boolean
  onComplete?: () => void
  className?: string
}

export function HoldTimer({ targetSeconds, isActive, onComplete, className }: HoldTimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => {
      setElapsed((e) => {
        const next = e + 0.1
        if (next >= targetSeconds) {
          clearInterval(interval)
          onComplete?.()
          return targetSeconds
        }
        return next
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isActive, targetSeconds, onComplete])

  // Reset when drill changes
  useEffect(() => {
    setElapsed(0)
  }, [targetSeconds])

  const pct = (elapsed / targetSeconds) * 100
  const remaining = Math.max(0, targetSeconds - elapsed)
  const isDone = elapsed >= targetSeconds

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {/* Arc track */}
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <motion.circle
            cx="28" cy="28" r="22"
            fill="none"
            stroke={isDone ? '#10E07C' : '#4F8EF7'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 22}
            animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - pct / 100) }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isDone ? (
              <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-success text-lg">
                ✓
              </motion.span>
            ) : (
              <span className="text-text-1 text-sm font-mono font-bold tabular-nums">
                {remaining.toFixed(0)}s
              </span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <span className="text-xs text-text-3">Hold</span>
    </div>
  )
}
