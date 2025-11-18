import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

// POST /api/reviews/summary - Generate AI summary for business reviews
export async function POST(request: NextRequest) {
  try {
    const { businessId } = await request.json()

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch business details
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Fetch all reviews for the business
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, review_text, reviewed_at')
      .eq('business_id', businessId)
      .order('reviewed_at', { ascending: false })
      .limit(100) // Limit to recent 100 reviews for context

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        summary: `${business.name} is building its reputation! Be the first to share your experience and help others discover what makes this business special.`,
        highlights: [],
        sentiment: 'neutral',
        totalReviews: 0,
      })
    }

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      // Return a generic summary if no API key
      const avgRating = (reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length).toFixed(1)
      return NextResponse.json({
        summary: `${business.name} has ${reviews.length} reviews with an average rating of ${avgRating} stars.`,
        highlights: [
          'Customers appreciate the service quality',
          'Positive feedback from satisfied clients',
          'Growing reputation in the community',
        ],
        sentiment: Number(avgRating) >= 4 ? 'positive' : Number(avgRating) >= 3 ? 'neutral' : 'mixed',
        totalReviews: reviews.length,
      })
    }

    // Generate AI summary using Anthropic Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const reviewsText = reviews
      .map((r, idx) => `Review ${idx + 1}: ${r.rating}/5 stars - "${r.review_text || 'No text provided'}"`)
      .join('\n\n')

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze these customer reviews for "${business.name}" and provide a concise, engaging summary for potential customers viewing the review page.

Reviews:
${reviewsText}

Please provide:
1. A 2-3 sentence summary capturing the overall customer experience
2. 3-5 key highlights (brief bullet points)
3. Overall sentiment (positive/mixed/negative)

Format your response as JSON:
{
  "summary": "2-3 sentence engaging summary",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "sentiment": "positive/mixed/negative"
}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI')
    }

    // Parse AI response
    const aiResponse = JSON.parse(content.text)

    return NextResponse.json({
      summary: aiResponse.summary,
      highlights: aiResponse.highlights,
      sentiment: aiResponse.sentiment,
      totalReviews: reviews.length,
    })
  } catch (error) {
    console.error('Error generating review summary:', error)

    // Return a fallback response on error
    return NextResponse.json({
      summary: 'Unable to generate summary at this time.',
      highlights: [],
      sentiment: 'neutral',
      totalReviews: 0,
    }, { status: 500 })
  }
}
