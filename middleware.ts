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

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/auth/callback',
    '/auth/confirm',
  ]

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith('/auth/'))

  // Update Supabase session
  const supabaseResponse = await updateSession(request)

  // For API routes, check authentication
  if (pathname.startsWith('/api/')) {
    // These API routes don't require authentication
    const publicApiRoutes = [
      '/api/auth/',
    ]

    const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route))

    if (!isPublicApiRoute) {
      // For protected API routes, authentication is checked within each route handler
      // We rely on Supabase session cookies for authentication
      return supabaseResponse
    }
  }

  // For dashboard routes, redirect to login if not authenticated
  if (pathname.startsWith('/dashboard') && !hasSupabaseSession(request)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
