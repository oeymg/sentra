'use server'

import { NextRequest, NextResponse } from 'next/server'
import { searchYelpBusiness } from '@/lib/integrations/yelp'

export async function GET(request: NextRequest) {
  const apiKey = process.env.YELP_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing YELP_API_KEY on the server.' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const location = searchParams.get('location')

  if (!name || !location) {
    return NextResponse.json(
      { error: 'Query params "name" and "location" are required.' },
      { status: 400 }
    )
  }

  try {
    const business = await searchYelpBusiness(name, location, apiKey)

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found on Yelp' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      business,
    })
  } catch (error) {
    console.error('Failed to lookup Yelp business', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        error: 'Unable to lookup business on Yelp',
        details: errorMessage,
      },
      { status: 502 }
    )
  }
}
