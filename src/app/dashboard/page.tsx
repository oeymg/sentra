'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { useOverview } from '@/hooks/useOverview'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { StatsCardSkeleton } from '@/components/dashboard/LoadingSkeleton'
import { motion } from 'framer-motion'
import { Link2, QrCode, Star, TrendingUp, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'

type SurveyData = {
  qrScans: number
  surveySubmissions: number
  conversionRate: number
  starBreakdown: { 5: number; 4: number; 3: number; 2: number; 1: number; private: number }
  recentSurveyReviews: { reviewText: string; rating: number; submittedAt: string }[]
}

export default function Dashboard() {
  const { selectedBusiness, loading: businessLoading } = useBusinessContext()
  const { data: overview, loading: overviewLoading, error, refresh } = useOverview(selectedBusiness?.id)
  const [copiedLink, setCopiedLink] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [publicLink, setPublicLink] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedBusiness) return
    setPublicLink(`${window.location.origin}/review/${selectedBusiness.slug}`)
  }, [selectedBusiness?.id])

  const handleCopyLink = () => {
    if (!publicLink) return
    navigator.clipboard.writeText(publicLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try { await refresh() } finally { setRefreshing(false) }
  }

  const isLoading = businessLoading || overviewLoading

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-12">
          <div className="max-w-5xl mx-auto space-y-12">
            <div>
              <div className="h-12 bg-gray-200 rounded w-48 mb-3 animate-pulse" />
              <div className="h-5 bg-gray-100 rounded w-72 animate-pulse" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <StatsCardSkeleton key={i} />)}
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
          <button onClick={refresh} className="px-4 py-2 bg-black text-white rounded-lg text-sm">
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
          description="Add a business profile to start collecting reviews via QR code."
          action={{ label: 'Start onboarding', onClick: () => { window.location.href = '/dashboard/onboarding' } }}
        />
      </DashboardLayout>
    )
  }

  const survey: SurveyData = (overview as any).survey ?? {
    qrScans: 0,
    surveySubmissions: 0,
    conversionRate: 0,
    starBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, private: 0 },
    recentSurveyReviews: [],
  }

  const fiveStars = survey.starBreakdown[5] ?? 0
  const fourStars = survey.starBreakdown[4] ?? 0
  const privateCount = survey.starBreakdown.private ?? 0

  return (
    <DashboardLayout>
      <div className="p-12">
        <div className="max-w-5xl mx-auto space-y-10">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <motion.h1
                className="text-5xl font-light mb-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Dashboard
              </motion.h1>
              <p className="text-gray-500 font-light">Your review performance this month</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* This Month stats */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">This Month</p>
            <div className="grid md:grid-cols-3 gap-6">
              <StatTile
                icon={<QrCode className="w-5 h-5" />}
                label="QR Scans"
                value={survey.qrScans}
                delay={0}
              />
              <StatTile
                icon={<Star className="w-5 h-5" />}
                label="Reviews Submitted"
                value={survey.surveySubmissions}
                delay={0.05}
              />
              <StatTile
                icon={<TrendingUp className="w-5 h-5" />}
                label="Conversion Rate"
                value={`${survey.conversionRate}%`}
                delay={0.1}
              />
            </div>
          </div>

          {/* Star Breakdown + Recent Reviews side by side */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Star Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
            >
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-5">Star Breakdown</p>
              <div className="space-y-4">
                <StarRow label="5 stars" count={fiveStars} total={survey.surveySubmissions} filled />
                <StarRow label="4 stars" count={fourStars} total={survey.surveySubmissions} filled />
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">1–3 stars <span className="text-xs text-gray-400">(sent to you privately)</span></span>
                    <span className="font-semibold text-gray-900">{privateCount}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Survey Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
            >
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-5">Recent Reviews</p>
              {survey.recentSurveyReviews.length === 0 ? (
                <p className="text-sm text-gray-400">No reviews yet. Share your QR code to get started.</p>
              ) : (
                <div className="space-y-4">
                  {survey.recentSurveyReviews.map((review, i) => (
                    <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 5 }, (_, j) => (
                          <Star
                            key={j}
                            className={`w-3 h-3 ${j < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                          />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">{timeAgo(review.submittedAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{review.reviewText}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap gap-3"
          >
            <Link
              href="/dashboard/reviews"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition"
            >
              View All Reviews
            </Link>
            <Link
              href="/dashboard/platforms"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <QrCode className="w-4 h-4" />
              Get QR Code
            </Link>
            {selectedBusiness && (
              <>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  {copiedLink ? (
                    <><Check className="w-4 h-4 text-green-600" /><span className="text-green-600">Copied!</span></>
                  ) : (
                    <><Copy className="w-4 h-4" />Copy Review Link</>
                  )}
                </button>
                <Link
                  href={`/review/${selectedBusiness.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview Survey
                </Link>
              </>
            )}
          </motion.div>

        </div>
      </div>
    </DashboardLayout>
  )
}

function StatTile({ icon, label, value, delay }: { icon: React.ReactNode; label: string; value: number | string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 text-gray-400 mb-3">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className="text-4xl font-light text-gray-900">{value}</p>
    </motion.div>
  )
}

function StarRow({ label, count, total, filled }: { label: string; count: number; total: number; filled?: boolean }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-14 text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${filled ? 'bg-yellow-400' : 'bg-gray-300'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right font-semibold text-gray-900">{count}</span>
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}
