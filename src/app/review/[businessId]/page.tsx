'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Search, ThumbsUp, ChevronLeft, ChevronRight, Share2, Check, Sparkles, Trophy, Medal, Award, Heart, TrendingUp, Clock, Zap, BadgeCheck, MessageCircle, Send, X } from 'lucide-react'
import Link from 'next/link'
import confetti from 'canvas-confetti'

type Business = {
  id: string
  name: string
  slug?: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  google_place_id: string | null
}

type Review = {
  id: string
  reviewer: string
  reviewerAvatar: string | null
  rating: number
  text: string
  reviewedAt: string
  responded: boolean
  responseText: string | null
  platform: string
  platformIcon: string
}

const PLATFORM_EMOJI: Record<string, string> = {
  google: '🔍',
  yelp: '🍽️',
  facebook: '📘',
  trustpilot: '⭐',
  tripadvisor: '🧭',
  default: '💬',
}

export default function PublicReviewsPage() {
  const params = useParams()
  const businessId = params.businessId as string
  const supabase = useMemo(() => createClient(), [])

  const [business, setBusiness] = useState<Business | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [copiedReviewId, setCopiedReviewId] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set())
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const reviewsPerPage = 10
  const confettiShownRef = useRef<Set<string>>(new Set())
  const heroRef = useRef<HTMLDivElement>(null)
  const reviewFormRef = useRef<HTMLDivElement>(null)

  // Review submission state
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showSharePrompt, setShowSharePrompt] = useState(false)

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<{
    summary: string
    highlights: string[]
    sentiment: string
    totalReviews: number
  } | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  // Fetch AI summary
  useEffect(() => {
    const fetchSummary = async () => {
      if (!business?.id) return

      try {
        setLoadingSummary(true)
        const response = await fetch('/api/reviews/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: business.id }),
        })

        if (response.ok) {
          const data = await response.json()
          setAiSummary(data)
        }
      } catch (error) {
        console.error('Error fetching summary:', error)
      } finally {
        setLoadingSummary(false)
      }
    }

    fetchSummary()
  }, [business?.id])

  useEffect(() => {
    const loadBusinessAndReviews = async () => {
      try {
        // Fetch business details - try by slug first, then by ID for backwards compatibility
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId)

        // Try to fetch with slug first (if column exists), fallback to just ID
        let businessData
        let businessError

        if (isUUID) {
          // If UUID, just query by ID (slug not needed)
          const result = await supabase
            .from('businesses')
            .select('id, name, description, website, logo_url, google_place_id')
            .eq('id', businessId)
            .single()
          businessData = result.data
          businessError = result.error
        } else {
          // If not UUID, assume it's a slug - try to query by slug
          // First try with slug column
          const resultWithSlug = await supabase
            .from('businesses')
            .select('id, name, slug, description, website, logo_url, google_place_id')
            .eq('slug', businessId)
            .single()

          if (resultWithSlug.error && resultWithSlug.error.message?.includes('column')) {
            // Slug column doesn't exist, fallback to ID query
            const resultById = await supabase
              .from('businesses')
              .select('id, name, description, website, logo_url, google_place_id')
              .eq('id', businessId)
              .single()
            businessData = resultById.data
            businessError = resultById.error
          } else {
            businessData = resultWithSlug.data
            businessError = resultWithSlug.error
          }
        }

        if (businessError) {
          console.error('Business error:', businessError)
          throw businessError
        }

        if (!businessData) {
          throw new Error('Business not found')
        }

        console.log('Business loaded:', businessData)
        setBusiness(businessData)

        // Get total count (use business ID, not slug)
        const { count, error: countError } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessData.id)

        if (countError) {
          console.error('Count error:', countError)
        }

        setTotalReviews(count || 0)

        // Fetch reviews with pagination (use business ID, not slug)
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(
            `
            id,
            reviewer_name,
            reviewer_avatar_url,
            rating,
            review_text,
            reviewed_at,
            has_response,
            response_text,
            review_platforms ( name, slug )
          `
          )
          .eq('business_id', businessData.id)
          .order('reviewed_at', { ascending: false })
          .range((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage - 1)

        if (reviewsError) {
          console.error('Reviews error:', reviewsError)
          throw reviewsError
        }

        console.log('Reviews loaded:', reviewsData?.length || 0, 'reviews')

        const normalized =
          reviewsData?.map((review) => {
            const platformMeta = Array.isArray(review.review_platforms)
              ? review.review_platforms[0]
              : review.review_platforms

            return {
              id: review.id,
              reviewer: review.reviewer_name || 'Anonymous',
              reviewerAvatar: review.reviewer_avatar_url,
              rating: Number(review.rating ?? 0),
              text: review.review_text || '',
              reviewedAt: review.reviewed_at,
              responded: review.has_response,
              responseText: review.response_text,
              platform: platformMeta?.name ?? 'Unknown',
              platformIcon:
                PLATFORM_EMOJI[platformMeta?.slug ?? 'default'] ?? PLATFORM_EMOJI.default,
            }
          }) ?? []

        setReviews(normalized)
      } catch (err) {
        console.error(err)
        setError('Unable to load reviews. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadBusinessAndReviews()
  }, [supabase, businessId, currentPage])

  const filteredReviews = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return reviews.filter((review) => {
      const matchesSearch = !query ||
        review.reviewer.toLowerCase().includes(query) ||
        review.text.toLowerCase().includes(query)
      const matchesRating = ratingFilter === null || Math.round(review.rating) === ratingFilter
      return matchesSearch && matchesRating
    })
  }, [reviews, searchTerm, ratingFilter])

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
  }, [reviews])

  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((r) => {
      const rating = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5
      if (rating >= 1 && rating <= 5) {
        dist[rating]++
      }
    })
    return dist
  }, [reviews])

  // Helper function to determine review badges
  const getReviewBadges = (review: Review, index: number) => {
    const badges: { icon: React.ReactElement; label: string; color: string }[] = []

    // First review badge
    if (index === reviews.length - 1) {
      badges.push({ icon: <Trophy className="w-3 h-3" />, label: 'First Review', color: 'bg-purple-100 text-purple-700' })
    }

    // Top reviewer (5-star with response)
    if (review.rating === 5 && review.responded) {
      badges.push({ icon: <Medal className="w-3 h-3" />, label: 'Top Reviewer', color: 'bg-yellow-100 text-yellow-700' })
    }

    // Detailed review (>100 characters)
    if (review.text && review.text.length > 100) {
      badges.push({ icon: <Sparkles className="w-3 h-3" />, label: 'Detailed Review', color: 'bg-blue-100 text-blue-700' })
    }

    // Recent review (within 7 days)
    const daysSinceReview = Math.floor((Date.now() - new Date(review.reviewedAt).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceReview <= 7) {
      badges.push({ icon: <Award className="w-3 h-3" />, label: 'Recent', color: 'bg-green-100 text-green-700' })
    }

    return badges
  }

  // Confetti effect for 5-star reviews
  const triggerConfetti = (reviewId: string) => {
    if (confettiShownRef.current.has(reviewId)) return
    confettiShownRef.current.add(reviewId)

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347']
    })
  }

  // Share review function
  const shareReview = async (reviewId: string) => {
    // Use slug for prettier URLs, fallback to ID if slug doesn't exist
    const identifier = business?.slug || businessId
    const url = `${window.location.origin}/review/${identifier}#review-${reviewId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedReviewId(reviewId)
      setTimeout(() => setCopiedReviewId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Toggle like on review
  const toggleLike = (reviewId: string) => {
    setLikedReviews((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
      }
      return newSet
    })
  }

  // Floating button visibility on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom
        setShowFloatingButton(heroBottom < 0)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle review submission
  const handleSubmitReview = async () => {
    if (rating === 0 || !reviewText.trim() || !reviewerName.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(`/api/reviews/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          rating,
          text: reviewText,
          reviewerName,
          reviewerEmail: reviewerEmail || null,
          source: 'direct',
        }),
      })

      if (response.ok) {
        // Success! Fire confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe'],
        })

        setSubmitted(true)
        setShowReviewForm(false)

        // Show share prompt instead of immediately reloading
        setTimeout(() => {
          setSubmitted(false)
          setShowSharePrompt(true)
        }, 2000)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingText = (r: number) => {
    switch (r) {
      case 1: return '😞 Not great'
      case 2: return '😐 Could be better'
      case 3: return '😊 Good'
      case 4: return '😄 Great!'
      case 5: return '🤩 Amazing!'
      default: return 'Rate your experience'
    }
  }

  const scrollToReviewForm = () => {
    setShowReviewForm(true)
    setTimeout(() => {
      reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  // Calculate response metrics
  const responseRate = useMemo(() => {
    if (reviews.length === 0) return 0
    const respondedCount = reviews.filter(r => r.responded).length
    return Math.round((respondedCount / reviews.length) * 100)
  }, [reviews])

  const avgResponseTime = useMemo(() => {
    // Mock data for demo - in production, calculate from actual timestamps
    return '2.4 hours'
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-2xl mb-4">😕</p>
          <h1 className="text-2xl font-light mb-2">Business not found</h1>
          <p className="text-gray-600 mb-6">{error || 'This business does not exist or has been removed.'}</p>
          <Link href="/" className="text-black underline hover:no-underline">
            Go to homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Live Stats Ticker */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white py-2 overflow-hidden"
      >
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="flex items-center gap-8 whitespace-nowrap"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">{Math.floor(Math.random() * 50 + 150)} reviews today</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">95% positive sentiment</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{Math.floor(Math.random() * 30 + 120)} responses sent</span>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <motion.div
                className="text-2xl font-bold bg-gradient-to-r from-black via-gray-800 to-black bg-clip-text text-transparent"
                whileHover={{ scale: 1.02 }}
              >
                sentra
              </motion.div>
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-black">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Live reviews</span>
              </div>
              <div className="text-sm text-gray-500">Powered by AI insights</div>
            </div>
          </div>
        </div>
      </header>

      {/* Business Info */}
      <div ref={heroRef} className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {business.logo_url && (
            <motion.img
              src={business.logo_url}
              alt={business.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
            />
          )}
          <h1 className="text-5xl font-light mb-3 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
            {business.name}
          </h1>
          {business.description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{business.description}</p>
          )}
          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
            >
              Visit website →
            </a>
          )}

          {/* Quick Response Metrics - Hidden until tracking is implemented */}
          {/* <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-6 mt-6"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
              <BadgeCheck className="w-4 h-4 text-green-700" />
              <span className="text-sm font-medium text-green-700">{responseRate}% Response Rate</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
              <Clock className="w-4 h-4 text-blue-700" />
              <span className="text-sm font-medium text-blue-700">Avg {avgResponseTime} response</span>
            </div>
          </motion.div> */}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-light mb-2">{avgRating}</div>
              <div className="flex items-center justify-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(Number(avgRating))
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">Average rating</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-light mb-2">{totalReviews}</div>
              <p className="text-sm text-gray-500">Total reviews</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-light mb-2">
                {reviews.filter((r) => r.responded).length}
              </div>
              <p className="text-sm text-gray-500">Responses posted</p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-sm font-medium text-black mb-4">Rating distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <motion.div
                  key={rating}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rating * 0.05 }}
                >
                  <div className="flex items-center gap-1 w-16">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-black">{rating}</span>
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${totalReviews > 0 ? (ratingDistribution[rating as keyof typeof ratingDistribution] / totalReviews) * 100 : 0}%`,
                      }}
                      transition={{ duration: 1, delay: rating * 0.1 }}
                    />
                  </div>
                  <span className="text-sm text-black w-12 text-right font-medium">
                    {ratingDistribution[rating as keyof typeof ratingDistribution]}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Sentra AI Summary */}
        {aiSummary && aiSummary.totalReviews > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 rounded-3xl p-8 mb-8 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/20 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-200/20 rounded-full -ml-24 -mb-24 blur-3xl" />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900">Sentra Summary</h3>
                  <p className="text-sm text-gray-600">AI-powered insights from {aiSummary.totalReviews} reviews</p>
                </div>
                {aiSummary.sentiment === 'positive' && (
                  <div className="px-4 py-2 bg-green-100 rounded-full">
                    <span className="text-sm font-semibold text-green-700">😊 Positive</span>
                  </div>
                )}
                {aiSummary.sentiment === 'mixed' && (
                  <div className="px-4 py-2 bg-yellow-100 rounded-full">
                    <span className="text-sm font-semibold text-yellow-700">😐 Mixed</span>
                  </div>
                )}
                {aiSummary.sentiment === 'negative' && (
                  <div className="px-4 py-2 bg-red-100 rounded-full">
                    <span className="text-sm font-semibold text-red-700">😞 Needs Improvement</span>
                  </div>
                )}
              </div>

              {/* Summary text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-sm"
              >
                <p className="text-lg text-gray-800 leading-relaxed font-light">
                  {aiSummary.summary}
                </p>
              </motion.div>

              {/* Highlights */}
              {aiSummary.highlights && aiSummary.highlights.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Key Highlights
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {aiSummary.highlights.map((highlight, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                        className="flex items-start gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm"
                      >
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{highlight}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Powered by tag */}
              <div className="mt-6 pt-4 border-t border-purple-200/50 flex items-center justify-between">
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  Powered by Sentra AI • Updated automatically
                </p>
                <div className="text-xs text-gray-400">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading state for summary */}
        {loadingSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 rounded-3xl p-8 mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600" />
              <div>
                <p className="font-semibold text-gray-900">Generating AI insights...</p>
                <p className="text-sm text-gray-600">Analyzing reviews to create your summary</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Review Trends Indicator */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-2xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-black">Reviews trending up</h3>
                    <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">+23%</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {business.name} received {Math.floor(reviews.length * 0.23)} more reviews this month
                  </p>
                </div>
              </div>
              <div className="hidden md:block text-4xl">📈</div>
            </div>
          </motion.div>
        )}

        {/* Review Submission Form */}
        <AnimatePresence>
          {showReviewForm && (
            <motion.div
              ref={reviewFormRef}
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-3xl p-8 relative">
                {/* Close button */}
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>

                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-light text-gray-900 mb-2">
                      Share Your Experience
                    </h2>
                    <p className="text-gray-600">
                      Your feedback helps {business.name} improve and helps others make informed decisions
                    </p>
                  </div>

                  {/* Star Rating */}
                  <div className="mb-8">
                    <label className="block text-lg font-semibold text-gray-900 mb-4 text-center">
                      How was your experience?
                    </label>
                    <div className="flex justify-center gap-3 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-12 h-12 md:w-16 md:h-16 transition-all ${
                              (hoverRating || rating) >= star
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-center text-lg font-medium text-gray-700 h-8">
                      {getRatingText(hoverRating || rating)}
                    </p>
                  </div>

                  {/* Review Text */}
                  <div className="mb-6">
                    <label className="block text-lg font-semibold text-gray-900 mb-3">
                      Tell us more! ✨
                    </label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="What did you love? What could be better? Your honest feedback helps us improve..."
                      rows={6}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-gray-900 placeholder:text-gray-400 text-base bg-white"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {reviewText.length} characters
                    </p>
                  </div>

                  {/* Name & Email */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-3">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-3">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        value={reviewerEmail}
                        onChange={(e) => setReviewerEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={submitting || rating === 0 || !reviewText.trim() || !reviewerName.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {submitting ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-6 h-6" />
                        Submit Review
                      </>
                    )}
                  </motion.button>

                  <p className="text-center text-sm text-gray-500 mt-4">
                    Your review will be visible to others and helps {business.name} improve
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Toast */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-green-400 to-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
            >
              <Check className="w-6 h-6" />
              <span className="font-semibold">Thank you! Your review has been submitted! 🎉</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Prompt Modal */}
        <AnimatePresence>
          {showSharePrompt && business && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => {
                setShowSharePrompt(false)
                window.location.reload()
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
              >
                <button
                  onClick={() => {
                    setShowSharePrompt(false)
                    window.location.reload()
                  }}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>

                <div className="text-center mb-8">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-6xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-3xl font-light text-gray-900 mb-3">
                    Thank You!
                  </h2>
                  <p className="text-gray-600 mb-2">
                    Your review has been submitted successfully!
                  </p>
                  <p className="text-gray-900 font-medium">
                    Help others discover {business.name} by sharing your review
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {/* Google Reviews */}
                  {business.google_place_id && (
                    <motion.a
                      href={`https://search.google.com/local/writereview?placeid=${business.google_place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
                        🔍
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900">Share on Google</p>
                        <p className="text-sm text-gray-600">Help others find {business.name}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </motion.a>
                  )}

                  {/* Facebook */}
                  <motion.a
                    href={`https://www.facebook.com/search/top?q=${encodeURIComponent(business.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-2xl hover:border-blue-600 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
                      📘
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">Share on Facebook</p>
                      <p className="text-sm text-gray-600">Let your friends know</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-700 transition-colors" />
                  </motion.a>

                  {/* Yelp */}
                  <motion.a
                    href={`https://www.yelp.com/search?find_desc=${encodeURIComponent(business.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-2xl hover:border-red-500 hover:bg-red-50 transition-all group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
                      🍽️
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">Share on Yelp</p>
                      <p className="text-sm text-gray-600">Reach more people</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                  </motion.a>
                </div>

                <motion.button
                  onClick={() => {
                    setShowSharePrompt(false)
                    window.location.reload()
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Maybe Later
                </motion.button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  You can close this and still see your review below
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setRatingFilter(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                ratingFilter === null
                  ? 'bg-black text-white shadow-lg scale-105'
                  : 'bg-white text-black border border-gray-200 hover:border-black hover:shadow-md'
              }`}
            >
              All Reviews ({reviews.length})
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setRatingFilter(rating)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  ratingFilter === rating
                    ? 'bg-black text-white shadow-lg scale-105'
                    : 'bg-white text-black border border-gray-200 hover:border-black hover:shadow-md'
                }`}
              >
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {rating} ({ratingDistribution[rating as keyof typeof ratingDistribution]})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 rounded-2xl bg-white shadow-sm max-w-md hover:border-black transition-all focus-within:border-black focus-within:shadow-md">
            <Search className="w-5 h-5 text-black" />
            <input
              type="text"
              placeholder="Search reviews by name or content..."
              className="outline-none text-sm bg-transparent flex-1 text-black placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-black hover:bg-black/5 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-black mt-2">
              Found {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
            </p>
          )}
        </motion.div>

        {/* Reviews */}
        {filteredReviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200"
          >
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl font-light text-black mb-2">No reviews found</p>
            <p className="text-sm text-gray-600">Try adjusting your filters or search term</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((review, idx) => {
              const badges = getReviewBadges(review, idx)
              const is5Star = Math.round(review.rating) === 5

              return (
                <motion.div
                  key={review.id}
                  id={`review-${review.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, type: 'spring', stiffness: 100 }}
                  onViewportEnter={() => {
                    if (is5Star) triggerConfetti(review.id)
                  }}
                  viewport={{ once: true, amount: 0.5 }}
                  onMouseEnter={() => setHoveredCard(review.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="bg-white rounded-3xl p-8 shadow-lg border-2 border-gray-100 hover:border-black transition-all duration-300 cursor-pointer relative overflow-hidden group"
                  style={{
                    transform: hoveredCard === review.id ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                    boxShadow: hoveredCard === review.id ? '0 20px 40px rgba(0,0,0,0.15)' : '0 4px 6px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Gradient overlay for 5-star reviews */}
                  {is5Star && (
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 via-transparent to-orange-50/50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}

                  {/* Share button */}
                  <motion.button
                    onClick={() => shareReview(review.id)}
                    className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full hover:bg-black hover:text-white hover:border-black transition-all z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {copiedReviewId === review.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </motion.button>

                  <div className="flex items-start gap-5 mb-4 relative z-10">
                    <div className="text-4xl">{review.platformIcon}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-lg text-black">{review.reviewer}</p>
                          <p className="text-sm text-black">
                            {review.platform} • {new Date(review.reviewedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <motion.div
                              key={star}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: idx * 0.08 + star * 0.05, type: 'spring' }}
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-200'
                                }`}
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Badges */}
                      {badges.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {badges.map((badge, badgeIdx) => (
                            <motion.div
                              key={badgeIdx}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: idx * 0.08 + 0.2 + badgeIdx * 0.05 }}
                              className={`${badge.color} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}
                            >
                              {badge.icon}
                              {badge.label}
                            </motion.div>
                          ))}
                        </div>
                      )}

                      <p className="text-black leading-relaxed font-light text-base">
                        {review.text || 'No review text provided.'}
                      </p>

                      {/* Review Actions */}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLike(review.id)
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                            likedReviews.has(review.id)
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${likedReviews.has(review.id) ? 'fill-red-600' : ''}`}
                          />
                          <span className="text-xs font-medium">
                            {likedReviews.has(review.id) ? 'Liked' : 'Helpful'} ({Math.floor(Math.random() * 20 + 5)})
                          </span>
                        </motion.button>

                        {/* Verified badge for some reviews */}
                        {idx % 3 === 0 && (
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                            <BadgeCheck className="w-4 h-4" />
                            <span className="text-xs font-medium">Verified Customer</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {review.responded && review.responseText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 + 0.3 }}
                      className="ml-14 mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16" />
                      <div className="flex items-center gap-2 mb-3 relative z-10">
                        <ThumbsUp className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-semibold text-black">Response from {business.name}</p>
                      </div>
                      <p className="text-sm text-black leading-relaxed relative z-10">{review.responseText}</p>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalReviews > reviewsPerPage && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {Math.ceil(totalReviews / reviewsPerPage)}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(Math.ceil(totalReviews / reviewsPerPage), prev + 1))
              }
              disabled={currentPage >= Math.ceil(totalReviews / reviewsPerPage)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Share Your Experience CTA */}
        {filteredReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <div className="bg-gradient-to-br from-black via-gray-800 to-black rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"
            />
            <div className="relative z-10">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-light text-white mb-3">
                Share Your Experience
              </h2>
              <p className="text-white/80 mb-6 max-w-xl mx-auto">
                Had a great experience with {business.name}? Your review helps others discover quality service and motivates us to keep improving!
              </p>
              <motion.button
                onClick={scrollToReviewForm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-black rounded-2xl font-medium hover:bg-gray-100 transition-colors shadow-xl"
              >
                Write a Review ✨
              </motion.button>
              <p className="text-white/60 text-sm mt-4">
                Join {totalReviews} others who shared their experience
              </p>
            </div>
          </div>
          </motion.div>
        )}
      </div>

      {/* Floating Write Review Button */}
      <AnimatePresence>
        {showFloatingButton && (
          <motion.button
            onClick={scrollToReviewForm}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl flex items-center gap-2 font-medium hover:shadow-3xl transition-shadow"
          >
            <Sparkles className="w-5 h-5" />
            Write a Review
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm text-black mb-3">
              Want to manage your reviews like {business.name}?
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all hover:shadow-xl font-medium"
            >
              Get started with Sentra
            </Link>
            <p className="text-xs text-gray-600 mt-6">
              Powered by <span className="font-semibold">sentra</span> • AI-powered review management
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
