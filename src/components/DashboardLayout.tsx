'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { LayoutDashboard, Star, Package, TrendingUp, Menu, X, RefreshCw, Mail, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { AIChatbot } from '@/components/dashboard/AIChatbot'
import { BusinessSelector } from '@/components/dashboard/BusinessSelector'
import { SidebarNav } from '@/components/dashboard/sidebar/SidebarNav'
import { SidebarUserPanel } from '@/components/dashboard/sidebar/SidebarUserPanel'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { selectedBusiness } = useBusinessContext()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
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

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    window.location.reload()
  }

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const mainNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/send', icon: Send, label: 'Send Request', highlight: true },
    { href: '/dashboard/reviews', icon: Star, label: 'Reviews' },
    { href: '/dashboard/campaigns', icon: Mail, label: 'Campaigns' },
    { href: '/dashboard/analytics', icon: TrendingUp, label: 'Analytics' },
    { href: '/dashboard/assets', icon: Package, label: 'Assets' },
  ]

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <LoadingSplash key="splash" />}
      </AnimatePresence>
      {!loading && (
        <>
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
          <aside
            className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg z-50 overflow-y-auto transition-transform duration-300 ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0`}
          >
            <div className="p-6 border-b border-gray-200 space-y-4">
              <Link href="/dashboard" className="group block">
                <motion.div
                  className="text-2xl font-bold bg-gradient-to-r from-black via-gray-800 to-black bg-clip-text text-transparent"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  sentra
                </motion.div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedBusiness
                    ? `${selectedBusiness.name}${
                        selectedBusiness.suburb ? ` • ${selectedBusiness.suburb}` : ''
                      }`
                    : 'Add your first business'}
                </p>
              </Link>
              <BusinessSelector />
            </div>

            <nav className="flex-1 p-4">
              <SidebarNav items={mainNavItems} pathname={pathname} />
            </nav>

            <SidebarUserPanel user={user} pathname={pathname} onSignOut={handleSignOut} />
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

        {/* AI Chatbot - Fixed position, available on all dashboard pages */}
        <AIChatbot />
        </>
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
