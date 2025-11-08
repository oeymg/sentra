// Facebook Graph API integration
// Requires Facebook App and Page Access Token

export interface FacebookReview {
  id: string
  created_time: string
  rating: number
  review_text?: string
  reviewer: {
    id: string
    name: string
  }
  recommendation_type: 'positive' | 'negative'
}

export async function fetchFacebookReviews(
  pageId: string,
  accessToken: string
): Promise<FacebookReview[]> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/ratings?fields=created_time,rating,review_text,reviewer,recommendation_type&access_token=${accessToken}`
    )

    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching Facebook reviews:', error)
    return []
  }
}

export async function replyToFacebookReview(
  reviewId: string,
  replyText: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${reviewId}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: replyText,
          access_token: accessToken,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('Error replying to Facebook review:', error)
    return false
  }
}

export function normalizeFacebookReview(review: FacebookReview) {
  return {
    platform_review_id: review.id,
    reviewer_name: review.reviewer.name,
    reviewer_avatar_url: null,
    rating: review.rating,
    review_text: review.review_text || '',
    reviewed_at: review.created_time,
    has_response: false,
    response_text: null,
    responded_at: null,
  }
}
