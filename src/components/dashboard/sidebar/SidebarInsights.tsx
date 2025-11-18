'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronRight, Lightbulb } from 'lucide-react'
import type { BusinessInsight } from '@/lib/ai/claude'

const categoryEmojis: Record<string, string> = {
  response_strategy: '💬',
  customer_satisfaction: '😊',
  operational: '⚙️',
  marketing: '📢',
}

const priorityEmojis: Record<BusinessInsight['priority'], string> = {
  high: '🔴',
  medium: '🟡',
  low: '🔵',
}

interface SidebarInsightsProps {
  insights: BusinessInsight[]
  loading: boolean
}

export function SidebarInsights({ insights, loading }: SidebarInsightsProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-6">
      <motion.button
        onClick={() => setOpen((prev) => !prev)}
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
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="mt-2 pl-4 px-4 py-2 space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            ) : insights.length > 0 ? (
              <ul className="mt-2 space-y-1 pl-4">
                {insights.map((insight, index) => (
                  <li key={`${insight.title}-${index}`}>
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
                          <p className="text-xs text-gray-500 line-clamp-2">{insight.description}</p>
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
  )
}
