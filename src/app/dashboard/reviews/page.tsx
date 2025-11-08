'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { responseTemplates } from '@/lib/analytics'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Star,
  MessageSquare,
  Loader2,
} from 'lucide-react'

type Business = {
  id: string
  name: string
  googlePlaceId: string | null
}

type Review = {
  id: string
  reviewer: string
  rating: number
  text: string
  reviewedAt: string
  sentiment: 'positive' | 'neutral' | 'negative' | null
  responded: boolean
  responseText: string | null
  platform: string
  platformIcon: string
}

type AISuggestion = { text: string; tone: string }

const PLATFORM_EMOJI: Record<string, string> = {
  google: '🔍',
  yelp: '🍽️',
  facebook: '📘',
  trustpilot: '⭐',
  tripadvisor: '🧭',
  default: '💬',
}

export default function ReviewsPage() {
  const supabase = useMemo(() => createClient(), [])

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingBusinesses, setLoadingBusinesses] = useState(true)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showAIModal, setShowAIModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [aiResponse, setAiResponse] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [savingResponse, setSavingResponse] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null)

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id,name,google_place_id')
          .order('created_at', { ascending: true })
        if (error) throw error
        const rows =
          data?.map((biz) => ({
            id: biz.id,
            name: biz.name,
            googlePlaceId: biz.google_place_id ?? null,
          })) ?? []
        setBusinesses(rows)
        if (rows.length > 0) {
          setSelectedBusiness(rows[0].id)
        }
      } catch (err) {
        console.error(err)
        setError('Unable to load your businesses. Confirm Supabase is configured correctly.')
      } finally {
        setLoadingBusinesses(false)
      }
    }

    loadBusinesses()
  }, [supabase])

  useEffect(() => {
    const loadReviews = async () => {
      if (!selectedBusiness) return
      setLoadingReviews(true)
      setError(null)

      const fetchStoredReviews = async () => {
        const { data, error } = await supabase
          .from('reviews')
          .select(
            `
            id,
            reviewer_name,
            rating,
            review_text,
            reviewed_at,
            sentiment,
            has_response,
            response_text,
            review_platforms ( name, slug )
          `
          )
          .eq('business_id', selectedBusiness)
          .order('reviewed_at', { ascending: false })

        if (error) throw error

        let hasUnanalysed = false

        const items =
          data?.map((review) => {
            const platformMeta = Array.isArray(review.review_platforms)
              ? review.review_platforms[0]
              : review.review_platforms

            if (!review.sentiment) {
              hasUnanalysed = true
            }

            return {
              id: review.id,
              reviewer: review.reviewer_name || 'Anonymous reviewer',
              rating: Number(review.rating ?? 0),
              text: review.review_text || '',
              reviewedAt: review.reviewed_at,
              sentiment: (review.sentiment as Review['sentiment']) ?? null,
              responded: review.has_response,
              responseText: review.response_text,
              platform: platformMeta?.name ?? 'Unknown platform',
              platformIcon: PLATFORM_EMOJI[platformMeta?.slug ?? 'default'] ?? PLATFORM_EMOJI.default,
            }
          }) ?? []

        return { items, hasUnanalysed }
      }

      try {
        let { items: normalized, hasUnanalysed } = await fetchStoredReviews()

        if (!normalized.length) {
          const currentBusiness = businesses.find((biz) => biz.id === selectedBusiness)
          if (currentBusiness?.googlePlaceId) {
            const syncResponse = await fetch('/api/google-reviews/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ businessId: currentBusiness.id }),
            })

            if (syncResponse.ok) {
              const refreshed = await fetchStoredReviews()
              normalized = refreshed.items
              hasUnanalysed = refreshed.hasUnanalysed
            } else {
              const payload = await syncResponse.json()
              setError(payload.error || 'Failed to sync Google reviews.')
            }
          }
        }

        if (hasUnanalysed && selectedBusiness) {
          setAnalysisStatus('Running AI analysis on your latest reviews...')
          const response = await fetch('/api/reviews/analyze-missing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId: selectedBusiness }),
          })

          if (response.ok) {
            const refreshed = await fetchStoredReviews()
            normalized = refreshed.items
            setAnalysisStatus(null)
          } else {
            const payload = await response.json()
            setAnalysisStatus(payload.error || 'Failed to analyze reviews.')
          }
        }

        setReviews(normalized)
      } catch (err) {
        console.error(err)
        setError('Unable to load reviews for this business.')
      } finally {
        setLoadingReviews(false)
      }
    }

    loadReviews()
  }, [supabase, selectedBusiness, businesses])

  const filteredReviews = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return reviews.filter((review) => {
      const matchesSearch =
        !query ||
        review.reviewer.toLowerCase().includes(query) ||
        review.text.toLowerCase().includes(query) ||
        review.platform.toLowerCase().includes(query)

      const matchesSentiment =
        filter === 'all' ||
        (filter === 'positive' && review.sentiment === 'positive') ||
        (filter === 'negative' && review.sentiment === 'negative')

      return matchesSearch && matchesSentiment
    })
  }, [reviews, searchTerm, filter])

  const handleGenerateResponse = async (review: Review) => {
    try {
      setGenerating(true)
      setModalError(null)
      setSelectedReview(review)
      setAiSuggestions([])
      setAiResponse('')

      const response = await fetch('/api/reviews/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to generate suggestions.')
      }

      setAiSuggestions(payload.responses || [])
      setAiResponse(payload.responses?.[0]?.text ?? '')
      setShowAIModal(true)
    } catch (err) {
      console.error(err)
      setModalError(err instanceof Error ? err.message : 'Failed to generate suggestions.')
      setShowAIModal(true)
    } finally {
      setGenerating(false)
    }
  }

  const handleApplyTemplate = (body: string) => {
    if (!selectedReview) return
    const firstName = selectedReview.reviewer.split(' ')[0]
    setAiResponse(body.replace(/{{customer}}/gi, firstName))
  }

  const handleSendResponse = async () => {
    if (!selectedReview || !aiResponse.trim()) return
    setSavingResponse(true)
    setModalError(null)

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          has_response: true,
          response_text: aiResponse.trim(),
          responded_at: new Date().toISOString(),
        })
        .eq('id', selectedReview.id)

      if (error) throw error

      setReviews((prev) =>
        prev.map((review) =>
          review.id === selectedReview.id
            ? { ...review, responded: true, responseText: aiResponse.trim() }
            : review
        )
      )

      setShowAIModal(false)
      setSelectedReview(null)
      setAiResponse('')
      setAiSuggestions([])
    } catch (err) {
      console.error(err)
      setModalError(err instanceof Error ? err.message : 'Failed to save response.')
    } finally {
      setSavingResponse(false)
    }
  }

  const emptyState = !loadingReviews && filteredReviews.length === 0

  return (
    <DashboardLayout>
      <div className="p-12">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-5xl font-light mb-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
                Reviews
              </h1>
              <p className="text-lg text-gray-600 font-light">Monitor every review and respond with AI assistance.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500">Business</label>
              <select
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                value={selectedBusiness ?? ''}
                onChange={(event) => setSelectedBusiness(event.target.value)}
                disabled={loadingBusinesses || businesses.length === 0}
              >
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="border border-red-200 bg-red-50 text-sm text-red-800 rounded-xl p-4">{error}</div>
          )}

          {analysisStatus && !error && (
            <div className="border border-blue-200 bg-blue-50 text-sm text-blue-800 rounded-xl p-4 flex items-center gap-2">
              {analysisStatus.toLowerCase().startsWith('running') && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{analysisStatus}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white shadow-sm">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, platform, or keywords..."
                className="outline-none text-sm bg-transparent w-64"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                disabled={loadingReviews}
              />
            </div>
            <div className="flex gap-2">
              <FilterButton label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
              <FilterButton
                label="Positive"
                icon={<ThumbsUp className="w-4 h-4" />}
                active={filter === 'positive'}
                onClick={() => setFilter('positive')}
              />
              <FilterButton
                label="Negative"
                icon={<ThumbsDown className="w-4 h-4" />}
                active={filter === 'negative'}
                onClick={() => setFilter('negative')}
              />
            </div>
          </div>

          {loadingReviews ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-40 border border-gray-200 rounded-2xl bg-gradient-to-r from-gray-50 to-white animate-pulse" />
              ))}
            </div>
          ) : emptyState ? (
            <div className="border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <p className="text-lg font-light mb-2 text-black">No reviews yet</p>
              <p className="text-sm text-gray-600 mb-6">Connect a platform or import reviews to populate this view.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ y: -2 }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{review.platformIcon}</div>
                      <div>
                        <p className="text-lg font-light text-black">{review.reviewer}</p>
                        <p className="text-sm text-gray-500">
                          {review.platform} • {new Date(review.reviewedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-4 h-4 ${
                            starIdx < Math.round(review.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">{review.text || 'No review text provided.'}</p>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs uppercase tracking-widest">
                      {review.sentiment === 'negative' ? (
                        <span className="text-red-600">Needs attention</span>
                      ) : review.sentiment === 'positive' ? (
                        <span className="text-green-600">Positive</span>
                      ) : (
                        <span className="text-gray-500">Neutral</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {review.responded ? (
                        <span className="text-sm text-green-600 font-medium">Responded</span>
                      ) : (
                        <button
                          onClick={() => handleGenerateResponse(review)}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                        >
                          {generating && selectedReview?.id === review.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Generate response
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            <SuggestionCard
              title="Response templates"
              description="Start from a proven tone and personalize before posting."
            >
              <div className="flex flex-wrap gap-2">
                {responseTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleApplyTemplate(template.body)}
                    className="px-3 py-1.5 border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </SuggestionCard>
            <SuggestionCard
              title="Quality reminder"
              description="Personalize every reply with names and concrete next steps. AI suggestions are a starting point, not the destination."
            >
              <p className="text-xs text-gray-500">
                We automatically track which reviews have been answered so your response rate improves over time.
              </p>
            </SuggestionCard>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAIModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => !savingResponse && setShowAIModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm uppercase tracking-widest text-gray-500">AI suggestion</p>
                  <h2 className="text-2xl font-light text-black">{selectedReview?.reviewer}</h2>
                </div>
                <button className="text-gray-400 hover:text-black" onClick={() => setShowAIModal(false)}>
                  ✕
                </button>
              </div>

              {modalError && (
                <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">{modalError}</div>
              )}

              {aiSuggestions.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {aiSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.tone}
                      onClick={() => setAiResponse(suggestion.text)}
                      className="px-3 py-1 text-xs border border-gray-200 rounded-full hover:bg-gray-50"
                    >
                      {suggestion.tone}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={aiResponse}
                onChange={(event) => setAiResponse(event.target.value)}
                rows={5}
                className="w-full border border-gray-200 rounded-xl p-4 text-gray-700 focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Edit the AI suggestion before posting..."
              />

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-500">
                  Claude drafts are saved for auditing once you post a response.
                </p>
                <button
                  onClick={handleSendResponse}
                  disabled={savingResponse || !aiResponse.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-black text-white rounded-lg disabled:opacity-50"
                >
                  {savingResponse && <Loader2 className="w-4 h-4 animate-spin" />}
                  Post response
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

function FilterButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon?: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm border transition ${
        active ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  )
}

function SuggestionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-gray-900 font-medium">
        <MessageSquare className="w-4 h-4" />
        {title}
      </div>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {children}
    </div>
  )
}
