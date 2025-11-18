'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Settings, LogOut } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface SidebarUserPanelProps {
  user: User | null
  pathname: string
  onSignOut: () => void
}

export function SidebarUserPanel({ user, pathname, onSignOut }: SidebarUserPanelProps) {
  return (
    <div className="p-4 border-t border-gray-200 bg-gradient-to-t from-gray-50 to-white">
      <div className="mb-3 px-4 py-2 bg-white rounded-lg border border-gray-100">
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Signed in as</div>
        <div className="text-sm text-black font-light truncate">
          {user?.user_metadata?.full_name || user?.email || 'Anonymous'}
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
              layoutId="sidebarActiveIndicator"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <Settings className="w-5 h-5" />
          <span className="font-light">Settings</span>
        </motion.div>
      </Link>
      <motion.button
        onClick={onSignOut}
        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        <LogOut className="w-5 h-5" />
        <span className="font-light">Sign out</span>
      </motion.button>
    </div>
  )
}
