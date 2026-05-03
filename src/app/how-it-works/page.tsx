'use client'

import Link from 'next/link'
import { ArrowRight, ArrowLeft, QrCode, MessageSquare, Star, ShieldCheck } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function HowItWorks() {
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
          <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8 hover:opacity-60 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-[5rem] md:text-[8rem] leading-[0.85] font-light mb-10 tracking-tighter text-black">
            How it
            <br />
            <span className="italic font-normal">works.</span>
          </h1>
          <p className="text-2xl text-gray-600 mb-6 max-w-2xl font-light leading-relaxed">
            From job completion to a live Google review — in under a minute.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-32 px-6 border-t border-black">
        <div className="max-w-5xl mx-auto space-y-32">

          {/* Step 1 */}
          <div className="group">
            <div className="text-8xl font-light text-black/20 mb-8 group-hover:text-black/50 transition-colors">01</div>
            <h2 className="text-5xl font-light mb-8 text-black">You give them a QR code</h2>
            <p className="text-2xl text-gray-500 max-w-3xl font-light leading-relaxed mb-12">
              Sentra generates a unique QR code for your business. Put it on your business card, a small counter stand, or a leave-behind card after the job.
              Customers scan it right then — while the experience is still fresh.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 bg-black rounded-2xl flex items-center justify-center shrink-0">
                <QrCode className="w-16 h-16 text-white" />
              </div>
              <div className="space-y-4 text-black font-light text-lg">
                <p>→ Business card with your QR printed on the back</p>
                <p>→ Counter display for your reception area</p>
                <p>→ Each QR links directly to your review page at <span className="font-medium">usesentra.com/review/your-name</span></p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="group">
            <div className="text-8xl font-light text-black/20 mb-8 group-hover:text-black/50 transition-colors">02</div>
            <h2 className="text-5xl font-light mb-8 text-black">They answer 3 quick questions</h2>
            <p className="text-2xl text-gray-500 max-w-3xl font-light leading-relaxed mb-12">
              The survey is designed to take under 30 seconds. Dropdowns and multiple-choice — no typing required.
              Customers can add their own words too, which makes the final review even more personal.
            </p>
            <div className="bg-black text-white rounded-2xl p-12 space-y-8">
              <div className="text-sm uppercase tracking-widest text-white/40 mb-6">The 3 questions</div>
              <div className="space-y-6 font-light text-xl">
                <div className="flex items-start gap-4">
                  <span className="text-white/30 w-8 shrink-0">1.</span>
                  <div>
                    <p className="text-white mb-2">What service did we help you with?</p>
                    <p className="text-white/40 text-base">Dropdown: AC Repair / Plumbing / Electrical / Painting / Other…</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-white/30 w-8 shrink-0">2.</span>
                  <div>
                    <p className="text-white mb-2">How was the response speed, quality and pricing?</p>
                    <p className="text-white/40 text-base">Multiple choice buttons — one tap per question</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-white/30 w-8 shrink-0">3.</span>
                  <div>
                    <p className="text-white mb-2">Anything else you'd like to add?</p>
                    <p className="text-white/40 text-base">Optional short text — 200 chars max</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="group">
            <div className="text-8xl font-light text-black/20 mb-8 group-hover:text-black/50 transition-colors">03</div>
            <h2 className="text-5xl font-light mb-8 text-black">AI writes the review</h2>
            <p className="text-2xl text-gray-500 max-w-3xl font-light leading-relaxed mb-12">
              Their answers are turned into a genuine, first-person Google review — around 100 words, specific to the service they received.
              No generic filler. No robotic phrasing.
            </p>
            <div className="border border-black rounded-2xl p-12 space-y-8">
              <div>
                <div className="text-sm uppercase tracking-widest text-gray-400 mb-4">Customer answered</div>
                <div className="space-y-2 text-gray-600 font-light">
                  <p>Service: AC Repair &nbsp;·&nbsp; Speed: Same day &nbsp;·&nbsp; Quality: Excellent &nbsp;·&nbsp; Pricing: Very fair</p>
                  <p className="italic">"Cleaned up after themselves too"</p>
                </div>
              </div>
              <div className="h-px bg-gray-200" />
              <div>
                <div className="text-sm uppercase tracking-widest text-gray-400 mb-4">AI-generated review</div>
                <p className="text-xl font-light text-black leading-relaxed">
                  "My AC stopped working on one of the hottest days of the year. I called in the morning and they had someone out the same afternoon. The technician was thorough, explained what the issue was, and had it running within an hour. The price was really fair — better than the other quotes I got. They also cleaned up before leaving, which I appreciated. Would definitely use them again."
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="group">
            <div className="text-8xl font-light text-black/20 mb-8 group-hover:text-black/50 transition-colors">04</div>
            <h2 className="text-5xl font-light mb-8 text-black">They post it. Or it stays private.</h2>
            <p className="text-2xl text-gray-500 max-w-3xl font-light leading-relaxed mb-12">
              4 and 5 star experiences get sent to Google — the review text is copied to their clipboard and Google opens automatically.
              3 stars and under come straight to you, privately. You get to fix it before it becomes a public problem.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-black rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="font-light text-gray-700 mb-5">4–5 stars: customer sees the review, clicks "Post to Google" and it's live.</p>
                <div className="inline-block px-4 py-2 bg-black text-white text-sm rounded-lg">
                  Post to Google →
                </div>
              </div>
              <div className="border border-red-200 bg-red-50 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-6 h-6 fill-red-400 text-red-400" />
                  <Star className="w-6 h-6 fill-red-400 text-red-400" />
                  <Star className="w-6 h-6 text-gray-200" />
                  <Star className="w-6 h-6 text-gray-200" />
                  <Star className="w-6 h-6 text-gray-200" />
                </div>
                <p className="font-light text-gray-600 mb-5">1–3 stars: feedback goes directly to you. Customer sees "Thank you, we'll be in touch."</p>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-600 font-medium">Sent to you privately</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Dashboard preview */}
      <section className="py-32 px-6 border-t border-black">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-4">Your dashboard</p>
          <h2 className="text-5xl font-light text-black mb-8 tracking-tight">Track everything.</h2>
          <p className="text-xl text-gray-500 font-light leading-relaxed mb-16 max-w-2xl">
            See QR scans, review submissions and conversion rate — updated in real time.
            Know which jobs are generating reviews and which aren't.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: 'QR Scans', value: '45', sub: 'This month' },
              { label: 'Reviews Submitted', value: '12', sub: 'Posted to Google' },
              { label: 'Conversion Rate', value: '27%', sub: 'Scans → reviews' },
            ].map((stat) => (
              <div key={stat.label} className="border border-gray-200 rounded-2xl p-8">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">{stat.label}</p>
                <p className="text-5xl font-light text-black mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 px-6 border-t border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-6xl md:text-8xl font-light mb-12 leading-[0.95] tracking-tight text-black">
            Ready to try it?
          </h2>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white hover:bg-gray-900 transition-all group"
          >
            <span>Start free trial</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-sm text-gray-400 mt-5">No credit card required.</p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
