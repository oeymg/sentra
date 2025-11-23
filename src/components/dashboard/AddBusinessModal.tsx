'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Building2, Globe, MapPin, Briefcase, FileText } from 'lucide-react'

interface AddBusinessModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddBusinessModal({ userId, isOpen, onClose, onSuccess }: AddBusinessModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    description: '',
    address: '',
  })
  const supabase = createClient()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate slug from business name
      let slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Fallback to a unique slug if empty
      if (!slug) {
        slug = `business-${Date.now()}`
      }

      const { error } = await supabase.from('businesses').insert({
        user_id: userId,
        name: formData.name,
        slug,
        industry: formData.industry,
        website: formData.website || null,
        description: formData.description || null,
        address: formData.address || null,
        plan_tier: 'free',
        subscription_status: 'active',
      })

      if (error) {
        // If slug already exists, retry with a unique suffix
        if (error.code === '23505') {
          const uniqueSlug = `${slug}-${Date.now()}`
          const { error: retryError } = await supabase.from('businesses').insert({
            user_id: userId,
            name: formData.name,
            slug: uniqueSlug,
            industry: formData.industry,
            website: formData.website || null,
            description: formData.description || null,
            address: formData.address || null,
            plan_tier: 'free',
            subscription_status: 'active',
          })
          if (retryError) throw retryError
        } else {
          throw error
        }
      }

      // Reset form
      setFormData({ name: '', industry: '', website: '', description: '', address: '' })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating business:', error)
      alert('Failed to create business. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Business</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building2 className="w-4 h-4" />
              Business Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Acme Restaurant"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Briefcase className="w-4 h-4" />
              Industry *
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
              <option value="E-commerce">E-commerce</option>
              <option value="Technology">Technology</option>
              <option value="Education">Education</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Globe className="w-4 h-4" />
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="w-4 h-4" />
              Business Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="123 Main St, Springfield"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              rows={3}
              placeholder="Tell us about your business"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating...' : 'Add Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
