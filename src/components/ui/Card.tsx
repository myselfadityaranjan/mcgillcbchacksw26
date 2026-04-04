import { cn } from '@/lib/cn'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'bordered' | 'glass' | 'warm'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  animate?: boolean
}

const variantClasses = {
  default:  'bg-bg-surface border border-border shadow-card',
  elevated: 'bg-bg-surface border border-border shadow-surface',
  bordered: 'bg-bg-surface border-2 border-border-strong',
  glass:    'bg-white/70 backdrop-blur-sm border border-border shadow-sm',
  // warm: cream bg card — for feature highlights
  warm:     'bg-bg-elevated border border-border shadow-card',
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-6',
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  onClick,
  animate = false,
}: CardProps) {
  const classes = cn(
    'rounded-xl',
    variantClasses[variant],
    paddingClasses[padding],
    onClick && 'cursor-pointer',
    className
  )

  if (animate || onClick) {
    return (
      <motion.div
        className={classes}
        onClick={onClick}
        whileHover={onClick
          ? { y: -2, boxShadow: '0 8px 32px rgba(100,80,50,0.11)' }
          : undefined}
        whileTap={onClick ? { scale: 0.998 } : undefined}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={classes}>{children}</div>
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-text-1 font-semibold text-base', className)}>{children}</h3>
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-text-2 text-sm mt-1 leading-relaxed', className)}>{children}</p>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between pt-4 mt-4 border-t border-border', className)}>
      {children}
    </div>
  )
}
