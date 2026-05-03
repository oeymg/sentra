'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Heart,
  MessageCircle,
  Share2,
  Send,
  Bookmark,
  MoreHorizontal,
  Globe,
  Award,
  Sparkles,
  X,
  Check,
} from 'lucide-react'
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

type AISummary = {
  summary: string
  highlights: string[]
  sentiment: string
  totalReviews: number
}

type SocialReviewHubProps = {
  business: Business
  reviews: Review[]
  aiSummary: AISummary | null
}

export default function SocialReviewHub({ business, reviews, aiSummary }: SocialReviewHubProps) {
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set())
  const [savedReviews, setSavedReviews] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})

  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const counts: Record<string, number> = {}
    reviews.forEach((review) => {
      counts[review.id] = Math.floor(Math.random() * 200 + 50)
    })
    setLikeCounts(counts)
  }, [reviews])

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
  }, [reviews])

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
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'] })
        setShowReviewModal(false)
        setTimeout(() => window.location.reload(), 1500)
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

  const toggleLike = (reviewId: string) => {
    setLikedReviews((prev) => {
      const next = new Set(prev)
      if (next.has(reviewId)) next.delete(reviewId)
      else { next.add(reviewId); if (navigator.vibrate) navigator.vibrate(10) }
      return next
    })
  }

  const toggleSave = (reviewId: string) => {
    setSavedReviews((prev) => {
      const next = new Set(prev)
      if (next.has(reviewId)) next.delete(reviewId)
      else next.add(reviewId)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <motion.h1
              className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              sentra
            </motion.h1>
          </Link>
          <motion.button
            onClick={() => setShowReviewModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold text-sm"
          >
            Leave a Review
          </motion.button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Profile */}
        <div className="flex items-start gap-4 sm:gap-8 mb-8">
          <div className="relative flex-shrink-0">
            {business.logo_url ? (
              <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-0.5">
                <img src={business.logo_url} alt={business.name} className="w-full h-full rounded-full object-cover border-2 border-black" />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-2xl sm:text-4xl font-bold">
                {business.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-black">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">{business.name}</h1>
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">{reviews.length}</div>
                <div className="text-xs sm:text-sm text-gray-400">reviews</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold flex items-center gap-1">
                  {avgRating}
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                </div>
                <div className="text-xs sm:text-sm text-gray-400">rating</div>
              </div>
            </div>
            {business.description && <p className="text-sm text-gray-300 mb-3 max-w-xl">{business.description}</p>}
            {business.website && (
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
                <Globe className="w-4 h-4" />
                Visit Website
              </a>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {aiSummary && aiSummary.totalReviews > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Insights</h3>
                <p className="text-sm text-gray-400">Based on {aiSummary.totalReviews} reviews</p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">{aiSummary.summary}</p>
            {aiSummary.highlights && aiSummary.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aiSummary.highlights.slice(0, 3).map((highlight, idx) => (
                  <span key={idx} className="px-4 py-2 bg-pink-500/20 rounded-full text-sm border border-pink-500/30">
                    ✨ {highlight}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Reviews Feed */}
        <div className="space-y-8">
          {reviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-black border border-gray-800 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {review.reviewer[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{review.reviewer}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(review.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-900 rounded-full transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 pb-3">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-5 h-5 ${star <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'fill-gray-700 text-gray-700'}`} />
                  ))}
                </div>
                <p className="text-gray-200 leading-relaxed">
                  <span className="font-semibold mr-2">{review.reviewer}</span>
                  {review.text}
                </p>
              </div>

              <div className="px-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.button onClick={() => toggleLike(review.id)} whileTap={{ scale: 0.8 }} className="p-2 hover:bg-gray-900 rounded-full transition-colors">
                      <Heart className={`w-6 h-6 transition-all ${likedReviews.has(review.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </motion.button>
                    <button className="p-2 hover:bg-gray-900 rounded-full transition-colors">
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button className="p-2 hover:bg-gray-900 rounded-full transition-colors">
                      <Share2 className="w-6 h-6" />
                    </button>
                  </div>
                  <motion.button onClick={() => toggleSave(review.id)} whileTap={{ scale: 0.8 }} className="p-2 hover:bg-gray-900 rounded-full transition-colors">
                    <Bookmark className={`w-6 h-6 transition-all ${savedReviews.has(review.id) ? 'fill-white text-white' : 'text-white'}`} />
                  </motion.button>
                </div>
                <p className="text-sm font-semibold mt-3">
                  {(likeCounts[review.id] || 0) + (likedReviews.has(review.id) ? 1 : 0)} likes
                </p>
              </div>

              {review.responded && review.responseText && (
                <div className="px-4 pb-4">
                  <div className="flex gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">{business.name}</p>
                      <p className="text-sm text-gray-300">{review.responseText}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {reviews.length === 0 && (
          <p className="text-center text-gray-500 py-12">No reviews yet.</p>
        )}

        <motion.button
          onClick={() => setShowReviewModal(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center z-40"
        >
          <Award className="w-7 h-7 text-white" />
        </motion.button>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-gray-900 rounded-3xl overflow-hidden border border-gray-800"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h2 className="text-xl font-bold">Create Review</h2>
                <button onClick={() => setShowReviewModal(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-3">Rate your experience</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                        <Star className={`w-12 h-12 transition-all ${(hoverRating || rating) >= star ? 'fill-yellow-500 text-yellow-500' : 'fill-gray-700 text-gray-700'}`} />
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3">Share your experience</label>
                  <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="What did you love? What could be better?" rows={5} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder:text-gray-500 resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3">Your name</label>
                  <input type="text" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="John Doe" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder:text-gray-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3">
                    Email <span className="text-gray-500">(optional)</span>
                  </label>
                  <input type="email" value={reviewerEmail} onChange={(e) => setReviewerEmail(e.target.value)} placeholder="john@example.com" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder:text-gray-500" />
                </div>

                <motion.button
                  onClick={handleSubmitReview}
                  disabled={submitting || rating === 0 || !reviewText.trim() || !reviewerName.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Posting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" />
                      Post Review
                    </div>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-400 mb-4">Powered by sentra AI</p>
          <Link href="/" className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold hover:shadow-xl transition-all">
            Get sentra for your business
          </Link>
        </div>
      </footer>
    </div>
  )
}
