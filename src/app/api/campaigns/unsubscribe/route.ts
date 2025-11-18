import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// POST /api/campaigns/unsubscribe - Unsubscribe a recipient
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Find recipient by tracking token
    const { data: recipient, error: findError } = await serviceSupabase
      .from('campaign_recipients')
      .select('id, email, campaign_id, status')
      .eq('tracking_token', token)
      .single()

    if (findError || !recipient) {
      return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 404 })
    }

    // Check if already unsubscribed
    if (recipient.status === 'unsubscribed') {
      return NextResponse.json({
        success: true,
        message: 'You are already unsubscribed',
        alreadyUnsubscribed: true,
      })
    }

    // Update recipient status to unsubscribed
    const { error: updateError } = await serviceSupabase
      .from('campaign_recipients')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', recipient.id)

    if (updateError) {
      console.error('Error unsubscribing recipient:', updateError)
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    // Log the unsubscribe event
    await serviceSupabase.from('campaign_events').insert({
      campaign_id: recipient.campaign_id,
      recipient_id: recipient.id,
      event_type: 'unsubscribed',
      event_data: {
        email: recipient.email,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
    })
  } catch (error) {
    console.error('Error processing unsubscribe:', error)
    return NextResponse.json({ error: 'Failed to process unsubscribe' }, { status: 500 })
  }
}

// GET /api/campaigns/unsubscribe?token=xxx - Check unsubscribe status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Find recipient by tracking token
    const { data: recipient, error: findError } = await serviceSupabase
      .from('campaign_recipients')
      .select('id, email, status')
      .eq('tracking_token', token)
      .single()

    if (findError || !recipient) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    return NextResponse.json({
      email: recipient.email,
      isUnsubscribed: recipient.status === 'unsubscribed',
    })
  } catch (error) {
    console.error('Error checking unsubscribe status:', error)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
