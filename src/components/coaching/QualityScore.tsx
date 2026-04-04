import { motion } from 'framer-motion'
import { ProgressRing } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/cn'

interface QualityScoreProps {
  score: number          // 0–100 smoothed
  history?: number[]     // last N frame scores for sparkline
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function scoreToVariant(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 75) return 'success'
  if (score >= 45) return 'warning'
  return 'danger'
}

function scoreToLabel(score: number): string {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  if (score >= 30) return 'Weak'
  return 'Poor'
}

const ringSizes = { sm: 56, md: 72, lg: 96 }
const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' }

export function QualityScore({ score, history, size = 'md', className }: QualityScoreProps) {
  const variant = scoreToVariant(score)
  const ringSize = ringSizes[size]

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <ProgressRing value={score} size={ringSize} strokeWidth={5} variant={variant}>
        <motion.span
          className={cn('font-mono font-bold tabular-nums', textSizes[size], {
            'text-success': variant === 'success',
            'text-warning': variant === 'warning',
            'text-danger': variant === 'danger',
          })}
          animate={{ opacity: 1 }}
          key={Math.round(score)}
        >
          {Math.round(score)}
        </motion.span>
      </ProgressRing>

      <span className="text-xs text-text-3">{scoreToLabel(score)}</span>

      {/* Sparkline */}
      {history && history.length > 1 && (
        <Sparkline data={history} variant={variant} />
      )}
    </div>
  )
}

function Sparkline({
  data,
  variant,
}: {
  data: number[]
  variant: 'success' | 'warning' | 'danger'
}) {
  const W = 64
  const H = 20
  const max = 100
  const pts = data
    .slice(-30)
    .map((v, i, arr) => {
      const x = (i / (arr.length - 1)) * W
      const y = H - (v / max) * H
      return `${x},${y}`
    })
    .join(' ')

  const colorMap = {
    success: '#5BA37A',
    warning: '#D97B35',
    danger:  '#C05A52',
  }

  return (
    <svg width={W} height={H} className="opacity-60">
      <polyline
        points={pts}
        fill="none"
        stroke={colorMap[variant]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
