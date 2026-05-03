import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { submissionId, googleClicked } = await request.json()

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from('survey_submissions')
      .update({
        submitted_at: new Date().toISOString(),
        google_redirect_clicked: googleClicked ?? false,
      })
      .eq('id', submissionId)

    if (error) {
      console.error('[Survey Submit] Update error:', error)
      return NextResponse.json({ error: 'Failed to mark submission' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Survey Submit] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
