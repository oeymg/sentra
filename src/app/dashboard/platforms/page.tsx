'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Link2, PlugZap, Shield, X } from 'lucide-react'

type Business = { id: string; name: string }
type Platform = { id: string; name: string; slug: string; icon: string }
type Connection = { id: string; platformId: string; platformName: string; platformBusinessId: string | null }

export default function PlatformsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    platformId: '',
    platformBusinessId: '',
    accessToken: '',
    refreshToken: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [{ data: businessRows }, { data: platformRows }] = await Promise.all([
          supabase.from('businesses').select('id,name').order('created_at', { ascending: true }),
          supabase.from('review_platforms').select('id,name,slug'),
        ])

        setBusinesses(businessRows || [])
        if (businessRows && businessRows.length > 0) {
          setSelectedBusiness(businessRows[0].id)
        }

        setPlatforms(
          (platformRows || []).map((platform) => ({
            id: platform.id,
            name: platform.name,
            slug: platform.slug,
            icon: platformIcon(platform.slug),
          }))
        )
      } catch (err) {
        console.error(err)
        setError('Unable to load platforms. Verify your Supabase connection.')
      } finally {
        setLoading(false)
      }
    }

    loadPrerequisites()
  }, [supabase])

  useEffect(() => {
    const loadConnections = async () => {
      if (!selectedBusiness) {
        setConnections([])
        return
      }

      const { data, error } = await supabase
        .from('business_platforms')
        .select(
          `
          id,
          platform_id,
          platform_business_id,
          review_platforms ( name )
        `
        )
        .eq('business_id', selectedBusiness)

      if (error) {
        console.error(error)
        setError('Unable to load platform connections.')
        setConnections([])
        return
      }

      setConnections(
        (data || []).map((connection) => {
          const platformMeta = Array.isArray(connection.review_platforms)
            ? connection.review_platforms[0]
            : connection.review_platforms

          return {
            id: connection.id,
            platformId: connection.platform_id,
            platformName: platformMeta?.name ?? 'Unknown platform',
            platformBusinessId: connection.platform_business_id,
          }
        })
      )
    }

    loadConnections()
  }, [supabase, selectedBusiness])

  const connectionCount = connections.length
  const selectedConnectionIds = new Set(connections.map((connection) => connection.platformId))

  const openModal = (platformId: string) => {
    setForm({
      platformId,
      platformBusinessId: '',
      accessToken: '',
      refreshToken: '',
    })
    setError(null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedBusiness || !form.platformId) return

    setSaving(true)
    setError(null)

    try {
      const payload = {
        business_id: selectedBusiness,
        platform_id: form.platformId,
        platform_business_id: form.platformBusinessId || null,
        access_token: form.accessToken || null,
        refresh_token: form.refreshToken || null,
        is_connected: true,
      }

      const { error } = await supabase
        .from('business_platforms')
        .upsert(payload, { onConflict: 'business_id,platform_id' })

      if (error) throw error

      setModalOpen(false)
      setForm({ platformId: '', platformBusinessId: '', accessToken: '', refreshToken: '' })

      // reload connections
      const { data } = await supabase
        .from('business_platforms')
        .select(
          `
          id,
          platform_id,
          platform_business_id,
          review_platforms ( name )
        `
        )
        .eq('business_id', selectedBusiness)

      setConnections(
        (data || []).map((connection) => {
          const platformMeta = Array.isArray(connection.review_platforms)
            ? connection.review_platforms[0]
            : connection.review_platforms

          return {
            id: connection.id,
            platformId: connection.platform_id,
            platformName: platformMeta?.name ?? 'Unknown platform',
            platformBusinessId: connection.platform_business_id,
          }
        })
      )
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unable to connect platform.')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async (platformId: string) => {
    if (!selectedBusiness) return

    const existing = connections.find((connection) => connection.platformId === platformId)
    if (!existing) return

    const { error } = await supabase
      .from('business_platforms')
      .delete()
      .eq('id', existing.id)
      .eq('business_id', selectedBusiness)

    if (error) {
      console.error(error)
      setError('Unable to disconnect platform.')
      return
    }

    setConnections(connections.filter((connection) => connection.platformId !== platformId))
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!businesses.length) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6">
          <h1 className="text-4xl font-light text-black">No businesses yet</h1>
          <p className="text-gray-600 max-w-md">Add a business profile to unlock platform integrations.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-12">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-5xl font-light mb-2 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
                Platforms
              </h1>
              <p className="text-lg text-gray-600 font-light">Connect review sources to start syncing data.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500">Business</label>
              <select
                className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
                value={selectedBusiness ?? ''}
                onChange={(event) => setSelectedBusiness(event.target.value)}
              >
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="border border-red-200 bg-red-50 text-sm text-red-800 rounded-xl p-4">{error}</div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {platforms
              .filter((platform) =>
                ['google', 'reddit', 'yelp', 'trustpilot', 'facebook', 'tripadvisor'].includes(platform.slug)
              )
              .map((platform) => {
                // Reddit is always "connected" via Claude AI scraping
                const isConnected = platform.slug === 'reddit' ? true : selectedConnectionIds.has(platform.id)
                const connection = connections.find((c) => c.platformId === platform.id)
                const isComingSoon = ['yelp', 'trustpilot', 'facebook', 'tripadvisor'].includes(platform.slug)

                return (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-2xl p-6 shadow-sm ${
                      isConnected
                        ? 'border-black bg-black text-white'
                        : isComingSoon
                        ? 'border-gray-200 bg-gray-50 text-black opacity-75'
                        : 'border-gray-200 bg-white text-black'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-4xl">{platform.icon}</div>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-xs uppercase tracking-widest">
                          <Check className="w-3 h-3" /> Connected
                        </span>
                      )}
                      {!isConnected && isComingSoon && (
                        <span className="text-xs uppercase tracking-widest text-gray-500">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-light mb-2">{platform.name}</p>
                    {isConnected && connection?.platformBusinessId && (
                      <p className="text-xs opacity-70 mb-4">ID: {connection.platformBusinessId}</p>
                    )}

                    <div className="flex items-center justify-between mt-6">
                      {isConnected ? (
                        platform.slug === 'reddit' ? (
                          <span className="px-4 py-2 text-sm italic opacity-70">
                            AI-powered
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDisconnect(platform.id)}
                            className="text-sm underline underline-offset-4 decoration-white/40"
                          >
                            Disconnect
                          </button>
                        )
                      ) : isComingSoon ? (
                        <span className="px-4 py-2 text-sm text-gray-400 italic">
                          Not available yet
                        </span>
                      ) : (
                        <button
                          onClick={() => openModal(platform.id)}
                          className="px-4 py-2 text-sm border border-current rounded-lg"
                        >
                          Connect
                        </button>
                      )}
                      <span className="text-sm opacity-70">{platform.slug}</span>
                    </div>
                  </motion.div>
                )
              })}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <InfoCard
              icon={<Link2 className="w-4 h-4" />}
              title="API credentials"
              description="Enter API keys or OAuth tokens when connecting a platform. Everything is encrypted inside Supabase."
            />
            <InfoCard
              icon={<Shield className="w-4 h-4" />}
              title="RLS protected"
              description="Only owners can view or edit connections thanks to Supabase Row Level Security."
            />
            <InfoCard
              icon={<PlugZap className="w-4 h-4" />}
              title="Coming soon"
              description="Native OAuth flows for Google, Yelp, and Facebook will simplify authentication even further."
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => !saving && setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Connect platform</p>
                  <p className="text-2xl font-light text-black">
                    {platforms.find((platform) => platform.id === form.platformId)?.name}
                  </p>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <InputField
                  label="Platform Business ID"
                  placeholder="e.g. accounts/123456789"
                  value={form.platformBusinessId}
                  onChange={(value) => setForm((prev) => ({ ...prev, platformBusinessId: value }))}
                />
                <InputField
                  label="Access token"
                  placeholder="Paste token or API key"
                  value={form.accessToken}
                  onChange={(value) => setForm((prev) => ({ ...prev, accessToken: value }))}
                />
                <InputField
                  label="Refresh token (optional)"
                  placeholder="Needed for OAuth platforms"
                  value={form.refreshToken}
                  onChange={(value) => setForm((prev) => ({ ...prev, refreshToken: value }))}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-3 bg-black text-white rounded-lg disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save connection'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

function platformIcon(slug: string) {
  const mapping: Record<string, string> = {
    google: '🔍',
    reddit: '🤖',
    yelp: '🍽️',
    facebook: '📘',
    trustpilot: '⭐',
    tripadvisor: '🧭',
  }
  return mapping[slug] ?? '💬'
}

function InfoCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm space-y-2">
      <div className="text-gray-900 flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  )
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block text-sm text-gray-600 space-y-1">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </label>
  )
}
