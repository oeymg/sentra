'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Mail, MessageSquare, QrCode, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { emailTemplates, type EmailTemplate } from '@/lib/email-templates'

type CampaignType = 'email' | 'sms' | 'qr_code'

export default function NewCampaignPage() {
  const router = useRouter()
  const { selectedBusiness } = useBusinessContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)

  const defaultTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      return 'UTC'
    }
  }, [])
  const minScheduleDate = useMemo(() => new Date().toISOString().split('T')[0], [])
  const timezoneOptions = useMemo<string[]>(() => {
    const fallback = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles']

    try {
      const intl = Intl as typeof Intl & { supportedValuesOf?: (input: string) => string[] }
      if (typeof intl.supportedValuesOf === 'function') {
        return intl.supportedValuesOf('timeZone')
      }
    } catch {
      // Ignore and return fallback
    }

    if (defaultTimezone && !fallback.includes(defaultTimezone)) {
      return [defaultTimezone, ...fallback]
    }

    return fallback
  }, [defaultTimezone])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'email' as CampaignType,
    targetPlatform: 'google',
    subjectLine: '',
    emailTemplate: `Hi {{customer}},

Thank you for choosing us! We'd love to hear about your experience.

Would you mind leaving us a review? It only takes a minute and helps us serve you better.

Click here to leave a review: {{review_link}}

Thanks again!
{{business_name}}`,
    sendMode: 'immediate' as 'immediate' | 'scheduled',
    scheduledDate: '',
    scheduledTime: '',
    timezone: defaultTimezone,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBusiness) {
      setError('Please select a business first')
      return
    }

    if (formData.sendMode === 'scheduled' && (!formData.scheduledDate || !formData.scheduledTime)) {
      setError('Please choose a date and time for the scheduled send.')
      return
    }

    let scheduledAt: string | null = null
    if (formData.sendMode === 'scheduled') {
      const localDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
      if (Number.isNaN(localDateTime.getTime())) {
        setError('Invalid scheduled date or time.')
        return
      }
      if (localDateTime.getTime() <= Date.now()) {
        setError('Scheduled send must be in the future.')
        return
      }
      scheduledAt = localDateTime.toISOString()
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          name: formData.name,
          description: formData.description,
          type: formData.type,
          targetPlatform: formData.targetPlatform,
          subjectLine: formData.subjectLine,
          emailTemplate: formData.emailTemplate,
          sendMode: formData.sendMode,
          scheduledAt,
          timezone: formData.timezone,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create campaign')
      }

      // Success - redirect to campaigns list
      router.push('/dashboard/campaigns')
    } catch (err) {
      console.error('Error creating campaign:', err)
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      ...formData,
      subjectLine: template.subject,
      emailTemplate: template.body,
    })
  }

  const campaignTypes = [
    { value: 'email' as CampaignType, label: 'Email Campaign', icon: Mail, description: 'Send review requests via email' },
    { value: 'sms' as CampaignType, label: 'SMS Campaign', icon: MessageSquare, description: 'Send review requests via SMS' },
    { value: 'qr_code' as CampaignType, label: 'QR Code', icon: QrCode, description: 'Generate QR codes for in-person requests' },
  ]

  const platforms = [
    { value: 'google', label: 'Google', emoji: '🔍' },
    { value: 'yelp', label: 'Yelp', emoji: '🍽️' },
    { value: 'facebook', label: 'Facebook', emoji: '📘' },
    { value: 'tripadvisor', label: 'TripAdvisor', emoji: '🧭' },
    { value: 'trustpilot', label: 'Trustpilot', emoji: '⭐' },
  ]

  return (
    <DashboardLayout>
      <div className="p-12">
        <div className="max-w-4xl mx-auto space-y-8">
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
              Create Campaign
            </motion.h1>
            <p className="text-lg text-gray-600 font-light">
              Set up an automated review request campaign
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Campaign Type */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-light text-black mb-4">Campaign Type</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {campaignTypes.map((type) => {
                  const Icon = type.icon
                  const isSelected = formData.type === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-black' : 'text-gray-400'}`} />
                      <p className="font-medium text-sm text-black mb-1">{type.label}</p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </button>
                  )
                })}
              </div>
              {formData.type !== 'email' && (
                <p className="mt-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Note: SMS and QR Code campaigns require additional setup. Email campaigns are fully supported.
                </p>
              )}
            </div>

            {/* Template Selection (only show for email campaigns) */}
            {formData.type === 'email' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-light text-black">Choose a Template</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Start with a proven template or write your own from scratch
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {emailTemplates.map((template) => {
                    const isSelected = selectedTemplate?.id === template.id
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleSelectTemplate(template)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-sm text-black mb-1">{template.name}</p>
                        <p className="text-xs text-gray-500 mb-2">{template.description}</p>
                        <p className="text-xs text-gray-400 font-mono truncate">
                          {template.subject}
                        </p>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  You can customize any template after selection
                </p>
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-light text-black mb-4">Campaign Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Spring 2025 Review Request"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional: Describe the purpose of this campaign"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Platform *
                </label>
                <select
                  required
                  value={formData.targetPlatform}
                  onChange={(e) => setFormData({ ...formData, targetPlatform: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                >
                  {platforms.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.emoji} {platform.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Where you want customers to leave reviews
                </p>
              </div>
            </div>

            {/* Scheduling */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-light text-black mb-4">Scheduling</h2>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer hover:border-gray-300 transition-colors">
                  <input
                    type="radio"
                    name="send-mode"
                    value="immediate"
                    checked={formData.sendMode === 'immediate'}
                    onChange={() => setFormData({ ...formData, sendMode: 'immediate' })}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-black">Send manually</p>
                    <p className="text-xs text-gray-500">
                      Keep this campaign in draft and trigger it when you’re ready.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer hover:border-gray-300 transition-colors">
                  <input
                    type="radio"
                    name="send-mode"
                    value="scheduled"
                    checked={formData.sendMode === 'scheduled'}
                    onChange={() => setFormData({ ...formData, sendMode: 'scheduled' })}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-black">Schedule for later</p>
                    <p className="text-xs text-gray-500">
                      Choose a future date/time. The campaign will be marked as scheduled.
                    </p>
                  </div>
                </label>
              </div>

              {formData.sendMode === 'scheduled' && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send date *
                    </label>
                    <input
                      type="date"
                      min={minScheduleDate}
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send time *
                    </label>
                    <input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                    >
                      {timezoneOptions.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Campaign will send based on this timezone.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Email Template (only show for email campaigns) */}
            {formData.type === 'email' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-xl font-light text-black mb-4">Email Content</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subjectLine}
                    onChange={(e) => setFormData({ ...formData, subjectLine: e.target.value })}
                    placeholder="e.g., We'd love your feedback!"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Template *
                  </label>
                  <textarea
                    required
                    value={formData.emailTemplate}
                    onChange={(e) => setFormData({ ...formData, emailTemplate: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm text-gray-900 placeholder:text-gray-500"
                  />
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p className="font-medium">Available variables:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li><code className="bg-gray-100 px-1 rounded">{'{{customer}}'}</code> - Customer's first name</li>
                      <li><code className="bg-gray-100 px-1 rounded">{'{{business_name}}'}</code> - Your business name</li>
                      <li><code className="bg-gray-100 px-1 rounded">{'{{review_link}}'}</code> - Link to leave a review</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Link
                href="/dashboard/campaigns"
                className="px-6 py-3 text-gray-600 hover:text-black transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
