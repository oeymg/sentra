'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  Plus,
  Mail,
  Users,
  TrendingUp,
  Play,
  Pause,
  Trash2,
  Eye,
  BarChart3,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { StatsCard } from '@/components/dashboard/StatsCard'

interface Campaign {
  id: string
  name: string
  description: string
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
  type: string
  total_sent: number
  total_opened: number
  total_clicked: number
  total_reviewed: number
  created_at: string
  scheduled_at?: string
  recipients?: { count: number }[]
}

export default function CampaignsPage() {
  const router = useRouter()
  const { selectedBusiness } = useBusinessContext()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'completed'>('all')

  useEffect(() => {
    if (selectedBusiness) {
      loadCampaigns()
    }
  }, [selectedBusiness])

  const loadCampaigns = async () => {
    if (!selectedBusiness) return

    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns?businessId=${selectedBusiness.id}`)
      const data = await response.json()

      if (response.ok) {
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCampaigns(campaigns.filter((c) => c.id !== campaignId))
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
    }
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filter === 'all') return true
    return campaign.status === filter
  })

  // Calculate totals
  const totalSent = campaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0)
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0)
  const totalClicked = campaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0)
  const totalReviewed = campaigns.reduce((sum, c) => sum + (c.total_reviewed || 0), 0)

  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0
  const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0
  const reviewRate = totalSent > 0 ? (totalReviewed / totalSent) * 100 : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'scheduled':
        return 'bg-blue-100 text-blue-700'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700'
      case 'completed':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (!selectedBusiness) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Please select a business</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-black">Review Campaigns</h1>
            <p className="text-gray-600 mt-1">
              Request reviews from customers and track responses
            </p>
          </div>
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Campaign
          </Link>
        </div>

        {/* Stats */}
        {campaigns.length > 0 && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Emails Sent"
              value={totalSent}
              icon={Mail}
              gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <StatsCard
              title="Open Rate"
              value={`${openRate.toFixed(1)}%`}
              icon={Eye}
              gradient="bg-gradient-to-r from-purple-500 to-pink-500"
            />
            <StatsCard
              title="Click Rate"
              value={`${clickRate.toFixed(1)}%`}
              icon={TrendingUp}
              gradient="bg-gradient-to-r from-orange-500 to-red-500"
            />
            <StatsCard
              title="Review Rate"
              value={`${reviewRate.toFixed(1)}%`}
              icon={BarChart3}
              gradient="bg-gradient-to-r from-green-500 to-emerald-500"
            />
          </div>
        )}

        {/* Filters */}
        {campaigns.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            {['all', 'active', 'scheduled', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Campaigns List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          campaigns.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No campaigns yet"
              description="Create your first campaign to start requesting reviews from customers"
              action={{
                label: 'Create Campaign',
                onClick: () => router.push('/dashboard/campaigns/new'),
              }}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No {filter} campaigns</p>
            </div>
          )
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    Campaign
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    Recipients
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    Sent
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    Opened
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    Reviews
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCampaigns.map((campaign, idx) => {
                  const recipientCount = campaign.recipients?.[0]?.count || 0
                  const openRate =
                    campaign.total_sent > 0
                      ? ((campaign.total_opened / campaign.total_sent) * 100).toFixed(1)
                      : '0'

                  return (
                    <motion.tr
                      key={campaign.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/campaigns/${campaign.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-black"
                        >
                          {campaign.name}
                        </Link>
                        {campaign.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {campaign.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{recipientCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {campaign.total_sent}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {campaign.total_opened} ({openRate}%)
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {campaign.total_reviewed}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/campaigns/${campaign.id}`}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Link>
                          <button
                            onClick={() => deleteCampaign(campaign.id)}
                            className="p-2 hover:bg-red-50 rounded transition-colors"
                            title="Delete campaign"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
