'use server'

import { NextRequest, NextResponse } from 'next/server'
import { fetchRedditReviews, normalizeRedditReview } from '@/lib/integrations/reddit'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const businessName = searchParams.get('businessName')
  const subreddits = searchParams.get('subreddits')?.split(',') || ['reviews', 'AskReddit']

  if (!businessName) {
    return NextResponse.json(
      { error: 'Query param "businessName" is required.' },
      { status: 400 }
    )
  }

  try {
    const reviews = await fetchRedditReviews(businessName, subreddits, 25)

    return NextResponse.json({
      businessName,
      subreddits,
      count: reviews.length,
      reviews: reviews.map(normalizeRedditReview),
    })
  } catch (error) {
    console.error('Failed to fetch Reddit reviews', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        error: 'Unable to fetch reviews from Reddit',
        details: errorMessage,
        businessName,
      },
      { status: 502 }
    )
  }
}
