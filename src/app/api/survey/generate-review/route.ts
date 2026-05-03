import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

const STAR_LABEL: Record<number, string> = {
  5: 'excellent',
  4: 'good',
  3: 'okay',
  2: 'below average',
  1: 'poor',
}

async function generateReviewText(
  businessName: string,
  serviceType: string,
  serviceRating: number,
  qualityRating: number,
  speedRating: number,
  jobDescription: string,
  highlights: string[],
  customerName: string,
  additionalComments: string
): Promise<string> {
  const highlightLine = highlights.length > 0
    ? `What stood out to the customer: ${highlights.join(', ')}`
    : 'No specific highlights selected'

  const prompt = `You are writing a Google review on behalf of a real customer for an Australian tradie business. Your job is to write it so it sounds exactly like something a regular person would type themselves.

CUSTOMER CONTEXT
Business: ${businessName}
Service type: ${serviceType}
What was done: ${jobDescription || 'not specified'}
${highlightLine}
Customer's name: ${customerName || 'not provided'}
Their own extra words: ${additionalComments || 'none'}

THEIR RATINGS
Overall service: ${STAR_LABEL[serviceRating]} (${serviceRating}/5)
Work quality: ${STAR_LABEL[qualityRating]} (${qualityRating}/5)
Response speed: ${STAR_LABEL[speedRating]} (${speedRating}/5)

RULES
- Write in first person ("I", "we", "my")
- 70–120 words — not too short (looks fake), not too long (looks corporate)
- Reference specific details: mention what was actually done, what stood out, and reflect the ratings honestly
- Vary your sentence structure — don't start every sentence the same way
- Sound like a real tradie customer: plain language, conversational, occasionally informal
- If the ratings are mostly 4–5: warm and positive but grounded
- If ratings are mixed (some 3s): honest and balanced — not gushing
- NEVER use: "I highly recommend", "pleasantly surprised", "went above and beyond", "five-star", "10/10"
- Do NOT mention star counts in the text
- Do NOT add a sign-off like "Thanks!" or the reviewer's name at the end
- Respond with only the review text, nothing else`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response from Claude')
  return content.text.trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessId,
      serviceType,
      serviceRating,
      qualityRating,
      speedRating,
      jobDescription,
      highlights,
      customerName,
      additionalComments,
    } = body

    if (!businessId || !serviceType || !serviceRating || !qualityRating || !speedRating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single()

    if (bizError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const rating = Math.round((serviceRating + qualityRating + speedRating) / 3)
    const isPrivate = rating <= 3

    const reviewText = await generateReviewText(
      business.name,
      serviceType,
      serviceRating,
      qualityRating,
      speedRating,
      jobDescription ?? '',
      highlights ?? [],
      customerName ?? '',
      additionalComments ?? ''
    )

    const { data: submission, error: insertError } = await supabase
      .from('survey_submissions')
      .insert({
        business_id: businessId,
        service_type: serviceType,
        service_rating: serviceRating,
        quality_rating: qualityRating,
        speed_rating: speedRating,
        job_description: jobDescription ?? null,
        highlights: highlights ?? null,
        customer_name: customerName ?? null,
        additional_comments: additionalComments ?? null,
        rating,
        generated_review: reviewText,
        is_private: isPrivate,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[Survey Generate] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }

    return NextResponse.json({ reviewText, rating, isPrivate, submissionId: submission.id })
  } catch (err) {
    console.error('[Survey Generate] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
