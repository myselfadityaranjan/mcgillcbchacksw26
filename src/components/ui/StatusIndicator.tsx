import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/cn'
import type { FormQuality } from '@/types'

interface StatusIndicatorProps {
  quality: FormQuality
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  label?: string
  className?: string
}

const qualityConfig = {
  green: {
    label: 'Good Form',
    color: 'text-success',
    bgColor: 'bg-success',
    glowClass: 'shadow-glow-success',
    borderClass: 'border-success/40',
    bgSubtle: 'bg-success/10',
  },
  yellow: {
    label: 'Needs Correction',
    color: 'text-warning',
    bgColor: 'bg-warning',
    glowClass: 'shadow-glow-warning',
    borderClass: 'border-warning/40',
    bgSubtle: 'bg-warning/10',
  },
  red: {
    label: 'Unsafe / Fix Now',
    color: 'text-danger',
    bgColor: 'bg-danger',
    glowClass: 'shadow-glow-danger',
    borderClass: 'border-danger/40',
    bgSubtle: 'bg-danger/10',
  },
} as const

const sizeClasses = {
  sm: { dot: 'w-2 h-2', text: 'text-xs' },
  md: { dot: 'w-3 h-3', text: 'text-sm' },
  lg: { dot: 'w-4 h-4', text: 'text-base' },
}

export function StatusIndicator({
  quality,
  size = 'md',
  pulse = true,
  label,
  className,
}: StatusIndicatorProps) {
  const config = qualityConfig[quality]
  const { dot, text } = sizeClasses[size]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={quality}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={cn('flex items-center gap-2', className)}
      >
        <span className="relative flex">
          {pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping-slow',
                config.bgColor
              )}
            />
          )}
          <span className={cn('relative inline-flex rounded-full', dot, config.bgColor)} />
        </span>
        <span className={cn('font-medium', config.color, text)}>
          {label ?? config.label}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}

/** Full-width status bar shown at the top/bottom of coaching mode */
export function StatusBar({ quality }: { quality: FormQuality }) {
  const config = qualityConfig[quality]
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={quality}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className={cn(
          'w-full py-2 px-4 flex items-center justify-center gap-2',
          'border-t',
          config.bgSubtle,
          config.borderClass
        )}
      >
        <StatusIndicator quality={quality} size="sm" pulse={quality !== 'green'} />
      </motion.div>
    </AnimatePresence>
  )
}
