import { Resend } from 'resend'

// Initialize Resend client
// To use this, add RESEND_API_KEY to your .env.local file
// Get your API key from: https://resend.com/api-keys
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export const isResendConfigured = () => !!process.env.RESEND_API_KEY

export interface SendCampaignEmailOptions {
  to: string
  from: string
  subject: string
  html: string
  trackingToken: string
  campaignId: string
  reviewUrl: string
}

export async function sendCampaignEmail(options: SendCampaignEmailOptions) {
  if (!resend) {
    throw new Error('Resend is not configured. Please add RESEND_API_KEY to your environment variables.')
  }

  const { to, from, subject, html, trackingToken, campaignId, reviewUrl } = options

  // Inject tracking pixel and modify links
  const trackingPixelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/campaigns/track/${trackingToken}`
  const clickTrackingBaseUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/campaigns/track/${trackingToken}/click`
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/unsubscribe/${trackingToken}`

  // Add tracking pixel at the end of the email
  const htmlWithTracking = html + `\n<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:block" />`

  // Build tracked review link (click tracking URL with actual review URL as parameter)
  const trackedReviewLink = `${clickTrackingBaseUrl}?url=${encodeURIComponent(reviewUrl)}`

  // Replace {{review_link}} with tracked link
  let finalHtml = htmlWithTracking.replace(
    /\{\{review_link\}\}/g,
    trackedReviewLink
  )

  // Add unsubscribe link footer
  const unsubscribeFooter = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <p style="margin: 0 0 8px 0;">
        Don't want to receive these emails? <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
      </p>
      <p style="margin: 0; color: #d1d5db;">
        This email was sent from Sentra
      </p>
    </div>
  `

  finalHtml = finalHtml + unsubscribeFooter

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html: finalHtml,
      tags: [
        { name: 'campaign_id', value: campaignId },
        { name: 'tracking_token', value: trackingToken },
      ],
    })

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email via Resend:', error)
    throw error
  }
}
