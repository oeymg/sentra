import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchRedditReviews, normalizeRedditReview } from '@/lib/integrations/reddit'
import { batchAnalyzeReviews } from '@/lib/ai/claude'
import { redditReviewsSyncSchema, validateRequestBody } from '@/lib/validations/api'
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
    const rateLimitResult = await checkRateLimit(request, 'sync', user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many sync requests. Please try again later.' },
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
    const { businessId, subreddits } = await validateRequestBody(request, redditReviewsSyncSchema)

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id,user_id,name')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!business.name) {
      return NextResponse.json({ error: 'Business name is required for Reddit search.' }, { status: 400 })
    }

    const subredditList = subreddits || ['reviews', 'AskReddit']
    const redditReviews = await fetchRedditReviews(business.name, subredditList, 25)

    if (!redditReviews.length) {
      return NextResponse.json({
        reviews: 0,
        message: 'No Reddit mentions found for this business'
      })
    }

    const { data: platform } = await supabase
      .from('review_platforms')
      .select('id')
      .eq('slug', 'reddit')
      .single()

    if (!platform) {
      return NextResponse.json({ error: 'Reddit platform is not configured in review_platforms.' }, { status: 500 })
    }

    const rows = redditReviews.map((review) => {
      const normalized = normalizeRedditReview(review)
      return {
        business_id: businessId,
        platform_id: platform.id,
        platform_review_id: normalized.platform_review_id,
        reviewer_name: normalized.reviewer_name,
        reviewer_avatar_url: normalized.reviewer_avatar_url,
        rating: normalized.rating,
        review_text: normalized.review_text,
        review_url: normalized.review_url,
        reviewed_at: normalized.reviewed_at,
        sentiment: null,
        sentiment_score: null,
        keywords: null,
        categories: null,
        language: null,
        is_spam: false,
        has_response: normalized.has_response,
        response_text: normalized.response_text,
        responded_at: normalized.responded_at,
      }
    })

    const { error: upsertError } = await supabase
      .from('reviews')
      .upsert(rows, {
        onConflict: 'platform_id,platform_review_id',
        ignoreDuplicates: false,
      })
      .select('id')

    if (upsertError) {
      console.error('[Sync] Failed to upsert Reddit reviews - RLS policy violation or database error:', {
        code: upsertError.code,
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
      })

      // Provide helpful error message
      if (upsertError.code === '42501') {
        return NextResponse.json({
          error: 'Database permission error. Please run the RLS policy fix: See FIX_RLS_POLICIES.sql',
          details: 'Row Level Security (RLS) is blocking review inserts. Update your Supabase RLS policies.'
        }, { status: 500 })
      }

      return NextResponse.json({
        error: 'Failed to save reviews.',
        details: upsertError.message
      }, { status: 500 })
    }

    // Auto-analyze reviews with Claude AI (in background)
    try {
      console.log(`[Claude AI] Starting auto-analysis for ${rows.length} Reddit reviews...`)

      // Use the review text and rating from the rows we already normalized
      const reviewsToAnalyze = rows.map(row => ({
        text: row.review_text || '',
        rating: row.rating || 0
      }))

      console.log('[Claude AI] Calling batchAnalyzeReviews for Reddit...')
      const analyses = await batchAnalyzeReviews(reviewsToAnalyze)
      console.log(`[Claude AI] Received ${analyses.length} analyses for Reddit`)

      // Update reviews with AI analysis in parallel (batch)
      const updatePromises = rows.map(async (row, i) => {
        const analysis = analyses[i]
        if (!analysis) return

        console.log(`[Claude AI] Updating Reddit review ${i + 1}/${rows.length} with analysis:`, {
          sentiment: analysis.sentiment,
          keywords: analysis.keywords?.length || 0,
          categories: analysis.categories?.length || 0,
        })

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
          .eq('platform_id', row.platform_id)
          .eq('platform_review_id', row.platform_review_id)

        if (updateError) {
          console.error(`[Claude AI] Error updating Reddit review ${i + 1}:`, updateError)
        }
      })

      await Promise.all(updatePromises)

      console.log(`✓ [Claude AI] Successfully analyzed ${analyses.length} Reddit reviews`)
    } catch (analysisError) {
      console.error('[Claude AI] Analysis failed (non-blocking):', analysisError)
      // Don't fail the sync if analysis fails
    }

    return NextResponse.json({
      reviews: rows.length,
      subreddits: subredditList,
      message: `Successfully synced ${rows.length} Reddit mentions`,
    })
  } catch (error) {
    console.error('Reddit reviews sync failed', error)
    return NextResponse.json({ error: 'Failed to sync Reddit reviews.' }, { status: 500 })
  }
}
