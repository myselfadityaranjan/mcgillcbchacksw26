import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, RotateCcw, ChevronRight, TrendingUp, Zap, Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressBar'
import { MetricPill } from '@/components/ui/MetricPill'
import { PageTransition } from '@/components/layout/PageTransition'
import { useCoachingStore, useAssessmentStore } from '@/store'
import { ROUTES } from '@/lib/constants'

const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
}
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

export default function SessionComplete() {
  const navigate = useNavigate()
  const { stats } = useCoachingStore()
  const { correctivePlan } = useAssessmentStore()

  // If no stats (accessed directly), use dummy values
  const displayStats = stats ?? {
    averageScore: 78,
    peakScore: 94,
    totalReps: 8,
    correctionsMade: 4,
    unsafeEvents: 0,
    greenFrames: 400,
    totalFrames: 600,
  }

  const qualityPct = Math.round((displayStats.greenFrames / Math.max(displayStats.totalFrames, 1)) * 100)

  // Next drill suggestion
  const currentDrillId = stats?.drillId
  const nextDrill = correctivePlan?.recommendations.find(
    (r) => r.drill.id !== currentDrillId
  )

  return (
    <PageTransition className="min-h-screen bg-bg pb-16 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full">
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="space-y-8 text-center"
        >
          {/* Success icon */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-24 h-24 rounded-full bg-success/15 border-2 border-success/40 flex items-center justify-center"
              >
                <CheckCircle2 size={44} className="text-success" />
              </motion.div>
              {/* Radiating rings */}
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-success/20"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.6 + i * 0.4, opacity: 0 }}
                  transition={{ duration: 1.2, delay: 0.3 + i * 0.2, ease: 'easeOut' }}
                />
              ))}
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeUp}>
            <h1 className="text-3xl font-black text-text-1 mb-2">Drill Complete!</h1>
            <p className="text-text-2">
              You made {displayStats.correctionsMade} form correction{displayStats.correctionsMade !== 1 ? 's' : ''} during this session.
            </p>
          </motion.div>

          {/* Quality score */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <ProgressRing value={displayStats.averageScore} size={100} strokeWidth={8} variant={displayStats.averageScore >= 70 ? 'success' : 'warning'}>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black font-mono text-text-1 tabular-nums">
                  {Math.round(displayStats.averageScore)}
                </span>
                <span className="text-[10px] text-text-3">avg score</span>
              </div>
            </ProgressRing>
          </motion.div>

          {/* Stats grid */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
            <MetricPill
              label="Quality"
              value={`${qualityPct}%`}
              variant={qualityPct >= 70 ? 'success' : 'warning'}
            />
            <MetricPill
              label="Peak"
              value={displayStats.peakScore}
              unit="/100"
              variant="default"
            />
            <MetricPill
              label="Reps"
              value={displayStats.totalReps}
              variant="default"
            />
          </motion.div>

          {/* What improved */}
          <motion.div variants={fadeUp} className="bg-bg-surface border border-border rounded-xl p-4 text-left space-y-2">
            <h3 className="text-text-1 font-semibold text-sm flex items-center gap-2">
              <TrendingUp size={14} className="text-success" />
              What this session trained
            </h3>
            <div className="space-y-1.5">
              {[
                { icon: Zap, text: 'Proprioceptive awareness of knee alignment' },
                { icon: Target, text: 'Hip-knee-foot stacking mechanics' },
                { icon: TrendingUp, text: 'Self-correction from coaching cues' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2 text-sm text-text-2">
                  <Icon size={13} className="text-brand shrink-0 mt-0.5" />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Next drill */}
          {nextDrill && (
            <motion.div variants={fadeUp} className="bg-brand/8 border border-brand/20 rounded-xl p-4">
              <p className="text-brand text-xs font-semibold mb-2">Suggested next drill</p>
              <div className="flex items-center justify-between">
                <span className="text-text-1 font-semibold text-sm">{nextDrill.drill.name}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ChevronRight size={13} />}
                  onClick={() => navigate(`/drill/${nextDrill.drill.id}`)}
                >
                  Start
                </Button>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              leftIcon={<RotateCcw size={14} />}
              onClick={() => navigate(ROUTES.RESULTS)}
            >
              Back to Plan
            </Button>
            <Button
              onClick={() => navigate(ROUTES.HOME)}
              rightIcon={<ChevronRight size={14} />}
            >
              Done
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  )
}
