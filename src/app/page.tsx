'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-white relative">
      <Header />

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <div className="absolute inset-0 animate-gridMove" style={{
            backgroundImage: 'linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="max-w-5xl mx-auto relative">
          {/* Floating review count */}
          <div className="absolute -top-8 right-0 text-sm uppercase tracking-widest text-black opacity-60 animate-pulse">
            1M+ reviews analyzed
          </div>

          <h1 className="text-[6rem] md:text-[9rem] leading-[0.85] font-light mb-10 tracking-tighter text-black animate-fadeIn">
            Your reviews.
            <br />
            <span className="italic font-normal">One place.</span>
          </h1>

          <p className="text-2xl text-black mb-16 max-w-2xl font-light leading-relaxed animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Stop jumping between platforms. Sentra brings all your reviews together,
            analyzes them with AI, and helps you respond—instantly.
          </p>

          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-3 text-base px-10 py-5 bg-black text-white hover:bg-gray-900 transition-all group animate-fadeIn relative overflow-hidden"
            style={{ animationDelay: '0.2s' }}
          >
            <span className="relative z-10">Start now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Link>
        </div>
      </section>

      {/* Feature list */}
      <section className="py-32 px-6 border-t border-black relative">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-24">
            <div className="flex gap-12 items-start group">
              <div className="text-8xl font-light text-black min-w-[120px] transition-all duration-500 group-hover:scale-110 group-hover:text-gray-400">01</div>
              <div className="pt-4">
                <h2 className="text-4xl font-light mb-6 text-black group-hover:translate-x-2 transition-transform duration-300">All platforms, one inbox</h2>
                <p className="text-xl text-black max-w-2xl font-light leading-relaxed">
                  Google, Yelp, Trustpilot, Facebook, TripAdvisor—and 15 more.
                  Every review in one place, no switching tabs.
                </p>
                {/* Animated platform logos marquee */}
                <div className="mt-6 overflow-hidden">
                  <div className="flex gap-4 animate-marquee">
                    <div className="px-3 py-1 border border-black/20 text-xs whitespace-nowrap">Google</div>
                    <div className="px-3 py-1 border border-black/20 text-xs whitespace-nowrap">Yelp</div>
                    <div className="px-3 py-1 border border-black/20 text-xs whitespace-nowrap">Trustpilot</div>
                    <div className="px-3 py-1 border border-black/20 text-xs whitespace-nowrap">Facebook</div>
                    <div className="px-3 py-1 border border-black/20 text-xs whitespace-nowrap">TripAdvisor</div>
                    <div className="px-3 py-1 border border-black/20 text-xs whitespace-nowrap">G2</div>
                    <div className="px-3 py-1 border border-black/20 text-xs whitespace-nowrap">Capterra</div>
                    <div className="px-3 py-1 border border-black/20 text-xs whitespace-nowrap">Amazon</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-12 items-start group">
              <div className="text-8xl font-light text-black min-w-[120px] transition-all duration-500 group-hover:scale-110 group-hover:text-gray-400">02</div>
              <div className="pt-4">
                <h2 className="text-4xl font-light mb-6 text-black group-hover:translate-x-2 transition-transform duration-300">AI that actually helps</h2>
                <p className="text-xl text-black max-w-2xl font-light leading-relaxed">
                  Sentiment analysis, keyword trends, and auto-generated responses
                  that sound like you. Powered by Claude.
                </p>
                {/* Live AI indicator */}
                <div className="mt-6 flex items-center gap-2">
                  <div className="w-2 h-2 bg-black rounded-full animate-ping" />
                  <span className="text-xs uppercase tracking-widest text-black">AI analyzing in real-time</span>
                </div>
              </div>
            </div>

            <div className="flex gap-12 items-start group">
              <div className="text-8xl font-light text-black min-w-[120px] transition-all duration-500 group-hover:scale-110 group-hover:text-gray-400">03</div>
              <div className="pt-4">
                <h2 className="text-4xl font-light mb-6 text-black group-hover:translate-x-2 transition-transform duration-300">Respond in seconds</h2>
                <p className="text-xl text-black max-w-2xl font-light leading-relaxed">
                  Choose your tone—professional, friendly, or apologetic.
                  AI drafts the response, you click send.
                </p>
                {/* Response time indicator */}
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-light text-black">2.3</span>
                    <span className="text-xs uppercase tracking-widest text-black">sec avg</span>
                  </div>
                  <div className="text-xs text-black">↓ 80% faster than manual</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple stats */}
      <section className="py-32 px-6 bg-black text-white relative overflow-hidden">
        {/* Animated scanline effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent animate-scanline" />
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-16 relative">
          <div className="group cursor-default">
            <div className="text-7xl font-light mb-3 transition-all duration-300 group-hover:scale-110">20+</div>
            <div className="text-sm uppercase tracking-widest group-hover:tracking-wider transition-all">Platforms</div>
          </div>
          <div className="group cursor-default">
            <div className="text-7xl font-light mb-3 transition-all duration-300 group-hover:scale-110">2min</div>
            <div className="text-sm uppercase tracking-widest group-hover:tracking-wider transition-all">Setup</div>
          </div>
          <div className="group cursor-default">
            <div className="text-7xl font-light mb-3 transition-all duration-300 group-hover:scale-110">80%</div>
            <div className="text-sm uppercase tracking-widest group-hover:tracking-wider transition-all">Time saved</div>
          </div>
          <div className="group cursor-default">
            <div className="text-7xl font-light mb-3 transition-all duration-300 group-hover:scale-110">Free</div>
            <div className="text-sm uppercase tracking-widest group-hover:tracking-wider transition-all">Forever</div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6 relative">
        {/* Floating cursor follower effect */}
        <div className="max-w-5xl mx-auto relative group/cta">
          <div className="absolute -inset-4 bg-black/5 rounded-3xl opacity-0 group-hover/cta:opacity-100 transition-opacity duration-500 blur-xl" />

          <div className="relative">
            <h2 className="text-6xl md:text-8xl font-light mb-12 leading-[0.95] tracking-tight text-black">
              Stop managing reviews.
              <br />
              <span className="italic">Start understanding them.</span>
            </h2>
            <div className="flex items-center gap-8">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-3 text-base px-10 py-5 bg-black text-white hover:bg-gray-900 transition-all group relative overflow-hidden"
              >
                <span className="relative z-10">Get started free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>

              {/* Live user counter */}
              <div className="flex items-center gap-2 text-sm">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-black border-2 border-white animate-pulse" style={{ animationDelay: '0s' }} />
                  <div className="w-8 h-8 rounded-full bg-black border-2 border-white animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-8 h-8 rounded-full bg-black border-2 border-white animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="text-black text-xs">
                  <span className="font-light">127 people</span> signed up today
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
