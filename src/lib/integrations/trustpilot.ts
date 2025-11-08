// Trustpilot API integration
// Requires Trustpilot API key and business unit ID

export interface TrustpilotReview {
  id: string
  stars: number
  title: string
  text: string
  createdAt: string
  consumer: {
    displayName: string
  }
  businessReply?: {
    text: string
    createdAt: string
  }
}

export async function fetchTrustpilotReviews(
  businessUnitId: string,
  apiKey: string
): Promise<TrustpilotReview[]> {
  try {
    const response = await fetch(
      `https://api.trustpilot.com/v1/business-units/${businessUnitId}/reviews`,
      {
        headers: {
          apikey: apiKey,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Trustpilot API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.reviews || []
  } catch (error) {
    console.error('Error fetching Trustpilot reviews:', error)
    return []
  }
}

export async function replyToTrustpilotReview(
  businessUnitId: string,
  reviewId: string,
  replyText: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.trustpilot.com/v1/business-units/${businessUnitId}/reviews/${reviewId}/reply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: replyText,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('Error replying to Trustpilot review:', error)
    return false
  }
}

export function normalizeTrustpilotReview(review: TrustpilotReview) {
  return {
    platform_review_id: review.id,
    reviewer_name: review.consumer.displayName,
    reviewer_avatar_url: null,
    rating: review.stars,
    review_text: `${review.title}\n\n${review.text}`,
    reviewed_at: review.createdAt,
    has_response: !!review.businessReply,
    response_text: review.businessReply?.text,
    responded_at: review.businessReply?.createdAt,
  }
}
