'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Review {
  id: string
  business_id: string
  platform_id: string
  platform_review_id: string
  reviewer_name: string
  reviewer_avatar_url: string | null
  rating: number
  review_text: string
  review_url: string | null
  reviewed_at: string
  sentiment: string | null
  sentiment_score: number | null
  keywords: string[] | null
  categories: string[] | null
  language: string | null
  is_spam: boolean
  has_response: boolean
  response_text: string | null
  responded_at: string | null
  created_at: string
  platform?: {
    name: string
    slug: string
    icon_emoji: string
  }
}

interface UseReviewsOptions {
  filter?: 'all' | 'positive' | 'negative'
  search?: string
  limit?: number
  offset?: number
}

export function useReviews(businessId: string | undefined, options: UseReviewsOptions = {}) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!businessId) {
      setLoading(false)
      return
    }

    const fetchReviews = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        let query = supabase
          .from('reviews')
          .select('*, platform:review_platforms(name, slug, icon_emoji)', { count: 'exact' })
          .eq('business_id', businessId)
          .order('reviewed_at', { ascending: false })

        // Apply filters
        if (options.filter === 'positive') {
          query = query.gte('rating', 4)
        } else if (options.filter === 'negative') {
          query = query.lte('rating', 3)
        }

        // Apply search
        if (options.search) {
          query = query.or(`review_text.ilike.%${options.search}%,reviewer_name.ilike.%${options.search}%`)
        }

        // Apply pagination
        if (options.limit) {
          query = query.limit(options.limit)
        }
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 25) - 1)
        }

        const { data, error: fetchError, count } = await query

        if (fetchError) throw fetchError

        setReviews(data || [])
        setTotal(count || 0)
      } catch (err) {
        console.error('Error fetching reviews:', err)
        setError(err instanceof Error ? err.message : 'Failed to load reviews')
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [businessId, options.filter, options.search, options.limit, options.offset])

  return { reviews, loading, error, total }
}
