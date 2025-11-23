'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, MapPin, Globe, Briefcase } from 'lucide-react'

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    website: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Generate slug from business name
      let slug = formData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Fallback to a unique slug if empty
      if (!slug) {
        slug = `business-${Date.now()}`
      }

      const { error } = await supabase.from('businesses').insert({
        user_id: user.id,
        name: formData.businessName,
        slug,
        industry: formData.industry,
        website: formData.website,
        description: formData.description,
        plan_tier: 'free',
        subscription_status: 'active',
      })

      if (error) {
        // If slug already exists, retry with a unique suffix
        if (error.code === '23505') {
          const uniqueSlug = `${slug}-${Date.now()}`
          const { error: retryError } = await supabase.from('businesses').insert({
            user_id: user.id,
            name: formData.businessName,
            slug: uniqueSlug,
            industry: formData.industry,
            website: formData.website,
            description: formData.description,
            plan_tier: 'free',
            subscription_status: 'active',
          })
          if (retryError) throw retryError
        } else {
          throw error
        }
      }

      router.push('/dashboard')
    } catch (err: any) {
      alert(err.message || 'Failed to create business')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Animated background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10">
          <div className="absolute inset-0 animate-gridMove" style={{
            backgroundImage: 'linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="mb-12 text-center">
          <h1 className="text-5xl font-light mb-4 text-black">Welcome to sentra</h1>
          <p className="text-lg text-gray-600 font-light">
            Let's set up your business to start managing reviews
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest text-black">Step {step} of 2</span>
            <span className="text-xs text-gray-500">{step === 1 ? 'Business Info' : 'Additional Details'}</span>
          </div>
          <div className="h-1 bg-gray-200">
            <div className="h-full bg-black transition-all duration-300" style={{ width: `${(step / 2) * 100}%` }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border border-black p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="businessName" className="block text-sm font-light mb-2 text-black">
                  Business Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-light mb-2 text-black">
                  Industry *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
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
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="website" className="block text-sm font-light mb-2 text-black">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-light mb-2 text-black">
                  Business Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors resize-none"
                  placeholder="Tell us about your business..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-black text-black hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
