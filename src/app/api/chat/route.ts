import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'edge'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, businessId, conversationHistory = [] } = body

    if (!message || !businessId) {
      return NextResponse.json(
        { error: 'Message and businessId are required' },
        { status: 400 }
      )
    }

    // Fetch business data
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Fetch reviews for context
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        rating,
        review_text,
        sentiment,
        categories,
        keywords,
        reviewed_at,
        has_response,
        platform:review_platforms(name, slug)
      `)
      .eq('business_id', businessId)
      .order('reviewed_at', { ascending: false })
      .limit(50)

    // Build context summary
    const totalReviews = reviews?.length || 0
    const avgRating = totalReviews > 0
      ? (reviews?.reduce((sum, r) => sum + (r.rating || 0), 0) || 0) / totalReviews
      : 0
    const sentimentCounts = {
      positive: reviews?.filter((r) => r.sentiment === 'positive').length || 0,
      neutral: reviews?.filter((r) => r.sentiment === 'neutral').length || 0,
      negative: reviews?.filter((r) => r.sentiment === 'negative').length || 0,
    }
    const responseRate = reviews?.filter((r) => r.has_response).length || 0

    // Get all unique categories and keywords
    const allCategories = new Set<string>()
    const allKeywords = new Set<string>()
    reviews?.forEach((r) => {
      r.categories?.forEach((c: string) => allCategories.add(c))
      r.keywords?.forEach((k: string) => allKeywords.add(k))
    })

    // Get platform breakdown
    const platformCounts: Record<string, number> = {}
    reviews?.forEach((r) => {
      const platform = Array.isArray(r.platform) ? r.platform[0] : r.platform
      const platformName = platform?.name || 'Unknown'
      platformCounts[platformName] = (platformCounts[platformName] || 0) + 1
    })

    // Build system context
    const systemContext = `You are an AI assistant helping ${business.name}, a business in the ${business.industry || 'service'} industry, understand their customer reviews and improve their operations.

Business Information:
- Name: ${business.name}
- Industry: ${business.industry || 'Not specified'}
- Location: ${business.address || 'Not specified'}
- Website: ${business.website || 'Not specified'}
- Description: ${business.description || 'Not provided'}

Review Analytics:
- Total Reviews: ${totalReviews}
- Average Rating: ${avgRating.toFixed(1)}/5.0
- Sentiment Distribution: ${sentimentCounts.positive} positive, ${sentimentCounts.neutral} neutral, ${sentimentCounts.negative} negative
- Response Rate: ${((responseRate / totalReviews) * 100).toFixed(1)}%
- Platforms: ${Object.entries(platformCounts)
      .map(([platform, count]) => `${platform} (${count})`)
      .join(', ')}

Common Categories: ${Array.from(allCategories).slice(0, 10).join(', ') || 'None detected yet'}
Common Keywords: ${Array.from(allKeywords).slice(0, 15).join(', ') || 'None detected yet'}

Recent Reviews Sample (last 10):
${reviews
  ?.slice(0, 10)
  .map((r, i) => {
    const platform = Array.isArray(r.platform) ? r.platform[0] : r.platform
    return `${i + 1}. [${r.rating}/5] ${platform?.name || 'Unknown'} - "${r.review_text?.substring(0, 150)}..." (${r.sentiment || 'unknown'} sentiment)`
  })
  .join('\n')}

Your role is to:
1. Answer questions about the business's reviews and customer feedback
2. Provide actionable insights and recommendations
3. Help identify trends, patterns, and areas for improvement
4. Assist with generating responses to reviews when asked
5. Explain sentiment analysis and review metrics
6. Suggest strategies to improve ratings and customer satisfaction

Be conversational, helpful, and data-driven. Use specific examples from the reviews when possible. If asked to generate a response to a review, provide a professional, empathetic, and on-brand reply.`

    // Initialize Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Build message history
    const messages: Message[] = [
      ...conversationHistory,
      { role: 'user', content: message },
    ]

    // Stream response from Claude
    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemContext,
      messages,
    })

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text
              controller.enqueue(encoder.encode(text))
            }
          }
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
