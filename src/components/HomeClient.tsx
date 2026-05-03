'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import { ArrowRight, Star, CheckCircle2, ChevronRight } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// ─── Screen transition variants ───────────────────────────────────────────────
const screenVariants = {
  enter: { opacity: 0, y: 16, scale: 0.97 },
  center: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.97 },
}
const screenTransition: Transition = { duration: 0.4, ease: [0.32, 0.72, 0, 1] as any }

// ─── QR Screen ────────────────────────────────────────────────────────────────
function QRScreen() {
  return (
    <motion.div
      variants={screenVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={screenTransition}
      className="h-full flex flex-col items-center justify-center px-6 gap-5"
    >
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-[10px] uppercase tracking-widest text-gray-400"
      >
        Scan to leave a review
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
        className="relative"
      >
        <svg width="148" height="148" viewBox="0 0 148 148" fill="none">
          <rect x="8" y="8" width="40" height="40" rx="5" fill="black" />
          <rect x="13" y="13" width="30" height="30" rx="3" fill="white" />
          <rect x="18" y="18" width="20" height="20" rx="2" fill="black" />

          <rect x="100" y="8" width="40" height="40" rx="5" fill="black" />
          <rect x="105" y="13" width="30" height="30" rx="3" fill="white" />
          <rect x="110" y="18" width="20" height="20" rx="2" fill="black" />

          <rect x="8" y="100" width="40" height="40" rx="5" fill="black" />
          <rect x="13" y="105" width="30" height="30" rx="3" fill="white" />
          <rect x="18" y="110" width="20" height="20" rx="2" fill="black" />

          {[
            [58,8],[66,8],[74,8],[82,8],[90,8],
            [58,16],[74,16],[90,16],
            [66,24],[74,24],[82,24],
            [58,32],[66,32],[82,32],[90,32],
            [58,40],[74,40],[82,40],
            [58,58],[66,58],[82,58],[90,58],[98,58],
            [66,66],[90,66],
            [58,74],[74,74],[82,74],[98,74],
            [66,82],[74,82],[90,82],
            [58,90],[66,90],[82,90],[90,90],
            [100,58],[108,58],[116,58],[124,58],[132,58],
            [100,66],[116,66],[132,66],
            [108,74],[124,74],
            [100,82],[108,82],[124,82],[132,82],
            [108,90],[116,90],[124,90],
            [58,108],[66,108],[82,108],[90,108],[98,108],
            [66,116],[82,116],[98,116],
            [58,124],[74,124],[82,124],
            [66,132],[74,132],[90,132],[98,132],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="6" height="6" fill="black" />
          ))}
        </svg>

        {/* Scan line */}
        <motion.div
          className="absolute left-2 right-2 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.5), transparent)' }}
          initial={{ top: '8%' }}
          animate={{ top: '92%' }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />

        {/* Corner brackets */}
        {[
          'top-0 left-0 border-t-2 border-l-2',
          'top-0 right-0 border-t-2 border-r-2',
          'bottom-0 left-0 border-b-2 border-l-2',
          'bottom-0 right-0 border-b-2 border-r-2',
        ].map((cls, i) => (
          <motion.div
            key={i}
            className={`absolute w-4 h-4 border-black ${cls}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05, type: 'spring', stiffness: 400 }}
          />
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="text-sm font-light text-gray-600"
      >
        Dave's Plumbing
      </motion.p>
    </motion.div>
  )
}

// ─── Survey Screen ─────────────────────────────────────────────────────────────
function SurveyScreen() {
  const questions = [
    { label: 'Service', stars: 5 },
    { label: 'Quality', stars: 5 },
    { label: 'Speed', stars: 4 },
  ]

  return (
    <motion.div
      variants={screenVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={screenTransition}
      className="h-full flex flex-col justify-center px-6 gap-7"
    >
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-[10px] uppercase tracking-widest text-gray-400 text-center"
      >
        How did we do?
      </motion.p>

      <div className="space-y-6">
        {questions.map(({ label, stars }, qi) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + qi * 0.1, ease: 'easeOut' }}
            className="flex items-center justify-between"
          >
            <span className="text-sm font-light text-gray-700">{label}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <motion.div
                  key={s}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.25 + qi * 0.12 + s * 0.055,
                    type: 'spring',
                    stiffness: 500,
                    damping: 18,
                  }}
                >
                  <Star className={`w-5 h-5 ${s <= stars ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'}`} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3 bg-black text-white text-sm font-light rounded-2xl"
      >
        Submit
      </motion.button>
    </motion.div>
  )
}

// ─── Review Screen ─────────────────────────────────────────────────────────────
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    const start = setTimeout(() => {
      let i = 0
      const iv = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) { clearInterval(iv); setDone(true) }
      }, 16)
      return () => clearInterval(iv)
    }, delay)
    return () => clearTimeout(start)
  }, [text, delay])

  return (
    <p className="text-[11px] text-gray-600 leading-relaxed font-light">
      {displayed}
      {!done && <span className="opacity-60">|</span>}
    </p>
  )
}

