'use server'

import { NextRequest, NextResponse } from 'next/server'
import { fetchYelpReviews, normalizeYelpReview } from '@/lib/integrations/yelp'

export async function GET(request: NextRequest) {
  const apiKey = process.env.YELP_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing YELP_API_KEY on the server.' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('businessId')

  if (!businessId) {
    return NextResponse.json(
      { error: 'Query param "businessId" is required.' },
      { status: 400 }
    )
  }

  try {
    const reviews = await fetchYelpReviews(businessId, apiKey)

    return NextResponse.json({
      businessId,
      count: reviews.length,
      reviews: reviews.map(normalizeYelpReview),
    })
  } catch (error) {
    console.error('Failed to fetch Yelp reviews', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        error: 'Unable to fetch reviews from Yelp',
        details: errorMessage,
        businessId,
      },
      { status: 502 }
    )
  }
}
