'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { LayoutDashboard, Star, Settings, Link2, LogOut, TrendingUp, Lightbulb, ChevronDown, ChevronRight, Menu, X, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BusinessInsight } from '@/lib/ai/claude'
import { useBusinessContext } from '@/contexts/BusinessContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { selectedBusiness } = useBusinessContext()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showGrowthTips, setShowGrowthTips] = useState(false)
  const [quickStats, setQuickStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    pendingReviews: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [aiInsights, setAiInsights] = useState<BusinessInsight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    })
  }, [router])

  // Load stats when selected business changes
  useEffect(() => {
    if (selectedBusiness) {
      loadSidebarStats(selectedBusiness.id)
    } else {
      setStatsLoading(false)
      setQuickStats({ totalReviews: 0, avgRating: 0, pendingReviews: 0 })
      setAiInsights([])
    }
  }, [selectedBusiness])

  const loadSidebarStats = async (businessId: string) => {
    try {
      const response = await fetch(`/api/dashboard/overview?businessId=${businessId}`)
      if (!response.ok) {
        throw new Error('Failed to load stats')
      }
      const payload = await response.json()
      setQuickStats({
        totalReviews: payload.stats.totalReviews,
        avgRating: payload.stats.avgRating,
        pendingReviews: payload.stats.pendingReviews,
      })

      // Load AI insights if we have reviews
      if (payload.stats.totalReviews > 0) {
        loadAiInsights(businessId)
      }
    } catch (error) {
      console.error('Sidebar stats load failed', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadAiInsights = async (businessId: string) => {
    try {
      setInsightsLoading(true)

      // Check session cache first
      const SIDEBAR_INSIGHTS_CACHE_KEY = 'sentra_sidebar_insights_cache'
      const SESSION_ID_KEY = 'sentra_session_id'

      // Generate or retrieve session ID
      let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        sessionStorage.setItem(SESSION_ID_KEY, sessionId)
      }

      // Try to get from cache
      const cacheStr = localStorage.getItem(SIDEBAR_INSIGHTS_CACHE_KEY)
      if (cacheStr) {
        try {
          const cache = JSON.parse(cacheStr)
          if (cache.sessionId === sessionId && cache.businessId === businessId) {
            console.log('[Sidebar] Using cached insights from this session')
            setAiInsights(cache.insights)
            setInsightsLoading(false)
            return
          }
        } catch (e) {
          console.error('Error reading sidebar insights cache:', e)
        }
      }

      // Fetch fresh insights
      console.log('[Sidebar] Fetching fresh insights from API')
      const response = await fetch(`/api/dashboard/insights?businessId=${businessId}`)
      if (!response.ok) {
        throw new Error('Failed to load insights')
      }
      const payload = await response.json()

      // Take top 3 high-priority insights for sidebar
      const topInsights = payload.insights
        .filter((insight: BusinessInsight) => insight.priority === 'high')
        .slice(0, 3)

      const sidebarInsights = topInsights.length > 0 ? topInsights : payload.insights.slice(0, 3)
      setAiInsights(sidebarInsights)

      // Cache the sidebar insights
      try {
        localStorage.setItem(SIDEBAR_INSIGHTS_CACHE_KEY, JSON.stringify({
          sessionId,
          businessId,
          insights: sidebarInsights,
          timestamp: Date.now()
        }))
      } catch (e) {
        console.error('Error saving sidebar insights cache:', e)
      }
    } catch (error) {
      console.error('AI insights load failed', error)
      setAiInsights([])
    } finally {
      setInsightsLoading(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleRefresh = async () => {
    if (!selectedBusiness || refreshing) return
    setRefreshing(true)
    try {
      await loadSidebarStats(selectedBusiness.id)
      // Force page reload to refresh all components
      window.location.reload()
    } catch (error) {
      console.error('Refresh failed:', error)
      setRefreshing(false)
    }
  }

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const mainNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/reviews', icon: Star, label: 'Reviews' },
    { href: '/dashboard/analytics', icon: TrendingUp, label: 'Analytics' },
    { href: '/dashboard/platforms', icon: Link2, label: 'Platforms' },
  ]

  const categoryEmojis = {
    response_strategy: '💬',
    customer_satisfaction: '😊',
    operational: '⚙️',
    marketing: '📢',
  }

  const priorityEmojis = {
    high: '🔴',
    medium: '🟡',
    low: '🔵',
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <LoadingSplash key="splash" />}
      </AnimatePresence>
      {!loading && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
          {/* Mobile Header */}
          <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/dashboard">
              <motion.div
                className="text-xl font-bold bg-gradient-to-r from-black via-gray-800 to-black bg-clip-text text-transparent"
                whileTap={{ scale: 0.95 }}
              >
                sentra
              </motion.div>
            </Link>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </header>

          {/* Mobile Menu Backdrop */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
              />
            )}
          </AnimatePresence>

          {/* Fixed Sidebar */}
          <aside className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg z-50 overflow-y-auto transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/dashboard" className="group">
            <motion.div
              className="text-2xl font-bold bg-gradient-to-r from-black via-gray-800 to-black bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              sentra
            </motion.div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedBusiness
                ? `${selectedBusiness.name}${selectedBusiness.suburb ? ` • ${selectedBusiness.suburb}` : ''}`
                : 'Add your first business'}
            </p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          {/* Main Navigation */}
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2 px-4">Main</p>
            <ul className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <motion.div
                        className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-black text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        whileHover={{ x: isActive ? 0 : 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isActive && (
                          <motion.div
                            className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r"
                            layoutId="activeIndicator"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <Icon className="w-5 h-5" />
                        <span className="font-light">{item.label}</span>
                      </motion.div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* AI Insights Section */}
          <div className="mb-6">
            <motion.button
              onClick={() => setShowGrowthTips(!showGrowthTips)}
              className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md">
                  <Lightbulb className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs uppercase tracking-widest font-medium">AI Insights</span>
              </div>
              {showGrowthTips ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </motion.button>

            <AnimatePresence>
              {showGrowthTips && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {insightsLoading ? (
                    <div className="mt-2 pl-4 px-4 py-2">
                      <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  ) : aiInsights.length > 0 ? (
                    <ul className="mt-2 space-y-1 pl-4">
                      {aiInsights.map((insight, index) => (
                        <li key={index}>
                          <div
                            className="block px-4 py-2 text-xs text-gray-600 hover:text-black hover:bg-gray-50 rounded-md transition-colors cursor-pointer group"
                            title={insight.description}
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-sm mt-0.5">{categoryEmojis[insight.category]}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-xs">{priorityEmojis[insight.priority]}</span>
                                  <span className="font-medium text-gray-900 group-hover:text-black">
                                    {insight.title}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                  {insight.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                      <li>
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors font-medium"
                        >
                          View All Insights →
                        </Link>
                      </li>
                    </ul>
                  ) : (
                    <div className="mt-2 pl-4 px-4 py-2 text-xs text-gray-500">
                      No insights available yet. Sync reviews to get AI-powered recommendations.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Stats */}
          <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Quick Stats</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Total Reviews</span>
                <span className="text-sm font-semibold text-black">
                  {statsLoading ? '—' : quickStats.totalReviews}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Avg Rating</span>
                <span className="text-sm font-semibold text-black">
                  {statsLoading ? '—' : quickStats.avgRating.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Pending</span>
                <span className="text-sm font-semibold text-orange-600">
                  {statsLoading ? '—' : quickStats.pendingReviews}
                </span>
              </div>
            </div>
          </div>

        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200 bg-gradient-to-t from-gray-50 to-white">
          <div className="mb-3 px-4 py-2 bg-white rounded-lg border border-gray-100">
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">
              Signed in as
            </div>
            <div className="text-sm text-black font-light truncate">
              {user?.user_metadata?.full_name || user?.email}
            </div>
          </div>
          <Link href="/dashboard/settings">
            <motion.div
              className={`relative w-full flex items-center gap-3 px-4 py-3 mb-3 rounded-lg transition-all duration-200 ${
                pathname === '/dashboard/settings'
                  ? 'bg-black text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              whileHover={{ x: pathname === '/dashboard/settings' ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
            >
              {pathname === '/dashboard/settings' && (
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r"
                  layoutId="activeIndicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Settings className="w-5 h-5" />
              <span className="font-light">Settings</span>
            </motion.div>
          </Link>
          <motion.button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-light">Sign out</span>
          </motion.button>
        </div>
      </aside>

      {/* Main content with responsive margins */}
          <main className="pt-16 lg:pt-0 lg:ml-64 min-h-screen overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -25, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      )}
    </>
  )
}

function LoadingSplash() {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 bg-white flex items-center justify-center z-[9999]"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.33, 1, 0.68, 1] } }}
        exit={{ opacity: 0 }}
        className="relative text-black flex flex-col items-center gap-4"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { duration: 0.35 } }}
          className="flex gap-4 text-5xl md:text-6xl font-light tracking-[0.3em] uppercase select-none"
        >
          {'sentra'.split('').map((letter, idx) => (
            <motion.span
              key={letter + idx}
              initial={{ y: 20, opacity: 0, rotate: -6 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05, ease: [0.33, 1, 0.68, 1] }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="w-48 h-px bg-black"
        />
      </motion.div>
    </motion.div>
  )
}
