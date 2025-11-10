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
  ChevronDown,
} from 'lucide-react'
import { useBusinessContext } from '@/contexts/BusinessContext'

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
  const { businesses, selectedBusiness, setSelectedBusinessId } = useBusinessContext()

  const [reviews, setReviews] = useState<Review[]>([])
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all')
  const [searchTerm, setSearchTerm] = useState('')
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  const reviewsPerPage = 25
  const [postToPlatform, setPostToPlatform] = useState(false)

  // Reset to page 1 when business changes
  useEffect(() => {
    console.log('[Reviews] Business changed, resetting state')
    setCurrentPage(1)
    // Clear reviews when switching businesses
    setReviews([])
    setTotalReviews(0)
    setError(null)
    setAnalysisStatus(null)
  }, [selectedBusiness])

  useEffect(() => {
    const loadReviews = async () => {
      if (!selectedBusiness) return

      console.log('[Reviews] Loading reviews for business:', selectedBusiness.id, selectedBusiness.name)

      // Clear reviews immediately when switching businesses
      setReviews([])
      setTotalReviews(0)
      setLoadingReviews(true)
      setError(null)

      const fetchStoredReviews = async () => {
        // Get total count first
        const { count } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', selectedBusiness.id)

        setTotalReviews(count || 0)

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
          .eq('business_id', selectedBusiness.id)
          .order('reviewed_at', { ascending: false })
          .range((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage - 1)

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
          if (selectedBusiness.googlePlaceId) {
            const syncResponse = await fetch('/api/google-reviews/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ businessId: selectedBusiness.id }),
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
            body: JSON.stringify({ businessId: selectedBusiness.id }),
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
  }, [supabase, selectedBusiness, currentPage, reviewsPerPage])

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
      // Use the post-reply API endpoint which handles both dry-run and real posting
      const response = await fetch('/api/reviews/post-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          replyText: aiResponse.trim(),
          isDryRun: !postToPlatform, // Default to dry run for MVP trial
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to post response')
      }

      // Update local state
      setReviews((prev) =>
        prev.map((review) =>
          review.id === selectedReview.id
            ? { ...review, responded: true, responseText: aiResponse.trim() }
            : review
        )
      )

      // Show success message
      if (result.isDryRun) {
        setModalError(null)
        alert('✅ Response saved! This is saved locally for your records. Enable platform integration to post directly.')
      } else {
        setModalError(null)
        alert('✅ Response posted to platform successfully!')
      }

      setShowAIModal(false)
      setSelectedReview(null)
      setAiResponse('')
      setAiSuggestions([])
    } catch (err) {
      console.error(err)
      setModalError(err instanceof Error ? err.message : 'Failed to post response.')
    } finally {
      setSavingResponse(false)
    }
  }

  const emptyState = !loadingReviews && filteredReviews.length === 0

  return (
    <DashboardLayout>
      <div className="p-12" key={selectedBusiness?.id || 'no-business'}>
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-5xl font-light mb-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
                Reviews
              </h1>
              <p className="text-lg text-gray-600 font-light">Monitor every review and respond with AI assistance.</p>
            </div>
            {businesses.length > 1 && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-500">Business</label>
                <div className="relative">
                  <select
                    className="px-4 py-2 pr-10 border border-gray-200 rounded-lg bg-white text-gray-900 appearance-none cursor-pointer hover:border-gray-300 transition"
                    value={selectedBusiness?.id ?? ''}
                    onChange={(event) => setSelectedBusinessId(event.target.value)}
                  >
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            )}
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
            <div className="space-y-4" key={selectedBusiness}>
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

          {/* Pagination */}
          {!loadingReviews && totalReviews > reviewsPerPage && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600">
                Showing {Math.min((currentPage - 1) * reviewsPerPage + 1, totalReviews)} to{' '}
                {Math.min(currentPage * reviewsPerPage, totalReviews)} of {totalReviews} reviews
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {Math.ceil(totalReviews / reviewsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(totalReviews / reviewsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(totalReviews / reviewsPerPage)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
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

              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postToPlatform}
                    onChange={(e) => setPostToPlatform(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-black"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Post directly to platform (requires OAuth)</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {postToPlatform
                        ? 'Will attempt to post to the review platform. Requires connected account.'
                        : 'Trial mode: Response will be saved locally for your records.'}
                    </p>
                  </div>
                </label>
              </div>

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
                  {postToPlatform ? 'Post to platform' : 'Save response'}
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
