'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export type SidebarNavItem = {
  href: string
  icon: LucideIcon
  label: string
}

interface SidebarNavProps {
  items: SidebarNavItem[]
  pathname: string
}

export function SidebarNav({ items, pathname }: SidebarNavProps) {
  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-2 px-4">Main</p>
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <li key={item.href}>
              <Link href={item.href}>
                <motion.div
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive ? 'bg-black text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  whileHover={{ x: isActive ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r"
                      layoutId="sidebarActiveIndicator"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
  )
}
