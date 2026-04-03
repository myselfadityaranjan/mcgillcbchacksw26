import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MoveHorizontal } from 'lucide-react'
import type { LiveCue, FormQuality } from '@/types'
import { cn } from '@/lib/cn'

interface LiveCueCardProps {
  cue: LiveCue | null
  quality: FormQuality
  className?: string
}

const priorityConfig = {
  unsafe: {
    bg: 'bg-danger/15',
    border: 'border-danger/40',
    text: 'text-danger',
    icon: <AlertTriangle size={16} />,
  },
  major: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
    icon: null,
  },
  minor: {
    bg: 'bg-brand/10',
    border: 'border-brand/25',
    text: 'text-brand',
    icon: null,
  },
}

const arrowIcon: Record<string, React.ReactNode> = {
  up: <ArrowUp size={14} />,
  down: <ArrowDown size={14} />,
  left: <ArrowLeft size={14} />,
  right: <ArrowRight size={14} />,
  outward: <MoveHorizontal size={14} />,
  inward: <MoveHorizontal size={14} className="scale-x-[-1]" />,
}

const goodCueText: Record<FormQuality, string> = {
  green: 'Great form — keep it up',
  yellow: 'Slight correction needed',
  red: 'Stop — fix your form',
}

export function LiveCueCard({ cue, quality, className }: LiveCueCardProps) {
  const isGood = quality === 'green' && !cue

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={cue?.id ?? 'good'}
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'rounded-lg border px-4 py-3 backdrop-blur-sm',
          isGood
            ? 'bg-success/10 border-success/30'
            : cue
            ? priorityConfig[cue.priority].bg + ' ' + priorityConfig[cue.priority].border
            : 'bg-bg-elevated/80 border-border',
          className
        )}
      >
        <div className="flex items-center gap-2">
          {/* Priority icon */}
          {cue && priorityConfig[cue.priority].icon && (
            <span className={cn('shrink-0', priorityConfig[cue.priority].text)}>
              {priorityConfig[cue.priority].icon}
            </span>
          )}

          {/* Arrow direction */}
          {cue?.arrowDirection && (
            <span className={cn('shrink-0', cue ? priorityConfig[cue.priority].text : 'text-success')}>
              {arrowIcon[cue.arrowDirection]}
            </span>
          )}

          {/* Cue text */}
          <p
            className={cn(
              'text-sm font-semibold',
              isGood ? 'text-success' : cue ? priorityConfig[cue.priority].text : 'text-text-2'
            )}
          >
            {isGood ? goodCueText[quality] : cue?.text ?? goodCueText[quality]}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
