'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getDesignVariant } from '@/lib/constants/industries'
import SocialReviewHub from '@/components/review-hub/SocialReviewHub'
import ProfessionalReviewHub from '@/components/review-hub/ProfessionalReviewHub'
import { motion } from 'framer-motion'

type Business = {
  id: string
  name: string
  slug?: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  google_place_id: string | null
  industry: string | null
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

export default function ReviewHubPage() {
  const params = useParams()
  const businessId = params.businessId as string
  const supabase = useMemo(() => createClient(), [])

  const [business, setBusiness] = useState<Business | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [videoReviews, setVideoReviews] = useState<VideoReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
            .select('id, name, description, website, logo_url, google_place_id, industry')
            .eq('id', businessId)
            .single()
          businessData = result.data
          businessError = result.error
        } else {
          const resultWithSlug = await supabase
            .from('businesses')
            .select('id, name, slug, description, website, logo_url, google_place_id, industry')
            .eq('slug', businessId)
            .single()

          if (resultWithSlug.error?.message?.includes('column')) {
            const resultById = await supabase
              .from('businesses')
              .select('id, name, description, website, logo_url, google_place_id, industry')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600"
        />
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-4">😕</p>
          <h1 className="text-3xl font-bold mb-2">Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This page does not exist'}</p>
          <a href="/" className="text-blue-600 font-semibold hover:underline">
            Go back →
          </a>
        </div>
      </div>
    )
  }

  // Determine design variant based on business industry
  const designVariant = getDesignVariant(business.industry)

  // Render appropriate component based on design variant
  if (designVariant === 'professional') {
    return (
      <ProfessionalReviewHub
        business={business}
        reviews={reviews}
        videoReviews={videoReviews}
        aiSummary={aiSummary}
      />
    )
  }

  return (
    <SocialReviewHub
      business={business}
      reviews={reviews}
      videoReviews={videoReviews}
      aiSummary={aiSummary}
    />
  )
}
