import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { businessId, rating, text, reviewerName, reviewerEmail, source } = await request.json()

    // Validation
    if (!businessId || !rating || !text || !reviewerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify business exists
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Create the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        business_id: businessId,
        platform: source || 'direct',
        rating,
        text,
        reviewer_name: reviewerName,
        reviewer_email: reviewerEmail,
        source_id: `direct_${Date.now()}`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Error creating review:', reviewError)
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      review,
      message: 'Thank you for your review!',
    })
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}
