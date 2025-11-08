import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

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
  if (pathname.startsWith('/dashboard')) {
    const supabase = supabaseResponse.cookies

    // Simple check: if there's no session cookie, redirect to login
    // More robust authentication is handled by Supabase RLS and route handlers
    const hasSessionCookie = request.cookies.has('sb-access-token') ||
                              request.cookies.has('sb-refresh-token')

    if (!hasSessionCookie) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
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
