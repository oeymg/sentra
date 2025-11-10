import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId, replyText, isDryRun = true } = await request.json()

    if (!reviewId || !replyText?.trim()) {
      return NextResponse.json({ error: 'Review ID and reply text are required' }, { status: 400 })
    }

    // Fetch the review with business and platform info
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(
        `
        *,
        businesses!inner(user_id, name),
        review_platforms!inner(slug, name)
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

    const platformSlug = review.review_platforms.slug

    // For MVP: Only support dry run (save to database but don't actually post)
    // This allows businesses to trial the feature without needing full OAuth setup
    if (isDryRun) {
      // Save the response to the database as if it was posted
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          has_response: true,
          response_text: replyText.trim(),
          responded_at: new Date().toISOString(),
        })
        .eq('id', reviewId)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,
        isDryRun: true,
        message: 'Response saved locally. To post directly to platforms, upgrade to enable OAuth integration.',
      })
    }

    // For future: Real platform posting (requires OAuth)
    if (platformSlug === 'google') {
      // Check if business has Google OAuth connected
      const { data: platform } = await supabase
        .from('business_platforms')
        .select('access_token, google_location_id, google_account_id')
        .eq('business_id', review.business_id)
        .eq('platform_id', review.platform_id)
        .single()

      if (!platform?.access_token) {
        return NextResponse.json(
          {
            error: 'Google My Business not connected',
            message: 'Please connect your Google My Business account in Settings to post replies directly.',
          },
          { status: 400 }
        )
      }

      // Post to Google My Business API
      const response = await fetch(
        `https://mybusiness.googleapis.com/v4/accounts/${platform.google_account_id}/locations/${platform.google_location_id}/reviews/${review.platform_review_id}/reply`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${platform.access_token}`,
          },
          body: JSON.stringify({
            comment: replyText.trim(),
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Google API error:', errorText)

        // Check if token expired
        if (response.status === 401) {
          return NextResponse.json(
            {
              error: 'Google authentication expired',
              message: 'Please reconnect your Google My Business account in Settings.',
            },
            { status: 401 }
          )
        }

        throw new Error(`Failed to post to Google: ${errorText}`)
      }

      // Update database with the posted response
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          has_response: true,
          response_text: replyText.trim(),
          responded_at: new Date().toISOString(),
        })
        .eq('id', reviewId)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,
        isDryRun: false,
        message: 'Response posted to Google successfully!',
      })
    }

    // Other platforms not yet supported
    return NextResponse.json(
      {
        error: 'Platform not supported',
        message: `Direct posting to ${platformSlug} is not yet available. Only local saving is supported.`,
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error posting reply:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
