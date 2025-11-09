'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import InsightsCard from '@/components/dashboard/InsightsCard'
import SyncToast from '@/components/SyncToast'
import { createClient } from '@/lib/supabase/client'
import { smartAutoSync, type SyncStatus } from '@/lib/auto-sync'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Link2,
  MessageSquare,
  RefreshCw,
  Star,
} from 'lucide-react'
import Link from 'next/link'

type OverviewResponse = {
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
  latestReviews: Array<{ id: string; platform: string; rating: number; sentiment: string | null; reviewed_at: string; has_response: boolean }>
  responseTime: {
    medianHours: number | null
    sameDayPercent: number
  }
}

export default function Dashboard() {
  const router = useRouter()
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([])
  const [showSyncToast, setShowSyncToast] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: businesses } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        const firstBusinessId = businesses?.[0]?.id ?? null
        setBusinessId(firstBusinessId)

        const endpoint = firstBusinessId
          ? `/api/dashboard/overview?businessId=${firstBusinessId}`
          : '/api/dashboard/overview'

        const response = await fetch(endpoint)
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }

        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load dashboard data')
        }

        setOverview(payload)

        // Auto-sync reviews if business has connected platforms
        if (firstBusinessId && payload.stats.connectedPlatforms > 0) {
          console.log('[Dashboard] Triggering smart auto-sync')
          setSyncStatuses([])
          setShowSyncToast(true)

          smartAutoSync(firstBusinessId, false, (status) => {
            setSyncStatuses((prev) => {
              const existing = prev.find((s) => s.platform === status.platform)
              if (existing) {
                return prev.map((s) => (s.platform === status.platform ? status : s))
              }
              return [...prev, status]
            })
          }).then((result) => {
            if (result) {
              console.log('[Dashboard] Auto-sync complete:', result.totalReviews, 'reviews synced')
              // Reload dashboard data if reviews were synced
              if (result.totalReviews > 0) {
                fetch(endpoint)
                  .then((res) => res.json())
                  .then((data) => setOverview(data))
                  .catch(console.error)
              }
              // Auto-hide toast after 5 seconds
              setTimeout(() => {
                setShowSyncToast(false)
              }, 5000)
            } else {
              // No sync needed (synced recently)
              setShowSyncToast(false)
            }
          })
        }
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleRefresh = async () => {
    if (!businessId || refreshing) return

    setRefreshing(true)
    try {
      const endpoint = `/api/dashboard/overview?businessId=${businessId}`
      const response = await fetch(endpoint)
      if (response.ok) {
        const payload = await response.json()
        setOverview(payload)
      }
    } catch (err) {
      console.error('Failed to refresh:', err)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto mt-24 text-center space-y-4">
          <p className="text-lg text-gray-800 font-medium">We couldn&apos;t load your dashboard.</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={() => {
              setLoading(true)
              setError(null)
              setOverview(null)
              router.refresh()
            }}
            className="px-4 py-2 bg-black text-white rounded-lg"
          >
            Try again
          </button>
        </div>
      </DashboardLayout>
    )
  }

  if (!overview) return null

  if (overview.stats.businessCount === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6">
          <h1 className="text-4xl font-light text-black">Let&apos;s add your first business</h1>
          <p className="text-gray-600 max-w-md">
            Connect a business profile to start aggregating reviews, running AI analysis, and sending replies from Sentra.
          </p>
          <Link
            href="/dashboard/onboarding"
            className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition"
          >
            Start onboarding
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const statsCards = [
    {
      label: 'Connected Platforms',
      value: overview.stats.connectedPlatforms,
      helper: 'Active integrations',
      icon: Link2,
    },
    {
      label: 'Total Reviews',
      value: overview.stats.totalReviews,
      helper: 'All time',
      icon: MessageSquare,
    },
    {
      label: 'Average Rating',
      value: overview.stats.avgRating.toFixed(1),
      helper: 'Across every platform',
      icon: Star,
    },
    {
      label: 'Response Rate',
      value: `${overview.stats.responseRate}%`,
      helper: 'Reviews with replies',
      icon: RefreshCw,
    },
  ]

  return (
    <DashboardLayout>
      <div className="p-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex items-start justify-between">
            <div>
              <motion.h1
                className="text-5xl font-light mb-3 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Dashboard
              </motion.h1>
              <p className="text-lg text-gray-600 font-light">
                Live snapshot of your review operations
                {overview.stats.totalReviews > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    • Based on {Math.min(overview.stats.totalReviews, 5)} most recent reviews
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Stats'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {statsCards.map((stat, idx) => {
              const Icon = stat.icon
              const gradients = [
                'from-blue-500 to-cyan-500',
                'from-purple-500 to-pink-500',
                'from-orange-500 to-red-500',
                'from-green-500 to-emerald-500'
              ]
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[idx]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">{stat.label}</p>
                      <span className={`p-3 rounded-xl bg-gradient-to-br ${gradients[idx]} text-white shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </span>
                    </div>
                    <div className="text-5xl font-light text-black mb-2">{stat.value}</div>
                    <p className="text-sm text-gray-600">{stat.helper}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* AI-Powered Insights */}
          {overview.stats.totalReviews > 0 && businessId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <InsightsCard businessId={businessId} />
            </motion.div>
          )}

          <div className="grid xl:grid-cols-[2fr,1fr] gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Review volume</p>
                  <h2 className="text-2xl font-light text-black">Last {overview.reviewTrend.length} months</h2>
                </div>
                <div className="px-4 py-2 rounded-lg bg-green-50 text-green-700 text-sm flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  {overview.stats.weeklyChange}% vs last week
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview.reviewTrend} margin={{ left: -20, right: 10 }}>
                    <defs>
                      <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#111111" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="month" stroke="#a1a1aa" />
                    <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }} />
                    <Area type="monotone" dataKey="reviews" stroke="#000" strokeWidth={2} fill="url(#trend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500">Sentiment mix</p>
                    <p className="text-lg font-light text-black">Across all reviews</p>
                  </div>
                  <Activity className="w-5 h-5 text-gray-500" />
                </div>
                <div className="space-y-4">
                  {overview.sentimentBreakdown.map((slice) => (
                    <div key={slice.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">{slice.label}</span>
                        <span className="text-black font-medium">{slice.value}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black"
                          style={{
                            width: overview.stats.totalReviews
                              ? `${(slice.value / overview.stats.totalReviews) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Response time</p>
                    <p className="text-lg font-light text-black">Speed to reply</p>
                  </div>
                  <RefreshCw className="w-5 h-5 text-gray-500" />
                </div>
                <div className="text-4xl font-light text-black">
                  {overview.responseTime.medianHours === null ? '—' : `${overview.responseTime.medianHours}h`}
                </div>
                <p className="text-sm text-gray-500">Median time from review to response</p>
                <div className="flex items-center justify-between text-sm">
                  <span>Same-day responses</span>
                  <span className="text-black font-medium">{overview.responseTime.sameDayPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Latest reviews</p>
                  <p className="text-lg font-light text-black">Most recent submissions</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-gray-500" />
              </div>
              <div className="space-y-4">
                {overview.latestReviews.length === 0 && (
                  <p className="text-sm text-gray-500">No reviews yet. Connect a platform to start collecting feedback.</p>
                )}
                {overview.latestReviews.map((review) => (
                  <div key={review.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4">
                    <div>
                      <p className="text-sm font-medium text-black">{review.platform}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.reviewed_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{review.rating.toFixed(1)} ★</p>
                      <p className={`text-xs ${review.has_response ? 'text-green-600' : 'text-amber-600'}`}>
                        {review.has_response ? 'Responded' : 'Awaiting reply'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Top categories</p>
                  <p className="text-lg font-light text-black">What people mention</p>
                </div>
                <BarIcon />
              </div>
              <div className="space-y-4">
                {overview.categoryBreakdown.length === 0 && (
                  <p className="text-sm text-gray-500">Run the AI analysis workflow to populate categories.</p>
                )}
                {overview.categoryBreakdown.map((category) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-black">{category.category}</p>
                      <p className="text-xs text-gray-500">{category.count} mentions</p>
                    </div>
                    <div className="text-lg font-light text-black">{category.share}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">Platform performance</p>
                <p className="text-lg font-light text-black">Where reviews are coming from</p>
              </div>
            </div>
            <div className="space-y-4">
              {overview.platformPerformance.length === 0 && (
                <p className="text-sm text-gray-500">No platform activity yet. Connect a review source to begin tracking.</p>
              )}
              {overview.platformPerformance.map((platform) => (
                <div
                  key={platform.platform}
                  className="flex items-center justify-between border border-gray-100 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-black">{platform.platform}</p>
                      <p className="text-xs text-gray-500">{platform.reviews} reviews</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase tracking-widest">Response rate</p>
                    <p className="text-lg font-light text-black">{platform.responseRate}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status Toast */}
      <SyncToast
        syncs={syncStatuses}
        isVisible={showSyncToast}
        onClose={() => setShowSyncToast(false)}
      />
    </DashboardLayout>
  )
}

function BarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="10" width="4" height="12" rx="1" className="fill-gray-200" />
      <rect x="10" y="4" width="4" height="18" rx="1" className="fill-gray-400" />
      <rect x="18" y="7" width="4" height="15" rx="1" className="fill-gray-600" />
    </svg>
  )
}
