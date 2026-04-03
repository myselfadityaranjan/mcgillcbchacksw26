import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Camera, Zap, ShieldCheck, ArrowRight,
  Activity, Eye, Target
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SafetyDisclaimer } from '@/components/layout/SafetyDisclaimer'
import { PageTransition } from '@/components/layout/PageTransition'
import { useUiStore } from '@/store'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { useAnalytics } from '@/hooks/useAnalytics'

const features = [
  {
    icon: Camera,
    title: 'Real-Time Body Scan',
    description:
      'Your webcam tracks 33 body landmarks in real time — no wearables, no equipment.',
  },
  {
    icon: Eye,
    title: 'Movement Intelligence',
    description:
      'Detects postural asymmetry, instability, and compensation patterns from how you actually move.',
  },
  {
    icon: Target,
    title: 'Live Corrective Coaching',
    description:
      'Visual overlays, correction arrows, and instant feedback while you perform corrective drills.',
  },
]

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function Landing() {
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const { hasAcceptedDisclaimer, acceptDisclaimer } = useUiStore()

  function handleStart() {
    if (!hasAcceptedDisclaimer) {
      acceptDisclaimer()
    }
    track('assessment_started')
    navigate(ROUTES.SETUP)
  }

  return (
    <PageTransition className="min-h-screen flex flex-col">
      {/* Background grid */}
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(79,142,247,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(79,142,247,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-brand/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-success/4 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
            <Activity size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-text-1 tracking-tight">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-text-3">Camera-based · No device needed</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-3xl mx-auto w-full text-center">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/20 rounded-full px-3 py-1 text-brand text-xs font-medium">
              <Zap size={11} strokeWidth={2.5} />
              McGill CBC Hackathon · Biology &amp; Physical Health
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={fadeUp} className="space-y-4">
            <h1 className="text-5xl font-black text-text-1 leading-[1.08] tracking-tight">
              See where your body{' '}
              <span className="text-brand">is unstable.</span>
            </h1>
            <p className="text-xl text-text-2 leading-relaxed max-w-xl mx-auto">
              Fix it before strain becomes injury — with real-time computer vision coaching
              personalized to how you actually move.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
            <Button
              size="xl"
              onClick={handleStart}
              rightIcon={<ArrowRight size={20} />}
              className="min-w-[240px]"
            >
              Start Your Assessment
            </Button>
            <p className="text-text-3 text-xs">
              <ShieldCheck size={11} className="inline mr-1" />
              All analysis happens on your device · No video stored
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Feature cards */}
      <section className="px-6 pb-12 max-w-4xl mx-auto w-full">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="bg-bg-surface border border-border rounded-xl p-5 space-y-3"
            >
              <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/15 flex items-center justify-center">
                <Icon size={17} className="text-brand" />
              </div>
              <h3 className="text-text-1 font-semibold text-sm">{title}</h3>
              <p className="text-text-2 text-xs leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Flow steps */}
      <section className="px-6 pb-12 max-w-3xl mx-auto w-full">
        <h2 className="text-center text-text-3 text-xs font-semibold uppercase tracking-widest mb-6">
          How it works
        </h2>
        <div className="flex items-start gap-0 relative">
          <div className="absolute top-4 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-px bg-border" />
          {[
            { step: '1', label: 'Scan', sub: 'Guided movement assessment' },
            { step: '2', label: 'Analyze', sub: 'Detect postural issues' },
            { step: '3', label: 'Plan', sub: 'Personalized drill prescription' },
            { step: '4', label: 'Coach', sub: 'Live form feedback' },
          ].map(({ step, label, sub }) => (
            <div key={step} className="flex-1 flex flex-col items-center gap-2 text-center relative">
              <div className="w-8 h-8 rounded-full bg-bg-elevated border-2 border-brand flex items-center justify-center z-10">
                <span className="text-brand text-xs font-bold font-mono">{step}</span>
              </div>
              <span className="text-text-1 text-xs font-semibold">{label}</span>
              <span className="text-text-3 text-[10px]">{sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="px-6 pb-8 max-w-2xl mx-auto w-full">
        <SafetyDisclaimer variant="inline" collapsible />
      </div>
    </PageTransition>
  )
}
