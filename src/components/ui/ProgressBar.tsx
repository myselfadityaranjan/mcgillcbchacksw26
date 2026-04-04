import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number        // 0–100
  max?: number
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  showLabel?: boolean
  label?: string
  className?: string
}

const trackClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const fillClasses = {
  brand:    'bg-brand',
  success:  'bg-success',
  warning:  'bg-warning',
  danger:   'bg-danger',
  gradient: 'bg-gradient-to-r from-danger via-warning to-success',
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'brand',
  size = 'md',
  animated = true,
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-text-2">{label}</span>}
          {showLabel && <span className="text-xs font-mono text-text-2">{Math.round(pct)}%</span>}
        </div>
      )}
      {/* Track — warm beige so it's visible on white bg */}
      <div className={cn('w-full bg-stone-200 rounded-full overflow-hidden', trackClasses[size])}>
        <motion.div
          className={cn('h-full rounded-full', fillClasses[variant])}
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

/** Circular progress ring — updated for light background */
export function ProgressRing({
  value,
  max = 100,
  size = 64,
  strokeWidth = 5,
  variant = 'brand',
  children,
  className,
}: {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  variant?: 'brand' | 'success' | 'warning' | 'danger'
  children?: React.ReactNode
  className?: string
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  // New warm palette colours
  const strokeColors = {
    brand:   '#6B9E77',   // sage green
    success: '#5BA37A',   // forest green
    warning: '#D97B35',   // warm amber
    danger:  '#C05A52',   // warm red
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track — visible warm gray on white bg */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(161,143,114,0.20)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColors[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