function ReviewScreen() {
  return (
    <motion.div
      variants={screenVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={screenTransition}
      className="h-full flex flex-col justify-center px-5 gap-5"
    >
      <div className="text-center space-y-1.5">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[10px] uppercase tracking-widest text-gray-400"
        >
          AI wrote this for you
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 20 }}
          className="flex justify-center gap-0.5"
        >
          {[1,2,3,4,5].map((s, i) => (
            <motion.div
              key={s}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 500, damping: 15 }}
            >
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-h-[90px]"
      >
        <TypewriterText
          text="Absolutely brilliant service. Dave showed up on time, sorted the issue fast, and left everything spotless. Highly recommend."
          delay={500}
        />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3 bg-black text-white text-sm font-light rounded-2xl flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
          <path d="M21.35 11.1H12v2.8h5.35C16.8 16.3 14.6 18 12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6c1.55 0 2.96.6 4.02 1.57l2.15-2.15A9.97 9.97 0 0 0 12 4C7.03 4 3 8.03 3 13s4.03 9 9 9c5.25 0 9-3.7 9-9 0-.6-.07-1.17-.18-1.73z"/>
        </svg>
        Post to Google
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="text-[10px] text-gray-400 text-center"
      >
        Opens Google Maps review form
      </motion.p>
    </motion.div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ duration, step }: { duration: number; step: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-[2px] bg-black/5 z-20">
      <motion.div
        key={step}
        className="h-full bg-black/25"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </div>
  )
}

// ─── Phone demo ───────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Scan', duration: 3200 },
  { label: '3 questions', duration: 3800 },
  { label: 'Post to Google', duration: 4500 },
]

