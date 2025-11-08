import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { batchAnalyzeReviews } from '@/lib/ai/claude'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await request.json()

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id,user_id')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: pending } = await supabase
      .from('reviews')
      .select('id, review_text, rating')
      .eq('business_id', businessId)
      .is('sentiment', null)
      .limit(50)

    if (!pending || pending.length === 0) {
      return NextResponse.json({ analyzed: 0 })
    }

    const analyses = await batchAnalyzeReviews(
      pending.map((review) => ({
        text: review.review_text || '',
        rating: Number(review.rating ?? 0),
      }))
    )

    const updates = pending.map(async (review, index) => {
      const analysis = analyses[index]
      if (!analysis) return

      await supabase
        .from('reviews')
        .update({
          sentiment: analysis.sentiment,
          sentiment_score: analysis.sentimentScore,
          keywords: analysis.keywords,
          categories: analysis.categories,
          language: analysis.language,
          is_spam: analysis.isSpam,
        })
        .eq('id', review.id)
    })

    await Promise.all(updates)

    return NextResponse.json({ analyzed: analyses.length })
  } catch (error) {
    console.error('Analyze missing reviews failed', error)
    return NextResponse.json({ error: 'Failed to analyze reviews.' }, { status: 500 })
  }
}
