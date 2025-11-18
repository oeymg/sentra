'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Mail,
  Eye,
  MousePointerClick,
  Star,
  Calendar,
  Users,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { CSVUpload, type CSVRecipient } from '@/components/campaigns/CSVUpload'

interface Campaign {
  id: string
  name: string
  description: string
  status: string
  type: string
  subject_line: string
  email_template: string
  total_sent: number
  total_opened: number
  total_clicked: number
  total_reviewed: number
  created_at: string
  scheduled_at?: string
}

interface Recipient {
  id: string
  email: string
  name: string
  phone?: string
  status: string
  sent_at?: string
  opened_at?: string
  clicked_at?: string
  reviewed_at?: string
  review_rating?: number
}

type RouteContext = {
  params: Promise<{ id: string }>
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { selectedBusiness } = useBusinessContext()
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [addingRecipients, setAddingRecipients] = useState(false)
  const [showAddRecipients, setShowAddRecipients] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)
  const [showTestEmailModal, setShowTestEmailModal] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [testEmailError, setTestEmailError] = useState<string | null>(null)
  const [testEmailSuccess, setTestEmailSuccess] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setCampaignId(p.id))
  }, [params])

  useEffect(() => {
    if (campaignId) {
      loadCampaign()
      loadRecipients()
    }
  }, [campaignId])

  const loadCampaign = async () => {
    if (!campaignId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}`)
      const data = await response.json()

      if (response.ok) {
        setCampaign(data.campaign)
      }
    } catch (error) {
      console.error('Error loading campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecipients = async () => {
    if (!campaignId) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/recipients`)
      const data = await response.json()

      if (response.ok) {
        setRecipients(data.recipients || [])
      }
    } catch (error) {
      console.error('Error loading recipients:', error)
    }
  }

  const handleAddRecipients = async (csvRecipients: CSVRecipient[]) => {
    if (!campaignId) return

    try {
      setAddingRecipients(true)
      const response = await fetch(`/api/campaigns/${campaignId}/recipients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: csvRecipients }),
      })

      if (response.ok) {
        await loadRecipients()
        setShowAddRecipients(false)
      }
    } catch (error) {
      console.error('Error adding recipients:', error)
    } finally {
      setAddingRecipients(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!campaignId || !campaign) return

    if (!confirm(`Are you sure you want to send this campaign to ${recipients.filter(r => r.status === 'pending').length} recipients?`)) {
      return
    }

    try {
      setSending(true)
      setSendError(null)
      setSendSuccess(null)

      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setSendSuccess(data.message || 'Campaign sent successfully!')
        await loadCampaign()
        await loadRecipients()
      } else {
        setSendError(data.error || 'Failed to send campaign')
      }
    } catch (error) {
      console.error('Error sending campaign:', error)
      setSendError('Failed to send campaign')
    } finally {
      setSending(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!campaignId || !testEmail) return

    try {
      setSendingTest(true)
      setTestEmailError(null)
      setTestEmailSuccess(null)

      const response = await fetch(`/api/campaigns/${campaignId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestEmailSuccess(data.message || 'Test email sent successfully!')
        setTestEmail('')
        setTimeout(() => {
          setShowTestEmailModal(false)
          setTestEmailSuccess(null)
        }, 2000)
      } else {
        setTestEmailError(data.error || 'Failed to send test email')
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      setTestEmailError('Failed to send test email')
    } finally {
      setSendingTest(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-gray-100 text-gray-700', label: 'Pending' },
      sent: { color: 'bg-blue-100 text-blue-700', label: 'Sent' },
      opened: { color: 'bg-purple-100 text-purple-700', label: 'Opened' },
      clicked: { color: 'bg-yellow-100 text-yellow-700', label: 'Clicked' },
      reviewed: { color: 'bg-green-100 text-green-700', label: 'Reviewed' },
      bounced: { color: 'bg-red-100 text-red-700', label: 'Bounced' },
    }
    const badge = badges[status as keyof typeof badges] || badges.pending
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const openRate = campaign && campaign.total_sent > 0
    ? ((campaign.total_opened / campaign.total_sent) * 100).toFixed(1)
    : '0.0'
  const clickRate = campaign && campaign.total_sent > 0
    ? ((campaign.total_clicked / campaign.total_sent) * 100).toFixed(1)
    : '0.0'
  const reviewRate = campaign && campaign.total_sent > 0
    ? ((campaign.total_reviewed / campaign.total_sent) * 100).toFixed(1)
    : '0.0'

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Campaign not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <Link
              href="/dashboard/campaigns"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to campaigns
            </Link>
            <motion.h1
              className="text-5xl font-light mb-3 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {campaign.name}
            </motion.h1>
            {campaign.description && (
              <p className="text-lg text-gray-600 font-light">{campaign.description}</p>
            )}
          </div>

          {/* Send Campaign Button & Messages */}
          <div className="space-y-4">
            {sendSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4"
              >
                {sendSuccess}
              </motion.div>
            )}
            {sendError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4"
              >
                {sendError}
              </motion.div>
            )}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTestEmailModal(true)}
                className="px-6 py-3 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Send Test Email
              </button>
              {recipients.filter(r => r.status === 'pending').length > 0 && campaign.status !== 'completed' && (
                <button
                  onClick={handleSendCampaign}
                  disabled={sending}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Campaign ({recipients.filter(r => r.status === 'pending').length} recipients)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <StatsCard
              title="Emails Sent"
              value={campaign.total_sent}
              icon={Send}
              gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <StatsCard
              title="Open Rate"
              value={`${openRate}%`}
              subtitle={`${campaign.total_opened} opened`}
              icon={Eye}
              gradient="bg-gradient-to-r from-purple-500 to-pink-500"
            />
            <StatsCard
              title="Click Rate"
              value={`${clickRate}%`}
              subtitle={`${campaign.total_clicked} clicked`}
              icon={MousePointerClick}
              gradient="bg-gradient-to-r from-orange-500 to-red-500"
            />
            <StatsCard
              title="Review Rate"
              value={`${reviewRate}%`}
              subtitle={`${campaign.total_reviewed} reviewed`}
              icon={Star}
              gradient="bg-gradient-to-r from-green-500 to-emerald-500"
            />
          </div>

          {/* Recipients */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-light text-black mb-1">Recipients</h2>
                <p className="text-sm text-gray-600">
                  {recipients.length} recipients in this campaign
                </p>
              </div>
              <button
                onClick={() => setShowAddRecipients(!showAddRecipients)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                {showAddRecipients ? 'Cancel' : 'Add Recipients'}
              </button>
            </div>

            {showAddRecipients && (
              <div className="mb-6">
                <CSVUpload
                  onRecipientsLoaded={handleAddRecipients}
                />
              </div>
            )}

            {recipients.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">No recipients yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a CSV file to add recipients to this campaign
                </p>
                <button
                  onClick={() => setShowAddRecipients(true)}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add Recipients
                </button>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-gray-700">Name</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-700">Email</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-700">Status</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-700">Sent</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-700">Opened</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-700">Clicked</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-700">Reviewed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recipients.map((recipient) => (
                        <tr key={recipient.id} className="hover:bg-gray-50">
                          <td className="p-4 text-sm text-gray-900">{recipient.name}</td>
                          <td className="p-4 text-sm text-gray-600">{recipient.email}</td>
                          <td className="p-4">{getStatusBadge(recipient.status)}</td>
                          <td className="p-4 text-sm text-gray-600">
                            {recipient.sent_at ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-400" />
                            )}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {recipient.opened_at ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300" />
                            )}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {recipient.clicked_at ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300" />
                            )}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {recipient.reviewed_at ? (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                {recipient.review_rating && (
                                  <span className="text-xs">{recipient.review_rating}</span>
                                )}
                              </div>
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Email Modal */}
      {showTestEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
          >
            <div className="mb-4">
              <h3 className="text-xl font-light text-black mb-2">Send Test Email</h3>
              <p className="text-sm text-gray-600">
                Preview how your campaign email will look. Customer name will be shown as "John" in the test.
              </p>
            </div>

            {testEmailSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 mb-4 text-sm"
              >
                {testEmailSuccess}
              </motion.div>
            )}

            {testEmailError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 mb-4 text-sm"
              >
                {testEmailError}
              </motion.div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder:text-gray-500"
                disabled={sendingTest}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowTestEmailModal(false)
                  setTestEmail('')
                  setTestEmailError(null)
                  setTestEmailSuccess(null)
                }}
                disabled={sendingTest}
                className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTestEmail}
                disabled={sendingTest || !testEmail}
                className="flex-1 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Test
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  )
}
