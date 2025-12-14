import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for demo request
const demoRequestSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  companyName: z.string().min(2, 'Company name is required'),
  companySize: z.string().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  currentReviewVolume: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  timezone: z.string().optional(),
  message: z.string().optional(),
  howDidYouHear: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = demoRequestSchema.parse(body)

    // Create Supabase client
    const supabase = await createClient()

    // Insert demo request
    const { data, error } = await supabase
      .from('demo_requests')
      .insert({
        full_name: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone || null,
        company_name: validatedData.companyName,
        company_size: validatedData.companySize || null,
        job_title: validatedData.jobTitle || null,
        industry: validatedData.industry || null,
        website: validatedData.website || null,
        current_review_volume: validatedData.currentReviewVolume || null,
        preferred_date: validatedData.preferredDate || null,
        preferred_time: validatedData.preferredTime || null,
        timezone: validatedData.timezone || null,
        message: validatedData.message || null,
        how_did_you_hear: validatedData.howDidYouHear || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting demo request:', error)
      return NextResponse.json(
        { error: 'Failed to submit demo request. Please try again.' },
        { status: 500 }
      )
    }

    // TODO: Send email notification to sales team
    // TODO: Send confirmation email to customer

    return NextResponse.json(
      {
        success: true,
        message: 'Demo request submitted successfully!',
        data,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error submitting demo request:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
