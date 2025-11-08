'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { User, Building2, Bell, Key, MessageSquare } from 'lucide-react'
import { responseTemplates } from '@/lib/analytics'

export default function Settings() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState<any>(null)
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
  })
  const [placeLookupLoading, setPlaceLookupLoading] = useState(false)
  const [placeLookupStatus, setPlaceLookupStatus] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [originalPlaceId, setOriginalPlaceId] = useState<string>('')

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
          setBusiness({
            id: biz.id,
            name: biz.name || '',
            industry: biz.industry || '',
            website: biz.website || '',
            description: biz.description || '',
            address: biz.address || '',
            googlePlaceId: placeId,
          })
          setOriginalPlaceId(placeId)
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building2 },
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
