import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateBusinessInsights, type BusinessMetrics } from '@/lib/ai/claude'
import { checkRateLimit } from '@/lib/rate-limit'

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

/**
 * Generate AI-powered business insights based on review data
 * GET /api/dashboard/insights?businessId=xxx (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting for AI analysis
    const rateLimitResult = await checkRateLimit(request, 'aiAnalysis', user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many insight requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          },
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const requestedBusinessId = searchParams.get('businessId')

    // Fetch business(es)
    let businessQuery = supabase.from('businesses').select('id, name').eq('user_id', user.id)
    if (requestedBusinessId) {
      businessQuery = businessQuery.eq('id', requestedBusinessId)
    }

    const { data: businesses, error: businessesError } = await businessQuery

    if (businessesError) {
      console.error('Failed to load businesses', businessesError)
      return NextResponse.json({ error: 'Unable to load data' }, { status: 500 })
    }

    if (!businesses || businesses.length === 0) {
      return NextResponse.json(
        { error: 'No businesses found. Please add a business first.' },
        { status: 404 }
      )
    }

    const businessIds = businesses.map((biz) => biz.id)
    const businessName = businesses[0].name

    // Fetch recent reviews for AI insights (limit to 100 most recent for performance)
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id,business_id,platform_id,rating,sentiment,reviewed_at,has_response,responded_at,categories,sentiment_score')
      .in('business_id', businessIds)
      .order('reviewed_at', { ascending: false })
      .limit(100)

    if (reviewsError) {
      console.error('Failed to load reviews', reviewsError)
      return NextResponse.json({ error: 'Unable to load data' }, { status: 500 })
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        {
          error: 'Not enough data to generate insights. Please sync reviews from your platforms first.',
          insights: [],
          summary: 'No reviews available for analysis.',
          strengths: [],
          opportunities: []
        },
        { status: 200 }
      )
    }

    // Fetch platform data
    const { data: platformRecords } = await supabase
      .from('review_platforms')
      .select('id,name,slug')

    const platformLookup = new Map<string, PlatformRecord>()
    platformRecords?.forEach((platform) => platformLookup.set(platform.id, platform))

    // Calculate metrics
    const totalReviews = reviews.length
    const respondedReviews = reviews.filter((review) => review.has_response && review.responded_at)
    const responseRate = totalReviews > 0 ? respondedReviews.length / totalReviews : 0
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / totalReviews
      : 0

    // Sentiment breakdown
    const sentimentBreakdown = {
      positive: reviews.filter((r) => r.sentiment === 'positive').length,
      neutral: reviews.filter((r) => r.sentiment === 'neutral').length,
      negative: reviews.filter((r) => r.sentiment === 'negative').length,
    }

    // Top categories
    const categoryCounter = new Map<string, number>()
    reviews.forEach((review) => {
      review.categories?.forEach((category: string) => {
        categoryCounter.set(category, (categoryCounter.get(category) ?? 0) + 1)
      })
    })

    const topCategories = Array.from(categoryCounter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    // Platform performance
    const platformCounts = new Map<string, { reviewCount: number; totalRating: number }>()
    reviews.forEach((review) => {
      const existing = platformCounts.get(review.platform_id) ?? { reviewCount: 0, totalRating: 0 }
      existing.reviewCount += 1
      existing.totalRating += Number(review.rating)
      platformCounts.set(review.platform_id, existing)
    })

    const platformPerformance = Array.from(platformCounts.entries()).map(([platformId, data]) => {
      const platform = platformLookup.get(platformId)
      return {
        platform: platform?.name ?? 'Unknown',
        reviewCount: data.reviewCount,
        avgRating: data.totalRating / data.reviewCount,
      }
    })

    // Response time metrics
    const responseDiffs = respondedReviews.map((review) => {
      const respondedAt = new Date(review.responded_at as string).getTime()
      const reviewedAt = new Date(review.reviewed_at).getTime()
      return respondedAt - reviewedAt
    })
    const medianHours = responseDiffs.length
      ? Math.round(median(responseDiffs) / (1000 * 60 * 60))
      : 0
    const sameDayPercentage = responseDiffs.length
      ? (responseDiffs.filter((diff) => diff <= 24 * 60 * 60 * 1000).length / responseDiffs.length) * 100
      : 0

    // Calculate trends
    const now = Date.now()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    const recentReviews = reviews.filter((r) => new Date(r.reviewed_at).getTime() >= now - thirtyDaysMs)
    const olderReviews = reviews.filter((r) => new Date(r.reviewed_at).getTime() < now - thirtyDaysMs)

    const reviewVelocity =
      olderReviews.length === 0
        ? 'increasing'
        : recentReviews.length > olderReviews.length
        ? 'increasing'
        : recentReviews.length < olderReviews.length
        ? 'decreasing'
        : 'stable'

    const recentAvgSentiment = recentReviews.length > 0
      ? recentReviews.reduce((sum, r) => sum + (r.sentiment_score ?? 0), 0) / recentReviews.length
      : 0
    const olderAvgSentiment = olderReviews.length > 0
      ? olderReviews.reduce((sum, r) => sum + (r.sentiment_score ?? 0), 0) / olderReviews.length
      : 0

    const sentimentTrend =
      olderReviews.length === 0
        ? 'stable'
        : recentAvgSentiment > olderAvgSentiment + 0.1
        ? 'improving'
        : recentAvgSentiment < olderAvgSentiment - 0.1
        ? 'declining'
        : 'stable'

    // Build metrics object
    const metrics: BusinessMetrics = {
      totalReviews,
      avgRating,
      responseRate,
      sentimentBreakdown,
      topCategories,
      platformPerformance,
      responseTime: {
        medianHours,
        sameDayPercentage,
      },
      recentTrends: {
        reviewVelocity,
        sentimentTrend,
      },
    }

    console.log('[Insights] Generating AI insights for:', businessName)
    console.log('[Insights] Metrics:', JSON.stringify(metrics, null, 2))

    // Generate AI insights using Claude
    try {
      const insights = await generateBusinessInsights(businessName, metrics)
      console.log('[Insights] Successfully generated insights')
      return NextResponse.json(insights)
    } catch (aiError) {
      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError)

      // Check if it's an Anthropic API credit issue
      if (errorMessage.includes('credit balance is too low') || errorMessage.includes('insufficient_quota')) {
        console.error('[Insights] Anthropic API credits depleted')
        return NextResponse.json(
          {
            error: 'AI insights temporarily unavailable',
            message: 'The AI analysis feature requires Anthropic API credits. Please add credits to your Anthropic account or contact support.',
            insights: [],
            summary: 'AI insights are currently unavailable due to API credit limitations.',
            strengths: [],
            opportunities: []
          },
          { status: 503 }
        )
      }

      // Other AI errors
      throw aiError
    }
  } catch (error) {
    console.error('Dashboard insights error', error)
    return NextResponse.json(
      {
        error: 'Failed to generate insights',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        insights: [],
        summary: 'Unable to generate insights at this time.',
        strengths: [],
        opportunities: []
      },
      { status: 500 }
    )
  }
}
