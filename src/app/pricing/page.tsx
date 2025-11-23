'use client'

import Link from 'next/link'
import { ArrowRight, ArrowLeft, Check, TrendingUp, Clock } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Pricing() {
  return (
    <main className="min-h-screen bg-white relative">
      <Header />

      {/* Hero */}
      <section className="pt-40 pb-32 px-6 relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <div className="absolute inset-0 animate-gridMove" style={{
            backgroundImage: 'linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8 text-black hover:opacity-60 transition-opacity animate-fadeIn">
            <ArrowLeft className="w-4 h-4 text-black" />
            Back
          </Link>
          <h1 className="text-[5rem] md:text-[8rem] leading-[0.85] font-light mb-10 tracking-tighter text-black animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Simple
            <br />
            <span className="italic font-normal">pricing.</span>
          </h1>
          <p className="text-2xl text-black mb-6 max-w-2xl font-light leading-relaxed animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Start free. Scale when you need to. No hidden fees.
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-full mb-16 animate-fadeIn shadow-sm" style={{ animationDelay: '0.3s' }}>
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-black">One extra star = 5-9% revenue boost annually</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-32 px-6 border-t border-black">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Free */}
          <div className="border border-black p-10 group hover:shadow-xl transition-all duration-300 bg-white text-black">
            <div className="text-sm uppercase tracking-widest mb-4 text-black">Free</div>
            <div className="text-6xl font-light mb-2 text-black">$0</div>
            <div className="text-sm text-black mb-4">Forever</div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg mb-6">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Save 5+ hours/week</span>
            </div>
            <Link
              href="/auth/signup"
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-black text-black hover:bg-black hover:text-white transition-all mb-10"
            >
              Start free
            </Link>
            <div className="space-y-4 text-black font-light">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>1 business location</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>All review platforms</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Unlimited review monitoring</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>5 AI responses per month</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Basic analytics</span>
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className="bg-black text-white border border-black p-10 relative group hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute -top-4 left-10 bg-white border border-black text-black px-4 py-1 text-xs uppercase tracking-widest">
              Most popular
            </div>
            <div className="text-sm uppercase tracking-widest mb-4">Pro</div>
            <div className="text-6xl font-light mb-2">$29.99</div>
            <div className="text-sm mb-4">Per month</div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg mb-6">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">14-day free trial</span>
            </div>
            <Link
              href="/auth/signup"
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black hover:bg-gray-100 transition-all mb-10"
            >
              Start Pro trial
            </Link>
            <div className="space-y-4 font-light">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>1 business location</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>All review platforms</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Unlimited reviews</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Unlimited AI responses</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Review generation campaigns</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Email & SMS automation</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>QR code generator</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Advanced analytics</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Competitor tracking</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Custom alerts</span>
              </div>
            </div>
          </div>

          {/* Enterprise */}
          <div className="border border-black p-10 group hover:shadow-xl transition-all duration-300">
            <div className="text-sm uppercase tracking-widest mb-4 text-black">Enterprise</div>
            <div className="text-6xl font-light mb-2 text-black">Custom</div>
            <div className="text-sm text-black mb-4">Pricing</div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg mb-6">
              <span className="text-sm font-semibold text-purple-700">For multi-location businesses</span>
            </div>
            <Link
              href="/contact-sales"
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-black text-black hover:bg-black hover:text-white transition-all mb-10"
            >
              Contact sales
            </Link>
            <div className="space-y-4 text-black font-light">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Unlimited locations</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Everything in Pro</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Auto-reply automation</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>White-label reports</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>API access</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Team management</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Priority support</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Custom integrations</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Dedicated account manager</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-6 border-t border-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-light mb-16 text-black">Questions?</h2>
          <div className="space-y-12">
            <div>
              <h3 className="text-2xl font-light mb-4 text-black">Is the free plan really free forever?</h3>
              <p className="text-xl font-light text-black leading-relaxed">
                Yes. No credit card required, no trial period, no catch. Start with 5 AI responses per month and upgrade when you need more.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-light mb-4 text-black">What happens after the Pro trial?</h3>
              <p className="text-xl font-light text-black leading-relaxed">
                After your 14-day Pro trial, you'll be asked to enter payment details to continue with Pro, or you can downgrade to the Free plan.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-light mb-4 text-black">Can I switch plans later?</h3>
              <p className="text-xl font-light text-black leading-relaxed">
                Yes. Upgrade or downgrade anytime from your dashboard settings. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-light mb-4 text-black">What's the difference between Free and Pro?</h3>
              <p className="text-xl font-light text-black leading-relaxed">
                Free gives you 5 AI responses per month and basic features. Pro unlocks unlimited AI responses, review generation campaigns (email/SMS/QR codes), and advanced analytics.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-light mb-4 text-black">When should I consider Enterprise?</h3>
              <p className="text-xl font-light text-black leading-relaxed">
                If you have multiple business locations or need white-label reports, API access, and dedicated support, Enterprise is for you. Contact our sales team for custom pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 px-6 border-t border-black relative">
        <div className="max-w-5xl mx-auto relative group/cta">
          <div className="absolute -inset-4 bg-black/5 rounded-3xl opacity-0 group-hover/cta:opacity-100 transition-opacity duration-500 blur-xl" />

          <div className="relative">
            <h2 className="text-6xl md:text-8xl font-light mb-12 leading-[0.95] tracking-tight text-black">
              Start for free.
              <br />
              <span className="italic">No credit card.</span>
            </h2>
            <div className="flex items-center gap-8">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-3 text-base px-10 py-5 bg-black text-white hover:bg-gray-900 transition-all group relative overflow-hidden"
              >
                <span className="relative z-10">Get started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>

            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
