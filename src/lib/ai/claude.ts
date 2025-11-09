import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
})

// Using latest Haiku model for cost-effective analysis
const CLAUDE_MODEL = 'claude-3-5-haiku-20241022'

export interface ReviewAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  keywords: string[]
  categories: string[]
  language: string
  isSpam: boolean
  summary?: string
  hasBusinessResponse?: boolean
  businessResponseText?: string
}

export interface ResponseSuggestion {
  text: string
  tone: 'professional' | 'friendly' | 'apologetic' | 'enthusiastic'
}

export interface BusinessInsight {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'response_strategy' | 'customer_satisfaction' | 'operational' | 'marketing'
  actionable: string
  impact: string
}

export interface InsightsAnalysis {
  insights: BusinessInsight[]
  summary: string
  strengths: string[]
  opportunities: string[]
}

export async function analyzeReview(
  reviewText: string,
  rating: number,
  existingResponse?: string | null
): Promise<ReviewAnalysis> {
  const prompt = `Analyze the following customer review and provide a structured analysis.

Review Text: "${reviewText}"
Rating: ${rating}/5 stars
${existingResponse ? `Existing Business Response: "${existingResponse}"` : ''}

Provide your analysis in the following JSON format:
{
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": -1 to 1 (where -1 is very negative, 0 is neutral, 1 is very positive),
  "keywords": ["key", "phrases", "from", "review"],
  "categories": ["service", "product", "price", "quality", etc.],
  "language": "en" (ISO 639-1 code),
  "isSpam": true | false,
  "summary": "Brief one-sentence summary of the review",
  "hasBusinessResponse": true | false,
  "businessResponseText": "extracted response text if found in review, or null"
}

Consider:
- Sentiment should match the overall tone and rating
- Keywords should be the most important words or phrases
- Categories should classify what the review is about
- Detect if this appears to be spam or fake
- Language detection for the review text
- Check if there's a business owner response embedded in the review text (often marked with "Response from owner:" or similar)
- Extract the business response if found, even if not explicitly marked

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
  reviews: Array<{ text: string; rating: number; existingResponse?: string | null }>
): Promise<ReviewAnalysis[]> {
  // Process in batches of 5 to avoid rate limits
  const batchSize = 5
  const results: ReviewAnalysis[] = []

  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map((review) => analyzeReview(review.text, review.rating, review.existingResponse))
    )
    results.push(...batchResults)

    // Small delay between batches
    if (i + batchSize < reviews.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return results
}

export interface BusinessMetrics {
  totalReviews: number
  avgRating: number
  responseRate: number
  sentimentBreakdown: {
    positive: number
    neutral: number
    negative: number
  }
  topCategories: Array<{ category: string; count: number }>
  platformPerformance: Array<{ platform: string; reviewCount: number; avgRating: number }>
  responseTime: {
    medianHours: number
    sameDayPercentage: number
  }
  recentTrends: {
    reviewVelocity: 'increasing' | 'stable' | 'decreasing'
    sentimentTrend: 'improving' | 'stable' | 'declining'
  }
}

/**
 * Generate AI-powered business insights based on review data and metrics
 * Analyzes patterns and provides actionable recommendations
 */
export async function generateBusinessInsights(
  businessName: string,
  metrics: BusinessMetrics
): Promise<InsightsAnalysis> {
  const prompt = `You are a business operations consultant analyzing real customer feedback for "${businessName}".

CRITICAL: Focus on OPERATIONAL INSIGHTS - analyze what customers say about actual business operations (service quality, product quality, staff behavior, cleanliness, wait times, pricing, consistency, etc.), NOT just review management tactics.

Business Metrics:
- Total Reviews: ${metrics.totalReviews}
- Average Rating: ${metrics.avgRating.toFixed(1)}/5.0
- Response Rate: ${(metrics.responseRate * 100).toFixed(1)}%
- Sentiment Distribution: ${metrics.sentimentBreakdown.positive} positive, ${metrics.sentimentBreakdown.neutral} neutral, ${metrics.sentimentBreakdown.negative} negative
- Top Categories: ${metrics.topCategories.map(c => `${c.category} (${c.count})`).join(', ')}
- Platform Performance: ${metrics.platformPerformance.map(p => `${p.platform}: ${p.reviewCount} reviews, ${p.avgRating.toFixed(1)} avg`).join('; ')}
- Response Time: Median ${metrics.responseTime.medianHours}h, ${metrics.responseTime.sameDayPercentage}% same-day
- Trends: Reviews ${metrics.recentTrends.reviewVelocity}, Sentiment ${metrics.recentTrends.sentimentTrend}

ANALYZE THE CATEGORIES TO INFER OPERATIONAL ISSUES:
- If "service" appears frequently → analyze service quality, staff training, customer experience
- If "food" or "product" appears → analyze quality consistency, preparation, menu/product issues
- If "price" appears → analyze value perception, pricing strategy
- If "staff" appears → analyze team performance, training needs, attitude
- If "cleanliness" appears → analyze hygiene standards, maintenance
- If "wait time" or "speed" appears → analyze operational efficiency, staffing levels
- Look for patterns in what customers ACTUALLY complain about or praise

Provide analysis in the following JSON format:
{
  "insights": [
    {
      "title": "Short insight title (max 8 words)",
      "description": "Detailed explanation of the insight (2-3 sentences)",
      "priority": "high" | "medium" | "low",
      "category": "response_strategy" | "customer_satisfaction" | "operational" | "marketing",
      "actionable": "Specific action to take (1 sentence)",
      "impact": "Expected impact if action is taken (1 sentence)"
    }
  ],
  "summary": "Overall business performance summary (2-3 sentences)",
  "strengths": [
    "Continue maintaining kitchen cleanliness standards - customers consistently praise hygiene",
    "Keep training staff on customer service excellence - friendliness is your top strength",
    "Maintain current food quality and consistency - it's driving repeat visits"
  ],
  "opportunities": [
    "Stop rushing service during peak hours - customers complain about mistakes and wait times",
    "Avoid inconsistent portion sizes - multiple reviews mention this operational issue",
    "Don't compromise on ingredient quality - customers notice and it affects ratings"
  ]
}

Guidelines:
- Generate 3-5 high-impact OPERATIONAL insights based on actual review data patterns
- Focus on day-to-day business operations: service quality, product/food quality, staff behavior, cleanliness, wait times, pricing, consistency
- Make insights immediately actionable with clear next steps for business operations
- Strengths should be framed as "DO THIS" - operational practices to continue/amplify (start with: Continue, Keep, Maintain, Focus on)
- Opportunities should be framed as "AVOID THIS" - operational problems to stop/prevent (start with: Stop, Avoid, Don't)
- Be specific and data-driven - reference actual metrics and review patterns
- AVOID generic review management advice like "respond faster" or "be more personal in responses"
- PRIORITIZE operational issues customers actually mention: slow service, rude staff, dirty facilities, inconsistent quality, pricing concerns
- High priority for operational issues directly affecting customer satisfaction or revenue
- If categories show "service" issues frequently → high-priority staff training/service quality insights
- If categories show "quality" issues → high-priority product/food consistency insights
- If categories show "cleanliness" issues → high-priority hygiene/maintenance insights
- Make each operational recommendation actionable within 1 week

Respond ONLY with valid JSON, no additional text.`

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
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
    console.error('Error generating business insights:', error)
    throw error
  }
}
