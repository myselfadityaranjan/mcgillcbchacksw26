import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Clock, Dumbbell, CheckCircle2,
  AlertTriangle, ChevronRight, RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { SafetyDisclaimer } from '@/components/layout/SafetyDisclaimer'
import { PageTransition } from '@/components/layout/PageTransition'
import { getDrillById } from '@/data/drills'
import { BODY_REGION_LABELS } from '@/lib/constants'

const difficultyConfig = {
  beginner: { variant: 'success' as const, label: 'Beginner' },
  intermediate: { variant: 'warning' as const, label: 'Intermediate' },
  advanced: { variant: 'danger' as const, label: 'Advanced' },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function DrillDetail() {
  const { drillId } = useParams<{ drillId: string }>()
  const navigate = useNavigate()
  const drill = drillId ? getDrillById(drillId) : null

  if (!drill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-text-2 p-8 text-center">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-text-1">Drill not found</p>
          <Button onClick={() => navigate(-1)} variant="secondary">Go back</Button>
        </div>
      </div>
    )
  }

  const diff = difficultyConfig[drill.difficulty]

  return (
    <PageTransition className="min-h-screen bg-bg pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </Button>
        <span className="text-text-2 text-sm font-medium flex-1">Drill Detail</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">

          {/* Hero */}
          <motion.div variants={fadeUp} className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                <Dumbbell size={22} className="text-brand" />
              </div>
              <div className="flex-1">
                <h1 className="text-text-1 text-2xl font-black">{drill.name}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant={diff.variant}>{diff.label}</Badge>
                  <Badge variant="default">
                    <Clock size={10} />
                    {drill.reps ? `${drill.reps} reps${drill.sets ? ` × ${drill.sets} sets` : ''}` : `${drill.durationSeconds}s hold`}
                  </Badge>
                  <Badge variant="info">{BODY_REGION_LABELS[drill.primaryRegion]}</Badge>
                </div>
              </div>
            </div>
            <p className="text-text-2 text-sm leading-relaxed">{drill.description}</p>
          </motion.div>

          {/* Setup instructions */}
          <motion.div variants={fadeUp}>
            <Card variant="elevated" padding="lg">
              <h2 className="text-text-1 font-semibold text-sm mb-3">How to Set Up</h2>
              <ol className="space-y-2">
                {drill.setupInstructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-text-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-brand/15 border border-brand/25 flex items-center justify-center text-brand text-xs font-mono font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Card>
          </motion.div>

          {/* Key cues */}
          <motion.div variants={fadeUp}>
            <h2 className="text-text-1 font-semibold text-sm mb-3">Key Movement Cues</h2>
            <div className="space-y-2">
              {drill.cues.map((cue) => (
                <div
                  key={cue.id}
                  className="flex items-start gap-3 bg-bg-surface border border-border rounded-lg p-3"
                >
                  <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                  <span className="text-text-2 text-sm">{cue.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Safety */}
          {drill.unsafeConditions.length > 0 && (
            <motion.div variants={fadeUp}>
              <div className="bg-danger/5 border border-danger/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-danger" />
                  <span className="text-danger text-xs font-semibold uppercase tracking-wide">
                    Stop if you experience
                  </span>
                </div>
                {drill.unsafeConditions.map((cond) => (
                  <div key={cond} className="flex items-start gap-2 text-xs text-danger/80">
                    <span className="shrink-0 w-1 h-1 rounded-full bg-danger/60 mt-1.5" />
                    {cond}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div variants={fadeUp}>
            <SafetyDisclaimer variant="banner" />
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} className="space-y-3 pt-2">
            <Button
              fullWidth
              size="xl"
              onClick={() => navigate(`/coach/${drill.id}`)}
              rightIcon={<ChevronRight size={20} />}
            >
              Start Live Coaching
            </Button>
            <Button
              fullWidth
              variant="ghost"
              size="md"
              onClick={() => navigate(-1)}
              leftIcon={<RotateCcw size={14} />}
            >
              Back to Results
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  )
}
