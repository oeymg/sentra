import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
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
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    // Verify the user owns this business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found or access denied' }, { status: 403 })
    }

    console.log(`[Reset] Deleting all reviews for business: ${business.name} (${businessId})`)

    // Get all review IDs for this business (we'll need these to delete AI responses)
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .eq('business_id', businessId)

    if (reviewsError) {
      throw reviewsError
    }

    const reviewIds = reviews?.map((r) => r.id) || []
    console.log(`[Reset] Found ${reviewIds.length} reviews to delete`)

    // Delete AI responses first (foreign key constraint)
    let aiResponsesDeleted = 0
    if (reviewIds.length > 0) {
      const { error: aiResponsesError, count } = await supabase
        .from('ai_responses')
        .delete({ count: 'exact' })
        .in('review_id', reviewIds)

      if (aiResponsesError) {
        console.error('[Reset] Error deleting AI responses:', aiResponsesError)
      } else {
        aiResponsesDeleted = count || 0
        console.log(`[Reset] Deleted ${aiResponsesDeleted} AI responses`)
      }
    }

    // Delete all reviews for this business
    const { error: deleteError, count } = await supabase
      .from('reviews')
      .delete({ count: 'exact' })
      .eq('business_id', businessId)

    if (deleteError) {
      throw deleteError
    }

    const deletedCount = count || 0
    console.log(`[Reset] Successfully deleted ${deletedCount} reviews and ${aiResponsesDeleted} AI responses`)

    return NextResponse.json({
      success: true,
      deletedCount,
      aiResponsesDeleted,
      message: `Deleted ${deletedCount} reviews and ${aiResponsesDeleted} AI responses for ${business.name}`,
    })
  } catch (error) {
    console.error('[Reset] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to reset reviews',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
