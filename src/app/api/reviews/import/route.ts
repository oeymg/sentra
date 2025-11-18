import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/reviews/import - Import reviews from CSV
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const businessId = formData.get('businessId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id, user_id')
      .eq('id', businessId)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Read CSV file
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 })
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())

    // Validate required columns
    const requiredColumns = ['reviewer_name', 'rating', 'review_text']
    const missingColumns = requiredColumns.filter(col => !header.includes(col))

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      )
    }

    // Get column indices
    const getColumnIndex = (name: string) => header.indexOf(name)
    const nameIdx = getColumnIndex('reviewer_name')
    const ratingIdx = getColumnIndex('rating')
    const textIdx = getColumnIndex('review_text')
    const dateIdx = getColumnIndex('reviewed_at')
    const platformIdx = getColumnIndex('platform')
    const reviewUrlIdx = getColumnIndex('review_url')

    // Get or create "Direct" platform
    const { data: directPlatform } = await supabase
      .from('review_platforms')
      .select('id')
      .eq('slug', 'direct')
      .single()

    const platformId = directPlatform?.id

    if (!platformId) {
      return NextResponse.json(
        { error: 'Default platform not found. Please contact support.' },
        { status: 500 }
      )
    }

    // Parse and insert reviews
    const reviews = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i]
        if (!line.trim()) continue

        // Simple CSV parsing (handles basic cases)
        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))

        const reviewerName = values[nameIdx]
        const rating = parseInt(values[ratingIdx])
        const reviewText = values[textIdx]
        const reviewedAt = dateIdx >= 0 && values[dateIdx] ? values[dateIdx] : new Date().toISOString()
        const reviewUrl = reviewUrlIdx >= 0 && values[reviewUrlIdx] ? values[reviewUrlIdx] : null

        // Validate data
        if (!reviewerName || !rating || !reviewText) {
          errors.push(`Row ${i + 1}: Missing required fields`)
          continue
        }

        if (rating < 1 || rating > 5) {
          errors.push(`Row ${i + 1}: Rating must be between 1 and 5`)
          continue
        }

        reviews.push({
          business_id: businessId,
          reviewer_name: reviewerName,
          rating: rating,
          review_text: reviewText,
          reviewed_at: reviewedAt,
          platform_id: platformId,
          has_response: false,
          review_url: reviewUrl,
        })
      } catch (error) {
        console.error(`Error parsing row ${i + 1}:`, error)
        errors.push(`Row ${i + 1}: Failed to parse`)
      }
    }

    if (reviews.length === 0) {
      return NextResponse.json(
        { error: 'No valid reviews found in CSV', details: errors },
        { status: 400 }
      )
    }

    // Insert reviews in batches
    const { data: insertedReviews, error: insertError } = await supabase
      .from('reviews')
      .insert(reviews)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to import reviews', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imported: insertedReviews?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${insertedReviews?.length || 0} reviews${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    })
  } catch (error) {
    console.error('Error importing reviews:', error)
    return NextResponse.json(
      { error: 'Failed to import reviews' },
      { status: 500 }
    )
  }
}
