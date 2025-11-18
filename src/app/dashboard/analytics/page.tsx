'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'
import { Layers3, PieChart, SlidersHorizontal, TrendingUp } from 'lucide-react'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { useOverview } from '@/hooks/useOverview'
import { ChartSkeleton } from '@/components/dashboard/LoadingSkeleton'
import { EmptyState } from '@/components/dashboard/EmptyState'

export default function AnalyticsPage() {
  const { selectedBusiness, loading: businessLoading } = useBusinessContext()
  const { data: overview, loading, error, refresh } = useOverview(selectedBusiness?.id)
  const isLoading = businessLoading || loading

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-12">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="mb-8">
              <div className="h-12 bg-gray-200 rounded w-48 mb-3 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-96 animate-pulse" />
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ChartSkeleton height={320} />
              </div>
              <ChartSkeleton height={256} />
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !overview) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center mt-24 space-y-4">
          <p className="text-lg font-medium text-gray-800">
            {error ?? 'Analytics are currently unavailable.'}
          </p>
          <p className="text-sm text-gray-500">
            Confirm your Supabase credentials and try again. Analytics unlock automatically once we detect reviews.
          </p>
          <button
            onClick={() => refresh()}
            className="px-4 py-2 bg-black text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    )
  }

  if (overview.stats.businessCount === 0) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={PieChart}
          title="Analytics unlock after onboarding"
          description="Add a business profile to start tracking sentiment, response times, and platform performance."
          action={{
            label: 'Add your first business',
            onClick: () => window.location.href = '/dashboard/onboarding',
          }}
        />
      </DashboardLayout>
    )
  }

  const sentimentChartData = overview.sentimentBreakdown.map((slice) => ({
    label: slice.label,
    value: slice.value,
  }))

  return (
    <DashboardLayout>
      <div className="p-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <motion.h1
                className="text-5xl font-light mb-3 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Analytics
              </motion.h1>
              <p className="text-lg text-gray-600 font-light">
                Trends, sentiment, and channel performance derived from real reviews.
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">Avg Rating</p>
                <p className="text-3xl font-light text-black">{overview.stats.avgRating.toFixed(1)}</p>
              </div>
              {/* Response rate metric - Hidden until tracking is implemented */}
              {/* <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">Response rate</p>
                <p className="text-3xl font-light text-black">{overview.stats.responseRate}%</p>
              </div> */}
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">Pending</p>
                <p className="text-3xl font-light text-black">{overview.stats.pendingReviews}</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Review cadence</p>
                  <p className="text-2xl font-light text-black">Volume vs responses</p>
                </div>
                <TrendingUp className="w-5 h-5 text-gray-500" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview.reviewTrend} margin={{ left: -20, right: 10 }}>
                    <defs>
                      <linearGradient id="volume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#111" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#111" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="month" stroke="#a1a1aa" />
                    <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }} />
                    <Area type="monotone" dataKey="reviews" name="Reviews" stroke="#111" strokeWidth={2} fill="url(#volume)" />
                    <Area type="monotone" dataKey="responses" name="Responses" stroke="#4f46e5" strokeWidth={2} fill="#4f46e510" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Sentiment</p>
                  <p className="text-2xl font-light text-black">Tone of voice</p>
                </div>
                <PieChart className="w-5 h-5 text-gray-500" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sentimentChartData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis dataKey="label" stroke="#a1a1aa" />
                    <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }} />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#111111" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Platform performance</p>
                  <p className="text-lg font-light text-black">Top channels by volume</p>
                </div>
                <Layers3 className="w-5 h-5 text-gray-500" />
              </div>
              <div className="space-y-4">
                {overview.platformPerformance.length === 0 && (
                  <p className="text-sm text-gray-500">Connect a review source to start gathering analytics.</p>
                )}
                {overview.platformPerformance.map((platform) => (
                  <div key={platform.platform} className="flex items-center justify-between border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platform.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-black">{platform.platform}</p>
                        <p className="text-xs text-gray-500">{platform.reviews} reviews</p>
                      </div>
                    </div>
                    {/* Response rate per platform - Hidden until tracking is implemented */}
                    {/* <div className="text-right">
                      <p className="text-xs uppercase tracking-widest text-gray-400">Response rate</p>
                      <p className="text-lg font-light text-black">{platform.responseRate}%</p>
                    </div> */}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Categories</p>
                  <p className="text-lg font-light text-black">Themes detected by Claude</p>
                </div>
                <SlidersHorizontal className="w-5 h-5 text-gray-500" />
              </div>
              <div className="space-y-4">
                {overview.categoryBreakdown.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Once you run review analysis, categories and keywords appear here automatically.
                  </p>
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

          {/* Response timing section - Hidden until tracking is implemented */}
          {/* <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">Response timing</p>
                <p className="text-lg font-light text-black">Operational efficiency</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Median response time</p>
                <p className="text-3xl font-light text-black">
                  {overview.responseTime.medianHours === null ? '—' : `${overview.responseTime.medianHours}h`}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Same-day responses</p>
                <p className="text-3xl font-light text-black">{overview.responseTime.sameDayPercent}%</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Pending reviews</p>
                <p className="text-3xl font-light text-black">{overview.stats.pendingReviews}</p>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </DashboardLayout>
  )
}
