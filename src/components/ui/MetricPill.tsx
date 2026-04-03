import { cn } from '@/lib/cn'

interface MetricPillProps {
  label: string
  value: string | number
  unit?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
  className?: string
}

const variantClasses = {
  default: 'bg-bg-elevated border-border text-text-2',
  success: 'bg-success/10 border-success/20 text-success',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  danger: 'bg-danger/10 border-danger/20 text-danger',
}

export function MetricPill({
  label,
  value,
  unit,
  variant = 'default',
  size = 'md',
  className,
}: MetricPillProps) {
  return (
    <div
      className={cn(
        'inline-flex flex-col items-center justify-center rounded-lg border',
        size === 'sm' ? 'px-2 py-1' : 'px-3 py-2',
        variantClasses[variant],
        className
      )}
    >
      <span
        className={cn(
          'font-mono font-semibold tabular-nums',
          size === 'sm' ? 'text-sm' : 'text-lg'
        )}
      >
        {value}
        {unit && <span className="text-xs font-sans ml-0.5 opacity-70">{unit}</span>}
      </span>
      <span className={cn('text-text-3 leading-tight', size === 'sm' ? 'text-[10px]' : 'text-xs')}>
        {label}
      </span>
    </div>
  )
}
