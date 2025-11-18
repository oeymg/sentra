import { useCallback, useEffect, useRef, useState } from 'react'

export type OverviewResponse = {
  stats: {
    businessCount: number
    connectedPlatforms: number
    totalReviews: number
    aiResponses: number
    avgRating: number
    responseRate: number
    pendingReviews: number
    weeklyChange: number
  }
  reviewTrend: Array<{ month: string; reviews: number; responses: number; avgRating: number }>
  sentimentBreakdown: Array<{ label: string; value: number }>
  platformPerformance: Array<{ platform: string; icon: string; reviews: number; responseRate: number }>
  categoryBreakdown: Array<{ category: string; count: number; share: number }>
  latestReviews: Array<{
    id: string
    platform: string
    rating: number
    sentiment: string | null
    reviewed_at: string
    has_response: boolean
  }>
  responseTime: {
    medianHours: number | null
    sameDayPercent: number
  }
}

export function useOverview(businessId?: string) {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchOverview = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    const endpoint = businessId
      ? `/api/dashboard/overview?businessId=${businessId}`
      : '/api/dashboard/overview'

    try {
      const response = await fetch(endpoint, { signal: controller.signal })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load dashboard data')
      }

      if (!controller.signal.aborted) {
        setData(payload)
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error('Error fetching overview:', err)
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
        setData(null)
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [businessId])

  useEffect(() => {
    fetchOverview()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchOverview])

  return { data, loading, error, refresh: fetchOverview }
}
