'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Heart,
  MessageCircle,
  Share2,
  Send,
  Bookmark,
  MoreHorizontal,
  Camera,
  Image as ImageIcon,
  Video,
  Smile,
  MapPin,
  Globe,
  Users,
  TrendingUp,
  Award,
  Zap,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Instagram,
  Youtube,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import VideoReview from '@/components/review-hub/VideoReview'
import MediaUploader from '@/components/review-hub/MediaUploader'
import MediaGallery from '@/components/review-hub/MediaGallery'
import LikeAnimation from '@/components/review-hub/LikeAnimation'

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
  hasVideo: boolean
  videoUrl: string | null
  videoThumbnail: string | null
  hasMedia: boolean
  mediaUrls: string[]
  mediaTypes: string[]
}

type VideoReview = {
  id: string
  platform: 'instagram' | 'tiktok' | 'youtube' | 'vimeo' | 'twitter' | 'facebook' | 'other'
  video_url: string
  embed_url: string | null
  thumbnail_url: string | null
  creator_name: string
  creator_handle: string | null
  creator_avatar_url: string | null
  creator_follower_count: number | null
  title: string | null
  description: string | null
  duration_seconds: number | null
  view_count: number
  like_count: number
  comment_count: number
  rating: number | null
  is_featured: boolean
  is_verified: boolean
  posted_at: string
}

const PLATFORM_EMOJI: Record<string, string> = {
  google: '🔍',
  yelp: '🍽️',
  facebook: '📘',
  trustpilot: '⭐',
  tripadvisor: '🧭',
  reddit: '🤖',
  default: '💬',
}

