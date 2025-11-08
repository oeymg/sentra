// Yelp Fusion API integration
// Requires Yelp API key

export interface YelpReview {
  id: string
  rating: number
  user: {
    id: string
    profile_url: string
    image_url?: string
    name: string
  }
  text: string
  time_created: string
  url: string
}

export async function fetchYelpReviews(
  businessId: string,
  apiKey: string
): Promise<YelpReview[]> {
  try {
    const response = await fetch(
      `https://api.yelp.com/v3/businesses/${businessId}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.reviews || []
  } catch (error) {
    console.error('Error fetching Yelp reviews:', error)
    return []
  }
}

export async function searchYelpBusiness(
  name: string,
  location: string,
  apiKey: string
): Promise<{ id: string; name: string; url: string } | null> {
  try {
    const params = new URLSearchParams({
      term: name,
      location: location,
      limit: '1',
    })

    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?${params}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.statusText}`)
    }

    const data = await response.json()
    if (data.businesses && data.businesses.length > 0) {
      const business = data.businesses[0]
      return {
        id: business.id,
        name: business.name,
        url: business.url,
      }
    }

    return null
  } catch (error) {
    console.error('Error searching Yelp business:', error)
    return null
  }
}

export function normalizeYelpReview(review: YelpReview) {
  return {
    platform_review_id: review.id,
    reviewer_name: review.user.name,
    reviewer_avatar_url: review.user.image_url,
    rating: review.rating,
    review_text: review.text,
    review_url: review.url,
    reviewed_at: review.time_created,
    has_response: false, // Yelp API doesn't provide response info in free tier
    response_text: null,
    responded_at: null,
  }
}

// Note: Yelp doesn't allow posting responses through their API
// Businesses must respond directly on Yelp.com
