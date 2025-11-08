import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
})

const CLAUDE_MODEL = 'claude-3-haiku-20240307'

export interface ReviewAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  keywords: string[]
  categories: string[]
  language: string
  isSpam: boolean
  summary?: string
}

export interface ResponseSuggestion {
  text: string
  tone: 'professional' | 'friendly' | 'apologetic' | 'enthusiastic'
}

export async function analyzeReview(
  reviewText: string,
  rating: number
): Promise<ReviewAnalysis> {
  const prompt = `Analyze the following customer review and provide a structured analysis.

Review Text: "${reviewText}"
Rating: ${rating}/5 stars

Provide your analysis in the following JSON format:
{
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": -1 to 1 (where -1 is very negative, 0 is neutral, 1 is very positive),
  "keywords": ["key", "phrases", "from", "review"],
  "categories": ["service", "product", "price", "quality", etc.],
  "language": "en" (ISO 639-1 code),
  "isSpam": true | false,
  "summary": "Brief one-sentence summary of the review"
}

Consider:
- Sentiment should match the overall tone and rating
- Keywords should be the most important words or phrases
- Categories should classify what the review is about
- Detect if this appears to be spam or fake
- Language detection for the review text

Respond ONLY with valid JSON, no additional text.`

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      const analysis = JSON.parse(content.text)
      return analysis
    }

    throw new Error('Unexpected response format from Claude')
  } catch (error) {
    console.error('Error analyzing review:', error)
    throw error
  }
}

export async function generateResponse(
  reviewText: string,
  rating: number,
  businessName: string,
  tone: 'professional' | 'friendly' | 'apologetic' | 'enthusiastic' = 'professional'
): Promise<string> {
  const toneDescriptions = {
    professional: 'professional and courteous',
    friendly: 'warm and friendly',
    apologetic: 'understanding and apologetic',
    enthusiastic: 'enthusiastic and appreciative',
  }

  const prompt = `You are helping ${businessName} respond to a customer review.

Review Rating: ${rating}/5 stars
Review Text: "${reviewText}"

Generate a ${toneDescriptions[tone]} response to this review. The response should:

${
  rating >= 4
    ? `- Thank the customer for their positive feedback
- Acknowledge specific points they mentioned
- Invite them to return`
    : rating >= 3
    ? `- Thank them for their feedback
- Address any concerns mentioned
- Show commitment to improvement`
    : `- Apologize for their poor experience
- Address their specific concerns
- Offer to make things right
- Provide contact information if needed`
}

Keep the response:
- Concise (2-3 sentences)
- Authentic and personalized
- Appropriate for the rating and tone
- Free of generic corporate language

Respond ONLY with the response text, no additional commentary.`

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      return content.text.trim()
    }

    throw new Error('Unexpected response format from Claude')
  } catch (error) {
    console.error('Error generating response:', error)
    // Fallback generic response
    if (rating >= 4) {
      return `Thank you so much for your wonderful review! We're thrilled to hear about your positive experience with ${businessName}. We look forward to serving you again soon!`
    } else if (rating >= 3) {
      return `Thank you for your feedback. We appreciate you taking the time to share your experience with ${businessName}. We're always working to improve and hope to serve you better in the future.`
    } else {
      return `We sincerely apologize for your experience. This doesn't meet the standards we set for ${businessName}. Please contact us directly so we can make this right. Thank you for bringing this to our attention.`
    }
  }
}

export async function generateMultipleResponses(
  reviewText: string,
  rating: number,
  businessName: string
): Promise<ResponseSuggestion[]> {
  const tones: Array<'professional' | 'friendly' | 'apologetic' | 'enthusiastic'> =
    rating >= 4
      ? ['professional', 'friendly', 'enthusiastic']
      : rating >= 3
      ? ['professional', 'friendly']
      : ['professional', 'apologetic']

  const responses = await Promise.all(
    tones.map(async (tone) => ({
      text: await generateResponse(reviewText, rating, businessName, tone),
      tone,
    }))
  )

  return responses
}

export async function batchAnalyzeReviews(
  reviews: Array<{ text: string; rating: number }>
): Promise<ReviewAnalysis[]> {
  // Process in batches of 5 to avoid rate limits
  const batchSize = 5
  const results: ReviewAnalysis[] = []

  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map((review) => analyzeReview(review.text, review.rating))
    )
    results.push(...batchResults)

    // Small delay between batches
    if (i + batchSize < reviews.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return results
}
