'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import InsightsCard from '@/components/dashboard/InsightsCard'
import SyncToast from '@/components/SyncToast'
import { smartAutoSync, type SyncStatus } from '@/lib/auto-sync'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { useOverview } from '@/hooks/useOverview'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { StatsCardSkeleton } from '@/components/dashboard/LoadingSkeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'
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
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const { selectedBusiness, loading: businessLoading } = useBusinessContext()
  const {
    data: overview,
    loading: overviewLoading,
    error,
    refresh,
  } = useOverview(selectedBusiness?.id)
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([])
  const [showSyncToast, setShowSyncToast] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [publicLink, setPublicLink] = useState('')
  const isLoading = businessLoading || overviewLoading

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (selectedBusiness) {
      // Use slug for prettier URLs
      setPublicLink(`${window.location.origin}/review/${selectedBusiness.slug}`)
    } else {
      setPublicLink('')
    }
  }, [selectedBusiness?.id])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!selectedBusiness || !overview || overview.stats.connectedPlatforms === 0) {
      setShowSyncToast(false)
      return
    }

    let isMounted = true
    let hideToastTimeout: ReturnType<typeof setTimeout> | null = null

    console.log('[Dashboard] Triggering smart auto-sync')
    setSyncStatuses([])
    setShowSyncToast(true)

    smartAutoSync(selectedBusiness.id, false, (status) => {
      if (!isMounted) return
      setSyncStatuses((prev) => {
        const existing = prev.find((s) => s.platform === status.platform)
        if (existing) {
          return prev.map((s) => (s.platform === status.platform ? status : s))
        }
        return [...prev, status]
      })
    }).then((result) => {
      if (!isMounted) return

      if (!result) {
        setShowSyncToast(false)
        return
      }

      if (result.totalReviews > 0) {
        refresh()
      }

      hideToastTimeout = setTimeout(() => {
        if (isMounted) {
          setShowSyncToast(false)
        }
      }, 5000)
    })

    return () => {
      isMounted = false
      if (hideToastTimeout) {
        clearTimeout(hideToastTimeout)
      }
    }
  }, [overview?.stats.connectedPlatforms, refresh, selectedBusiness?.id])


  const handleRefresh = async () => {
    if (refreshing) return

    setRefreshing(true)
    try {
      await refresh()
    } catch (err) {
      console.error('Failed to refresh dashboard:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleCopyLink = () => {
    if (!publicLink) return
    navigator.clipboard.writeText(publicLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-12">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="mb-8">
              <div className="h-12 bg-gray-200 rounded w-64 mb-3 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-96 animate-pulse" />
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </div>
          </div>
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
              refresh()
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
        <EmptyState
          icon={Link2}
          title="Let's add your first business"
          description="Connect a business profile to start aggregating reviews, running AI analysis, and sending replies from Sentra."
          action={{
            label: 'Start onboarding',
            onClick: () => window.location.href = '/dashboard/onboarding',
          }}
        />
      </DashboardLayout>
    )
  }

  const statsCards = [
    {
      title: 'Connected Platforms',
      value: overview.stats.connectedPlatforms,
      subtitle: 'Active integrations',
      icon: Link2,
    },
    {
      title: 'Total Reviews',
      value: overview.stats.totalReviews,
      subtitle: 'All time',
      icon: MessageSquare,
    },
    {
      title: 'Average Rating',
      value: overview.stats.avgRating.toFixed(1),
      subtitle: 'Across every platform',
      icon: Star,
    },
    // Response Rate metric - Hidden until tracking is implemented
    /* {
      title: 'Response Rate',
      value: `${overview.stats.responseRate}%`,
      subtitle: 'Reviews with replies',
      icon: RefreshCw,
    }, */
  ]
  const gradients = [
    'bg-gradient-to-br from-blue-500 to-cyan-500',
    'bg-gradient-to-br from-purple-500 to-pink-500',
    'bg-gradient-to-br from-orange-500 to-red-500',
    'bg-gradient-to-br from-green-500 to-emerald-500',
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
            {statsCards.map((stat, idx) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <StatsCard
                  title={stat.title}
                  value={stat.value}
                  subtitle={stat.subtitle}
                  icon={stat.icon}
                  gradient={gradients[idx]}
                />
              </motion.div>
            ))}

            {/* Review Hub Page - Single Condensed Card */}
            {selectedBusiness && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-500 mb-0.5">Your page</p>
                      <h3 className="text-sm font-semibold text-gray-900">Review Hub</h3>
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-2">
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <Link
                    href={`/review/${selectedBusiness.slug}`}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-xs font-medium text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* AI-Powered Insights */}
          {overview.stats.totalReviews > 0 && selectedBusiness && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <InsightsCard businessId={selectedBusiness.id} />
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

              {/* Response time metric - Hidden until tracking is implemented */}
              {/* <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">
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
              </div> */}
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
                  {/* Response rate per platform - Hidden until tracking is implemented */}
                  {/* <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase tracking-widest">Response rate</p>
                    <p className="text-lg font-light text-black">{platform.responseRate}%</p>
                  </div> */}
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
