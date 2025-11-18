import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ token: string }>
}

// GET /api/campaigns/track/[token] - Track email opens via tracking pixel
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params
    const serviceSupabase = createServiceRoleClient()

    // Find recipient by tracking token
    const { data: recipient, error: findError } = await serviceSupabase
      .from('campaign_recipients')
      .select('id, campaign_id, status, opened_at')
      .eq('tracking_token', token)
      .single()

    if (!findError && recipient) {
      // Only update if not already marked as opened
      if (!recipient.opened_at) {
        await serviceSupabase
          .from('campaign_recipients')
          .update({
            status: recipient.status === 'sent' ? 'opened' : recipient.status,
            opened_at: new Date().toISOString(),
          })
          .eq('id', recipient.id)

        // Log the open event
        await serviceSupabase.from('campaign_events').insert({
          campaign_id: recipient.campaign_id,
          recipient_id: recipient.id,
          event_type: 'opened',
          event_data: {
            user_agent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          },
        })
      }
    }

    // Return a 1x1 transparent GIF pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error tracking email open:', error)

    // Still return the pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  }
}
