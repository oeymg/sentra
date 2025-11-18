import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { fetchTripAdvisorReviews, normalizeTripAdvisorReview } from '@/lib/integrations/tripadvisor'
import { batchAnalyzeReviews } from '@/lib/ai/claude'
import { checkRateLimit } from '@/lib/rate-limit'
import { tripAdvisorSyncSchema, validateRequestBody } from '@/lib/validations/api'

export async function POST(request: NextRequest) {
  console.log('[TripAdvisor Sync] Sync endpoint called')
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('[TripAdvisor Sync] Unauthorized - no user')
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

    let parsedBody
    try {
      parsedBody = await validateRequestBody(request, tripAdvisorSyncSchema)
    } catch (validationError) {
      const message =
        validationError instanceof Error ? validationError.message : 'Invalid request body'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { businessId, tripAdvisorUrl } = parsedBody

    console.log('[TripAdvisor Sync] Syncing reviews for business:', businessId)

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id,user_id,name,tripadvisor_url')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedTripAdvisorUrl = tripAdvisorUrl ?? business.tripadvisor_url

    if (!resolvedTripAdvisorUrl) {
      return NextResponse.json(
        { error: 'This business does not have a TripAdvisor URL configured.' },
        { status: 400 }
      )
    }

    // Get TripAdvisor platform ID
    const { data: platform } = await supabase
      .from('review_platforms')
      .select('id')
      .eq('slug', 'tripadvisor')
      .single()

    if (!platform) {
      return NextResponse.json(
        { error: 'TripAdvisor platform is not configured in review_platforms.' },
        { status: 500 }
      )
    }

    console.log(
      '[TripAdvisor Sync] Fetching reviews from TripAdvisor using Claude AI...',
      resolvedTripAdvisorUrl
    )
    const tripAdvisorReviews = await fetchTripAdvisorReviews(resolvedTripAdvisorUrl)
    console.log(`[TripAdvisor Sync] Received ${tripAdvisorReviews.length} reviews from TripAdvisor`)

    if (!tripAdvisorReviews.length) {
      console.log('[TripAdvisor Sync] No reviews found')
      return NextResponse.json({
        reviews: 0,
        message: 'No reviews found on TripAdvisor page',
      })
    }

    const rows = tripAdvisorReviews.map((review) => {
      const normalized = normalizeTripAdvisorReview(review)
      return {
        business_id: businessId,
        platform_id: platform.id,
        platform_review_id: normalized.platform_review_id,
        reviewer_name: normalized.reviewer_name,
        reviewer_avatar_url: normalized.reviewer_avatar_url,
        rating: normalized.rating,
        review_text: normalized.review_text,
        review_url: resolvedTripAdvisorUrl,
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

    const canUseServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const dbClient = canUseServiceRole ? createServiceRoleClient() : supabase

    if (!canUseServiceRole) {
      console.warn('[TripAdvisor Sync] SUPABASE_SERVICE_ROLE_KEY not configured, using user-scoped client.')
    } else {
      console.log('[TripAdvisor Sync] Upserting reviews with service role client...')
    }

    const { error: upsertError } = await dbClient
      .from('reviews')
      .upsert(rows, {
        onConflict: 'platform_id,platform_review_id',
        ignoreDuplicates: false,
      })
      .select('id')

    if (upsertError) {
      console.error('[TripAdvisor Sync] Failed to upsert reviews:', {
        code: upsertError.code,
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
      })

      return NextResponse.json(
        {
          error: 'Failed to save reviews.',
          details: upsertError.message,
        },
        { status: 500 }
      )
    }

    console.log(`[TripAdvisor Sync] Successfully upserted ${rows.length} reviews`)

    // Auto-analyze reviews with Claude AI (in background)
    try {
      console.log(`[Claude AI] Starting auto-analysis for ${rows.length} TripAdvisor reviews...`)

      const reviewsToAnalyze = rows.map((row) => ({
        text: row.review_text || '',
        rating: row.rating || 0,
        existingResponse: row.response_text,
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
          aiDetectedResponse: analysis.hasBusinessResponse,
        })

        const updateData: any = {
          sentiment: analysis.sentiment,
          sentiment_score: analysis.sentimentScore,
          keywords: analysis.keywords,
          categories: analysis.categories,
          language: analysis.language,
          is_spam: analysis.isSpam,
        }

        // If AI detected a response and the review doesn't have one yet, update it
        if (analysis.hasBusinessResponse && !row.has_response && analysis.businessResponseText) {
          console.log(`[Claude AI] AI detected business response in review ${i + 1}`)
          updateData.has_response = true
          updateData.response_text = analysis.businessResponseText
          updateData.responded_at = new Date().toISOString()
        }

        const { error: updateError } = await dbClient
          .from('reviews')
          .update(updateData)
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

    return NextResponse.json({
      reviews: rows.length,
      message: `Successfully synced ${rows.length} TripAdvisor reviews using AI`,
    })
  } catch (error) {
    console.error('TripAdvisor reviews sync failed', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to sync TripAdvisor reviews.', details: errorMessage },
      { status: 500 }
    )
  }
}
