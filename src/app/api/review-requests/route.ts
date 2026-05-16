import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

function maskContact(method: string, contact: string): string {
  if (method === 'email') {
    const [local, domain] = contact.split('@')
    if (!domain) return contact
    return `${local[0]}···@${domain}`
  }
  // phone — show last 4 digits
  const digits = contact.replace(/\D/g, '')
  return `···· ${digits.slice(-4)}`
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, method, contact } = await request.json()
    if (!businessId || !method || !contact) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const validMethods = ['whatsapp', 'sms', 'email']
    if (!validMethods.includes(method)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // Verify the caller owns this business
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!business) return NextResponse.json({ ok: false }, { status: 403 })

    const serviceClient = createServiceRoleClient()
    await serviceClient.from('review_requests').insert({
      business_id: businessId,
      method,
      contact_hint: maskContact(method, contact),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId')
    if (!businessId) return NextResponse.json({ ok: false }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    const { data, error } = await supabase
      .from('review_requests')
      .select('id, method, contact_hint, sent_at')
      .eq('business_id', businessId)
      .order('sent_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ ok: true, requests: data ?? [] })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
