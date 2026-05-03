'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { ArrowRight, ArrowLeft, Search, CheckCircle2, Star, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BusinessSetupFormProps {
  user: User
  planTier: 'free' | 'pro' | 'enterprise'
}

const TRADE_TYPES = [
  'Plumbing',
  'Electrical',
  'HVAC & Air Con',
  'Building & Construction',
  'Painting',
  'Landscaping',
  'Cleaning',
  'Healthcare',
  'Automotive',
  'Hospitality',
  'Retail',
  'Other',
]

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

type PlaceResult = {
  placeId: string
  displayName: string
  formattedAddress: string
  rating: number | null
  userRatingCount: number | null
}

export default function BusinessSetupForm({ user, planTier }: BusinessSetupFormProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 fields
  const [businessName, setBusinessName] = useState('')
  const [trade, setTrade] = useState('')
  const [location, setLocation] = useState('')

  // Step 2 fields
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [placeResult, setPlaceResult] = useState<PlaceResult | null>(null)
  const [placeSearching, setPlaceSearching] = useState(false)
  const [placeError, setPlaceError] = useState('')
  const [placeConfirmed, setPlaceConfirmed] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const slug = useMemo(() => toSlug(businessName), [businessName])

  // Auto-search Google Business when step 2 loads
  useEffect(() => {
    if (step !== 2 || placeResult || placeSearching) return
    if (!businessName.trim() || !location.trim()) return
    searchGoogleBusiness()
  }, [step])

  const searchGoogleBusiness = async () => {
    setPlaceSearching(true)
    setPlaceError('')
    setPlaceResult(null)
    setPlaceConfirmed(false)

    try {
      const res = await fetch('/api/google-reviews/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: businessName.trim(), location: location.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPlaceError(data.error || 'No listing found. You can skip this step.')
      } else {
        setPlaceResult(data)
      }
    } catch {
      setPlaceError('Could not reach Google. You can skip this step.')
    } finally {
      setPlaceSearching(false)
    }
  }

  const handleSubmit = async () => {
    if (!businessName.trim()) return
    setLoading(true)
    setError('')

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
        }, { onConflict: 'id', ignoreDuplicates: true })

      if (profileError && profileError.code !== '23505') {
        throw new Error(`Profile error: ${profileError.message}`)
      }

      const baseSlug = slug || `business-${Date.now()}`
      const trialEndsAt = planTier === 'pro' || planTier === 'free'
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : null

      const normaliseWebsite = (url: string) => {
        if (!url) return null
        return url.startsWith('http') ? url : `https://${url}`
      }

      const businessPayload = {
        user_id: user.id,
        name: businessName.trim(),
        slug: baseSlug,
        industry: trade || 'Home Services',
        address: location || null,
        description: location ? `Based in ${location}` : null,
        phone: phone.trim() || null,
        website: normaliseWebsite(website.trim()),
        google_place_id: placeConfirmed && placeResult ? placeResult.placeId : null,
        plan_tier: 'pro',
        subscription_status: 'trial',
        trial_ends_at: trialEndsAt,
        plan_started_at: new Date().toISOString(),
      }

      const { error: bizError } = await supabase
        .from('businesses')
        .insert(businessPayload)

      if (bizError) {
        if (bizError.code === '23505') {
          const { error: retryError } = await supabase
            .from('businesses')
            .insert({ ...businessPayload, slug: `${baseSlug}-${Date.now()}` })
          if (retryError) throw retryError
        } else {
          throw bizError
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Setup error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const step1Valid = businessName.trim().length > 0

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{
        backgroundImage: 'linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="flex-1 flex flex-col justify-center px-6 py-20 relative">
        <div className="max-w-xl mx-auto w-full">

          <Link href="/" className="text-sm text-gray-400 hover:text-black transition-colors mb-16 inline-block">
            ← Sentra
          </Link>

          {/* Step indicator */}
          <div className="flex gap-1.5 mb-12 w-24">
            {[1, 2].map(s => (
              <motion.div
                key={s}
                animate={{ backgroundColor: s <= step ? '#000' : '#e5e7eb' }}
                className="h-1 flex-1 rounded-full"
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait" custom={step === 1 ? -1 : 1}>
            {step === 1 ? (
              <motion.div
                key="step1"
                custom={-1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <h1 className="text-[3.5rem] md:text-[5rem] leading-[0.88] font-light tracking-tighter text-black mb-4">
                  Set up your
                  <br />
                  <span className="italic font-normal">review page.</span>
                </h1>
                <p className="text-xl text-gray-500 font-light mb-14">
                  Takes 60 seconds. You'll be collecting reviews today.
                </p>

                {error && (
                  <div className="mb-8 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-12">
                  {/* Business name */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
                      Business name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full text-2xl md:text-3xl font-light border-b-2 border-gray-200 focus:border-black outline-none py-3 bg-transparent text-black transition-colors placeholder:text-gray-300"
                      placeholder="Jake's Plumbing"
                      autoFocus
                    />
                    {slug && (
                      <p className="mt-3 text-xs text-gray-400 font-mono">
                        usesentra.com/review/<span className="text-black">{slug}</span>
                      </p>
                    )}
                  </div>

                  {/* Trade type */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
                      Type of work
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TRADE_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTrade(t === trade ? '' : t)}
                          className={`px-4 py-2 text-sm font-light border transition-all ${
                            trade === t
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
                      Suburb or city{' '}
                      <span className="normal-case tracking-normal text-gray-300 ml-1">optional</span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full text-2xl md:text-3xl font-light border-b-2 border-gray-200 focus:border-black outline-none py-3 bg-transparent text-black transition-colors placeholder:text-gray-300"
                      placeholder="Brisbane, QLD"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!step1Valid}
                      className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white hover:bg-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed group text-lg font-light"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <h1 className="text-[3.5rem] md:text-[5rem] leading-[0.88] font-light tracking-tighter text-black mb-4">
                  A bit more
                  <br />
                  <span className="italic font-normal">about you.</span>
                </h1>
                <p className="text-xl text-gray-500 font-light mb-14">
                  Helps personalise your review page and notifications.
                </p>

                {error && (
                  <div className="mb-8 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-12">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
                      Phone number{' '}
                      <span className="normal-case tracking-normal text-gray-300 ml-1">optional</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-2xl md:text-3xl font-light border-b-2 border-gray-200 focus:border-black outline-none py-3 bg-transparent text-black transition-colors placeholder:text-gray-300"
                      placeholder="0412 345 678"
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-gray-400">Used to notify you of private feedback</p>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
                      Website{' '}
                      <span className="normal-case tracking-normal text-gray-300 ml-1">optional</span>
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full text-2xl md:text-3xl font-light border-b-2 border-gray-200 focus:border-black outline-none py-3 bg-transparent text-black transition-colors placeholder:text-gray-300"
                      placeholder="jakesplumbing.com.au"
                    />
                  </div>

                  {/* Google Business lookup */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
                      Google Business listing
                    </label>

                    {placeSearching && (
                      <div className="flex items-center gap-3 text-sm text-gray-500 py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching Google for <span className="font-medium text-black">{businessName}</span>…
                      </div>
                    )}

                    {!placeSearching && placeResult && !placeConfirmed && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-2xl p-5 space-y-4"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{placeResult.displayName}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{placeResult.formattedAddress}</p>
                          {placeResult.rating && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600">{placeResult.rating} · {placeResult.userRatingCount?.toLocaleString()} reviews on Google</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setPlaceConfirmed(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm rounded-xl font-medium hover:bg-gray-800 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            That's us
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPlaceResult(null); setPlaceError('Not the right listing? You can skip this for now.') }}
                            className="px-5 py-2.5 border border-gray-200 text-sm rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            Not us
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {!placeSearching && placeConfirmed && placeResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 py-3 text-sm text-gray-700"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <span>Google Business linked — reviews will post directly from the survey.</span>
                      </motion.div>
                    )}

                    {!placeSearching && placeError && !placeResult && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-400">{placeError}</p>
                        {location.trim() && (
                          <button
                            type="button"
                            onClick={searchGoogleBusiness}
                            className="flex items-center gap-2 text-sm text-black hover:opacity-60 transition-opacity"
                          >
                            <Search className="w-4 h-4" />
                            Try again
                          </button>
                        )}
                      </div>
                    )}

                    {!placeSearching && !placeResult && !placeError && !placeConfirmed && location.trim() && (
                      <button
                        type="button"
                        onClick={searchGoogleBusiness}
                        className="flex items-center gap-2 text-sm text-black hover:opacity-60 transition-opacity"
                      >
                        <Search className="w-4 h-4" />
                        Find my Google listing
                      </button>
                    )}

                    {!location.trim() && (
                      <p className="text-sm text-gray-400">Add a location in step 1 to enable automatic lookup.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-black transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white hover:bg-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed group text-lg font-light"
                    >
                      {loading ? 'Setting up…' : 'Get my QR code'}
                      {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </div>

                  <p className="text-sm text-gray-400 -mt-6">
                    14-day free trial. No credit card required.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
