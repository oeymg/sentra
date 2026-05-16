'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Phone, Mail, ChevronDown, Check, Send, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function buildSurveyUrl(slug: string) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://usesentra.com'
  return `${base}/review/${slug}`
}

type Tab = 'phone' | 'email'

export default function SendPage() {
  const { selectedBusiness } = useBusinessContext()
  const [tab, setTab] = useState<Tab>('phone')
  const [contact, setContact] = useState('')
  const [sent, setSent] = useState<'whatsapp' | 'sms' | 'email' | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const slug = selectedBusiness ? (selectedBusiness.slug || selectedBusiness.id) : null
  const surveyUrl = slug ? buildSurveyUrl(slug) : null
  const message = `Hi! Thanks for the work we did for you. We'd love it if you could leave us a quick review — it only takes 30 seconds: ${surveyUrl}`

  const digits = contact.replace(/\D/g, '')
  const canSendPhone = digits.length >= 8 && !!surveyUrl
  const canSendEmail = contact.includes('@') && contact.includes('.') && !!surveyUrl

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  // Reset contact when switching tabs
  const switchTab = (t: Tab) => {
    setTab(t)
    setContact('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const logRequest = (method: string) => {
    if (!selectedBusiness) return
    fetch('/api/review-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: selectedBusiness.id, method, contact }),
    }).catch(() => {/* fire and forget */})
  }

  const sendWhatsApp = () => {
    if (!canSendPhone) return
    logRequest('whatsapp')
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank')
    setSent('whatsapp')
  }

  const sendSMS = () => {
    if (!canSendPhone) return
    logRequest('sms')
    window.location.href = `sms:${contact}?body=${encodeURIComponent(message)}`
    setSent('sms')
  }

  const sendEmail = () => {
    if (!canSendEmail) return
    logRequest('email')
    const subject = encodeURIComponent(`Quick review for ${selectedBusiness?.name ?? 'us'}`)
    window.location.href = `mailto:${contact}?subject=${subject}&body=${encodeURIComponent(message)}`
    setSent('email')
  }

  const reset = () => {
    setContact('')
    setSent(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const sentLabel = sent === 'whatsapp' ? 'WhatsApp' : sent === 'sms' ? 'SMS' : 'Email'

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-light text-gray-900 mb-1">Send review request</h1>
                  <p className="text-gray-500 text-sm">Fire this off right after the job — while they&apos;re still happy.</p>
                </div>

                {/* Tab toggle */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => switchTab('phone')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                      tab === 'phone'
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Phone
                  </button>
                  <button
                    onClick={() => switchTab('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                      tab === 'email'
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </div>

                {/* Input */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
                    {tab === 'phone' ? "Customer's mobile number" : "Customer's email address"}
                  </label>
                  <input
                    ref={inputRef}
                    key={tab}
                    type={tab === 'email' ? 'email' : 'tel'}
                    inputMode={tab === 'email' ? 'email' : 'tel'}
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder={tab === 'phone' ? '0412 345 678' : 'customer@example.com'}
                    disabled={!surveyUrl}
                    className="w-full px-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors disabled:opacity-40 bg-white"
                  />
                  {tab === 'phone' && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      For international numbers include the country code (e.g. 61412…)
                    </p>
                  )}
                </div>

                {/* Message preview */}
                <div className="mb-6">
                  <button
                    onClick={() => setPreviewOpen(!previewOpen)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${previewOpen ? 'rotate-180' : ''}`} />
                    {previewOpen ? 'Hide' : 'Preview'} message
                  </button>
                  <AnimatePresence>
                    {previewOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {surveyUrl ? message : 'Select a business to preview.'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Send button(s) */}
                {tab === 'phone' ? (
                  <div className="flex gap-3">
                    <button
                      onClick={sendWhatsApp}
                      disabled={!canSendPhone}
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </button>
                    <button
                      onClick={sendSMS}
                      disabled={!canSendPhone}
                      className="flex-1 flex items-center justify-center gap-2 py-4 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Phone className="w-4 h-4" />
                      SMS
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={sendEmail}
                    disabled={!canSendEmail}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-black text-white rounded-xl text-base font-medium hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                    Send email
                  </button>
                )}

                {!surveyUrl && (
                  <p className="text-xs text-center text-gray-400 mt-3">No business selected — pick one from the sidebar.</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                  className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-10 h-10 text-green-500" />
                </motion.div>

                <h2 className="text-2xl font-light text-gray-900 mb-2">
                  {sentLabel} should be opening now
                </h2>
                <p className="text-gray-500 text-sm mb-8">
                  {sent === 'email'
                    ? 'Your email client should open with the message pre-filled.'
                    : `The message is pre-filled — just hit send in ${sentLabel}.`}
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={reset}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-black text-white rounded-xl text-base font-medium hover:bg-gray-800 transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                    Send another
                  </button>
                  <Link
                    href="/dashboard"
                    className="w-full flex items-center justify-center py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Back to dashboard
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </DashboardLayout>
  )
}
