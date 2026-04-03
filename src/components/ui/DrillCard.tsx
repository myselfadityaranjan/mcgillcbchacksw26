import { motion } from 'framer-motion'
import { Clock, ChevronRight, Dumbbell, Star } from 'lucide-react'
import type { DrillRecommendation } from '@/types'
import { Badge } from './Badge'
import { cn } from '@/lib/cn'

interface DrillCardProps {
  recommendation: DrillRecommendation
  onClick?: () => void
  className?: string
}

const difficultyBadge = {
  beginner: { variant: 'success' as const, label: 'Beginner' },
  intermediate: { variant: 'warning' as const, label: 'Intermediate' },
  advanced: { variant: 'danger' as const, label: 'Advanced' },
}

const categoryIcon: Record<string, React.ReactNode> = {
  stretch: <span className="text-base">🧘</span>,
  mobility: <span className="text-base">🔄</span>,
  stability: <span className="text-base">⚖️</span>,
  strength: <span className="text-base">💪</span>,
}

export function DrillCard({ recommendation, onClick, className }: DrillCardProps) {
  const { drill, issueIds, priority, reason } = recommendation
  const diff = difficultyBadge[drill.difficulty]

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full text-left',
        'bg-bg-surface hover:bg-bg-elevated',
        'border border-border hover:border-border-strong',
        'rounded-lg p-4 transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        className
      )}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.998 }}
      transition={{ duration: 0.12 }}
    >
      <div className="flex items-start gap-3">
        {/* Priority badge + category icon */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
            <span className="text-brand text-xs font-bold font-mono">{priority}</span>
          </div>
          <span>{categoryIcon[drill.category] ?? <Dumbbell size={14} />}</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-text-1 font-semibold text-sm leading-tight">{drill.name}</span>
            <ChevronRight size={16} className="text-text-3 shrink-0 mt-0.5" />
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <Badge variant={diff.variant} size="sm">{diff.label}</Badge>
            <Badge variant="default" size="sm">
              <Clock size={10} />
              {drill.reps ? `${drill.reps} reps` : `${drill.durationSeconds}s`}
            </Badge>
            {issueIds.length > 0 && (
              <Badge variant="info" size="sm">
                <Star size={10} />
                Targets your issue
              </Badge>
            )}
          </div>

          {/* Reason */}
          <p className="text-text-2 text-xs leading-relaxed">{reason}</p>
        </div>
      </div>
    </motion.button>
  )
}
