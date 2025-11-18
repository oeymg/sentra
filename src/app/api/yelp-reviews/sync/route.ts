import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { fetchYelpReviews, normalizeYelpReview } from '@/lib/integrations/yelp'
import { batchAnalyzeReviews } from '@/lib/ai/claude'
import { checkRateLimit } from '@/lib/rate-limit'

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  console.log('[Yelp Sync] Yelp reviews sync endpoint called')
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Yelp Sync] Unauthorized - no user')
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

    // Parse request body
    const body = await request.json()
    const { businessId } = body

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    console.log('[Yelp Sync] Syncing reviews for business:', businessId)

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id,user_id,yelp_business_id')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!business.yelp_business_id) {
      return NextResponse.json(
        { error: 'This business does not have a Yelp Business ID configured.' },
        { status: 400 }
      )
    }

    // Get Yelp platform ID
    const { data: platform } = await supabase
      .from('review_platforms')
      .select('id')
      .eq('slug', 'yelp')
      .single()

    if (!platform) {
      return NextResponse.json(
        { error: 'Yelp platform is not configured in review_platforms.' },
        { status: 500 }
      )
    }

    // Check last sync time from business_platforms table
    const { data: businessPlatform } = await supabase
      .from('business_platforms')
      .select('last_synced_at')
      .eq('business_id', businessId)
      .eq('platform_id', platform.id)
      .single()

    if (businessPlatform?.last_synced_at) {
      const lastSyncTime = new Date(businessPlatform.last_synced_at).getTime()
      const now = Date.now()
      const timeSinceLastSync = now - lastSyncTime

      if (timeSinceLastSync < TWENTY_FOUR_HOURS_MS) {
        const hoursRemaining = Math.ceil((TWENTY_FOUR_HOURS_MS - timeSinceLastSync) / (1000 * 60 * 60))
        const nextSyncTime = new Date(lastSyncTime + TWENTY_FOUR_HOURS_MS)

        console.log(
          `[Yelp Sync] Rate limit: Last sync was ${Math.floor(timeSinceLastSync / (1000 * 60 * 60))} hours ago. Next sync available in ${hoursRemaining} hours.`
        )

        return NextResponse.json(
          {
            error: 'Yelp API rate limit: Reviews can only be synced once every 24 hours',
            details: `Next sync available in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}`,
            nextSyncAvailable: nextSyncTime.toISOString(),
            lastSyncedAt: businessPlatform.last_synced_at,
          },
          { status: 429 }
        )
      }
    }

    const apiKey = process.env.YELP_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'YELP_API_KEY is not configured.' }, { status: 500 })
    }

    console.log('[Yelp Sync] Fetching reviews from Yelp API...')
    const yelpReviews = await fetchYelpReviews(business.yelp_business_id, apiKey)
    console.log(`[Yelp Sync] Received ${yelpReviews.length} reviews from Yelp`)

    if (!yelpReviews.length) {
      console.log('[Yelp Sync] No reviews found, updating sync time anyway')

      // Update last_synced_at even if no reviews found
      const serviceClient = createServiceRoleClient()
      await serviceClient
        .from('business_platforms')
        .upsert({
          business_id: businessId,
          platform_id: platform.id,
          last_synced_at: new Date().toISOString(),
        })

      return NextResponse.json({ reviews: 0, message: 'No reviews found' })
    }

    const rows = yelpReviews.map((review) => {
      const normalized = normalizeYelpReview(review)
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

    // Use service role client to bypass RLS for syncing reviews (trusted server-side operation)
    console.log('[Yelp Sync] Upserting reviews with service role client...')
    const serviceClient = createServiceRoleClient()
    const { error: upsertError } = await serviceClient
      .from('reviews')
      .upsert(rows, {
        onConflict: 'platform_id,platform_review_id',
        ignoreDuplicates: false,
      })
      .select('id')

    if (upsertError) {
      console.error('[Yelp Sync] Failed to upsert reviews:', {
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

    console.log(`[Yelp Sync] Successfully upserted ${rows.length} reviews`)

    // Update last_synced_at in business_platforms
    const { error: platformUpdateError } = await serviceClient
      .from('business_platforms')
      .upsert({
        business_id: businessId,
        platform_id: platform.id,
        last_synced_at: new Date().toISOString(),
      })

    if (platformUpdateError) {
      console.error('[Yelp Sync] Failed to update last_synced_at:', platformUpdateError)
      // Don't fail the sync if this update fails
    } else {
      console.log('[Yelp Sync] Updated last_synced_at timestamp')
    }

    // Auto-analyze reviews with Claude AI (in background)
    try {
      console.log(`[Claude AI] Starting auto-analysis for ${rows.length} Yelp reviews...`)

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

        const { error: updateError } = await serviceClient
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

    const response: any = {
      reviews: rows.length,
      syncedAt: new Date().toISOString(),
      nextSyncAvailable: new Date(Date.now() + TWENTY_FOUR_HOURS_MS).toISOString(),
    }

    // Note about Yelp API limitations
    if (rows.length === 3) {
      response.note = 'Yelp API returns only the 3 most recent reviews'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Yelp reviews sync failed', error)
    return NextResponse.json({ error: 'Failed to sync Yelp reviews.' }, { status: 500 })
  }
}
