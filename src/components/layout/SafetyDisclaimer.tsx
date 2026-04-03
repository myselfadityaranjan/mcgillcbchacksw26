import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, ChevronDown } from 'lucide-react'
import { DISCLAIMER_TEXT } from '@/lib/constants'
import { cn } from '@/lib/cn'

interface SafetyDisclaimerProps {
  variant?: 'banner' | 'inline' | 'modal-footer'
  className?: string
  collapsible?: boolean
}

export function SafetyDisclaimer({ variant = 'inline', className, collapsible = false }: SafetyDisclaimerProps) {
  const [expanded, setExpanded] = useState(!collapsible)

  if (variant === 'banner') {
    return (
      <div className={cn('bg-warning/8 border border-warning/20 rounded-lg p-3 flex items-start gap-2.5', className)}>
        <ShieldAlert size={15} className="text-warning shrink-0 mt-0.5" />
        <p className="text-warning/90 text-xs leading-relaxed">{DISCLAIMER_TEXT}</p>
      </div>
    )
  }

  if (variant === 'modal-footer') {
    return (
      <div className={cn('text-center', className)}>
        <p className="text-text-3 text-xs leading-relaxed max-w-xs mx-auto">{DISCLAIMER_TEXT}</p>
      </div>
    )
  }

  // inline / collapsible
  return (
    <div className={cn('rounded-lg border border-border overflow-hidden', className)}>
      <button
        onClick={() => collapsible && setExpanded((v) => !v)}
        className={cn(
          'w-full flex items-center gap-2 p-3',
          collapsible && 'cursor-pointer hover:bg-bg-elevated transition-colors',
          !collapsible && 'cursor-default'
        )}
      >
        <ShieldAlert size={14} className="text-text-3 shrink-0" />
        <span className="text-text-3 text-xs font-medium flex-1 text-left">
          Safety Notice
        </span>
        {collapsible && (
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-text-3" />
          </motion.span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-3 pb-3 text-text-3 text-xs leading-relaxed">
              {DISCLAIMER_TEXT}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
