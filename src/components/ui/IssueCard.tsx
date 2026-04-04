import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import type { DetectedIssue } from '@/types'
import { getIssueMeta } from '@/data/issues'
import { Badge } from './Badge'
import { cn } from '@/lib/cn'
import { BODY_REGION_LABELS } from '@/lib/constants'

interface IssueCardProps {
  issue: DetectedIssue
  rank?: number
  defaultExpanded?: boolean
}

const severityConfig = {
  mild: { variant: 'warning' as const, label: 'Mild', Icon: Info },
  moderate: { variant: 'warning' as const, label: 'Moderate', Icon: AlertCircle },
  significant: { variant: 'danger' as const, label: 'Significant', Icon: AlertTriangle },
}

const confidenceLabel = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
}

export function IssueCard({ issue, rank, defaultExpanded = false }: IssueCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const meta = getIssueMeta(issue.id)
  const { variant, label: severityLabel, Icon: SeverityIcon } = severityConfig[issue.severity]

  return (
    <motion.div
      className={cn(
        'rounded-xl border transition-all duration-200',
        issue.severity === 'significant'
          ? 'bg-danger/5 border-danger/20 shadow-sm'
          : 'bg-bg-surface border-border shadow-card hover:shadow-surface hover:-translate-y-0.5'
      )}
      layout
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left"
        aria-expanded={expanded}
      >
        {/* Rank */}
        {rank !== undefined && (
          <span className="shrink-0 w-6 h-6 rounded-full bg-stone-100 border border-border flex items-center justify-center text-xs text-text-2 font-mono mt-0.5">
            {rank}
          </span>
        )}

        {/* Icon */}
        <SeverityIcon
          size={18}
          className={cn(
            'shrink-0 mt-0.5',
            variant === 'danger' ? 'text-danger' : 'text-warning'
          )}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-text-1 font-semibold text-sm">{meta.name}</span>
            <Badge variant={variant} size="sm">{severityLabel}</Badge>
            <Badge variant="default" size="sm">{BODY_REGION_LABELS[issue.primaryRegion]}</Badge>
          </div>
          <p className="text-text-2 text-xs leading-relaxed line-clamp-2">
            {meta.description}
          </p>
        </div>

        {/* Expand chevron */}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-1"
        >
          <ChevronDown size={16} className="text-text-3" />
        </motion.span>
      </button>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
              {/* Why it matters */}
              <div>
                <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-1.5">
                  Why it matters
                </h4>
                <p className="text-text-2 text-sm leading-relaxed">{meta.whyItMatters}</p>
              </div>

              {/* May contribute to */}
              <div>
                <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-1.5">
                  May contribute to
                </h4>
                <ul className="space-y-1">
                  {meta.whatItMayLeadTo.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-2">
                      <span className="shrink-0 w-1 h-1 rounded-full bg-text-3 mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key metric */}
              <div className="bg-stone-100 rounded-lg p-3 flex justify-between items-center">
                <span className="text-xs text-text-3 capitalize">
                  {issue.metrics.primaryDeviationLabel}
                </span>
                <span className="font-mono text-sm text-text-1 font-medium">
                  {issue.metrics.primaryDeviation.toFixed(1)}
                  {issue.metrics.primaryDeviationLabel.includes('°') ? '°' :
                    issue.metrics.primaryDeviationLabel.includes('cm') ? ' cm' : ''}
                </span>
              </div>

              {/* Confidence */}
              <p className="text-xs text-text-3">{confidenceLabel[issue.confidence]}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
