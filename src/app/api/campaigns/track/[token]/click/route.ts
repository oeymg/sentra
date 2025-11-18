import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ token: string }>
}

// GET /api/campaigns/track/[token]/click?url=... - Track link clicks and redirect
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params
    const searchParams = request.nextUrl.searchParams
    const targetUrl = searchParams.get('url')

    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing target URL' }, { status: 400 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Find recipient by tracking token
    const { data: recipient, error: findError } = await serviceSupabase
      .from('campaign_recipients')
      .select('id, campaign_id, status, clicked_at')
      .eq('tracking_token', token)
      .single()

    if (!findError && recipient) {
      // Only update if not already marked as clicked
      if (!recipient.clicked_at) {
        await serviceSupabase
          .from('campaign_recipients')
          .update({
            status: recipient.status === 'opened' || recipient.status === 'sent' ? 'clicked' : recipient.status,
            clicked_at: new Date().toISOString(),
          })
          .eq('id', recipient.id)

        // Log the click event
        await serviceSupabase.from('campaign_events').insert({
          campaign_id: recipient.campaign_id,
          recipient_id: recipient.id,
          event_type: 'clicked',
          event_data: {
            url: targetUrl,
            user_agent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          },
        })
      }
    }

    // Redirect to the target URL
    return NextResponse.redirect(targetUrl)
  } catch (error) {
    console.error('Error tracking click:', error)

    // Try to redirect to target URL even on error
    const searchParams = request.nextUrl.searchParams
    const targetUrl = searchParams.get('url')

    if (targetUrl) {
      return NextResponse.redirect(targetUrl)
    }

    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 })
  }
}
