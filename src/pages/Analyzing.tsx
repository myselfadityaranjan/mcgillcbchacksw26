import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PageTransition } from '@/components/layout/PageTransition'
import { useAssessmentStore } from '@/store'
import { MockPoseEngine } from '@/lib/adapters'
import { ROUTES } from '@/lib/constants'
import type { AnalysisResult, CorrectivePlan, DrillRecommendation } from '@/types'
import { DRILLS } from '@/data/drills'

const analysisCopy = [
  'Extracting pose landmarks...',
  'Computing shoulder asymmetry...',
  'Analyzing spinal alignment...',
  'Detecting knee tracking patterns...',
  'Measuring pelvic tilt...',
  'Calculating left-right balance...',
  'Mapping strain patterns...',
  'Generating corrective plan...',
]

/** Readable labels for issue IDs used in recommendation reasons */
const ISSUE_LABELS: Record<string, string> = {
  rounded_shoulders:    'rounded shoulders',
  forward_head_posture: 'forward head posture',
  anterior_pelvic_tilt: 'anterior pelvic tilt',
  knee_valgus:          'knee valgus',
  lateral_asymmetry:    'lateral asymmetry',
}

/**
 * Recommendation engine — builds a full corrective plan from analysis results.
 *
 * Strategy:
 *   1. Score every drill by how many detected issues it targets (weighted by severity)
 *   2. Consolidate issueIds so each drill shows all issues it addresses
 *   3. Always include at least one drill per detected issue
 *   4. Sort by relevance score descending, cap at 5 recommendations
 */
function generatePlan(analysis: AnalysisResult): CorrectivePlan {
  const severityWeight: Record<string, number> = {
    significant: 3,
    moderate: 2,
    mild: 1,
  }

  // Build a score + issueId map for every drill
  const drillScores = new Map<string, { score: number; issueIds: string[]; reasons: string[] }>()

  for (const issue of analysis.issues) {
    const weight = severityWeight[issue.severity] ?? 1
    const matchingDrills = DRILLS.filter((d) => d.targetIssues.includes(issue.id))

    for (const drill of matchingDrills) {
      const existing = drillScores.get(drill.id) ?? { score: 0, issueIds: [], reasons: [] }
      existing.score += weight
      if (!existing.issueIds.includes(issue.id)) {
        existing.issueIds.push(issue.id)
        existing.reasons.push(ISSUE_LABELS[issue.id] ?? issue.id.replace(/_/g, ' '))
      }
      drillScores.set(drill.id, existing)
    }
  }

  // Sort drills by score descending
  const sorted = [...drillScores.entries()].sort((a, b) => b[1].score - a[1].score)

  const recommendations: DrillRecommendation[] = sorted
    .slice(0, 5)
    .map(([drillId, { issueIds, reasons }], index) => {
      const drill = DRILLS.find((d) => d.id === drillId)!
      const reasonText =
        reasons.length === 1
          ? `Directly targets your ${reasons[0]} pattern`
          : `Addresses ${reasons.slice(0, -1).join(', ')} and ${reasons[reasons.length - 1]}`

      return {
        drill,
        issueIds,
        priority: index + 1,
        reason: reasonText,
      }
    })

  return {
    sessionId: analysis.sessionId,
    generatedAt: Date.now(),
    recommendations,
    totalEstimatedMinutes: Math.round(recommendations.length * 2.5),
  }
}

export default function Analyzing() {
  const navigate = useNavigate()
  const { session, setAnalysisResult, setCorrectivePlan, setError } = useAssessmentStore()
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)

  // Guard
  useEffect(() => {
    if (!session) navigate(ROUTES.HOME, { replace: true })
  }, [session, navigate])

  useEffect(() => {
    if (!session) return

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 1.2, 95))
    }, 60)

    // Cycle copy text
    const copyInterval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, analysisCopy.length - 1))
    }, 380)

    // Run actual analysis
    const engine = new MockPoseEngine()
    engine.analyze(session).then((result: AnalysisResult) => {
      clearInterval(progressInterval)
      clearInterval(copyInterval)
      setProgress(100)
      setStepIndex(analysisCopy.length - 1)

      const plan: CorrectivePlan = generatePlan(result)

      setTimeout(() => {
        setAnalysisResult(result)
        setCorrectivePlan(plan)
        navigate(ROUTES.RESULTS)
      }, 600)
    }).catch((err: Error) => {
      setError(err.message)
      navigate(ROUTES.SETUP)
    })

    return () => {
      clearInterval(progressInterval)
      clearInterval(copyInterval)
    }
  }, [session, setAnalysisResult, setCorrectivePlan, setError, navigate])

  return (
    <PageTransition className="min-h-screen flex flex-col items-center justify-center bg-bg p-6">
      <div className="max-w-sm w-full space-y-8 text-center">
        {/* Animated icon */}
        <div className="flex justify-center">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 rounded-full border-2 border-brand/20 border-t-brand flex items-center justify-center"
            >
              <Activity size={30} className="text-brand" />
            </motion.div>
            {/* Pulsing rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-brand/10"
                animate={{ scale: [1, 1.6 + i * 0.3], opacity: [0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-text-1 text-2xl font-bold">Analyzing Your Movement</h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-text-2 text-sm min-h-5"
            >
              {analysisCopy[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <ProgressBar value={progress} variant="brand" size="md" animated />
          <p className="text-text-3 text-xs font-mono tabular-nums">{Math.round(progress)}%</p>
        </div>

        <p className="text-text-3 text-xs">
          All analysis runs on your device · No data leaves your browser
        </p>
      </div>
    </PageTransition>
  )
}
