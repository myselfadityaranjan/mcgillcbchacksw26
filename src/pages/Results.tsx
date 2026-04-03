import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RotateCcw, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IssueCard } from '@/components/ui/IssueCard'
import { DrillCard } from '@/components/ui/DrillCard'
import { ProgressRing } from '@/components/ui/ProgressBar'
import { BodyStrainMap } from '@/components/results/BodyStrainMap'
import { PageTransition } from '@/components/layout/PageTransition'
import { useAssessmentStore } from '@/store'
import { useAnalytics } from '@/hooks/useAnalytics'
import { ROUTES, SCORE_EXCELLENT, SCORE_GOOD } from '@/lib/constants'

function scoreVariant(score: number): 'success' | 'warning' | 'danger' {
  if (score >= SCORE_EXCELLENT) return 'success'
  if (score >= SCORE_GOOD) return 'warning'
  return 'danger'
}

function scoreLabel(score: number): string {
  if (score >= SCORE_EXCELLENT) return 'Excellent'
  if (score >= SCORE_GOOD) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Needs Work'
}

export default function Results() {
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const { analysisResult, correctivePlan, reset } = useAssessmentStore()

  // Guard: must have analysis result
  useEffect(() => {
    if (!analysisResult) navigate(ROUTES.HOME, { replace: true })
  }, [analysisResult, navigate])

  useEffect(() => {
    if (analysisResult) {
      track('results_viewed', { issueCount: analysisResult.issues.length })
    }
  }, [analysisResult, track])

  if (!analysisResult || !correctivePlan) return null

  const { issues, overallScore } = analysisResult
  const variant = scoreVariant(overallScore)

  return (
    <PageTransition className="min-h-screen bg-bg pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { reset(); navigate(ROUTES.HOME) }}
          leftIcon={<RotateCcw size={14} />}
        >
          New Scan
        </Button>
        <span className="text-text-2 text-sm font-semibold">Your Results</span>
        <div className="w-20" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* Score summary */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-bg-surface border border-border rounded-xl p-6 flex items-center gap-6"
        >
          <ProgressRing value={overallScore} size={88} strokeWidth={7} variant={variant}>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black font-mono text-text-1 tabular-nums">
                {overallScore}
              </span>
              <span className="text-[10px] text-text-3">/ 100</span>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-text-1 text-xl font-bold">Movement Score</h1>
              <span
                className={`text-sm font-semibold ${
                  variant === 'success' ? 'text-success' :
                  variant === 'warning' ? 'text-warning' : 'text-danger'
                }`}
              >
                {scoreLabel(overallScore)}
              </span>
            </div>
            <p className="text-text-2 text-sm">
              {issues.length === 0
                ? 'No significant patterns detected. Your movement looks solid.'
                : `${issues.length} movement pattern${issues.length > 1 ? 's' : ''} detected that may benefit from correction.`}
            </p>
          </div>
        </motion.div>

        {/* Body strain map + issues side by side */}
        {issues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 items-start">
            <BodyStrainMap issues={issues} />

            <div className="space-y-3">
              <h2 className="text-text-1 font-bold text-base">Detected Patterns</h2>
              <p className="text-text-3 text-xs">
                Language reflects patterns consistent with these posture tendencies, not clinical diagnoses.
              </p>
              {issues.map((issue, i) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                >
                  <IssueCard issue={issue} rank={i + 1} defaultExpanded={i === 0} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Corrective plan */}
        {correctivePlan.recommendations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-text-1 font-bold text-base">Your Corrective Plan</h2>
              <span className="flex items-center gap-1.5 text-text-3 text-xs">
                <Clock size={12} />
                ~{correctivePlan.totalEstimatedMinutes} min
              </span>
            </div>

            <div className="space-y-2">
              {correctivePlan.recommendations.map((rec, i) => (
                <motion.div
                  key={rec.drill.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.07, duration: 0.35 }}
                >
                  <DrillCard
                    recommendation={rec}
                    onClick={() => navigate(`/drill/${rec.drill.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {correctivePlan.recommendations[0] && (
          <Button
            fullWidth
            size="lg"
            onClick={() => navigate(`/drill/${correctivePlan.recommendations[0].drill.id}`)}
          >
            Start First Drill — {correctivePlan.recommendations[0].drill.shortName}
          </Button>
        )}
      </div>
    </PageTransition>
  )
}
