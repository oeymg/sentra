'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { User, Building2, Bell, Key, MessageSquare, AlertTriangle, CreditCard, Sparkles, Zap, Crown, Clock, Check, ArrowRight } from 'lucide-react'
import { responseTemplates } from '@/lib/analytics'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { getPlanDisplayName, getPlanPrice, getDaysRemainingInTrial } from '@/lib/plans'

export default function Settings() {
  const router = useRouter()
  const { selectedBusiness } = useBusinessContext()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState<any>(null)
  const [resetting, setResetting] = useState(false)
  const [profile, setProfile] = useState({
    fullName: '',
    email: ''
  })
  const [business, setBusiness] = useState({
    id: '',
    name: '',
    industry: '',
    website: '',
    description: '',
    address: '',
    googlePlaceId: '',
    yelpBusinessId: '',
    tripAdvisorUrl: '',
  })
  const [placeLookupLoading, setPlaceLookupLoading] = useState(false)
  const [placeLookupStatus, setPlaceLookupStatus] = useState<string | null>(null)
  const [yelpLookupLoading, setYelpLookupLoading] = useState(false)
  const [yelpLookupStatus, setYelpLookupStatus] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [originalPlaceId, setOriginalPlaceId] = useState<string>('')
  const [originalYelpId, setOriginalYelpId] = useState<string>('')
  const [originalTripAdvisorUrl, setOriginalTripAdvisorUrl] = useState<string>('')

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
        setProfile({
          fullName: user.user_metadata?.full_name || '',
          email: user.email || ''
        })

        // Load business data
        const { data: businesses } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)

        if (businesses && businesses.length > 0) {
          const biz = businesses[0]
          const placeId = biz.google_place_id || ''
          const yelpId = biz.yelp_business_id || ''
          const tripAdvisorUrl = biz.tripadvisor_url || ''
          setBusiness({
            id: biz.id,
            name: biz.name || '',
            industry: biz.industry || '',
            website: biz.website || '',
            description: biz.description || '',
            address: biz.address || '',
            googlePlaceId: placeId,
            yelpBusinessId: yelpId,
            tripAdvisorUrl: tripAdvisorUrl,
          })
          setOriginalPlaceId(placeId)
          setOriginalYelpId(yelpId)
          setOriginalTripAdvisorUrl(tripAdvisorUrl)
        }
      }
    }

    loadData()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: profile.fullName }
      })

      if (error) throw error
      alert('Profile updated successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSyncStatus(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('businesses')
        .update({
          name: business.name,
          industry: business.industry,
          website: business.website,
          description: business.description,
          address: business.address || null,
          google_place_id: business.googlePlaceId || null,
          yelp_business_id: business.yelpBusinessId || null,
          tripadvisor_url: business.tripAdvisorUrl || null,
        })
        .eq('id', business.id)

      if (error) throw error

      if (business.id && business.googlePlaceId) {
        await ensureGooglePlatformConnection(supabase, business.id, business.googlePlaceId)

        // Auto-sync reviews if Place ID was just added or changed
        if (business.googlePlaceId && business.googlePlaceId !== originalPlaceId) {
          setSyncStatus('Syncing reviews from Google...')
          await syncGoogleReviews(business.id)
          setOriginalPlaceId(business.googlePlaceId)
        }
      }

      if (business.id && business.yelpBusinessId) {
        await ensureYelpPlatformConnection(supabase, business.id, business.yelpBusinessId)

        // Auto-sync reviews if Yelp Business ID was just added or changed
        if (business.yelpBusinessId && business.yelpBusinessId !== originalYelpId) {
          setSyncStatus('Syncing reviews from Yelp...')
          await syncYelpReviews(business.id)
          setOriginalYelpId(business.yelpBusinessId)
        }
      }

      if (business.id && business.tripAdvisorUrl) {
        await ensureTripAdvisorPlatformConnection(supabase, business.id, business.tripAdvisorUrl)

        // Auto-sync reviews if TripAdvisor URL was just added or changed
        if (business.tripAdvisorUrl && business.tripAdvisorUrl !== originalTripAdvisorUrl) {
          setSyncStatus('Syncing reviews from TripAdvisor using AI...')
          await syncTripAdvisorReviews(business.id, business.tripAdvisorUrl)
          setOriginalTripAdvisorUrl(business.tripAdvisorUrl)
        }
      }

      alert('Business updated successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to update business')
      setSyncStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const syncGoogleReviews = async (businessId: string) => {
    try {
      const response = await fetch('/api/google-reviews/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Sync failed')
      }

      const count = payload.reviews || 0
      let message = `Successfully synced ${count} review${count !== 1 ? 's' : ''} from Google!`

      if (payload.warning) {
        message += ` Note: ${payload.warning}`
      }

      setSyncStatus(message)

      // Clear sync status after 8 seconds (longer to read the warning)
      setTimeout(() => setSyncStatus(null), 8000)
    } catch (err) {
      console.error('Review sync error:', err)
      setSyncStatus(err instanceof Error ? err.message : 'Failed to sync reviews')
    }
  }

  const handleLookupPlaceId = async () => {
    if (!business.name || !business.address) {
      setPlaceLookupStatus('Enter business name and address first.')
      return
    }

    setPlaceLookupLoading(true)
    setPlaceLookupStatus(null)

    try {
      const response = await fetch('/api/google-reviews/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: business.name, location: business.address }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Lookup failed')
      }

      setBusiness((prev) => ({
        ...prev,
        address: payload.formattedAddress || prev.address,
        googlePlaceId: payload.placeId,
      }))
      setPlaceLookupStatus(`Matched: ${payload.displayName}`)
    } catch (err) {
      console.error(err)
      setPlaceLookupStatus(err instanceof Error ? err.message : 'Failed to lookup Place ID.')
    } finally {
      setPlaceLookupLoading(false)
    }
  }

  const handleLookupYelpId = async () => {
    if (!business.name || !business.address) {
      setYelpLookupStatus('Enter business name and address first.')
      return
    }

    setYelpLookupLoading(true)
    setYelpLookupStatus(null)

    try {
      const response = await fetch(
        `/api/yelp-reviews/lookup?name=${encodeURIComponent(business.name)}&location=${encodeURIComponent(business.address)}`
      )
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Lookup failed')
      }

      setBusiness((prev) => ({
        ...prev,
        yelpBusinessId: payload.business.id,
      }))
      setYelpLookupStatus(`Matched: ${payload.business.name}`)
    } catch (err) {
      console.error(err)
      setYelpLookupStatus(err instanceof Error ? err.message : 'Failed to lookup Yelp Business ID.')
    } finally {
      setYelpLookupLoading(false)
    }
  }

  const syncYelpReviews = async (businessId: string) => {
    try {
      const response = await fetch('/api/yelp-reviews/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Sync failed')
      }

      const count = payload.reviews || 0
      let message = `Successfully synced ${count} review${count !== 1 ? 's' : ''} from Yelp!`

      if (payload.note) {
        message += ` Note: ${payload.note}`
      }

      setSyncStatus(message)

      // Clear sync status after 8 seconds
      setTimeout(() => setSyncStatus(null), 8000)
    } catch (err) {
      console.error('Yelp review sync error:', err)
      setSyncStatus(err instanceof Error ? err.message : 'Failed to sync Yelp reviews')
    }
  }

  const syncTripAdvisorReviews = async (businessId: string, tripAdvisorUrl: string) => {
    try {
      const response = await fetch('/api/tripadvisor-reviews/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, tripAdvisorUrl }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Sync failed')
      }

      const count = payload.reviews || 0
      const message = `Successfully synced ${count} review${count !== 1 ? 's' : ''} from TripAdvisor using AI!`

      setSyncStatus(message)

      // Clear sync status after 8 seconds
      setTimeout(() => setSyncStatus(null), 8000)
    } catch (err) {
      console.error('TripAdvisor review sync error:', err)
      setSyncStatus(err instanceof Error ? err.message : 'Failed to sync TripAdvisor reviews')
    }
  }

  const handleResetDashboard = async () => {
    if (!selectedBusiness) {
      alert('No business selected')
      return
    }

    const confirmed = window.confirm(
      `⚠️ WARNING: This will permanently delete ALL reviews, AI responses, and insights for "${selectedBusiness.name}".\n\nThis action CANNOT be undone.\n\nType "${selectedBusiness.name}" in the next prompt to confirm.`
    )

    if (!confirmed) return

    const confirmation = window.prompt(`Type "${selectedBusiness.name}" to confirm:`)
    if (confirmation !== selectedBusiness.name) {
      alert('Confirmation failed. Reset cancelled.')
      return
    }

    setResetting(true)

    try {
      const response = await fetch('/api/reviews/reset', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: selectedBusiness.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset reviews')
      }

      alert(`✅ Successfully deleted ${result.deletedCount} reviews and all associated data.`)

      // Clear local caches
      try {
        localStorage.removeItem('sentra_insights_cache')
        localStorage.removeItem('sentra_sidebar_insights_cache')
      } catch (e) {
        console.error('Error clearing caches:', e)
      }

      // Reload the page to refresh all data
      window.location.reload()
    } catch (err) {
      console.error('Reset failed:', err)
      alert(err instanceof Error ? err.message : 'Failed to reset dashboard')
    } finally {
      setResetting(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'plan', label: 'Plan & Billing', icon: CreditCard },
    { id: 'templates', label: 'Response Templates', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Key },
  ]

  return (
    <DashboardLayout>
      <div className="p-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-light mb-3 text-black">
            Settings
          </h1>
          <p className="text-lg text-gray-600 mb-12 font-light">
            Manage your account and business settings
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-gray-200">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-light transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-black text-black'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="border border-black p-8">
              <h2 className="text-2xl font-light mb-6 text-black">Profile Information</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-light mb-2 text-black">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-light mb-2 text-black">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 text-gray-500 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Business Tab */}
          {activeTab === 'business' && (
            <div className="border border-black p-8">
              <h2 className="text-2xl font-light mb-6 text-black">Business Information</h2>
              <form onSubmit={handleUpdateBusiness} className="space-y-6">
                <div>
                  <label className="block text-sm font-light mb-2 text-black">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={business.name}
                    onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-light mb-2 text-black">
                    Industry
                  </label>
                  <select
                    value={business.industry}
                    onChange={(e) => setBusiness({ ...business, industry: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                  >
                    <option value="">Select an industry</option>
                    <option value="property">Real Estate & Property Development</option>
                    <option value="construction">Construction & Building</option>
                    <option value="professional">Professional Services</option>
                    <option value="home">Home Services</option>
                    <option value="retail">Retail & E-commerce</option>
                    <option value="hospitality">Hospitality & Travel</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="automotive">Automotive</option>
                    <option value="beauty">Beauty & Wellness</option>
                    <option value="education">Education</option>
                    <option value="technology">Technology</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-light mb-2 text-black">
                    Website
                  </label>
                  <input
                    type="url"
                    value={business.website}
                    onChange={(e) => setBusiness({ ...business, website: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-light mb-2 text-black">
                    Business Address
                  </label>
                  <input
                    type="text"
                    value={business.address}
                    onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                    placeholder="123 Main St, Springfield"
                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-light text-black">
                    Google Place ID
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={business.googlePlaceId}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 text-black bg-gray-50"
                      placeholder="Run lookup to fetch automatically"
                    />
                    <button
                      type="button"
                      onClick={handleLookupPlaceId}
                      disabled={placeLookupLoading}
                      className="px-4 py-3 bg-black text-white rounded-lg disabled:opacity-50"
                    >
                      {placeLookupLoading ? 'Searching…' : 'Lookup'}
                    </button>
                  </div>
                  {placeLookupStatus && (
                    <p className="text-xs text-gray-500">{placeLookupStatus}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-light text-black">
                    Yelp Business ID
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={business.yelpBusinessId}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 text-black bg-gray-50"
                      placeholder="Run lookup to fetch automatically"
                    />
                    <button
                      type="button"
                      onClick={handleLookupYelpId}
                      disabled={yelpLookupLoading}
                      className="px-4 py-3 bg-black text-white rounded-lg disabled:opacity-50"
                    >
                      {yelpLookupLoading ? 'Searching…' : 'Lookup'}
                    </button>
                  </div>
                  {yelpLookupStatus && (
                    <p className="text-xs text-gray-500">{yelpLookupStatus}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-light mb-2 text-black">
                    TripAdvisor URL
                  </label>
                  <input
                    type="url"
                    value={business.tripAdvisorUrl}
                    onChange={(e) => setBusiness({ ...business, tripAdvisorUrl: e.target.value })}
                    placeholder="https://www.tripadvisor.com/Restaurant_Review-g..."
                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste your business's TripAdvisor page URL. Reviews will be extracted using AI.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-light mb-2 text-black">
                    Description
                  </label>
                  <textarea
                    value={business.description}
                    onChange={(e) => setBusiness({ ...business, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors resize-none"
                  />
                </div>

                {syncStatus && (
                  <div className={`p-4 rounded-lg border ${
                    syncStatus.includes('Successfully')
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : syncStatus.includes('Syncing')
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {syncStatus.includes('Syncing') && (
                        <div className="w-4 h-4 border-2 border-blue-800 border-t-transparent rounded-full animate-spin" />
                      )}
                      <span className="text-sm font-medium">{syncStatus}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Plan & Billing Tab */}
          {activeTab === 'plan' && (
            <div className="space-y-8">
              {/* Current Plan Card */}
              <div className="border border-black p-8">
                <h2 className="text-2xl font-light mb-6 text-black">Current Plan</h2>

                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl font-light text-black">
                        {getPlanDisplayName(selectedBusiness?.plan_tier || 'free')}
                      </span>
                      {selectedBusiness?.subscription_status === 'trial' && selectedBusiness?.trial_ends_at && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                          Trial
                        </span>
                      )}
                    </div>
                    {selectedBusiness?.subscription_status === 'trial' && selectedBusiness?.trial_ends_at && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {getDaysRemainingInTrial(selectedBusiness.trial_ends_at)} days remaining
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-light text-black">
                      {getPlanPrice(selectedBusiness?.plan_tier || 'free')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(selectedBusiness?.plan_tier || 'free') === 'free' ? 'forever' : 'per month'}
                    </p>
                  </div>
                </div>

                {/* Usage Stats for Free Plan */}
                {(selectedBusiness?.plan_tier || 'free') === 'free' && (
                  <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-sm text-gray-600">AI Responses This Month</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedBusiness?.ai_responses_used_this_month || 0} / 5
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          (selectedBusiness?.ai_responses_used_this_month || 0) >= 5
                            ? 'bg-red-500'
                            : (selectedBusiness?.ai_responses_used_this_month || 0) >= 4
                            ? 'bg-yellow-500'
                            : 'bg-blue-600'
                        }`}
                        style={{
                          width: `${Math.min(100, ((selectedBusiness?.ai_responses_used_this_month || 0) / 5) * 100)}%`,
                        }}
                      />
                    </div>
                    {(selectedBusiness?.ai_responses_used_this_month || 0) >= 5 && (
                      <p className="text-sm text-red-600 mt-2">
                        Monthly limit reached. Upgrade to Pro for unlimited AI responses.
                      </p>
                    )}
                  </div>
                )}

                {/* Trial Info */}
                {selectedBusiness?.subscription_status === 'trial' && selectedBusiness?.trial_ends_at && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Your Pro trial ends in {getDaysRemainingInTrial(selectedBusiness.trial_ends_at)} days
                    </p>
                    <p className="text-sm text-blue-700">
                      Add payment details to continue using Pro features after your trial ends.
                    </p>
                  </div>
                )}
              </div>

              {/* Available Plans */}
              <div>
                <h2 className="text-2xl font-light mb-6 text-black">
                  {(selectedBusiness?.plan_tier || 'free') === 'free' ? 'Upgrade Your Plan' : 'Change Plan'}
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      id: 'free',
                      name: 'Free',
                      price: '$0',
                      period: 'forever',
                      icon: Sparkles,
                      features: ['1 location', 'All review platforms', '5 AI responses per month', 'Basic analytics'],
                    },
                    {
                      id: 'pro',
                      name: 'Pro',
                      price: '$29.99',
                      period: 'per month',
                      icon: Zap,
                      popular: true,
                      features: ['1 location', 'Unlimited AI responses', 'Review generation campaigns', 'Email & SMS automation', 'Advanced analytics'],
                    },
                    {
                      id: 'enterprise',
                      name: 'Enterprise',
                      price: 'Custom',
                      period: 'pricing',
                      icon: Crown,
                      features: ['Unlimited locations', 'Everything in Pro', 'Auto-reply automation', 'White-label reports', 'API access', 'Priority support'],
                    },
                  ].map((plan) => {
                    const PlanIcon = plan.icon
                    const isCurrent = plan.id === (selectedBusiness?.plan_tier || 'free')
                    const canUpgrade = ((selectedBusiness?.plan_tier || 'free') === 'free' && plan.id !== 'free') ||
                                     ((selectedBusiness?.plan_tier || 'free') === 'pro' && plan.id === 'enterprise')

                    return (
                      <div
                        key={plan.id}
                        className={`relative border-2 rounded p-6 transition-all ${
                          isCurrent
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        } ${plan.popular ? 'ring-2 ring-blue-100' : ''}`}
                      >
                        {plan.popular && !isCurrent && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black text-white text-xs font-medium rounded-full">
                            Most Popular
                          </div>
                        )}

                        {isCurrent && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black text-white text-xs font-medium rounded-full">
                            Current Plan
                          </div>
                        )}

                        <div className="mb-4">
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mb-3">
                            <PlanIcon className="w-5 h-5 text-black" />
                          </div>
                          <h3 className="text-lg font-semibold text-black mb-2">{plan.name}</h3>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-light text-black">{plan.price}</span>
                            <span className="text-gray-600 text-xs">/ {plan.period}</span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>

                        {isCurrent ? (
                          <button
                            disabled
                            className="w-full py-2 bg-gray-100 text-gray-600 rounded text-sm font-medium cursor-not-allowed"
                          >
                            Current Plan
                          </button>
                        ) : canUpgrade ? (
                          <Link
                            href={plan.id === 'enterprise' ? '/contact-sales' : '/onboarding/payment?plan=' + plan.id}
                            className="block w-full text-center py-2 bg-black text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors"
                          >
                            Upgrade to {plan.name}
                          </Link>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Billing Information (if not on free plan) */}
              {(selectedBusiness?.plan_tier || 'free') !== 'free' && (
                <div className="border border-black p-8">
                  <h2 className="text-2xl font-light mb-6 text-black">Billing Information</h2>

                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Payment integration coming soon</p>
                    <p className="text-sm text-gray-500">
                      Stripe integration will be added here for payment management
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Response Templates Tab */}
          {activeTab === 'templates' && (
            <div className="border border-black p-8">
              <h2 className="text-2xl font-light mb-6 text-black">Response Templates</h2>
              <p className="text-gray-600 mb-8 font-light">
                Customize your AI-generated response templates. These templates are available when responding to reviews and can be personalized with customer names.
              </p>

              <div className="space-y-6">
                {responseTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-light text-black">{template.name}</h3>
                        <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">{template.tone}</p>
                      </div>
                      <button className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors text-sm">
                        Edit Template
                      </button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {template.body.replace(/{{customer}}/g, '[Customer Name]')}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {template.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="px-2 py-1 bg-gray-100 text-xs text-gray-600 border border-gray-200"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors">
                  + Add New Template
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="border border-black p-8">
              <h2 className="text-2xl font-light mb-6 text-black">Notification Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <div>
                    <div className="font-light text-black">New Reviews</div>
                    <div className="text-sm text-gray-600">Get notified when you receive new reviews</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <div>
                    <div className="font-light text-black">Weekly Summary</div>
                    <div className="text-sm text-gray-600">Receive a weekly summary of your reviews</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <div>
                    <div className="font-light text-black">Marketing Updates</div>
                    <div className="text-sm text-gray-600">Receive updates about new features and tips</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="border border-black p-8">
              <h2 className="text-2xl font-light mb-6 text-black">Security Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-light text-lg mb-2 text-black">Change Password</h3>
                  <p className="text-sm text-gray-600 mb-4">Update your password to keep your account secure</p>
                  <button className="px-6 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors">
                    Change Password
                  </button>
                </div>
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="font-light text-lg mb-2 text-black">Delete Account</h3>
                  <p className="text-sm text-gray-600 mb-4">Permanently delete your account and all data</p>
                  <button className="px-6 py-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                    Delete Account
                  </button>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <h3 className="font-light text-lg text-black">Danger Zone</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Reset all review data for {selectedBusiness?.name || 'this business'}. This will delete all reviews, AI responses, and insights. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleResetDashboard}
                    disabled={resetting || !selectedBusiness}
                    className="px-6 py-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {resetting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        Reset All Reviews
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

async function ensureGooglePlatformConnection(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  placeId: string
) {
  const { data: platform, error: platformError } = await supabase
    .from('review_platforms')
    .select('id')
    .eq('slug', 'google')
    .single()

  if (platformError || !platform) {
    console.warn('Google platform row not found', platformError)
    return
  }

  const { error } = await supabase
    .from('business_platforms')
    .upsert(
      {
        business_id: businessId,
        platform_id: platform.id,
        platform_business_id: placeId,
        is_connected: true,
      },
      { onConflict: 'business_id,platform_id' }
    )

  if (error) {
    console.error('Failed to connect Google platform', error)
  }
}

async function ensureYelpPlatformConnection(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  yelpBusinessId: string
) {
  const { data: platform, error: platformError } = await supabase
    .from('review_platforms')
    .select('id')
    .eq('slug', 'yelp')
    .single()

  if (platformError || !platform) {
    console.warn('Yelp platform row not found', platformError)
    return
  }

  const { error } = await supabase
    .from('business_platforms')
    .upsert(
      {
        business_id: businessId,
        platform_id: platform.id,
        platform_business_id: yelpBusinessId,
        is_connected: true,
      },
      { onConflict: 'business_id,platform_id' }
    )

  if (error) {
    console.error('Failed to connect Yelp platform', error)
  }
}

async function ensureTripAdvisorPlatformConnection(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  tripAdvisorUrl: string
) {
  const { data: platform, error: platformError } = await supabase
    .from('review_platforms')
    .select('id')
    .eq('slug', 'tripadvisor')
    .single()

  if (platformError || !platform) {
    console.warn('TripAdvisor platform row not found', platformError)
    return
  }

  const { error } = await supabase
    .from('business_platforms')
    .upsert(
      {
        business_id: businessId,
        platform_id: platform.id,
        platform_business_id: tripAdvisorUrl,
        is_connected: true,
      },
      { onConflict: 'business_id,platform_id' }
    )

  if (error) {
    console.error('Failed to connect TripAdvisor platform', error)
  }
}
