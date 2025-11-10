'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Star, Search, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Business = {
  id: string
  name: string
  description: string | null
  website: string | null
  logo_url: string | null
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
  const reviewsPerPage = 10

  useEffect(() => {
    const loadBusinessAndReviews = async () => {
      try {
        // Fetch business details
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id, name, description, website, logo_url')
          .eq('id', businessId)
          .single()

        if (businessError) throw businessError
        setBusiness(businessData)

        // Get total count
        const { count } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)

        setTotalReviews(count || 0)

        // Fetch reviews with pagination
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
          .eq('business_id', businessId)
          .order('reviewed_at', { ascending: false })
          .range((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage - 1)

        if (reviewsError) throw reviewsError

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
    return reviews.filter(
      (review) =>
        !query ||
        review.reviewer.toLowerCase().includes(query) ||
        review.text.toLowerCase().includes(query)
    )
  }, [reviews, searchTerm])

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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
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
            <div className="text-sm text-gray-500">Powered by AI insights</div>
          </div>
        </div>
      </header>

      {/* Business Info */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {business.logo_url && (
            <img
              src={business.logo_url}
              alt={business.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-gray-200"
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
            <h3 className="text-sm font-medium text-gray-700 mb-4">Rating distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{rating}</span>
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{
                        width: `${totalReviews > 0 ? (ratingDistribution[rating as keyof typeof ratingDistribution] / totalReviews) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {ratingDistribution[rating as keyof typeof ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="mb-6">
          <div className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg bg-white shadow-sm max-w-md">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              className="outline-none text-sm bg-transparent flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Reviews */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-lg text-gray-500">No reviews found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-3xl">{review.platformIcon}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{review.reviewer}</p>
                        <p className="text-sm text-gray-500">
                          {review.platform} • {new Date(review.reviewedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{review.text || 'No review text provided.'}</p>
                  </div>
                </div>

                {review.responded && review.responseText && (
                  <div className="ml-12 mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsUp className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-gray-900">Response from {business.name}</p>
                    </div>
                    <p className="text-sm text-gray-700">{review.responseText}</p>
                  </div>
                )}
              </motion.div>
            ))}
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
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Want to manage your reviews like {business.name}?
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Get started with Sentra
          </Link>
          <p className="text-xs text-gray-500 mt-4">
            Powered by <span className="font-medium">sentra</span> • AI-powered review management
          </p>
        </div>
      </footer>
    </div>
  )
}
