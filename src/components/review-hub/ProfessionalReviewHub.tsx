'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  Send,
  X,
  Check,
  Globe,
  Shield,
  Clock,
  TrendingUp,
  Award,
  MessageSquare,
  Filter,
} from 'lucide-react'
import Link from 'next/link'

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

type AISummary = {
  summary: string
  highlights: string[]
  sentiment: string
  totalReviews: number
}

type ProfessionalReviewHubProps = {
  business: Business
  reviews: Review[]
  aiSummary: AISummary | null
}

export default function ProfessionalReviewHub({
  business,
  reviews,
  aiSummary,
}: ProfessionalReviewHubProps) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent')

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
  }, [reviews])

  const responseRate = useMemo(() => {
    if (reviews.length === 0) return 0
    const responded = reviews.filter((r) => r.responded).length
    return Math.round((responded / reviews.length) * 100)
  }, [reviews])

  const ratingDistribution = useMemo(() => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating]++
    })
    return dist
  }, [reviews])

  const filteredAndSortedReviews = useMemo(() => {
    let filtered = filterRating !== null ? reviews.filter((r) => r.rating === filterRating) : reviews
    return [...filtered].sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
      if (sortBy === 'highest') return b.rating - a.rating
      return a.rating - b.rating
    })
  }, [reviews, filterRating, sortBy])

  const handleSubmitReview = async () => {
    if (rating === 0 || !reviewText.trim() || !reviewerName.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          rating,
          text: reviewText,
          reviewerName,
          reviewerEmail: reviewerEmail || null,
          source: 'direct',
        }),
      })

      if (response.ok) {
        setShowReviewModal(false)
        setRating(0)
        setReviewText('')
        setReviewerName('')
        setReviewerEmail('')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/sentra_icon.png" alt="Sentra" className="w-8 h-8" />
              <h1 className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors hidden sm:block" style={{ fontFamily: 'Inter, sans-serif' }}>
                sentra
              </h1>
            </Link>
            <motion.button
              onClick={() => setShowReviewModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Write Review
            </motion.button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Business Profile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg object-cover border-2 border-blue-100" />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl font-bold">
                  {business.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">{business.name}</h1>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                  <Shield className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              </div>
              {business.description && (
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 max-w-3xl leading-relaxed">{business.description}</p>
              )}
              {business.website && (
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm sm:text-base font-medium transition-colors">
                  <Globe className="w-4 h-4" />
                  <span>Visit Website</span>
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{avgRating}</span>
                <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 fill-blue-600 text-blue-600" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Average Rating</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{reviews.length}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Reviews</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{responseRate}%</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Response Rate</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">&lt;24h</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Response Time</p>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {aiSummary && aiSummary.totalReviews > 0 && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Customer Insights</h3>
                <p className="text-sm text-gray-500 mb-3">Based on {aiSummary.totalReviews} verified reviews</p>
                <p className="text-gray-700 leading-relaxed mb-4">{aiSummary.summary}</p>
                {aiSummary.highlights && aiSummary.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {aiSummary.highlights.slice(0, 3).map((highlight, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-gray-700 font-medium">
                        <Check className="w-4 h-4 text-blue-600" />
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rating Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star] || 0
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
              return (
                <button
                  key={star}
                  onClick={() => setFilterRating(filterRating === star ? null : star)}
                  className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all ${
                    filterRating === star ? 'bg-blue-50 border-2 border-blue-600' : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1 w-20">
                    <span className="font-semibold text-gray-900">{star}</span>
                    <Star className="w-4 h-4 fill-blue-600 text-blue-600" />
                  </div>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-16 text-right">
                    {count} {count === 1 ? 'review' : 'reviews'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Filter and Sort */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Customer Reviews
            {filterRating && (
              <span className="text-base font-normal text-gray-600 ml-3">
                ({filteredAndSortedReviews.length} {filterRating}-star {filteredAndSortedReviews.length === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>Sort by:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'highest' | 'lowest')}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredAndSortedReviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {review.reviewer[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{review.reviewer}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(review.reviewedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-5 h-5 ${star <= review.rating ? 'fill-blue-600 text-blue-600' : 'fill-gray-200 text-gray-200'}`} />
                  ))}
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">{review.text}</p>

              {review.responded && review.responseText && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900">{business.name}</p>
                        <span className="text-xs text-gray-500">• Response</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{review.responseText}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredAndSortedReviews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No reviews found with the selected filters.</p>
            <button onClick={() => { setFilterRating(null); setSortBy('recent') }} className="mt-4 text-blue-600 hover:text-blue-700 font-medium">
              Clear filters
            </button>
          </div>
        )}

        <div className="mt-12 text-center">
          <motion.button
            onClick={() => setShowReviewModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Send className="w-5 h-5" />
            Share Your Experience
          </motion.button>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowReviewModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
              <button onClick={() => setShowReviewModal(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Overall Rating</label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="p-2">
                      <Star className={`w-12 h-12 transition-all ${(hoverRating || rating) >= star ? 'fill-blue-600 text-blue-600' : 'fill-gray-200 text-gray-200'}`} />
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Your Review</label>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share details of your experience..." rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder:text-gray-400 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Your Name</label>
                <input type="text" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="John Smith" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder:text-gray-400" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Email Address <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input type="email" value={reviewerEmail} onChange={(e) => setReviewerEmail(e.target.value)} placeholder="john.smith@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder:text-gray-400" />
              </div>

              <motion.button
                onClick={handleSubmitReview}
                disabled={submitting || rating === 0 || !reviewText.trim() || !reviewerName.trim()}
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
                className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="w-5 h-5" />
                    Submit Review
                  </div>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img src="/sentra_icon.png" alt="Sentra" className="w-6 h-6" />
            <p className="text-gray-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Powered by Sentra</p>
          </div>
          <Link href="/" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Get Sentra for Your Business
          </Link>
        </div>
      </footer>
    </div>
  )
}
