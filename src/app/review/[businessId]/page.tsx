'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Star, ExternalLink } from 'lucide-react'

type Business = {
  id: string
  name: string
  slug?: string | null
  logo_url: string | null
  google_place_id: string | null
  industry: string | null
}

type SurveyAnswers = {
  serviceType: string
  serviceRating: number
  qualityRating: number
  speedRating: number
  jobDescription: string
  highlights: string[]
  customerName: string
  additionalComments: string
}

type GenerateResult = {
  reviewText: string
  rating: number
  isPrivate: boolean
  submissionId: string
}

const STEP_COUNT = 4

const SERVICE_OPTIONS = [
  'Air Conditioning',
  'Plumbing',
  'Electrical',
  'Carpentry / Joinery',
  'Painting',
  'Tiling',
  'Roofing',
  'General Maintenance',
  'Other',
]

const HIGHLIGHT_OPTIONS = [
  'Arrived on time',
  'Left the area clean',
  'Explained the problem clearly',
  'Fixed it quickly',
  'Good value for money',
  'Friendly & professional',
  'Great quality finish',
  'Easy to communicate with',
  'Sorted it in one visit',
  'Kept us updated throughout',
]

// ─── Star rating input ────────────────────────────────────────────────────────
const STAR_LABELS = ['', 'Poor', 'Needs work', 'Okay', 'Good', 'Excellent']
const STAR_COLOURS = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']

function StarRatingInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <motion.span
          key={active}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium"
          style={{ color: active ? STAR_COLOURS[active] : 'transparent' }}
        >
          {active ? STAR_LABELS[active] : 'Tap to rate'}
        </motion.span>
      </div>
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onTouchStart={() => setHovered(s)}
            onTouchEnd={() => { onChange(s); setHovered(0) }}
            onClick={() => onChange(s)}
            className="focus:outline-none"
          >
            <motion.div
              animate={{ scale: active >= s ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            >
              <Star
                className={`w-10 h-10 transition-colors duration-100 ${
                  active >= s ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'
                }`}
              />
            </motion.div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReviewSurveyPage() {
  const params = useParams()
  const businessId = params.businessId as string
  const supabase = useMemo(() => createClient(), [])

  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [answers, setAnswers] = useState<SurveyAnswers>({
    serviceType: '',
    serviceRating: 0,
    qualityRating: 0,
    speedRating: 0,
    jobDescription: '',
    highlights: [],
    customerName: '',
    additionalComments: '',
  })
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId)
        let bizData: Business | null = null

        if (isUUID) {
          const { data, error: e } = await supabase
            .from('businesses')
            .select('id, name, slug, logo_url, google_place_id, industry')
            .eq('id', businessId)
            .single()
          if (e || !data) throw new Error('Business not found')
          bizData = data
        } else {
          const { data, error: e } = await supabase
            .from('businesses')
            .select('id, name, slug, logo_url, google_place_id, industry')
            .eq('slug', businessId)
            .single()
          if (e || !data) throw new Error('Business not found')
          bizData = data
        }

        setBusiness(bizData)
        fetch('/api/qr/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: bizData.id }),
        }).catch(() => {})
      } catch {
        setError('Unable to load this page')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [supabase, businessId])

  const toggleHighlight = (h: string) => {
    setAnswers(a => ({
      ...a,
      highlights: a.highlights.includes(h)
        ? a.highlights.filter(x => x !== h)
        : [...a.highlights, h],
    }))
  }

  const canAdvance = () => {
    if (step === 1) return answers.serviceType !== ''
    if (step === 2) return answers.serviceRating > 0 && answers.qualityRating > 0 && answers.speedRating > 0
    if (step === 3) return answers.jobDescription.trim().length >= 5
    return true
  }

  const navigate = (next: number) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  const handleNext = async () => {
    if (step < STEP_COUNT) { navigate(step + 1); return }

    if (!business) return
    setGenerating(true)

    try {
      const res = await fetch('/api/survey/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          serviceType: answers.serviceType,
          serviceRating: answers.serviceRating,
          qualityRating: answers.qualityRating,
          speedRating: answers.speedRating,
          jobDescription: answers.jobDescription,
          highlights: answers.highlights,
          customerName: answers.customerName,
          additionalComments: answers.additionalComments,
        }),
      })

      if (!res.ok) throw new Error('Generation failed')
      const data: GenerateResult = await res.json()
      setResult(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleGoogleRedirect = async () => {
    if (!result || !business?.google_place_id) return
    await fetch('/api/survey/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: result.submissionId, googleClicked: true }),
    }).catch(() => {})
    setSubmitted(true)
    try { await navigator.clipboard.writeText(result.reviewText) } catch {}
    window.open(`https://search.google.com/local/writereview?placeid=${business.google_place_id}`, '_blank')
  }

  const handlePrivateSubmit = async () => {
    if (!result) return
    await fetch('/api/survey/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: result.submissionId, googleClicked: false }),
    }).catch(() => {})
    setSubmitted(true)
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="w-10 h-10 rounded-full bg-black"
        />
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">😕</p>
          <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
          <p className="text-gray-500">{error || 'This link may be invalid.'}</p>
        </div>
      </div>
    )
  }

  // ── Thank-you ─────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="text-5xl mb-4">{result?.isPrivate ? '🙏' : '⭐'}</div>
          <h1 className="text-2xl font-semibold mb-2">
            {result?.isPrivate ? 'Thank you for your feedback' : 'Thanks for your review!'}
          </h1>
          <p className="text-gray-500 text-sm">
            {result?.isPrivate
              ? `${business.name} will be in touch to make things right.`
              : `Your review helps ${business.name} grow.`}
          </p>
        </motion.div>
      </div>
    )
  }

  // ── Result ────────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center">
            {business.logo_url && (
              <img src={business.logo_url} alt={business.name} className="w-12 h-12 rounded-xl mx-auto mb-3 object-cover" />
            )}
            <p className="text-sm text-gray-500 uppercase tracking-widest">{business.name}</p>
          </div>

          {result.isPrivate ? (
            <div className="bg-gray-50 rounded-2xl p-6 text-center space-y-4">
              <p className="text-4xl">🙏</p>
              <p className="font-medium text-gray-900">We appreciate your honesty</p>
              <p className="text-sm text-gray-500">
                Your feedback has been sent privately to {business.name}. They&apos;ll reach out to make things right.
              </p>
              <button onClick={handlePrivateSubmit} className="w-full py-3 bg-black text-white rounded-xl text-sm font-medium">
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`w-6 h-6 ${i < result.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>

              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Your review — feel free to edit</p>
                <p className="text-gray-900 leading-relaxed text-sm">{result.reviewText}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGoogleRedirect}
                  className="w-full py-3 bg-black text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                >
                  Post to Google
                  <ExternalLink className="w-4 h-4" />
                </button>
                <p className="text-xs text-center text-gray-400">
                  Your review will be copied to clipboard — paste it into the Google form.
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    )
  }

  // ── Survey steps ──────────────────────────────────────────────────────────────
  const stepLabels = ['Service', 'Ratings', 'Details', 'Finish']

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          {business.logo_url && (
            <img src={business.logo_url} alt={business.name} className="w-12 h-12 rounded-xl mx-auto mb-3 object-cover" />
          )}
          <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">{business.name}</p>
          <h1 className="text-xl font-semibold text-gray-900">How did we do?</h1>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.div
                animate={{
                  width: i + 1 === step ? 24 : 8,
                  backgroundColor: i + 1 < step ? '#000' : i + 1 === step ? '#000' : '#e5e7eb',
                }}
                className="h-1.5 rounded-full"
                transition={{ duration: 0.3 }}
              />
              <span className={`text-[10px] transition-colors ${i + 1 === step ? 'text-black' : 'text-gray-300'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 32 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -32 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Step 1 — Service type */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="font-medium text-gray-900">What service did we help you with?</p>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers(a => ({ ...a, serviceType: opt }))}
                      className={`px-4 py-3 rounded-xl text-sm text-left border transition-all ${
                        answers.serviceType === opt
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Star ratings */}
            {step === 2 && (
              <div className="space-y-8">
                <StarRatingInput
                  label="Overall service"
                  value={answers.serviceRating}
                  onChange={(v) => setAnswers(a => ({ ...a, serviceRating: v }))}
                />
                <StarRatingInput
                  label="Quality of work"
                  value={answers.qualityRating}
                  onChange={(v) => setAnswers(a => ({ ...a, qualityRating: v }))}
                />
                <StarRatingInput
                  label="Response speed"
                  value={answers.speedRating}
                  onChange={(v) => setAnswers(a => ({ ...a, speedRating: v }))}
                />
              </div>
            )}

            {/* Step 3 — Job details */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <p className="font-medium text-gray-900">What did we do for you?</p>
                  <p className="text-sm text-gray-400">A couple of words about the actual job — this makes your review specific and genuine.</p>
                  <input
                    type="text"
                    value={answers.jobDescription}
                    onChange={e => setAnswers(a => ({ ...a, jobDescription: e.target.value.slice(0, 120) }))}
                    placeholder="e.g. Fixed a burst pipe under the kitchen sink"
                    autoFocus
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <p className="text-xs text-gray-300 text-right">{answers.jobDescription.length}/120</p>
                </div>

                <div className="space-y-3">
                  <p className="font-medium text-gray-900">What stood out?</p>
                  <p className="text-sm text-gray-400">Select any that apply.</p>
                  <div className="flex flex-wrap gap-2">
                    {HIGHLIGHT_OPTIONS.map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => toggleHighlight(h)}
                        className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                          answers.highlights.includes(h)
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Finish */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">Your first name <span className="text-gray-400 font-normal text-sm">optional</span></p>
                  <input
                    type="text"
                    value={answers.customerName}
                    onChange={e => setAnswers(a => ({ ...a, customerName: e.target.value.slice(0, 40) }))}
                    placeholder="e.g. Sarah"
                    autoFocus
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-gray-900">Anything else to add? <span className="text-gray-400 font-normal text-sm">optional</span></p>
                  <textarea
                    value={answers.additionalComments}
                    onChange={e => setAnswers(a => ({ ...a, additionalComments: e.target.value.slice(0, 200) }))}
                    placeholder="Your own words will make the review feel more personal"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <p className="text-xs text-gray-300 text-right">{answers.additionalComments.length}/200</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          {step > 1 ? (
            <button
              onClick={() => navigate(step - 1)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={!canAdvance() || generating}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : step === STEP_COUNT ? (
              'Generate my review'
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        {/* Step hint for step 3 */}
        {step === 3 && answers.jobDescription.trim().length < 5 && (
          <p className="text-xs text-center text-gray-400 mt-4">Add a brief job description to continue</p>
        )}
      </div>
    </div>
  )
}
