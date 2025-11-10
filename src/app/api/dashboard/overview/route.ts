import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ReviewRow = {
  id: string
  business_id: string
  platform_id: string
  rating: number
  sentiment: 'positive' | 'neutral' | 'negative' | null
  reviewed_at: string
  has_response: boolean
  responded_at: string | null
  categories: string[] | null
  sentiment_score: number | null
}

type PlatformRecord = {
  id: string
  name: string
  slug: string
  icon_url: string | null
}

const MONTHS_TO_SHOW = 6

const PLATFORM_EMOJI: Record<string, string> = {
  google: '🔍',
  yelp: '🍽️',
  facebook: '📘',
  trustpilot: '⭐',
  tripadvisor: '🧭',
  amazon: '🛒',
  'app-store': '📱',
  'play-store': '▶️',
  default: '💬',
}

function getMonthBuckets() {
  const buckets: Date[] = []
  const now = new Date()
  for (let i = MONTHS_TO_SHOW - 1; i >= 0; i--) {
    const ref = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    ref.setUTCMonth(ref.getUTCMonth() - i)
    buckets.push(ref)
  }
  return buckets
}

function isSameMonth(date: Date, bucket: Date) {
  return date.getUTCFullYear() === bucket.getUTCFullYear() && date.getUTCMonth() === bucket.getUTCMonth()
}

function formatMonth(date: Date) {
  return date.toLocaleString('en-US', { month: 'short' })
}

