import { createClient } from '@/lib/supabase/server'
import { generateMultipleResponses } from '@/lib/ai/claude'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = await request.json()

    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`*, businesses!inner(user_id, name, id)`)
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (review.businesses.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const responses = await generateMultipleResponses(
      review.review_text || '',
      review.rating,
      review.businesses.name
    )

    const { error: insertError } = await supabase
      .from('ai_responses')
      .insert(responses.map((r) => ({
        review_id: reviewId,
        response_text: r.text,
        tone: r.tone,
        is_used: false,
      })))

    if (insertError) {
      console.error('Failed to save AI responses:', insertError)
    }

    return NextResponse.json({ success: true, responses })
  } catch (error) {
    console.error('Error generating responses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
