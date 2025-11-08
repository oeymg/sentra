import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-black py-20 px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold mb-2 text-black">sentra</div>
          <div className="text-sm text-black">© 2025</div>
        </div>
        <div className="flex gap-10 text-sm text-black">
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
