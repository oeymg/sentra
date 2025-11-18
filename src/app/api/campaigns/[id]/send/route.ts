import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { sendCampaignEmail, isResendConfigured } from '@/lib/resend'
import { replaceTemplateVariables } from '@/lib/email-templates'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/campaigns/[id]/send - Send campaign to all pending recipients
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Resend is configured
    if (!isResendConfigured()) {
      return NextResponse.json(
        {
          error: 'Email sending is not configured. Please add RESEND_API_KEY to your environment variables.',
        },
        { status: 503 }
      )
    }

    // Get campaign details
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*, business:businesses(id, name, slug, user_id, google_place_id)')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Verify ownership
    const business = campaign.business as unknown as { id: string; user_id: string; name: string; slug: string; google_place_id: string | null }
    if (business.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all pending recipients (excludes unsubscribed recipients automatically)
    const { data: recipients } = await supabase
      .from('campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No pending recipients to send to' },
        { status: 400 }
      )
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Generate review URL (use slug for prettier URLs)
    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${business.slug || business.id}`

    // Send emails to all pending recipients
    for (const recipient of recipients) {
      try {
        // Replace template variables
        const personalizedSubject = replaceTemplateVariables(campaign.subject_line || '', {
          customer: recipient.name,
          business_name: business.name,
        })

        const personalizedBody = replaceTemplateVariables(campaign.email_template || '', {
          customer: recipient.name,
          business_name: business.name,
          review_link: '{{REVIEW_URL}}', // Placeholder, will be replaced with tracked URL
        })

        // Send email via Resend
        await sendCampaignEmail({
          to: recipient.email,
          from: `${business.name} <onboarding@resend.dev>`, // TODO: Use custom domain
          subject: personalizedSubject,
          html: personalizedBody,
          trackingToken: recipient.tracking_token,
          campaignId: campaign.id,
          reviewUrl, // Pass the actual review URL
        })

        // Update recipient status to 'sent'
        await serviceSupabase
          .from('campaign_recipients')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', recipient.id)

        // Log the send event
        await serviceSupabase.from('campaign_events').insert({
          campaign_id: campaign.id,
          recipient_id: recipient.id,
          event_type: 'sent',
          event_data: {
            subject: personalizedSubject,
          },
        })

        results.sent++
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error)
        results.failed++
        results.errors.push(`${recipient.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)

        // Mark as bounced
        await serviceSupabase
          .from('campaign_recipients')
          .update({
            status: 'bounced',
          })
          .eq('id', recipient.id)
      }
    }

    // Update campaign status to 'active'
    await supabase
      .from('campaigns')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)

    return NextResponse.json({
      success: true,
      results,
      message: `Sent ${results.sent} emails, ${results.failed} failed`,
    })
  } catch (error) {
    console.error('Error sending campaign:', error)
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    )
  }
}
