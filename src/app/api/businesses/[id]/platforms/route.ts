import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/businesses/[id]/platforms
 * Fetch connected platforms for a business
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Fetch connected platforms
    const { data: platforms, error } = await supabase
      .from('business_platforms')
      .select(
        `
        id,
        platform_id,
        platform_business_id,
        is_connected,
        review_platforms (
          id,
          name,
          slug
        )
      `
      )
      .eq('business_id', id)
      .eq('is_connected', true)

    if (error) {
      console.error('[Platforms API] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch platforms' }, { status: 500 })
    }

    // Transform response to flatten platform data
    const transformedPlatforms = (platforms || []).map((p) => {
      const platformData = Array.isArray(p.review_platforms)
        ? p.review_platforms[0]
        : p.review_platforms

      return {
        id: p.id,
        platform_id: p.platform_id,
        platform_business_id: p.platform_business_id,
        platform_name: platformData?.name || 'Unknown',
        platform_slug: platformData?.slug || '',
        is_connected: p.is_connected,
      }
    })

    return NextResponse.json(transformedPlatforms)
  } catch (error) {
    console.error('[Platforms API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
