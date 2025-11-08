'use server'

import { NextRequest, NextResponse } from 'next/server'
import { fetchAllGoogleReviews, normalizeGoogleReview } from '@/lib/integrations/google-reviews'

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing GOOGLE_PLACES_API_KEY on the server.' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get('placeId')

  if (!placeId) {
    return NextResponse.json(
      { error: 'Query param "placeId" is required.' },
      { status: 400 }
    )
  }

  try {
    const { reviews, place } = await fetchAllGoogleReviews(placeId, apiKey)

    return NextResponse.json({
      placeId,
      place,
      count: reviews.length,
      reviews: reviews.map(normalizeGoogleReview),
    })
  } catch (error) {
    console.error('Failed to fetch Google reviews', error)

    // Provide more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        error: 'Unable to fetch reviews from Google',
        details: errorMessage,
        placeId,
      },
      { status: 502 }
    )
  }
}
