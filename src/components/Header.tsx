'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/8">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/sentra_icon.png" alt="Sentra" className="w-7 h-7" />
          <span className="text-xl font-light tracking-tight text-black">
            sentra
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <Link
            href="/how-it-works"
            className={`hidden md:block text-sm font-light transition-colors ${pathname === '/how-it-works' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className={`hidden md:block text-sm font-light transition-colors ${pathname === '/pricing' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            className={`hidden md:block text-sm font-light transition-colors ${pathname.startsWith('/blog') ? 'text-black' : 'text-gray-400 hover:text-black'}`}
          >
            Blog
          </Link>
          <Link
            href="/auth/login"
            className="hidden sm:block text-sm font-light text-gray-400 hover:text-black transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm px-5 py-2 bg-black text-white hover:bg-gray-800 transition-colors font-light"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </nav>
  )
}