export default function SocialReviewHub() {
  const params = useParams()
  const businessId = params.businessId as string
  const supabase = useMemo(() => createClient(), [])

  const [business, setBusiness] = useState<Business | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [videoReviews, setVideoReviews] = useState<VideoReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'videos'>('all')
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set())
  const [savedReviews, setSavedReviews] = useState<Set<string>>(new Set())

  // Review submission state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [mediaTypes, setMediaTypes] = useState<string[]>([])

  // Double-tap to like state
  const [showLikeAnimation, setShowLikeAnimation] = useState<string | null>(null)
  const [lastTap, setLastTap] = useState<{ id: string; time: number }>({ id: '', time: 0 })

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<{
    summary: string
    highlights: string[]
    sentiment: string
    totalReviews: number
  } | null>(null)

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId)

        let businessData, businessError

        if (isUUID) {
          const result = await supabase
            .from('businesses')
            .select('id, name, description, website, logo_url, google_place_id')
            .eq('id', businessId)
            .single()
          businessData = result.data
          businessError = result.error
        } else {
          const resultWithSlug = await supabase
            .from('businesses')
            .select('id, name, slug, description, website, logo_url, google_place_id')
            .eq('slug', businessId)
            .single()

          if (resultWithSlug.error?.message?.includes('column')) {
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

        if (businessError || !businessData) throw new Error('Business not found')

        setBusiness(businessData)

        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            id, reviewer_name, reviewer_avatar_url, rating, review_text, reviewed_at,
            has_response, response_text, has_video, video_url, video_thumbnail_url,
            has_media, media_urls, media_types,
            review_platforms ( name, slug )
          `)
          .eq('business_id', businessData.id)
          .order('reviewed_at', { ascending: false })
          .limit(50)

        if (!reviewsError && reviewsData) {
          const normalized = reviewsData.map((review) => {
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
              platformIcon: PLATFORM_EMOJI[platformMeta?.slug ?? 'default'] ?? PLATFORM_EMOJI.default,
              hasVideo: review.has_video || false,
              videoUrl: review.video_url,
              videoThumbnail: review.video_thumbnail_url,
              hasMedia: review.has_media || false,
              mediaUrls: review.media_urls || [],
              mediaTypes: review.media_types || [],
            }
          })
          setReviews(normalized)
        }

        // Fetch video reviews
        const videoResponse = await fetch(`/api/video-reviews?businessId=${businessData.id}`)
        if (videoResponse.ok) {
          const videoData = await videoResponse.json()
          setVideoReviews(videoData.videoReviews || [])
        }

        // Fetch AI summary
        const summaryResponse = await fetch('/api/reviews/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: businessData.id }),
        })

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json()
          setAiSummary(summaryData)
        }
      } catch (err) {
        console.error(err)
        setError('Unable to load reviews')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, businessId])

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
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
          mediaTypes: mediaTypes.length > 0 ? mediaTypes : null,
        }),
      })

      if (response.ok) {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
        })

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
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
        // Haptic feedback simulation
        if (navigator.vibrate) navigator.vibrate(10)
      }
      return newSet
    })
  }

  const toggleSave = (reviewId: string) => {
    setSavedReviews((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) newSet.delete(reviewId)
      else newSet.add(reviewId)
      return newSet
    })
  }

  const handleDoubleTap = (reviewId: string) => {
    const now = Date.now()
    if (lastTap.id === reviewId && now - lastTap.time < 300) {
      // Double tap detected!
      toggleLike(reviewId)
      setShowLikeAnimation(reviewId)
      if (navigator.vibrate) navigator.vibrate(10)
      setTimeout(() => setShowLikeAnimation(null), 1000)
    }
    setLastTap({ id: reviewId, time: now })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500"
        />
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-4">😕</p>
          <h1 className="text-3xl font-bold mb-2">Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This page does not exist'}</p>
          <Link href="/" className="text-pink-500 font-semibold hover:underline">
            Go back →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Instagram-style Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/">
              <motion.h1
                className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
              >
                sentra
              </motion.h1>
            </Link>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:block px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold text-sm"
              >
                Follow
              </motion.button>
              <motion.button
                onClick={() => setShowReviewModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-gray-900 rounded-full transition-colors"
              >
                <Camera className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Section - Instagram Style */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-start gap-8 mb-8">
          {/* Profile Picture */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            {business.logo_url ? (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-1 bg-black">
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-5xl font-bold">
                {business.name[0]?.toUpperCase()}
              </div>
            )}
            {/* Verified Badge */}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-4 border-black">
              <Check className="w-5 h-5 text-white" />
            </div>
          </motion.div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold">{business.name}</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full border border-pink-500/30">
                <Award className="w-4 h-4 text-pink-500" />
                <span className="text-sm font-semibold">Verified</span>
              </div>
            </div>

            {/* Stats - Instagram Style */}
            <div className="flex items-center gap-8 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{reviews.length + videoReviews.length}</div>
                <div className="text-sm text-gray-400">reviews</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.floor(Math.random() * 5000 + 10000)}</div>
                <div className="text-sm text-gray-400">followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold flex items-center gap-1">
                  {avgRating}
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                </div>
                <div className="text-sm text-gray-400">rating</div>
              </div>
            </div>

            {/* Bio */}
            {business.description && (
              <p className="text-gray-300 mb-4 max-w-2xl">{business.description}</p>
            )}

            {/* Website Link */}
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-4"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">Visit Website</span>
              </a>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setShowReviewModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 max-w-xs px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-semibold text-sm"
              >
                Leave a Review
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold text-sm transition-colors"
              >
                Share
              </motion.button>
            </div>
          </div>
        </div>

        {/* Story Highlights - Instagram Style */}
        {videoReviews.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {videoReviews.slice(0, 10).map((video, idx) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex-shrink-0 text-center cursor-pointer group"
                >
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-0.5 group-hover:scale-110 transition-transform">
                      <div className="w-full h-full rounded-full bg-black p-1">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.creator_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                            <Video className="w-8 h-8 text-pink-500" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center border-2 border-black">
                      <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 max-w-[80px] truncate">
                    {video.creator_name.split(' ')[0]}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary - Stories Style */}
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
                  <span
                    key={idx}
                    className="px-4 py-2 bg-pink-500/20 rounded-full text-sm border border-pink-500/30"
                  >
                    ✨ {highlight}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab Navigation - Instagram Style */}
        <div className="border-t border-gray-800 mb-6">
          <div className="flex items-center justify-center gap-12">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 py-4 border-t-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-pink-500 text-pink-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wide">All</span>
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-2 py-4 border-t-2 transition-colors ${
                activeTab === 'photos'
                  ? 'border-pink-500 text-pink-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wide">Photos</span>
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex items-center gap-2 py-4 border-t-2 transition-colors ${
                activeTab === 'videos'
                  ? 'border-pink-500 text-pink-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Video className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wide">Videos</span>
            </button>
          </div>
        </div>

        {/* Video Grid */}
        {activeTab === 'videos' && videoReviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {videoReviews.map((video, index) => (
              <VideoReview key={video.id} video={video} index={index} />
            ))}
          </div>
        )}

        {/* Reviews Feed - Instagram Post Style */}
        {(activeTab === 'all' || activeTab === 'photos') && (
          <div className="space-y-8">
            {reviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-black border border-gray-800 rounded-2xl overflow-hidden"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {review.reviewer[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{review.reviewer}</p>
                        {idx % 3 === 0 && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(review.reviewedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-900 rounded-full transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-3">
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.div
                        key={star}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: idx * 0.05 + star * 0.05, type: 'spring' }}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= review.rating
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'fill-gray-700 text-gray-700'
                          }`}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Review Text */}
                  <div
                    onClick={() => handleDoubleTap(review.id)}
                    className="relative cursor-pointer select-none"
                  >
                    <p className="text-gray-200 leading-relaxed mb-3">
                      <span className="font-semibold mr-2">{review.reviewer}</span>
                      {review.text}
                    </p>
                    {/* Like Animation */}
                    <LikeAnimation
                      show={showLikeAnimation === review.id}
                      onComplete={() => setShowLikeAnimation(null)}
                    />
                  </div>

                  {/* Media Gallery */}
                  {review.hasMedia && review.mediaUrls && review.mediaUrls.length > 0 && (
                    <div className="mt-3">
                      <MediaGallery
                        mediaUrls={review.mediaUrls}
                        mediaTypes={review.mediaTypes}
                      />
                    </div>
                  )}
                </div>

                {/* Interaction Buttons - Instagram Style */}
                <div className="px-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.button
                        onClick={() => toggleLike(review.id)}
                        whileTap={{ scale: 0.8 }}
                        className="p-2 hover:bg-gray-900 rounded-full transition-colors"
                      >
                        <Heart
                          className={`w-6 h-6 transition-all ${
                            likedReviews.has(review.id)
                              ? 'fill-red-500 text-red-500 scale-110'
                              : 'text-white hover:text-gray-300'
                          }`}
                        />
                      </motion.button>
                      <button className="p-2 hover:bg-gray-900 rounded-full transition-colors">
                        <MessageCircle className="w-6 h-6" />
                      </button>
                      <button className="p-2 hover:bg-gray-900 rounded-full transition-colors">
                        <Share2 className="w-6 h-6" />
                      </button>
                    </div>
                    <motion.button
                      onClick={() => toggleSave(review.id)}
                      whileTap={{ scale: 0.8 }}
                      className="p-2 hover:bg-gray-900 rounded-full transition-colors"
                    >
                      <Bookmark
                        className={`w-6 h-6 transition-all ${
                          savedReviews.has(review.id)
                            ? 'fill-white text-white'
                            : 'text-white hover:text-gray-300'
                        }`}
                      />
                    </motion.button>
                  </div>

                  {/* Like Count */}
                  <p className="text-sm font-semibold mt-3">
                    {Math.floor(Math.random() * 200 + 50) + (likedReviews.has(review.id) ? 1 : 0)}{' '}
                    likes
                  </p>
                </div>

                {/* Business Response */}
                {review.responded && review.responseText && (
                  <div className="px-4 pb-4">
                    <div className="flex gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-1">{business.name}</p>
                        <p className="text-sm text-gray-300">{review.responseText}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Floating Action Button */}
        <motion.button
          onClick={() => setShowReviewModal(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center z-40"
        >
          <Camera className="w-7 h-7 text-white" />
        </motion.button>
      </div>

      {/* Review Modal - Instagram Story Style */}
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
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h2 className="text-xl font-bold">Create Review</h2>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                {/* Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3">Rate your experience</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Star
                          className={`w-12 h-12 transition-all ${
                            (hoverRating || rating) >= star
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'fill-gray-700 text-gray-700'
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3">
                    Share your experience
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="What did you love? What could be better?"
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-white placeholder:text-gray-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">{reviewText.length}/500</p>
                </div>

                {/* Name */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3">Your name</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Email */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3">
                    Email <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Media Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3">
                    Add photos or videos <span className="text-gray-500">(optional)</span>
                  </label>
                  <MediaUploader
                    onMediaChange={(urls, types) => {
                      setMediaUrls(urls)
                      setMediaTypes(types)
                    }}
                    maxFiles={5}
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  onClick={handleSubmitReview}
                  disabled={submitting || rating === 0 || !reviewText.trim() || !reviewerName.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
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

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-400 mb-4">Powered by sentra AI</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold hover:shadow-xl transition-all"
          >
            Get sentra for your business
          </Link>
        </div>
      </footer>
    </div>
  )
}
