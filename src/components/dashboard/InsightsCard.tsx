'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import type { BusinessInsight, InsightsAnalysis } from '@/lib/ai/claude'

interface InsightsCardProps {
  businessId?: string
}

const priorityColors = {
  high: 'bg-red-50 border-red-200 text-red-700',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  low: 'bg-blue-50 border-blue-200 text-blue-700',
}

const priorityIcons = {
  high: '🔴',
  medium: '🟡',
  low: '🔵',
}

const categoryIcons = {
  response_strategy: '💬',
  customer_satisfaction: '😊',
  operational: '⚙️',
  marketing: '📢',
}

// Cache key for session-based insights storage
const INSIGHTS_CACHE_KEY = 'sentra_insights_cache'
const SESSION_ID_KEY = 'sentra_session_id'

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  return sessionId
}

// Get cached insights for current session
function getCachedInsights(businessId?: string): InsightsAnalysis | null {
  if (typeof window === 'undefined') return null

  try {
    const cache = localStorage.getItem(INSIGHTS_CACHE_KEY)
    if (!cache) return null

    const parsed = JSON.parse(cache)
    const currentSession = getSessionId()

    // Check if cache is for current session and business
    if (parsed.sessionId === currentSession && parsed.businessId === (businessId || 'default')) {
      return parsed.data
    }
  } catch (error) {
    console.error('Error reading insights cache:', error)
  }

  return null
}

// Save insights to cache
function setCachedInsights(data: InsightsAnalysis, businessId?: string) {
  if (typeof window === 'undefined') return

  try {
    const cache = {
      sessionId: getSessionId(),
      businessId: businessId || 'default',
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Error saving insights cache:', error)
  }
}

export default function InsightsCard({ businessId }: InsightsCardProps) {
  const [insights, setInsights] = useState<InsightsAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInsight, setSelectedInsight] = useState<BusinessInsight | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [fromCache, setFromCache] = useState(false)

  async function fetchInsights(forceRefresh = false) {
    try {
      setLoading(true)
      setError(null)

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getCachedInsights(businessId)
        if (cached) {
          console.log('[Insights] Using cached insights from this session')
          setInsights(cached)
          setFromCache(true)
          setLoading(false)
          return
        }
      }

      setFromCache(false)

      console.log('[Insights] Fetching fresh insights from API')
      const url = businessId
        ? `/api/dashboard/insights?businessId=${businessId}`
        : '/api/dashboard/insights'

      const response = await fetch(url)
      const data = await response.json()

      // Check if it's a service unavailable error (API credits)
      if (response.status === 503 && data.message) {
        setError(data.message)
        setInsights(null)
        return
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch insights')
      }

      // Save to cache
      setCachedInsights(data, businessId)
      setInsights(data)
    } catch (err) {
      console.error('Failed to fetch insights:', err)
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function handleRefresh() {
    setRefreshing(true)
    fetchInsights(true)
  }

  useEffect(() => {
    fetchInsights()
  }, [businessId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🤖</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">AI-Powered Insights</h2>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    const isApiCreditError = error.includes('API credits') || error.includes('credit balance')

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🤖</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">AI-Powered Insights</h2>
        </div>
        <div className={`border rounded-lg p-4 ${isApiCreditError ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{isApiCreditError ? '💳' : '⚠️'}</span>
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${isApiCreditError ? 'text-yellow-900' : 'text-red-900'}`}>
                {isApiCreditError ? 'API Credits Required' : 'Error Loading Insights'}
              </p>
              <p className={`text-sm ${isApiCreditError ? 'text-yellow-700' : 'text-red-700'}`}>{error}</p>
              {isApiCreditError && (
                <a
                  href="https://console.anthropic.com/settings/billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm font-medium text-purple-600 hover:text-purple-700 underline"
                >
                  Add credits to Anthropic account →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!insights || insights.insights.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🤖</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">AI-Powered Insights</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Generate fresh insights"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <p className="text-gray-600 text-sm leading-relaxed">{insights.summary}</p>
        {fromCache && (
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <span>💾</span> Cached insights from this session
          </p>
        )}
      </div>

      {/* Insights List */}
      <div className="space-y-3 mb-6">
        {insights.insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedInsight === insight ? 'ring-2 ring-purple-500' : ''
            } ${priorityColors[insight.priority]}`}
            onClick={() => setSelectedInsight(selectedInsight === insight ? null : insight)}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{categoryIcons[insight.category]}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">{priorityIcons[insight.priority]}</span>
                  <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                </div>
                <p className="text-sm text-gray-700 mb-2">{insight.description}</p>

                <AnimatePresence>
                  {selectedInsight === insight && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-gray-300 space-y-2"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Action to Take:</p>
                        <p className="text-sm text-gray-800">{insight.actionable}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Expected Impact:</p>
                        <p className="text-sm text-gray-800">{insight.impact}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Do's and Don'ts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.strengths.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2 text-base">
              <span className="text-xl">✅</span> Do This
            </h3>
            <ul className="space-y-2">
              {insights.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-green-800 flex gap-2 items-start">
                  <span className="text-green-600 font-bold mt-0.5">→</span>
                  <span className="flex-1">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {insights.opportunities.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2 text-base">
              <span className="text-xl">❌</span> Avoid This
            </h3>
            <ul className="space-y-2">
              {insights.opportunities.map((opportunity, index) => (
                <li key={index} className="text-sm text-red-800 flex gap-2 items-start">
                  <span className="text-red-600 font-bold mt-0.5">→</span>
                  <span className="flex-1">{opportunity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
