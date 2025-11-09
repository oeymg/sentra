import crypto from 'crypto'

export interface GoogleReview {
  reviewId: string
  reviewer: {
    profilePhotoUrl?: string
    displayName: string
  }
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'
  comment?: string
  createTime: string
  updateTime: string
  reviewReply?: {
    comment: string
    updateTime: string
  }
}

export interface PlaceDetails {
  displayName: string
  name: string
  rating?: number
  userRatingCount?: number
  formattedAddress?: string
  websiteUri?: string
}

const STAR_RATING_MAP = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
}

const PLACE_DETAILS_FIELDS =
  'displayName,name,rating,userRatingCount,formattedAddress,websiteUri'

const REVIEW_FIELDS =
  'reviews.name,reviews.rating,reviews.text,reviews.publishTime,reviews.authorAttribution'

function normalizePlaceResource(placeId: string) {
  return placeId.startsWith('places/') ? placeId : `places/${placeId}`
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetails> {
  const resource = normalizePlaceResource(placeId)
  const response = await fetch(`https://places.googleapis.com/v1/${resource}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': PLACE_DETAILS_FIELDS,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Place details error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return {
    displayName: data.displayName?.text || 'Unknown Business',
    name: data.name || resource,
    rating: data.rating,
    userRatingCount: data.userRatingCount,
    formattedAddress: data.formattedAddress,
    websiteUri: data.websiteUri,
  }
}

async function fetchReviewsViaDetails(placeId: string, apiKey: string): Promise<GoogleReview[]> {
  const resource = normalizePlaceResource(placeId)
  const response = await fetch(`https://places.googleapis.com/v1/${resource}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': REVIEW_FIELDS,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Place reviews error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  if (!Array.isArray(data.reviews)) {
    return []
  }

  return data.reviews.map(transformGoogleReview)
}

async function fetchReviewsViaSearch(placeId: string, apiKey: string): Promise<GoogleReview[]> {
  const parent = normalizePlaceResource(placeId)
  const reviews: GoogleReview[] = []
  let nextPageToken: string | undefined

  do {
    const body: Record<string, any> = {
      parent,
      pageSize: 50,
      orderBy: 'NEWEST',
    }
    if (nextPageToken) {
      body.pageToken = nextPageToken
    }

    const response = await fetch('https://places.googleapis.com/v1/placeReviews:search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'reviews,nextPageToken',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Place reviews search error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const batch = Array.isArray(data.reviews)
      ? data.reviews
      : Array.isArray(data.placeReviews)
      ? data.placeReviews
      : []

    reviews.push(...batch.map(transformGoogleReview))
    nextPageToken = data.nextPageToken

    if (nextPageToken) {
      await new Promise((resolve) => setTimeout(resolve, 800))
    }
  } while (nextPageToken)

  return reviews
}

function transformGoogleReview(review: any): GoogleReview {
  const comment =
    review.comment?.text ??
    review.text?.text ??
    review.comment?.plainText ??
    review.text ??
    ''
  const publishTime = review.createTime || review.publishTime || new Date().toISOString()
  const updateTime = review.updateTime || publishTime

  return {
    reviewId: review.name || crypto.randomUUID(),
    reviewer: {
      profilePhotoUrl: review.authorAttribution?.photoUri || review.author?.profilePhotoUrl,
      displayName:
        review.authorAttribution?.displayName ||
        review.author?.displayName ||
        'Anonymous',
    },
    starRating: getRatingEnum(Number(review.rating ?? 5)),
    comment,
    createTime: publishTime,
    updateTime,
    reviewReply: review.reply
      ? {
          comment: review.reply.comment || review.reply.text?.text || '',
          updateTime: review.reply.updateTime || updateTime,
        }
      : undefined,
  }
}

function getRatingEnum(rating: number): 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' {
  // Round to nearest integer for accurate rating conversion
  const rounded = Math.round(rating)
  if (rounded <= 1) return 'ONE'
  if (rounded === 2) return 'TWO'
  if (rounded === 3) return 'THREE'
  if (rounded === 4) return 'FOUR'
  return 'FIVE'
}

export async function replyToGoogleReview(
  accountId: string,
  locationId: string,
  reviewId: string,
  replyText: string,
  accessToken: string
): Promise<boolean> {
  try {
    // Using Google My Business API
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          comment: replyText,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('Error replying to Google review:', error)
    return false
  }
}

export function normalizeGoogleReview(review: GoogleReview) {
  return {
    platform_review_id: review.reviewId,
    reviewer_name: review.reviewer.displayName,
    reviewer_avatar_url: review.reviewer.profilePhotoUrl,
    rating: STAR_RATING_MAP[review.starRating],
    review_text: review.comment || '',
    review_url: null,
    reviewed_at: review.createTime,
    has_response: !!review.reviewReply,
    response_text: review.reviewReply?.comment,
    responded_at: review.reviewReply?.updateTime,
  }
}

export async function fetchAllGoogleReviews(
  placeId: string,
  apiKey: string
): Promise<{ reviews: GoogleReview[]; place: PlaceDetails }> {
  const place = await fetchPlaceDetails(placeId, apiKey)

  // Try the Search endpoint first (supports pagination, can get all reviews)
  // Note: This endpoint requires Google My Business API access or special permissions
  try {
    console.log('Attempting to fetch reviews via Search endpoint...')
    const reviews = await fetchReviewsViaSearch(placeId, apiKey)
    console.log(`✓ Successfully fetched ${reviews.length} reviews via Search endpoint`)
    if (reviews.length > 0) {
      return { reviews, place }
    }
    console.log('Search endpoint returned 0 reviews, falling back to Details endpoint')
  } catch (error) {
    console.warn('⚠ PlaceReviews:search endpoint not available (404)')
    console.warn('This endpoint requires Google My Business API access or is not enabled.')
    console.warn('Falling back to Place Details endpoint (limited to 5 most recent reviews)')
  }

  // Fallback to Details endpoint (limited to 5 most recent reviews)
  // This is a Google API limitation - public Places API only returns 5 reviews max
  console.log('Fetching reviews via Details endpoint (Google API limit: 5 most recent reviews)...')
  const fallbackReviews = await fetchReviewsViaDetails(placeId, apiKey)
  console.log(`✓ Fetched ${fallbackReviews.length} reviews via Details endpoint`)

  if (fallbackReviews.length === 5) {
    console.warn('⚠ Only 5 reviews synced due to Google Places API limitations.')
    console.warn('To sync all reviews, you need to set up Google My Business API with OAuth.')
  }

  return { reviews: fallbackReviews, place }
}
