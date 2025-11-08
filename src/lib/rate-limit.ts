import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from '@/lib/env'
import { NextRequest } from 'next/server'

/**
 * Rate limiter instances for different API endpoints
 * Uses Upstash Redis for distributed rate limiting
 *
 * If Upstash credentials are not configured, uses in-memory rate limiting
 * (which only works for single-instance deployments)
 */

let redis: Redis | undefined
let rateLimiters: {
  api: Ratelimit
  aiAnalysis: Ratelimit
  sync: Ratelimit
}

// Initialize rate limiters
if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  // Production: Use Upstash Redis for distributed rate limiting
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  })

  rateLimiters = {
    // General API endpoints: 60 requests per minute
    api: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:api',
    }),

    // AI analysis endpoints: 20 requests per minute (more expensive)
    aiAnalysis: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:ai',
    }),

    // Sync endpoints: 10 requests per 5 minutes (heavy operations)
    sync: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '5 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:sync',
    }),
  }

  console.log('✓ Rate limiting enabled with Upstash Redis')
} else {
  // Development: Use in-memory rate limiting
  console.warn(
    '⚠️  Upstash Redis not configured. Using in-memory rate limiting (single-instance only).\n' +
      '   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production.'
  )

  // Create a simple in-memory cache
  const cache = new Map()
  const fakeRedis = {
    sadd: async () => 1,
    eval: async () => [1, new Date().getTime() + 60000],
    get: async (key: string) => cache.get(key) || null,
    set: async (key: string, value: any) => cache.set(key, value),
    expire: async () => 1,
  } as any

  rateLimiters = {
    api: new Ratelimit({
      redis: fakeRedis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
    }),
    aiAnalysis: new Ratelimit({
      redis: fakeRedis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
    }),
    sync: new Ratelimit({
      redis: fakeRedis,
      limiter: Ratelimit.slidingWindow(10, '5 m'),
    }),
  }
}

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
export function getRateLimitIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Use IP address as fallback
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0] ?? request.headers.get('x-real-ip') ?? 'anonymous'
  return `ip:${ip}`
}

/**
 * Check rate limit for a request
 * Returns { success: true } if within limits, { success: false, ... } if rate limited
 */
export async function checkRateLimit(
  request: NextRequest,
  type: 'api' | 'aiAnalysis' | 'sync',
  userId?: string
) {
  const identifier = getRateLimitIdentifier(request, userId)
  const limiter = rateLimiters[type]

  return await limiter.limit(identifier)
}

/**
 * Rate limit middleware wrapper for API routes
 * Usage:
 *
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await checkRateLimit(request, 'api')
 *   if (!rateLimitResult.success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests. Please try again later.' },
 *       {
 *         status: 429,
 *         headers: {
 *           'X-RateLimit-Limit': rateLimitResult.limit.toString(),
 *           'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
 *           'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
 *         },
 *       }
 *     )
 *   }
 *   // ... rest of your handler
 * }
 */
