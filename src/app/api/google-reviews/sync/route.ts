import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAllGoogleReviews, normalizeGoogleReview } from '@/lib/integrations/google-reviews'
import { batchAnalyzeReviews } from '@/lib/ai/claude'
import { googleReviewsSyncSchema, validateRequestBody } from '@/lib/validations/api'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  console.log('[Sync] Google reviews sync endpoint called')
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Sync] Unauthorized - no user')
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
    const { businessId } = await validateRequestBody(request, googleReviewsSyncSchema)
    console.log('[Sync] Syncing reviews for business:', businessId)

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id,user_id,google_place_id')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!business.google_place_id) {
      return NextResponse.json({ error: 'This business does not have a Google Place ID configured.' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY is not configured.' }, { status: 500 })
    }

    console.log('[Sync] Fetching reviews from Google Places API...')
    const googleData = await fetchAllGoogleReviews(business.google_place_id, apiKey)
    console.log(`[Sync] Received ${googleData.reviews.length} reviews from Google`)

    if (!googleData.reviews.length) {
      console.log('[Sync] No reviews found, returning empty result')
      return NextResponse.json({ reviews: [], place: googleData.place })
    }

    const { data: platform } = await supabase
      .from('review_platforms')
      .select('id')
      .eq('slug', 'google')
      .single()

    if (!platform) {
      return NextResponse.json({ error: 'Google platform is not configured in review_platforms.' }, { status: 500 })
    }

    const rows = googleData.reviews.map((review) => {
      const normalized = normalizeGoogleReview(review)
      return {
        business_id: businessId,
        platform_id: platform.id,
        platform_review_id: normalized.platform_review_id,
        reviewer_name: normalized.reviewer_name,
        reviewer_avatar_url: normalized.reviewer_avatar_url,
        rating: normalized.rating,
        review_text: normalized.review_text,
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
      .upsert(rows, { onConflict: 'platform_id,platform_review_id' })

    if (upsertError) {
      console.error('Failed to upsert reviews', upsertError)
      return NextResponse.json({ error: 'Failed to save reviews.' }, { status: 500 })
    }

    // Auto-analyze reviews with Claude AI (in background)
    try {
      console.log(`[Claude AI] Starting auto-analysis for ${rows.length} reviews...`)

      // Use the review text and rating from the rows we already normalized
      const reviewsToAnalyze = rows.map(row => ({
        text: row.review_text || '',
        rating: row.rating || 0
      }))

      console.log('[Claude AI] Calling batchAnalyzeReviews...')
      const analyses = await batchAnalyzeReviews(reviewsToAnalyze)
      console.log(`[Claude AI] Received ${analyses.length} analyses`)

      // Update reviews with AI analysis in parallel (batch)
      const updatePromises = rows.map(async (row, i) => {
        const analysis = analyses[i]
        if (!analysis) return

        console.log(`[Claude AI] Updating review ${i + 1}/${rows.length} with analysis:`, {
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
          console.error(`[Claude AI] Error updating review ${i + 1}:`, updateError)
        }
      })

      await Promise.all(updatePromises)

      console.log(`✓ [Claude AI] Successfully analyzed ${analyses.length} reviews`)
    } catch (analysisError) {
      console.error('[Claude AI] Analysis failed (non-blocking):', analysisError)
      // Don't fail the sync if analysis fails
    }

    const response: any = {
      reviews: rows.length,
      place: googleData.place,
    }

    // Add warning if only 5 reviews were synced (Google API limitation)
    if (rows.length === 5) {
      response.warning = 'Only 5 most recent reviews synced (Google Places API limitation)'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Google reviews sync failed', error)
    return NextResponse.json({ error: 'Failed to sync Google reviews.' }, { status: 500 })
  }
}
