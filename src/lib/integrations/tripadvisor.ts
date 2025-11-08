// TripAdvisor API integration
// Note: TripAdvisor API requires business partnership and is not freely available
// This is a placeholder for the integration structure

export interface TripAdvisorReview {
  id: string
  rating: number
  title: string
  text: string
  published_date: string
  author: {
    username: string
  }
  management_response?: {
    text: string
    published_date: string
  }
}

export async function fetchTripAdvisorReviews(
  locationId: string,
  apiKey: string
): Promise<TripAdvisorReview[]> {
  try {
    // Note: This endpoint may require special access
    const response = await fetch(
      `https://api.tripadvisor.com/api/partner/2.0/location/${locationId}/reviews`,
      {
        headers: {
          'X-TripAdvisor-API-Key': apiKey,
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`TripAdvisor API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching TripAdvisor reviews:', error)
    return []
  }
}

export function normalizeTripAdvisorReview(review: TripAdvisorReview) {
  return {
    platform_review_id: review.id,
    reviewer_name: review.author.username,
    reviewer_avatar_url: null,
    rating: review.rating,
    review_text: `${review.title}\n\n${review.text}`,
    reviewed_at: review.published_date,
    has_response: !!review.management_response,
    response_text: review.management_response?.text,
    responded_at: review.management_response?.published_date,
  }
}

// Note: TripAdvisor requires businesses to respond through their Management Center
// API responses are not generally available
