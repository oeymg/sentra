import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Check if user has any businesses
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      // If no businesses exist, redirect to plan selection
      if (!businesses || businesses.length === 0) {
        return NextResponse.redirect(new URL('/onboarding/plan-selection', requestUrl.origin))
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
