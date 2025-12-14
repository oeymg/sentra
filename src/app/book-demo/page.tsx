'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function BookDemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    business: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('https://formspree.io/f/myzrvyng', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit demo request')
      }

      // Success!
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#000000', '#333333', '#666666'],
      })

      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting demo request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit demo request')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-32 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="w-20 h-20 mx-auto mb-8 bg-black rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-light mb-6 text-black">
            Thanks for reaching out.
          </h1>

          <p className="text-xl text-gray-600 mb-12 font-light">
            We'll get back to you within 24 hours to schedule your demo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white hover:bg-gray-900 transition-colors">
              Back to home
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-4 border border-black text-black hover:bg-black hover:text-white transition-colors">
              View pricing
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Animated background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0 animate-gridMove" style={{
          backgroundImage: 'linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <section className="pt-40 pb-32 px-6 relative">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-20">
            <h1 className="text-[5rem] md:text-[8rem] leading-[0.85] font-light mb-10 tracking-tighter text-black animate-fadeIn">
              Book a
              <br />
              <span className="italic font-normal">demo.</span>
            </h1>
            <p className="text-2xl text-black mb-6 max-w-2xl mx-auto font-light leading-relaxed animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              See how Sentra can transform your review management.
            </p>

            {/* Social proof */}
            <div className="inline-flex items-center gap-2 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-black text-black" />
              ))}
              <span className="text-sm text-gray-600 ml-2">Trusted by 500+ businesses</span>
            </div>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            {error && (
              <div className="mb-6 p-4 border border-red-500 bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Your name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-black bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Work email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@company.com"
                  className="w-full px-4 py-3 border border-black bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>

              {/* Business */}
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  Tell us about your business
                </label>
                <textarea
                  name="business"
                  required
                  value={formData.business}
                  onChange={handleChange}
                  rows={4}
                  placeholder="What's your business name and what do you do?"
                  className="w-full px-4 py-3 border border-black bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-black text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2 font-medium"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Book demo
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                We'll get back to you within 24 hours
              </p>
            </form>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-24 pt-16 border-t border-black"
          >
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  title: 'AI-powered responses',
                  description: 'Respond to every review in seconds with AI',
                },
                {
                  title: '21+ platforms',
                  description: 'Manage all your reviews in one place',
                },
                {
                  title: 'Proven results',
                  description: 'Average rating increase of 0.6 stars',
                },
              ].map((feature, idx) => (
                <div key={idx} className="text-center">
                  <h3 className="font-medium text-black mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 font-light">{feature.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
