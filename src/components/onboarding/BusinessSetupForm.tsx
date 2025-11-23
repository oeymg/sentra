'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Building2, MapPin, Globe, Briefcase, ArrowRight, Check, Sparkles, Zap, Building } from 'lucide-react'

interface BusinessSetupFormProps {
  user: User
  planTier: 'free' | 'pro' | 'enterprise'
}

export default function BusinessSetupForm({ user, planTier }: BusinessSetupFormProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    website: '',
    location: '',
  })
  const router = useRouter()
  const supabase = createClient()

  const planDetails = {
    free: { name: 'Free', icon: Sparkles, color: 'text-gray-600' },
    pro: { name: 'Pro', icon: Zap, color: 'text-blue-600' },
    enterprise: { name: 'Enterprise', icon: Building, color: 'text-purple-600' },
  }

  const currentPlan = planDetails[planTier]
  const PlanIcon = currentPlan.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate slug from business name
      let slug = formData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Fallback to a unique slug if empty
      if (!slug) {
        slug = `business-${Date.now()}`
      }

      // Calculate trial end date for Pro plan (14 days from now)
      const trialEndsAt = planTier === 'pro'
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : null

      // Create the business with plan tier
      const { data: business, error } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          name: formData.businessName,
          slug,
          industry: formData.industry,
          website: formData.website || null,
          address: formData.location || null,
          description: formData.location ? `Located in ${formData.location}` : null,
          plan_tier: planTier,
          subscription_status: planTier === 'pro' ? 'trial' : 'active',
          trial_ends_at: trialEndsAt,
          plan_started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        // If slug already exists, retry with a unique suffix
        if (error.code === '23505') {
          const uniqueSlug = `${slug}-${Date.now()}`
          const { data: retryBusiness, error: retryError } = await supabase
            .from('businesses')
            .insert({
              user_id: user.id,
              name: formData.businessName,
              slug: uniqueSlug,
              industry: formData.industry,
              website: formData.website || null,
              address: formData.location || null,
              description: formData.location ? `Located in ${formData.location}` : null,
              plan_tier: planTier,
              subscription_status: planTier === 'pro' ? 'trial' : 'active',
              trial_ends_at: trialEndsAt,
              plan_started_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (retryError) throw retryError
        } else {
          throw error
        }
      }

      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      console.error('Error creating business:', error)
      alert(`Failed to create business: ${error.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-2xl">
        {/* Plan Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full mb-4">
            <PlanIcon className={`w-4 h-4 ${currentPlan.color}`} />
            <span className="text-sm font-medium text-gray-900">
              {currentPlan.name} Plan Selected
            </span>
            {planTier === 'pro' && (
              <span className="text-xs text-gray-600">• 14-day free trial</span>
            )}
          </div>
          <h1 className="text-4xl font-light mb-2 text-black">
            Set up your business
          </h1>
          <p className="text-gray-600">
            Let's get your business profile ready
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <div className={`w-16 h-1 ${
                step >= 2 ? 'bg-black' : 'bg-gray-200'
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <Building2 className="w-4 h-4" />
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                    placeholder="Acme Restaurant"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <Briefcase className="w-4 h-4" />
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                    required
                  >
                    <option value="">Select industry</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Retail">Retail</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="Home Services">Home Services</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Beauty & Wellness">Beauty & Wellness</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.businessName || !formData.industry}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <Globe className="w-4 h-4" />
                    Website (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <MapPin className="w-4 h-4" />
                    Location (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
                    placeholder="Sydney, NSW"
                  />
                </div>

                {/* Trial Info for Pro */}
                {planTier === 'pro' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">
                          14-Day Pro Trial
                        </h4>
                        <p className="text-sm text-blue-700">
                          Your trial starts now. No credit card required. You'll be notified before it ends.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? 'Creating...' : 'Complete Setup'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {planTier === 'pro' && 'Start your free trial now. Upgrade to continue after 14 days.'}
            {planTier === 'free' && 'You can upgrade to Pro anytime from your dashboard.'}
          </p>
        </div>
      </div>
    </div>
  )
}