function FlowDemo() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setStep(s => (s + 1) % 3), STEPS[step].duration)
    return () => clearTimeout(t)
  }, [step])

  return (
    <div className="flex flex-col items-center select-none">
      {/* Floating phone */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        {/* Glow */}
        <div className="absolute inset-0 rounded-[44px] bg-black/8 blur-2xl scale-95 translate-y-4" />

        {/* Phone shell */}
        <div className="relative w-[260px] h-[530px] bg-white rounded-[44px] border-[2px] border-black/90 shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <ProgressBar duration={STEPS[step].duration} step={step} />

          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-3xl z-10" />

          {/* Screen */}
          <div className="absolute inset-0 pt-7 pb-6">
            <AnimatePresence mode="wait">
              {step === 0 && <QRScreen key="qr" />}
              {step === 1 && <SurveyScreen key="survey" />}
              {step === 2 && <ReviewScreen key="review" />}
            </AnimatePresence>
          </div>

          {/* Home bar */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-black/15 rounded-full" />
        </div>
      </motion.div>

      {/* Step pills */}
      <div className="flex items-center gap-3 mt-8">
        {STEPS.map(({ label }, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <motion.div
              animate={{
                width: step === i ? 28 : 6,
                backgroundColor: step === i ? 'rgb(0,0,0)' : 'rgba(0,0,0,0.15)',
              }}
              className="h-1.5 rounded-full"
              transition={{ duration: 0.3 }}
            />
            <span className={`text-[10px] transition-colors font-light ${step === i ? 'text-black' : 'text-gray-300'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomeClient() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero — split layout */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="max-w-5xl mx-auto relative w-full grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: text */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-[3.75rem] md:text-[5rem] lg:text-[5.5rem] leading-[0.88] font-light tracking-tighter text-black mb-8"
            >
              More Google
              <br />
              reviews.
              <br />
              <span className="italic font-normal">Automatically.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-lg md:text-xl text-gray-500 mb-10 font-light leading-relaxed"
            >
              QR code. 3 questions. AI writes the review. They post it.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white hover:bg-gray-900 transition-all group"
              >
                Start free trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 border border-black text-black hover:bg-gray-50 transition-all"
              >
                See how it works
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-gray-400 mt-5"
            >
              14-day free trial. No credit card required.
            </motion.p>
          </div>

          {/* Right: phone demo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
            className="hidden md:flex justify-center lg:justify-end"
          >
            <FlowDemo />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6 border-t border-black">
        <div className="max-w-5xl mx-auto space-y-0">
          {[
            { num: '01', title: 'Hand them a QR code', body: 'On your card or a leave-behind. They scan it at the job.' },
            { num: '02', title: 'They answer 3 questions', body: 'Service, quality, speed. No typing. Under 30 seconds.' },
            { num: '03', title: 'AI writes it. They post it.', body: 'One tap and it\'s live on Google. Under 4 stars goes to you privately.' },
          ].map((step, i) => (
            <div
              key={step.num}
              className={`group flex gap-10 md:gap-16 py-16 ${i < 2 ? 'border-b border-black/10' : ''}`}
            >
              <div className="text-6xl font-light text-black/20 group-hover:text-black/50 transition-colors w-20 shrink-0 pt-1">
                {step.num}
              </div>
              <div className="pt-2">
                <h3 className="text-3xl md:text-4xl font-light text-black mb-3">{step.title}</h3>
                <p className="text-lg text-gray-400 font-light">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Negative review filtering */}
      <section className="py-32 px-6 border-t border-black">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-5xl font-light text-black mb-6 tracking-tight leading-tight">
              Bad reviews stay
              <br />
              between you.
            </h2>
            <p className="text-xl text-gray-400 font-light">
              1–3 stars goes straight to you, privately.
              <br />
              4–5 stars goes to Google.
            </p>
          </div>
          <div className="space-y-4">
            <div className="border border-black rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-widest">Posts to Google</span>
              </div>
              <p className="text-gray-700 text-sm font-light">Great job, came same day and sorted everything out.</p>
            </div>
            <div className="border border-red-200 bg-red-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-0.5">
                  {[1,2].map(s => <Star key={s} className="w-4 h-4 fill-red-400 text-red-400" />)}
                  {[3,4,5].map(s => <Star key={s} className="w-4 h-4 text-gray-200" />)}
                </div>
                <span className="text-xs text-red-500 uppercase tracking-widest">Sent to you privately</span>
              </div>
              <p className="text-gray-600 text-sm font-light">Took a while and pricing felt high.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-32 px-6 border-t border-black bg-black text-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
          <div>
            <h2 className="text-6xl font-light mb-2 tracking-tight">$29.99</h2>
            <p className="text-xl text-white/50 font-light">per month. Everything included.</p>
          </div>
          <div className="space-y-3">
            {[
              'QR codes for cards and displays',
              'AI-written reviews',
              'Negative review filtering',
              'Live dashboard',
              'Cancel anytime',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/70">
                <CheckCircle2 className="w-4 h-4 text-white/50 shrink-0" />
                <span className="font-light text-sm">{item}</span>
              </div>
            ))}
            <div className="pt-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-gray-100 transition-all group"
              >
                Start free trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 px-6 border-t border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-6xl md:text-8xl font-light mb-12 leading-[0.95] tracking-tight text-black">
            Your next job
            <br />
            <span className="italic">deserves a review.</span>
          </h2>
          <div className="flex items-center gap-6">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white hover:bg-gray-900 transition-all group"
            >
              Start free trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/pricing" className="text-sm text-gray-400 hover:text-black transition-colors flex items-center gap-1">
              See pricing <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-5">No credit card required.</p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
