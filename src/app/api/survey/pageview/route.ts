import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { businessId, source } = await request.json()
    if (!businessId) return NextResponse.json({ ok: false }, { status: 400 })

    const validSources = ['qr', 'nfc', 'link', 'direct']
    const safeSource = validSources.includes(source) ? source : 'direct'

    const supabase = createServiceRoleClient()
    await supabase.from('survey_page_views').insert({ business_id: businessId, source: safeSource })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
