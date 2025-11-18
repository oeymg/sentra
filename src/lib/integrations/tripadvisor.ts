// TripAdvisor AI-powered web scraping integration
// Uses Claude AI to extract reviews from TripAdvisor URLs

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

/**
 * Fetch TripAdvisor reviews using Claude AI web scraping
 * Provide the TripAdvisor business URL (e.g., https://www.tripadvisor.com/Restaurant_Review-g...)
 */
export async function fetchTripAdvisorReviews(
  tripAdvisorUrl: string
): Promise<TripAdvisorReview[]> {
  try {
    // Use more realistic headers to avoid bot detection
    const response = await fetch(tripAdvisorUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.google.com/',
      },
      // Important: Don't follow redirects automatically for better control
      redirect: 'follow',
    })

    if (!response.ok) {
      // Provide more detailed error information
      const statusText = response.statusText || 'Unknown error'
      const errorBody = await response.text().catch(() => '')

      console.error('[TripAdvisor] Fetch failed:', {
        status: response.status,
        statusText,
        url: tripAdvisorUrl,
        bodyPreview: errorBody.substring(0, 200)
      })

      if (response.status === 403) {
        throw new Error(
          `TripAdvisor blocked the request (403 Forbidden). This can happen due to:\n` +
          `1. Rate limiting - Try again in a few minutes\n` +
          `2. Bot detection - TripAdvisor has anti-scraping measures\n` +
          `3. Geographic restrictions - Request may be blocked from certain regions\n\n` +
          `Consider using the TripAdvisor Content API for production use.`
        )
      }

      throw new Error(`Failed to fetch TripAdvisor page: ${response.status} ${statusText}`)
    }

    const html = await response.text()

    // Verify we got actual HTML content
    if (!html || html.length < 100) {
      throw new Error('Received empty or invalid response from TripAdvisor')
    }

    // Use Claude AI to parse the HTML and extract reviews
    const reviews = await parseTripAdvisorHtmlWithClaude(html)

    return reviews
  } catch (error) {
    console.error('Error fetching TripAdvisor reviews:', error)
    throw error
  }
}

/**
 * Use Claude AI to parse TripAdvisor HTML and extract review data
 */
async function parseTripAdvisorHtmlWithClaude(html: string): Promise<TripAdvisorReview[]> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const prompt = `Extract all reviews from this TripAdvisor HTML page. For each review, extract:
- Review ID (generate a unique ID if not found)
- Rating (1-5)
- Title
- Review text
- Published date (in ISO format)
- Author username
- Management response (if any) with text and date

Return the data as a JSON array. If you cannot find reviews, return an empty array.

HTML:
${html.substring(0, 50000)}` // Limit HTML size to avoid token limits

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response from Claude')
    }

    // Parse Claude's response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn('No JSON array found in Claude response')
      return []
    }

    const reviews = JSON.parse(jsonMatch[0])

    // Transform to our interface
    return reviews.map((review: any, index: number) => ({
      id: review.id || `tripadvisor-${Date.now()}-${index}`,
      rating: Math.min(5, Math.max(1, review.rating || 3)),
      title: review.title || '',
      text: review.text || review.review_text || '',
      published_date: review.published_date || review.date || new Date().toISOString(),
      author: {
        username: review.author?.username || review.author || 'Anonymous',
      },
      management_response: review.management_response || review.response ? {
        text: review.management_response?.text || review.response?.text || review.response || '',
        published_date: review.management_response?.published_date || review.response?.date || new Date().toISOString(),
      } : undefined,
    }))
  } catch (error) {
    console.error('Error parsing TripAdvisor HTML with Claude:', error)
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
