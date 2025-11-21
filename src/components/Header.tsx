'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-black">
          sentra
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/how-it-works"
            className={`text-sm transition-opacity ${
              pathname === '/how-it-works'
                ? 'text-black hover:opacity-60'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className={`text-sm transition-opacity ${
              pathname === '/pricing'
                ? 'text-black hover:opacity-60'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            className={`text-sm transition-opacity ${
              pathname?.startsWith('/blog')
                ? 'text-black hover:opacity-60'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Blog
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm px-5 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  )
}
