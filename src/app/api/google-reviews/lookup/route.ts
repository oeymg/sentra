import { NextRequest, NextResponse } from 'next/server'

type PlacesSearchResponse = {
  places?: Array<{
    id: string
    displayName?: { text: string }
    formattedAddress?: string
    rating?: number
    userRatingCount?: number
  }>
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY is not configured on the server.' }, { status: 500 })
  }

  const { name, location } = await request.json().catch(() => ({}))

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
  }

  if (!location || typeof location !== 'string') {
    return NextResponse.json({ error: 'Business address or location is required.' }, { status: 400 })
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount',
      },
      body: JSON.stringify({
        textQuery: `${name}, ${location}`,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Places API error (${response.status}): ${errorText}`)
    }

    const data = (await response.json()) as PlacesSearchResponse
    const place = data.places?.[0]

    if (!place) {
      return NextResponse.json({ error: 'No matching place found for this business.' }, { status: 404 })
    }

    return NextResponse.json({
      placeId: place.id,
      displayName: place.displayName?.text ?? name,
      formattedAddress: place.formattedAddress ?? location,
      rating: place.rating ?? null,
      userRatingCount: place.userRatingCount ?? null,
    })
  } catch (error) {
    console.error('Places lookup failed', error)
    return NextResponse.json({ error: 'Failed to look up Place ID.' }, { status: 500 })
  }
}
