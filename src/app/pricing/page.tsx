'use client'

import Link from 'next/link'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const features = [
  'QR codes for business cards and counter displays',
  'Guided 3-question customer survey',
  'AI-written reviews from survey answers',
  'Negative review filtering — stays private',
  'Live dashboard: scans, submissions, conversion rate',
  'Star breakdown each month',
  'Google review redirect for 4–5 star responses',
  'Unlimited QR scans and submissions',
  'Cancel anytime — no lock-in',
]

export default function Pricing() {
  return (
    <main className="min-h-screen bg-white relative">
      <Header />

      {/* Hero */}
      <section className="pt-40 pb-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="max-w-5xl mx-auto relative">
          <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8 text-black hover:opacity-60 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-[5rem] md:text-[8rem] leading-[0.85] font-light mb-10 tracking-tighter text-black">
            Simple
            <br />
            <span className="italic font-normal">pricing.</span>
          </h1>
          <p className="text-2xl text-gray-600 mb-4 max-w-2xl font-light leading-relaxed">
            One plan. Everything included. No tiers, no feature gates.
          </p>
        </div>
      </section>

      {/* Single pricing card */}
      <section className="py-32 px-6 border-t border-black">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          {/* Price */}
          <div>
            <div className="text-sm uppercase tracking-widest text-gray-400 mb-6">Monthly</div>
            <div className="text-8xl font-light text-black mb-2">$29<span className="text-4xl">.99</span></div>
            <p className="text-gray-500 font-light mb-2">per business per month</p>
            <p className="text-gray-400 text-sm mb-10">That's $1 a day — less than a coffee.</p>

            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-3 w-full justify-center px-8 py-5 bg-black text-white hover:bg-gray-900 transition-all group mb-4"
            >
              <span>Start free trial</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-xs text-center text-gray-400">14-day free trial. No credit card required.</p>
          </div>

          {/* Features */}
          <div className="space-y-5">
            <div className="text-sm uppercase tracking-widest text-gray-400 mb-6">Everything included</div>
            {features.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <Check className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-black font-light">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-6 border-t border-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-light mb-16 text-black tracking-tight">Questions?</h2>
          <div className="space-y-12">
            {[
              {
                q: 'How does the free trial work?',
                a: 'You get 14 days free with full access to every feature. No credit card needed to start. After the trial, it\'s $29.99/month.',
              },
              {
                q: 'Do I need to print my own QR codes?',
                a: 'Sentra generates your QR code inside the dashboard. You can download it and put it on your own cards or displays — or we\'ll have print-ready designs available soon.',
              },
              {
                q: 'What stops a customer from leaving a fake review?',
                a: 'The review is based on their survey answers — if they didn\'t interact with your business they won\'t have meaningful answers. The AI uses those answers to write the review, so it reads authentic because it is.',
              },
              {
                q: 'Does Google allow this?',
                a: 'Yes. We don\'t offer incentives for reviews (which Google prohibits). We just make it frictionless for happy customers to share their genuine experience. The customer writes and submits the review themselves.',
              },
              {
                q: 'What happens with negative feedback?',
                a: '1–3 star responses never go to Google. They go straight to you so you can follow up and fix the issue before it becomes a public problem.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. No lock-in, no cancellation fees. Cancel from your dashboard settings at any time.',
              },
            ].map((item) => (
              <div key={item.q}>
                <h3 className="text-2xl font-light mb-4 text-black">{item.q}</h3>
                <p className="text-xl font-light text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 px-6 border-t border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-6xl md:text-8xl font-light mb-12 leading-[0.95] tracking-tight text-black">
            Start free.
            <br />
            <span className="italic">No credit card.</span>
          </h2>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white hover:bg-gray-900 transition-all group"
          >
            <span>Get started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
