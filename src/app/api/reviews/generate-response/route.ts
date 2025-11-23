import { createClient } from '@/lib/supabase/server'
import { generateMultipleResponses } from '@/lib/ai/claude'
import { NextRequest, NextResponse } from 'next/server'
import { canGenerateAIResponse, incrementAIResponseUsage } from '@/lib/plans'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = await request.json()

    // Fetch the review and business
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(
        `
        *,
        businesses!inner(
          user_id,
          name,
          id,
          plan_tier,
          subscription_status,
          ai_responses_used_this_month
        )
      `
      )
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check authorization
    if (review.businesses.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if business can generate AI response (plan limits)
    const { allowed, reason, remaining } = await canGenerateAIResponse(review.businesses.id)

    if (!allowed) {
      return NextResponse.json(
        {
          error: reason || 'Cannot generate AI response',
          limitReached: true,
          planTier: review.businesses.plan_tier,
        },
        { status: 403 }
      )
    }

    // Generate multiple response suggestions
    const responses = await generateMultipleResponses(
      review.review_text || '',
      review.rating,
      review.businesses.name
    )

    // Save the AI responses to the database
    const aiResponses = responses.map((response) => ({
      review_id: reviewId,
      response_text: response.text,
      tone: response.tone,
      is_used: false,
    }))

    const { error: insertError } = await supabase
      .from('ai_responses')
      .insert(aiResponses)

    if (insertError) {
      console.error('Failed to save AI responses:', insertError)
    }

    // Increment AI response usage counter
    await incrementAIResponseUsage(review.businesses.id)

    return NextResponse.json({
      success: true,
      responses,
      remaining: remaining !== undefined ? remaining - 1 : undefined,
    })
  } catch (error) {
    console.error('Error generating responses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
