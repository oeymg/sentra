import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/campaigns - List all campaigns for a business
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Fetch campaigns with recipient counts
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        recipients:campaign_recipients(count)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

// POST /api/campaigns - Create a new campaign
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
    const {
      businessId,
      name,
      description,
      type = 'email',
      subjectLine,
      emailTemplate,
      targetPlatform = 'google',
      reviewUrl,
      enableFollowup = false,
      followupDelayDays = 3,
      maxFollowups = 2,
      scheduledAt,
      timezone = 'UTC',
    } = body

    if (!businessId || !name) {
      return NextResponse.json(
        { error: 'businessId and name are required' },
        { status: 400 }
      )
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    let parsedScheduledAt: Date | null = null
    if (scheduledAt) {
      const parsed = new Date(scheduledAt)
      if (!Number.isNaN(parsed.getTime())) {
        parsedScheduledAt = parsed
      }
    }

    const isFutureScheduled =
      parsedScheduledAt !== null && parsedScheduledAt.getTime() > Date.now()

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        business_id: businessId,
        name,
        description,
        type,
        subject_line: subjectLine,
        email_template: emailTemplate,
        target_platform: targetPlatform,
        review_url: reviewUrl,
        enable_followup: enableFollowup,
        followup_delay_days: followupDelayDays,
        max_followups: maxFollowups,
        status: isFutureScheduled ? 'scheduled' : 'draft',
        scheduled_at: parsedScheduledAt ? parsedScheduledAt.toISOString() : null,
        timezone,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
