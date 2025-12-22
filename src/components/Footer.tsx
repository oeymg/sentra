import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-black py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 sm:gap-0">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
            <img
              src="/sentra_icon.png"
              alt="Sentra"
              className="w-6 h-6 sm:w-8 sm:h-8"
            />
            <div className="text-2xl sm:text-3xl font-bold text-black" style={{ fontFamily: 'Inter, sans-serif' }}>sentra</div>
          </div>
          <div className="text-sm text-black">© 2025</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-10 text-sm text-black">
          <Link href="/how-it-works" className="hover:opacity-60 transition-opacity">
            How it works
          </Link>
          <Link href="/pricing" className="hover:opacity-60 transition-opacity">
            Pricing
          </Link>
          <Link href="/auth/login" className="hover:opacity-60 transition-opacity">
            Sign in
          </Link>
          <Link href="/auth/signup" className="hover:opacity-60 transition-opacity">
            Get started
          </Link>
        </div>
      </div>
    </footer>
  )
}
