import { cn } from '@/lib/cn'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'bordered' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  animate?: boolean
}

const variantClasses = {
  default: 'bg-bg-surface border border-border',
  elevated: 'bg-bg-elevated border border-border shadow-surface',
  bordered: 'bg-bg-surface border-2 border-border-strong',
  glass: 'bg-bg-elevated/60 backdrop-blur-sm border border-border',
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
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
    'rounded-lg',
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
        whileHover={onClick ? { scale: 1.005, borderColor: 'rgba(99, 120, 186, 0.4)' } : undefined}
        whileTap={onClick ? { scale: 0.998 } : undefined}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={classes}>{children}</div>
}

// Convenience sub-components
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-3', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-text-1 font-semibold text-base', className)}>{children}</h3>
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-text-2 text-sm mt-1', className)}>{children}</p>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between pt-3 mt-3 border-t border-border', className)}>
      {children}
    </div>
  )
}
