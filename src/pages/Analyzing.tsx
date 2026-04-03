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

/** Minimal recommendation engine — Person 2 replaces with their full engine */
function generatePlan(analysis: AnalysisResult): CorrectivePlan {
  const seen = new Set<string>()
  const recommendations: DrillRecommendation[] = []
  let priority = 1

  for (const issue of analysis.issues) {
    const meta = DRILLS.filter((d) => d.targetIssues.includes(issue.id))
    for (const drill of meta) {
      if (!seen.has(drill.id)) {
        seen.add(drill.id)
        recommendations.push({
          drill,
          issueIds: [issue.id],
          priority: priority++,
          reason: `Addresses your detected pattern: ${issue.id.replace(/_/g, ' ')}`,
        })
      }
    }
  }

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
              className="text-text-2 text-sm h-5"
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
