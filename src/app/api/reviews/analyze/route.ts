import { createClient } from '@/lib/supabase/server'
import { analyzeReview } from '@/lib/ai/claude'
import { NextRequest, NextResponse } from 'next/server'
import { reviewAnalyzeSchema, validateRequestBody } from '@/lib/validations/api'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(request, 'aiAnalysis', user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many analysis requests. Please try again later.' },
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

    // Validate request body
    const { reviewId } = await validateRequestBody(request, reviewAnalyzeSchema)

    // Fetch the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(
        `
        *,
        businesses!inner(user_id)
      `
      )
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check authorization
    if (review.businesses.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Analyze the review
    const analysis = await analyzeReview(review.review_text || '', review.rating)

    // Update the review with analysis
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentimentScore,
        keywords: analysis.keywords,
        categories: analysis.categories,
        language: analysis.language,
        is_spam: analysis.isSpam,
      })
      .eq('id', reviewId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('Error analyzing review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
