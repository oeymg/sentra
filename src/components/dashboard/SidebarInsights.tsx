'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'

export interface SidebarInsight {
  category: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

interface SidebarInsightsProps {
  insights: SidebarInsight[]
  loading: boolean
  onRefresh?: () => void
}

export function SidebarInsights({ insights, loading, onRefresh }: SidebarInsightsProps) {
  const [showInsights, setShowInsights] = useState(false)

  const highPriorityInsights = insights.filter((i) => i.priority === 'high').slice(0, 3)

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowInsights(!showInsights)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-900">AI Insights</span>
          {highPriorityInsights.length > 0 && (
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
              {highPriorityInsights.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRefresh()
              }}
              className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Refresh insights"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {showInsights ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="mt-2 pl-4 px-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="py-2 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-2 bg-gray-200 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : highPriorityInsights.length > 0 ? (
              <ul className="mt-2 pl-4 space-y-1">
                {highPriorityInsights.map((insight, idx) => (
                  <li key={idx}>
                    <div className="px-4 py-2 hover:bg-purple-50 rounded-md transition-colors group cursor-pointer">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 group-hover:text-black text-sm block">
                            {insight.title}
                          </span>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
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
  )
}
