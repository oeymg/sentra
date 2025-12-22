'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
          <img
            src="/sentra_icon.png"
            alt="Sentra"
            className="w-7 h-7 sm:w-8 sm:h-8"
          />
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-black hidden sm:block" style={{ fontFamily: 'Inter, sans-serif' }}>
            sentra
          </span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
          <Link
            href="/how-it-works"
            className={`hidden md:block text-sm transition-opacity ${
              pathname === '/how-it-works'
                ? 'text-black hover:opacity-60'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className={`hidden md:block text-sm transition-opacity ${
              pathname === '/pricing'
                ? 'text-black hover:opacity-60'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            className={`hidden md:block text-sm transition-opacity ${
              pathname?.startsWith('/blog')
                ? 'text-black hover:opacity-60'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Blog
          </Link>
          <Link
            href="/auth/login"
            className="hidden sm:block text-sm text-gray-600 hover:text-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/book-demo"
            className="text-xs sm:text-sm px-3 sm:px-5 py-1.5 sm:py-2 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Book a demo
          </Link>
        </div>
      </div>
    </nav>
  )
}
