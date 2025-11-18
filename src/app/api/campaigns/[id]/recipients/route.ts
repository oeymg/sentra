import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/campaigns/[id]/recipients - Add recipients to campaign
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipients } = body // Array of {email, name, phone}

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients array is required' }, { status: 400 })
    }

    // Verify campaign ownership
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('business_id, businesses!inner(user_id)')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const businesses = campaign.businesses as unknown as { user_id: string }
    if (businesses.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Insert recipients
    const recipientsData = recipients.map((recipient) => ({
      campaign_id: campaignId,
      business_id: campaign.business_id,
      email: recipient.email,
      name: recipient.name || null,
      phone: recipient.phone || null,
    }))

    const { data, error } = await supabase
      .from('campaign_recipients')
      .insert(recipientsData)
      .select()

    if (error) throw error

    return NextResponse.json({ recipients: data }, { status: 201 })
  } catch (error) {
    console.error('Error adding recipients:', error)
    return NextResponse.json({ error: 'Failed to add recipients' }, { status: 500 })
  }
}

// GET /api/campaigns/[id]/recipients - Get campaign recipients
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify campaign ownership
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('business_id, businesses!inner(user_id)')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const businesses = campaign.businesses as unknown as { user_id: string }
    if (businesses.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch recipients
    const { data: recipients, error } = await supabase
      .from('campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ recipients })
  } catch (error) {
    console.error('Error fetching recipients:', error)
    return NextResponse.json({ error: 'Failed to fetch recipients' }, { status: 500 })
  }
}
