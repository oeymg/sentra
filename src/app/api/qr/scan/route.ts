import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { businessId } = await request.json()

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const userAgent = request.headers.get('user-agent') ?? null

    const { error } = await supabase
      .from('qr_scans')
      .insert({ business_id: businessId, user_agent: userAgent })

    if (error) {
      console.error('[QR Scan] Insert error:', error)
      return NextResponse.json({ error: 'Failed to record scan' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[QR Scan] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
