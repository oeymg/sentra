import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const SUPABASE_COOKIE_PREFIX = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null
  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
    return `sb-${projectRef}-auth-token`
  } catch {
    return null
  }
})()

function hasSupabaseSession(request: NextRequest) {
  const cookies = request.cookies.getAll()

  // Legacy cookie names used by some Supabase helpers
  const legacySession = cookies.some((cookie) =>
    cookie.name === 'sb-access-token' || cookie.name === 'sb-refresh-token'
  )
  if (legacySession) return true

  if (!SUPABASE_COOKIE_PREFIX) return false

  return cookies.some((cookie) =>
    cookie.name === SUPABASE_COOKIE_PREFIX || cookie.name.startsWith(`${SUPABASE_COOKIE_PREFIX}.`)
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!hasSupabaseSession(request)) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Dashboard routes are client-rendered and handle auth inside the app.
  // Avoid refreshing the Supabase session in middleware on every page/API request.
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // Onboarding routes render on the server and benefit from refreshed cookies.
  return updateSession(request)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
  ],
}