function median(values: number[]) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedBusinessId = searchParams.get('businessId')

    let businessQuery = supabase.from('businesses').select('id').eq('user_id', user.id)
    if (requestedBusinessId) {
      businessQuery = businessQuery.eq('id', requestedBusinessId)
    }

    const { data: businesses, error: businessesError } = await businessQuery

    if (businessesError) {
      console.error('Failed to load businesses', businessesError)
      return NextResponse.json({ error: 'Unable to load data' }, { status: 500 })
    }

    if (requestedBusinessId && (!businesses || businesses.length === 0)) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({
        stats: {
          businessCount: 0,
          connectedPlatforms: 0,
          totalReviews: 0,
          aiResponses: 0,
          avgRating: 0,
          responseRate: 0,
          pendingReviews: 0,
          weeklyChange: 0,
        },
        reviewTrend: getMonthBuckets().map((bucket) => ({
          month: formatMonth(bucket),
          reviews: 0,
          responses: 0,
          avgRating: 0,
        })),
        sentimentBreakdown: [
          { label: 'Positive', value: 0 },
          { label: 'Neutral', value: 0 },
          { label: 'Negative', value: 0 },
        ],
        platformPerformance: [],
        categoryBreakdown: [],
        latestReviews: [],
        responseTime: {
          medianHours: null,
          sameDayPercent: 0,
        },
      })
    }

    const businessIds = businesses.map((biz) => biz.id)

    // Fetch all reviews for accurate statistics
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id,business_id,platform_id,rating,sentiment,reviewed_at,has_response,responded_at,categories,sentiment_score')
      .in('business_id', businessIds)
      .order('reviewed_at', { ascending: false })

    if (reviewsError) {
      console.error('Failed to load reviews', reviewsError)
      return NextResponse.json({ error: 'Unable to load data' }, { status: 500 })
    }

    const reviewIds = reviews?.map((review) => review.id) ?? []
    let aiResponsesCount = 0

    if (reviewIds.length > 0) {
      const { count } = await supabase
        .from('ai_responses')
        .select('id', { count: 'exact', head: true })
        .in('review_id', reviewIds)

      aiResponsesCount = count ?? 0
    }

    const { data: platformRecords } = await supabase
      .from('review_platforms')
      .select('id,name,slug,icon_url')

    const platformLookup = new Map<string, PlatformRecord>()
    platformRecords?.forEach((platform) => platformLookup.set(platform.id, platform))

    const { data: connections } = await supabase
      .from('business_platforms')
      .select('platform_id')
      .in('business_id', businessIds)

    const connectedPlatforms = new Set(connections?.map((c) => c.platform_id))

    const totalReviews = reviews?.length ?? 0
    const respondedReviews = reviews?.filter((review) => review.has_response && review.responded_at) ?? []
    const responseRate = totalReviews > 0 ? Math.round((respondedReviews.length / totalReviews) * 100) : 0
    const avgRating =
      totalReviews > 0 ? Number((reviews!.reduce((sum, review) => sum + Number(review.rating), 0) / totalReviews).toFixed(2)) : 0
    const pendingReviews = totalReviews - respondedReviews.length

    const now = Date.now()
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    const currentWindowStart = now - sevenDaysMs
    const previousWindowStart = now - sevenDaysMs * 2

    const currentWeek = reviews?.filter((review) => new Date(review.reviewed_at).getTime() >= currentWindowStart).length ?? 0
    const previousWeek =
      reviews?.filter((review) => {
        const reviewedAt = new Date(review.reviewed_at).getTime()
        return reviewedAt >= previousWindowStart && reviewedAt < currentWindowStart
      }).length ?? 0

    const weeklyChange =
      previousWeek === 0 ? (currentWeek > 0 ? 100 : 0) : Math.round(((currentWeek - previousWeek) / previousWeek) * 100)

    const buckets = getMonthBuckets()
    const reviewTrend = buckets.map((bucket) => {
      const bucketReviews = (reviews || []).filter((review) =>
        isSameMonth(new Date(review.reviewed_at), bucket)
      )
      const bucketResponses = bucketReviews.filter((review) => review.has_response).length
      const bucketAvg =
        bucketReviews.length > 0
          ? Number((bucketReviews.reduce((sum, review) => sum + Number(review.rating), 0) / bucketReviews.length).toFixed(2))
          : 0

      return {
        month: formatMonth(bucket),
        reviews: bucketReviews.length,
        responses: bucketResponses,
        avgRating: bucketAvg,
      }
    })

    const sentimentBreakdown = ['positive', 'neutral', 'negative'].map((label) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value: reviews?.filter((review) => review.sentiment === label).length ?? 0,
    }))

    const platformCounts = new Map<
      string,
      { platform: string; slug: string; reviews: number; responded: number; icon: string }
    >()

    reviews?.forEach((review) => {
      const platform = platformLookup.get(review.platform_id)
      const slug = platform?.slug ?? 'default'
      const existing = platformCounts.get(review.platform_id) ?? {
        platform: platform?.name ?? 'Unknown Platform',
        slug,
        reviews: 0,
        responded: 0,
        icon: PLATFORM_EMOJI[slug] ?? PLATFORM_EMOJI.default,
      }

      existing.reviews += 1
      if (review.has_response) existing.responded += 1

      platformCounts.set(review.platform_id, existing)
    })

    const platformPerformance = Array.from(platformCounts.values())
      .map((entry) => ({
        platform: entry.platform,
        icon: entry.icon,
        reviews: entry.reviews,
        responseRate: entry.reviews > 0 ? Math.round((entry.responded / entry.reviews) * 100) : 0,
      }))
      .sort((a, b) => b.reviews - a.reviews)

    const categoryCounter = new Map<string, number>()
    reviews?.forEach((review) => {
      review.categories?.forEach((category: string) => {
        categoryCounter.set(category, (categoryCounter.get(category) ?? 0) + 1)
      })
    })

    const categoryBreakdown = Array.from(categoryCounter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        share: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0,
      }))

    const latestReviews = (reviews || [])
      .sort((a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime())
      .slice(0, 5)
      .map((review) => {
        const platform = platformLookup.get(review.platform_id)
        return {
          id: review.id,
          platform: platform?.name ?? 'Unknown',
          rating: review.rating,
          sentiment: review.sentiment,
          reviewed_at: review.reviewed_at,
          has_response: review.has_response,
        }
      })

    const responseDiffs = respondedReviews.map((review) => {
      const respondedAt = new Date(review.responded_at as string).getTime()
      const reviewedAt = new Date(review.reviewed_at).getTime()
      return respondedAt - reviewedAt
    })
    const medianHours = responseDiffs.length ? Math.round(median(responseDiffs) / (1000 * 60 * 60)) : null
    const sameDayPercent = responseDiffs.length
      ? Math.round((responseDiffs.filter((diff) => diff <= 24 * 60 * 60 * 1000).length / responseDiffs.length) * 100)
      : 0

    return NextResponse.json({
      stats: {
        businessCount: businessIds.length,
        connectedPlatforms: connectedPlatforms.size,
        totalReviews,
        aiResponses: aiResponsesCount,
        avgRating,
        responseRate,
        pendingReviews,
        weeklyChange,
      },
      reviewTrend,
      sentimentBreakdown,
      platformPerformance,
      categoryBreakdown,
      latestReviews,
      responseTime: {
        medianHours,
        sameDayPercent,
      },
    })
  } catch (error) {
    console.error('Dashboard overview error', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
