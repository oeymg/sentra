'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { motion } from 'framer-motion'
import {
  QrCode, Nfc, Link2, MessageCircle, Download, Copy, Check,
  Send, Phone, Mail, ChevronDown, Smartphone,
} from 'lucide-react'
import QRCode from 'qrcode'

function buildSurveyUrl(slug: string) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://usesentra.com'
  return `${base}/review/${slug}`
}

// ─── QR Code Card ─────────────────────────────────────────────────────────────
function QRCodeCard({ surveyUrl }: { surveyUrl: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!surveyUrl || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, surveyUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
  }, [surveyUrl])

  const download = useCallback(async () => {
    if (!surveyUrl) return
    const dataUrl = await QRCode.toDataURL(surveyUrl, { width: 1200, margin: 4 })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'sentra-qr-code.png'
    a.click()
  }, [surveyUrl])

  const copyLink = useCallback(() => {
    if (!surveyUrl) return
    navigator.clipboard.writeText(surveyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [surveyUrl])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm lg:col-span-2"
    >
      <div className="flex flex-col sm:flex-row gap-8 items-start">
        {/* QR Preview */}
        <div className="shrink-0">
          {surveyUrl ? (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <canvas ref={canvasRef} className="rounded-lg block" />
            </div>
          ) : (
            <div className="w-[252px] h-[252px] bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
              <QrCode className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* Info + actions */}
        <div className="flex-1 py-1">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">QR Code</p>
          <h2 className="text-2xl font-light text-gray-900 mb-2">Your print-ready QR code</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Drop this on your business card, a leave-behind, or anywhere at the job. Customer scans it, answers 3 quick questions, AI writes the review.
          </p>

          {surveyUrl && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2 mb-5 border border-gray-100">
              <span className="text-xs font-mono text-gray-500 truncate flex-1">{surveyUrl}</span>
              <button onClick={copyLink} className="shrink-0 text-gray-400 hover:text-black transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={download}
              disabled={!surveyUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
            <button
              onClick={copyLink}
              disabled={!surveyUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? <><Check className="w-4 h-4 text-green-500" /> Copied</> : <><Copy className="w-4 h-4" /> Copy link</>}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Send to Customer Card ─────────────────────────────────────────────────────
type SendMethod = 'whatsapp' | 'sms' | 'email'

function SendCard({ surveyUrl, businessName }: { surveyUrl: string | null; businessName: string }) {
  const [method, setMethod] = useState<SendMethod>('whatsapp')
  const [contact, setContact] = useState('')
  const [sent, setSent] = useState(false)

  const message = `Hi! Thanks for the work we did for you. We'd love it if you could leave us a quick review — it only takes 30 seconds: ${surveyUrl}`

  const send = () => {
    if (!surveyUrl || !contact) return

    if (method === 'whatsapp') {
      const phone = contact.replace(/\D/g, '')
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
    } else if (method === 'sms') {
      window.location.href = `sms:${contact}?body=${encodeURIComponent(message)}`
    } else {
      window.location.href = `mailto:${contact}?subject=${encodeURIComponent(`Quick review for ${businessName}`)}&body=${encodeURIComponent(message)}`
    }

    setSent(true)
    setTimeout(() => { setSent(false); setContact('') }, 3000)
  }

  const methods: { id: SendMethod; label: string; icon: typeof Phone; placeholder: string }[] = [
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: 'e.g. 61412345678' },
    { id: 'sms', label: 'SMS', icon: Phone, placeholder: 'e.g. 0412 345 678' },
    { id: 'email', label: 'Email', icon: Mail, placeholder: 'customer@example.com' },
  ]
  const active = methods.find(m => m.id === method)!

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
    >
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Send to Customer</p>
      <h2 className="text-lg font-light text-gray-900 mb-1">Fire off a review request</h2>
      <p className="text-sm text-gray-500 mb-5">Already left the job? Send the link directly to their phone.</p>

      {/* Method tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {methods.map(m => (
          <button
            key={m.id}
            onClick={() => { setMethod(m.id); setContact('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              method === m.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <m.icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1.5">{active.label} contact</label>
        <input
          type={method === 'email' ? 'email' : 'tel'}
          value={contact}
          onChange={e => setContact(e.target.value)}
          placeholder={active.placeholder}
          disabled={!surveyUrl}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black transition-colors disabled:opacity-40"
        />
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
        <p className="text-xs text-gray-400 mb-1">Message preview</p>
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{surveyUrl ? message : 'Select a business to preview the message.'}</p>
      </div>

      <button
        onClick={send}
        disabled={!contact || !surveyUrl || sent}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {sent
          ? <><Check className="w-4 h-4" /> Sent!</>
          : <><Send className="w-4 h-4" /> Send via {active.label}</>}
      </button>
      {method === 'whatsapp' && (
        <p className="text-xs text-gray-400 text-center mt-2">Opens WhatsApp with the message pre-filled</p>
      )}
    </motion.div>
  )
}

// ─── NFC Card ─────────────────────────────────────────────────────────────────
function NFCCard({ surveyUrl }: { surveyUrl: string | null }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const copy = () => {
    if (!surveyUrl) return
    navigator.clipboard.writeText(surveyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
    >
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">NFC Tag</p>
      <h2 className="text-lg font-light text-gray-900 mb-1">Tap to review</h2>
      <p className="text-sm text-gray-500 mb-5 leading-relaxed">
        Customer taps their phone on your card or sticker — survey opens instantly. No camera, no typing.
      </p>

      <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100 mb-4">
        <Smartphone className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-xs font-mono text-gray-600 truncate flex-1">
          {surveyUrl ?? 'No business selected'}
        </span>
        {surveyUrl && (
          <button onClick={copy} className="shrink-0 text-gray-400 hover:text-black transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-1"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        How to set up an NFC tag
      </button>

      {open && (
        <ol className="mt-2 space-y-1.5 text-xs text-gray-500 leading-relaxed list-decimal list-inside pl-1">
          <li>Buy any NTAG213 sticker or card (~$1 on Amazon)</li>
          <li>Download <span className="font-medium text-gray-700">NFC Tools</span> (free, iOS & Android)</li>
          <li>Tap "Write" → "Add a record" → "URL"</li>
          <li>Paste your survey URL above and write to the tag</li>
          <li>Stick it on your business card, van, or invoice book</li>
        </ol>
      )}
    </motion.div>
  )
}

// ─── Survey Link Card ──────────────────────────────────────────────────────────
function SurveyLinkCard({ surveyUrl }: { surveyUrl: string | null }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!surveyUrl) return
    navigator.clipboard.writeText(surveyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
    >
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Survey Link</p>
      <h2 className="text-lg font-light text-gray-900 mb-1">Share anywhere</h2>
      <p className="text-sm text-gray-500 mb-5">Paste into iMessage, email, invoices, or your email signature.</p>

      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100 mb-4">
        <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-xs font-mono text-gray-600 truncate flex-1">
          {surveyUrl ?? 'No business selected'}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={copy}
          disabled={!surveyUrl}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy link</>}
        </button>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'iMessage', href: surveyUrl ? `sms:?body=${encodeURIComponent(surveyUrl)}` : '#' },
            { label: 'Email', href: surveyUrl ? `mailto:?subject=Quick review&body=${encodeURIComponent(surveyUrl)}` : '#' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center justify-center py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AssetsPage() {
  const { selectedBusiness } = useBusinessContext()

  const slug = selectedBusiness ? (selectedBusiness.slug || selectedBusiness.id) : null
  const surveyUrl = slug ? buildSurveyUrl(slug) : null
  const businessName = selectedBusiness?.name || ''

  return (
    <DashboardLayout>
      <div className="p-12">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <div>
            <motion.h1
              className="text-5xl font-light mb-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Assets
            </motion.h1>
            <p className="text-gray-500 font-light">Everything you need to collect reviews — digital and physical.</p>
          </div>

          {/* Grid */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* QR Code — spans 2 cols */}
            <QRCodeCard surveyUrl={surveyUrl} />

            {/* Send to Customer */}
            <SendCard surveyUrl={surveyUrl} businessName={businessName} />

            {/* NFC */}
            <NFCCard surveyUrl={surveyUrl} />

            {/* Survey Link */}
            <SurveyLinkCard surveyUrl={surveyUrl} />
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
