import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendCampaignEmail, isResendConfigured } from '@/lib/resend'
import { replaceTemplateVariables } from '@/lib/email-templates'

type RouteContext = {
  params: Promise<{ id: string }>
}

// POST /api/campaigns/[id]/test - Send a test email
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: campaignId } = await context.params
    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json({ error: 'Test email address is required' }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = await createClient()

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

    // Generate review URL (use slug for prettier URLs)
    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${business.slug || business.id}`

    // Replace template variables with sample data
    const personalizedSubject = replaceTemplateVariables(campaign.subject_line || '', {
      customer: 'John',
      business_name: business.name,
    })

    const personalizedBody = replaceTemplateVariables(campaign.email_template || '', {
      customer: 'John',
      business_name: business.name,
      review_link: reviewUrl, // Use actual review link in test
    })

    // Send test email via Resend (without tracking for test emails)
    const { resend } = await import('@/lib/resend')

    if (!resend) {
      return NextResponse.json(
        { error: 'Resend is not configured' },
        { status: 503 }
      )
    }

    await resend.emails.send({
      from: `${business.name} <onboarding@resend.dev>`,
      to: testEmail,
      subject: `[TEST] ${personalizedSubject}`,
      html: `
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">⚠️ This is a test email</h3>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This is a preview of how your campaign email will look. Customer name shown as "John" for testing.
          </p>
        </div>
        ${personalizedBody}
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; text-align: center;">
          Test email sent from Sentra • Campaign: ${campaign.name}
        </div>
      `,
      tags: [
        { name: 'type', value: 'test' },
        { name: 'campaign_id', value: campaignId },
      ],
    })

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
