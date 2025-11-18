'use client'

import { useState, useEffect } from 'react'

export interface Insight {
  category: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
  relatedReviews?: number
}

interface CachedInsights {
  data: Insight[]
  timestamp: number
  businessId: string
}

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes
const CACHE_KEY = 'ai_insights_cache'

export function useInsights(businessId: string | undefined, cacheKey?: string) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!businessId) {
      setLoading(false)
      return
    }

    const fetchInsights = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check cache first
        const actualCacheKey = cacheKey || CACHE_KEY
        const cachedData = sessionStorage.getItem(actualCacheKey)

        if (cachedData) {
          try {
            const parsed: CachedInsights = JSON.parse(cachedData)
            const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION
            const isSameBusiness = parsed.businessId === businessId

            if (!isExpired && isSameBusiness) {
              setInsights(parsed.data)
              setLoading(false)
              return
            }
          } catch {
            // Invalid cache, continue to fetch
          }
        }

        // Fetch fresh data
        const response = await fetch(`/api/dashboard/insights?businessId=${businessId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch insights')
        }

        const data = await response.json()
        const insightsList = data.insights || []

        // Cache the results
        const cacheData: CachedInsights = {
          data: insightsList,
          timestamp: Date.now(),
          businessId,
        }
        sessionStorage.setItem(actualCacheKey, JSON.stringify(cacheData))

        setInsights(insightsList)
      } catch (err) {
        console.error('Error fetching insights:', err)
        setError(err instanceof Error ? err.message : 'Failed to load insights')
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [businessId, cacheKey])

  const clearCache = () => {
    const actualCacheKey = cacheKey || CACHE_KEY
    sessionStorage.removeItem(actualCacheKey)
  }

  return { insights, loading, error, clearCache }
}
