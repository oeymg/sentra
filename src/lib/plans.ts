import { createClient } from '@/lib/supabase/client'

export type PlanTier = 'free' | 'pro' | 'enterprise'

export interface PlanLimits {
  maxLocations: number
  aiResponsesPerMonth: number | 'unlimited'
  hasReviewGeneration: boolean
  hasEmailSMS: boolean
  hasAdvancedAnalytics: boolean
  hasCompetitorTracking: boolean
  hasAutoReply: boolean
  hasWhiteLabel: boolean
  hasAPIAccess: boolean
  hasTeamManagement: boolean
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxLocations: 1,
    aiResponsesPerMonth: 5,
    hasReviewGeneration: false,
    hasEmailSMS: false,
    hasAdvancedAnalytics: false,
    hasCompetitorTracking: false,
    hasAutoReply: false,
    hasWhiteLabel: false,
    hasAPIAccess: false,
    hasTeamManagement: false,
  },
  pro: {
    maxLocations: 1,
    aiResponsesPerMonth: 'unlimited',
    hasReviewGeneration: true,
    hasEmailSMS: true,
    hasAdvancedAnalytics: true,
    hasCompetitorTracking: true,
    hasAutoReply: false,
    hasWhiteLabel: false,
    hasAPIAccess: false,
    hasTeamManagement: false,
  },
  enterprise: {
    maxLocations: Infinity,
    aiResponsesPerMonth: 'unlimited',
    hasReviewGeneration: true,
    hasEmailSMS: true,
    hasAdvancedAnalytics: true,
    hasCompetitorTracking: true,
    hasAutoReply: true,
    hasWhiteLabel: true,
    hasAPIAccess: true,
    hasTeamManagement: true,
  },
}

export interface Business {
  id: string
  plan_tier: PlanTier
  subscription_status: string
  ai_responses_used_this_month: number
  ai_responses_reset_at: string
  trial_ends_at: string | null
}

/**
 * Check if a business can generate an AI response
 */
export async function canGenerateAIResponse(businessId: string): Promise<{
  allowed: boolean
  reason?: string
  remaining?: number
}> {
  const supabase = createClient()

  const { data: business, error } = await supabase
    .from('businesses')
    .select('plan_tier, subscription_status, ai_responses_used_this_month, ai_responses_reset_at, trial_ends_at')
    .eq('id', businessId)
    .single()

  if (error || !business) {
    return { allowed: false, reason: 'Business not found' }
  }

  // Check if subscription is active or in trial
  if (business.subscription_status === 'expired' || business.subscription_status === 'cancelled') {
    return { allowed: false, reason: 'Subscription expired or cancelled' }
  }

  // Check if trial has ended for pro users
  if (business.plan_tier === 'pro' && business.subscription_status === 'trial' && business.trial_ends_at) {
    const trialEnd = new Date(business.trial_ends_at)
    if (trialEnd < new Date()) {
      return { allowed: false, reason: 'Trial period ended' }
    }
  }

  const limits = PLAN_LIMITS[business.plan_tier]

  // For unlimited plans (Pro and Enterprise)
  if (limits.aiResponsesPerMonth === 'unlimited') {
    return { allowed: true }
  }

  // For free plan, check monthly limit
  const used = business.ai_responses_used_this_month
  const remaining = limits.aiResponsesPerMonth - used

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Monthly limit of ${limits.aiResponsesPerMonth} AI responses reached`,
      remaining: 0,
    }
  }

  return { allowed: true, remaining }
}

/**
 * Increment AI response usage counter
 */
export async function incrementAIResponseUsage(businessId: string): Promise<void> {
  const supabase = createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('ai_responses_used_this_month, ai_responses_reset_at')
    .eq('id', businessId)
    .single()

  if (!business) return

  // Check if counter needs to be reset (older than 1 month)
  const resetDate = new Date(business.ai_responses_reset_at)
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  if (resetDate < oneMonthAgo) {
    // Reset counter
    await supabase
      .from('businesses')
      .update({
        ai_responses_used_this_month: 1,
        ai_responses_reset_at: new Date().toISOString(),
      })
      .eq('id', businessId)
  } else {
    // Increment counter
    await supabase
      .from('businesses')
      .update({
        ai_responses_used_this_month: business.ai_responses_used_this_month + 1,
      })
      .eq('id', businessId)
  }
}

/**
 * Check if a business has access to a specific feature
 */
export function hasFeatureAccess(planTier: PlanTier, feature: keyof PlanLimits): boolean {
  const limits = PLAN_LIMITS[planTier]
  const value = limits[feature]

  // For boolean features
  if (typeof value === 'boolean') {
    return value
  }

  // For numeric features (like maxLocations)
  if (typeof value === 'number') {
    return value > 0
  }

  // For 'unlimited' string
  if (value === 'unlimited') {
    return true
  }

  return false
}

/**
 * Get user-friendly plan name
 */
export function getPlanDisplayName(planTier: PlanTier): string {
  const names = {
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise',
  }
  return names[planTier]
}

/**
 * Get plan price for display
 */
export function getPlanPrice(planTier: PlanTier): string {
  const prices = {
    free: '$0',
    pro: '$29.99',
    enterprise: 'Custom',
  }
  return prices[planTier]
}

/**
 * Check if business is on trial
 */
export function isOnTrial(business: { subscription_status: string; trial_ends_at: string | null }): boolean {
  if (business.subscription_status !== 'trial' || !business.trial_ends_at) {
    return false
  }

  const trialEnd = new Date(business.trial_ends_at)
  return trialEnd > new Date()
}

/**
 * Get days remaining in trial
 */
export function getDaysRemainingInTrial(trialEndsAt: string): number {
  const trialEnd = new Date(trialEndsAt)
  const now = new Date()
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}
