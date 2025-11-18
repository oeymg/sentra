export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  tone: 'grateful' | 'direct' | 'incentive' | 'followup' | 'vip'
  description: string
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'grateful',
    name: 'The Grateful',
    tone: 'grateful',
    subject: 'Thank you, {{customer}}! Your feedback would mean the world',
    description: 'Warm, personal thank you that makes customers feel valued',
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">

        <!-- Header -->
        <div style="text-align: center; padding: 30px 0 20px 0;">
          <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 600; margin: 0;">Thank You! 🙏</h1>
        </div>

        <!-- Main Content -->
        <div style="background: #ffffff; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
          <p style="font-size: 18px; color: #1a1a1a; margin: 0 0 20px 0;">Hi {{customer}},</p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 20px 0;">
            I wanted to personally reach out and thank you for choosing <strong style="color: #1a1a1a;">{{business_name}}</strong>. Customers like you are the reason we love what we do!
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 30px 0;">
            Your experience matters to us, and we'd be honored if you could share your feedback with others. It only takes a minute and helps us continue to improve.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="{{review_link}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
              ⭐ Leave a Quick Review
            </a>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 30px 0 0 0;">
            Thank you again for your support!
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 20px 0 0 0;">
            Warmly,<br>
            <strong style="color: #1a1a1a;">The {{business_name}} Team</strong>
          </p>
        </div>

        <!-- PS Section -->
        <div style="background: #f8f9fa; border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin: 0;">
            <strong style="color: #4a4a4a;">P.S.</strong> If you ever have questions or concerns, please reach out directly - we're always here to help.
          </p>
        </div>
      </div>
    `,
  },
  {
    id: 'direct',
    name: 'The Direct',
    tone: 'direct',
    subject: 'Quick question about your recent visit',
    description: 'Straightforward and professional request',
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">

        <!-- Header -->
        <div style="text-align: center; padding: 30px 0 20px 0;">
          <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 600; margin: 0;">Quick Feedback Request</h1>
        </div>

        <!-- Main Content -->
        <div style="background: #ffffff; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
          <p style="font-size: 18px; color: #1a1a1a; margin: 0 0 20px 0;">Hello {{customer}},</p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 20px 0;">
            We hope you enjoyed your recent experience at <strong style="color: #1a1a1a;">{{business_name}}</strong>.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 30px 0;">
            We'd appreciate it if you could take <strong>60 seconds</strong> to share your feedback with future customers:
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="{{review_link}}" style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
              📝 Leave Your Review
            </a>
          </div>

          <p style="font-size: 15px; line-height: 1.5; color: #6b7280; margin: 30px 0 0 0; text-align: center;">
            Your honest review helps others make informed decisions<br>and helps us improve our service.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 30px 0 0 0;">
            Thank you for your time!
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 15px 0 0 0;">
            Best regards,<br>
            <strong style="color: #1a1a1a;">{{business_name}}</strong>
          </p>
        </div>
      </div>
    `,
  },
  {
    id: 'incentive',
    name: 'The Incentive',
    tone: 'incentive',
    subject: '{{customer}}, enjoy 10% off your next visit (+ quick favor)',
    description: 'Offers discount/gift for leaving a review',
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">

        <!-- Header with Gift -->
        <div style="text-align: center; padding: 30px 0 20px 0;">
          <div style="font-size: 48px; margin-bottom: 10px;">🎁</div>
          <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 600; margin: 0;">A Thank You Gift!</h1>
        </div>

        <!-- Discount Banner -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
          <p style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0;">10% OFF</p>
          <p style="color: #d1fae5; font-size: 14px; margin: 8px 0 0 0;">Your next visit</p>
        </div>

        <!-- Main Content -->
        <div style="background: #ffffff; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
          <p style="font-size: 18px; color: #1a1a1a; margin: 0 0 20px 0;">Hi {{customer}},</p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 20px 0;">
            Thank you for choosing <strong style="color: #1a1a1a;">{{business_name}}</strong>! We hope you had a great experience.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 20px 0;">
            As a token of appreciation, we'd like to offer you <strong style="color: #10b981;">10% off your next visit</strong> - no strings attached!
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 30px 0;">
            But if you have 2 minutes, we'd love to hear about your experience:
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="{{review_link}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              ⭐ Share Your Experience
            </a>
          </div>

          <p style="font-size: 15px; line-height: 1.5; color: #6b7280; margin: 30px 0; text-align: center;">
            Your review helps other customers discover us<br>and helps our team continue to improve.
          </p>

          <!-- Discount Code Box -->
          <div style="background: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <p style="font-size: 13px; color: #065f46; margin: 0 0 8px 0; font-weight: 600;">USE THIS CODE AT YOUR NEXT VISIT:</p>
            <p style="font-size: 24px; color: #10b981; font-weight: 700; margin: 0; letter-spacing: 2px;">REVIEW10</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 25px 0 0 0; text-align: center;">
            Thanks for being awesome! 🎉
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 15px 0 0 0; text-align: center;">
            <strong style="color: #1a1a1a;">The {{business_name}} Team</strong>
          </p>
        </div>
      </div>
    `,
  },
  {
    id: 'followup',
    name: 'The Follow-up',
    tone: 'followup',
    subject: "We'd still love to hear from you, {{customer}}",
    description: 'Gentle reminder for customers who didn\'t respond',
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">

        <!-- Header -->
        <div style="text-align: center; padding: 30px 0 20px 0;">
          <div style="font-size: 36px; margin-bottom: 10px;">👋</div>
          <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 600; margin: 0;">Quick Follow-Up</h1>
        </div>

        <!-- Main Content -->
        <div style="background: #ffffff; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
          <p style="font-size: 18px; color: #1a1a1a; margin: 0 0 20px 0;">Hi {{customer}},</p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 20px 0;">
            We reached out last week to see if you'd be willing to share your experience at <strong style="color: #1a1a1a;">{{business_name}}</strong>.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 30px 0;">
            We understand you're busy, but if you have just <strong>60 seconds</strong>, your feedback would really help us out:
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="{{review_link}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
              💬 Share Your Thoughts
            </a>
          </div>

          <p style="font-size: 15px; line-height: 1.5; color: #6b7280; margin: 30px 0; text-align: center;">
            Your honest opinion helps us improve and<br>helps other customers make informed decisions.
          </p>

          <!-- No Pressure Note -->
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 25px 0;">
            <p style="font-size: 14px; line-height: 1.5; color: #78350f; margin: 0;">
              <strong>No pressure!</strong> We appreciate your business either way. 😊
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 25px 0 0 0;">
            Thank you,<br>
            <strong style="color: #1a1a1a;">{{business_name}}</strong>
          </p>
        </div>
      </div>
    `,
  },
  {
    id: 'vip',
    name: 'The VIP',
    tone: 'vip',
    subject: "{{customer}}, you're one of our top customers ⭐",
    description: 'Special treatment for loyal/high-value customers',
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">

        <!-- VIP Badge -->
        <div style="text-align: center; padding: 30px 0 20px 0;">
          <div style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 12px 30px; border-radius: 50px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);">
            <p style="color: #ffffff; font-size: 14px; font-weight: 700; margin: 0; letter-spacing: 2px;">⭐ VIP CUSTOMER ⭐</p>
          </div>
          <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 600; margin: 10px 0 0 0;">You're Special to Us</h1>
        </div>

        <!-- Main Content -->
        <div style="background: linear-gradient(to bottom, #fffbeb 0%, #ffffff 100%); border-radius: 12px; padding: 35px; margin-bottom: 20px; border: 2px solid #fef3c7;">
          <p style="font-size: 18px; color: #1a1a1a; margin: 0 0 20px 0;">Dear {{customer}},</p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 20px 0;">
            You're one of our <strong style="color: #d97706;">most valued customers</strong> at {{business_name}}, and we wanted to reach out personally.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 20px 0;">
            Your continued support means everything to our small business. As someone who knows us well, your perspective would be incredibly valuable to others considering our services.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 30px 0;">
            Would you be willing to share your experience?
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="{{review_link}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 8px; font-size: 17px; font-weight: 700; box-shadow: 0 6px 16px rgba(251, 191, 36, 0.4); text-transform: uppercase; letter-spacing: 1px;">
              ⭐ Share Your Story
            </a>
          </div>

          <p style="font-size: 15px; line-height: 1.6; color: #6b7280; margin: 30px 0; padding: 20px; background: #ffffff; border-radius: 8px; text-align: center;">
            Your review carries weight because you've experienced what we do over time. It would help us grow while maintaining the quality you've come to expect.
          </p>

          <!-- VIP Perk -->
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #fbbf24; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
            <p style="font-size: 14px; color: #92400e; font-weight: 600; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">🎁 VIP Exclusive Perk</p>
            <p style="font-size: 15px; line-height: 1.5; color: #78350f; margin: 0;">
              As a thank you for being such a loyal customer, you'll get <strong>early access to any new services</strong> we launch. Just mention this email next time you visit!
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 30px 0 0 0; text-align: center;">
            With gratitude,<br>
            <strong style="color: #1a1a1a;">The {{business_name}} Team</strong>
          </p>
        </div>

        <!-- Thank You Note -->
        <div style="text-align: center; padding: 15px;">
          <p style="font-size: 13px; color: #9ca3af; margin: 0;">
            Thank you for being part of our journey 🙏
          </p>
        </div>
      </div>
    `,
  },
]

export function getTemplateById(id: string): EmailTemplate | undefined {
  return emailTemplates.find((t) => t.id === id)
}

export function getTemplateByTone(tone: EmailTemplate['tone']): EmailTemplate | undefined {
  return emailTemplates.find((t) => t.tone === tone)
}

export function replaceTemplateVariables(
  template: string,
  variables: {
    customer?: string
    business_name?: string
    review_link?: string
  }
): string {
  let result = template

  if (variables.customer) {
    result = result.replace(/\{\{customer\}\}/g, variables.customer)
    result = result.replace(/\{\{first_name\}\}/g, variables.customer)
  }

  if (variables.business_name) {
    result = result.replace(/\{\{business_name\}\}/g, variables.business_name)
  }

  if (variables.review_link) {
    result = result.replace(/\{\{review_link\}\}/g, variables.review_link)
  }

  return result
}
