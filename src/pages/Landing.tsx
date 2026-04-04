/**
 * Landing page — redesigned with Down Dog / wellness-app aesthetic.
 * Warm white + beige palette, DM Serif Display hero headline,
 * organic blob shapes, breathing animations, sage green CTAs.
 */

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, ShieldCheck, ArrowRight, Activity, Leaf, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SafetyDisclaimer } from '@/components/layout/SafetyDisclaimer'
import { PageTransition } from '@/components/layout/PageTransition'
import { useUiStore } from '@/store'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { useAnalytics } from '@/hooks/useAnalytics'

// ── Animation variants ──────────────────────────────────────────────────────
const stagger = {
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.8 } },
}

// ── Feature list ────────────────────────────────────────────────────────────
const features = [
  {
    emoji: '📷',
    title: 'Camera-Based Scan',
    description: 'No wearables. Your webcam tracks 33 body landmarks in real time.',
  },
  {
    emoji: '🧠',
    title: 'Movement Intelligence',
    description: 'Detects postural asymmetry and compensation patterns from how you move.',
  },
  {
    emoji: '🎯',
    title: 'Live Corrective Coaching',
    description: 'Visual overlays, correction arrows, and instant cues during every drill.',
  },
]

// ── How it works ────────────────────────────────────────────────────────────
const steps = [
  { n: '01', label: 'Scan',   sub: 'Guided movement assessment' },
  { n: '02', label: 'Analyze', sub: 'Detect postural patterns'   },
  { n: '03', label: 'Plan',   sub: 'Personalized drill prescription' },
  { n: '04', label: 'Coach',  sub: 'Live form feedback'          },
]

export default function Landing() {
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const { hasAcceptedDisclaimer, acceptDisclaimer } = useUiStore()

  function handleStart() {
    if (!hasAcceptedDisclaimer) acceptDisclaimer()
    track('assessment_started')
    navigate(ROUTES.SETUP)
  }

  return (
    <PageTransition className="min-h-screen flex flex-col bg-bg overflow-x-hidden">

      {/* ── Organic background blobs ───────────────────────────────────── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        {/* Large warm cream blob — top left */}
        <motion.div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-bg-elevated/70 blob-shape"
          animate={{ scale: [1, 1.04, 1], rotate: [0, 3, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Sage green glow blob — top right */}
        <motion.div
          className="absolute -top-16 -right-24 w-[440px] h-[440px] rounded-full bg-brand/8 blur-[80px]"
          animate={{ scale: [1, 1.08, 1], x: [0, 10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Warm amber glow — bottom */}
        <motion.div
          className="absolute bottom-[-5%] left-[25%] w-[500px] h-[300px] rounded-full bg-warning/5 blur-[100px]"
          animate={{ scale: [1, 1.05, 1], y: [0, -12, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(107,158,119,0.6) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-white/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center shadow-glow-brand">
            <Activity size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-text-1 tracking-tight text-base">{APP_NAME}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-breathe" />
          <span className="text-xs text-text-3 font-medium">No device needed · Privacy first</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleStart}>
          Try it now →
        </Button>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-12 max-w-4xl mx-auto w-full text-center">
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          {/* Eyebrow badge */}
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5 text-brand text-xs font-semibold tracking-wide">
              <Leaf size={11} strokeWidth={2.5} />
              McGill CBC Hackathon · Biology &amp; Physical Health
            </span>
          </motion.div>

          {/* Headline — DM Serif Display for that premium editorial feel */}
          <motion.div variants={fadeUp} className="space-y-5">
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-serif text-text-1 leading-[1.05] tracking-tight"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Move better.
              <br />
              <span className="text-brand italic">Feel stronger.</span>
            </h1>
            <p className="text-lg sm:text-xl text-text-2 leading-relaxed max-w-xl mx-auto font-light">
              Real-time computer vision detects how your body actually moves — and coaches you back into alignment.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                size="xl"
                onClick={handleStart}
                rightIcon={<ArrowRight size={20} />}
                className="min-w-[260px] shadow-surface text-base font-semibold"
              >
                Start Your Free Assessment
              </Button>
            </motion.div>
            <p className="text-text-3 text-xs flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-success" />
              All analysis stays on your device · No video stored · Free
            </p>
          </motion.div>

          {/* Social proof strip */}
          <motion.div variants={fadeIn} className="flex items-center justify-center gap-6 pt-2">
            {[
              { icon: Camera, label: '33 body landmarks' },
              { icon: Sparkles, label: 'Real-time coaching' },
              { icon: Leaf, label: 'Evidence-based drills' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-text-3 text-xs">
                <Icon size={12} className="text-brand" />
                {label}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* ── Feature cards ─────────────────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-4xl mx-auto w-full">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {features.map(({ emoji, title, description }, i) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="group bg-bg-surface border border-border rounded-2xl p-6 shadow-card hover:shadow-surface transition-all duration-300 hover:-translate-y-1"
            >
              {/* Emoji icon container */}
              <div className="w-11 h-11 rounded-xl bg-bg-elevated flex items-center justify-center text-xl mb-4 group-hover:bg-brand/10 transition-colors duration-300">
                {emoji}
              </div>
              <h3 className="text-text-1 font-semibold text-sm mb-2">{title}</h3>
              <p className="text-text-2 text-sm leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-center text-text-3 text-xs font-semibold uppercase tracking-widest mb-10">
            How it works
          </h2>
          <div className="relative flex items-start gap-0">
            {/* Connecting line */}
            <div className="absolute top-5 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            {steps.map(({ n, label, sub }) => (
              <div key={n} className="flex-1 flex flex-col items-center gap-3 text-center px-2 relative">
                <div className="w-10 h-10 rounded-full bg-bg-surface border-2 border-brand/40 flex items-center justify-center z-10 shadow-card">
                  <span className="text-brand text-xs font-bold font-mono">{n}</span>
                </div>
                <div>
                  <p className="text-text-1 text-xs font-semibold">{label}</p>
                  <p className="text-text-3 text-[10px] mt-0.5 leading-snug">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Bottom CTA band ────────────────────────────────────────────────── */}
      <section className="mx-6 mb-12 max-w-2xl lg:mx-auto w-auto rounded-2xl bg-gradient-to-br from-brand/12 to-brand/5 border border-brand/15 p-8 text-center">
        <p
          className="text-2xl font-serif text-text-1 mb-3"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Your body is giving you signals.
        </p>
        <p className="text-text-2 text-sm mb-6">It takes 3 minutes to understand them.</p>
        <Button size="lg" onClick={handleStart} rightIcon={<ArrowRight size={18} />}>
          Begin Free Scan
        </Button>
      </section>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <div className="px-6 pb-10 max-w-2xl mx-auto w-full">
        <SafetyDisclaimer variant="inline" collapsible />
      </div>
    </PageTransition>
  )
}
