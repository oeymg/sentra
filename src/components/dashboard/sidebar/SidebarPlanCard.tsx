'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, Sparkles, ArrowUpRight, Clock } from 'lucide-react'
import { useBusinessContext } from '@/contexts/BusinessContext'
import { getPlanDisplayName, getDaysRemainingInTrial, PLAN_LIMITS } from '@/lib/plans'

interface PlanInfo {
  plan_tier: 'free' | 'pro' | 'enterprise'
  subscription_status: string
  ai_responses_used_this_month: number
  trial_ends_at: string | null
}

export function SidebarPlanCard() {
  const { selectedBusiness } = useBusinessContext()
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedBusiness) {
      setLoading(false)
      return
    }

    // Fetch plan info from the business context or API
    // For now, we'll use the selectedBusiness data if it includes plan info
    if (selectedBusiness.plan_tier) {
      setPlanInfo({
        plan_tier: selectedBusiness.plan_tier as 'free' | 'pro' | 'enterprise',
        subscription_status: selectedBusiness.subscription_status || 'active',
        ai_responses_used_this_month: selectedBusiness.ai_responses_used_this_month || 0,
        trial_ends_at: selectedBusiness.trial_ends_at || null,
      })
      setLoading(false)
    }
  }, [selectedBusiness])

  if (loading || !planInfo) return null

  const planLimits = PLAN_LIMITS[planInfo.plan_tier]
  const isFreePlan = planInfo.plan_tier === 'free'
  const isOnTrial = planInfo.subscription_status === 'trial' && planInfo.trial_ends_at
  const daysRemaining = isOnTrial && planInfo.trial_ends_at
    ? getDaysRemainingInTrial(planInfo.trial_ends_at)
    : 0

  const aiResponsesLimit = planLimits.aiResponsesPerMonth
  const aiResponsesUsed = planInfo.ai_responses_used_this_month
  const aiResponsesRemaining =
    aiResponsesLimit === 'unlimited'
      ? 'Unlimited'
      : Math.max(0, aiResponsesLimit - aiResponsesUsed)

  const PlanIcon = isFreePlan ? Sparkles : Zap

  return (
    <div className="px-4 pb-4">
      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 space-y-3">
        {/* Plan Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isFreePlan ? 'bg-gray-100' : 'bg-black'
            }`}>
              <PlanIcon className={`w-4 h-4 ${isFreePlan ? 'text-gray-600' : 'text-white'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {getPlanDisplayName(planInfo.plan_tier)}
              </p>
              {isOnTrial && (
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {daysRemaining} days left
                </p>
              )}
            </div>
          </div>
          {isFreePlan && (
            <Link
              href="/onboarding/plan-selection"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Upgrade
            </Link>
          )}
        </div>

        {/* AI Responses Usage */}
        {isFreePlan && (
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-gray-600">AI Responses</span>
              <span className="text-xs font-medium text-gray-900">
                {aiResponsesUsed} / {aiResponsesLimit}
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  aiResponsesUsed >= aiResponsesLimit
                    ? 'bg-red-500'
                    : aiResponsesUsed >= aiResponsesLimit * 0.8
                    ? 'bg-yellow-500'
                    : 'bg-blue-600'
                }`}
                style={{
                  width: `${Math.min(100, (aiResponsesUsed / (aiResponsesLimit as number)) * 100)}%`,
                }}
              />
            </div>
            {aiResponsesUsed >= aiResponsesLimit && (
              <p className="text-xs text-red-600 mt-1">Limit reached</p>
            )}
          </div>
        )}

        {/* Upgrade CTA for Free Plan */}
        {isFreePlan && (
          <Link
            href="/onboarding/plan-selection"
            className="block w-full text-center px-3 py-2 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center justify-center gap-1">
              Upgrade to Pro
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </Link>
        )}

        {/* Trial Notification for Pro */}
        {isOnTrial && planInfo.plan_tier === 'pro' && (
          <div className="text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg p-2">
            <p className="font-medium text-blue-900 mb-1">Pro Trial Active</p>
            <p>Add payment details to continue after trial</p>
          </div>
        )}
      </div>
    </div>
  )
}
