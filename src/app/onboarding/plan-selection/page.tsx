'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, Building2, Sparkles } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

type PlanTier = 'free' | 'pro' | 'enterprise'

const plans = [
  {
    id: 'free' as PlanTier,
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out Sentra',
    icon: Sparkles,
    features: [
      '1 location',
      'All review platforms',
      'Unlimited review monitoring',
      '5 AI responses per month',
      'Basic analytics',
    ],
    limitations: [
      'No review generation campaigns',
      'No email/SMS automation',
      'Limited AI responses',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    id: 'pro' as PlanTier,
    name: 'Pro',
    price: '$29.99',
    period: 'per month',
    description: 'Everything you need to manage reviews at scale',
    icon: Zap,
    features: [
      '1 location',
      'All review platforms',
      'Unlimited reviews',
      'Unlimited AI responses',
      'Review generation campaigns',
      'Email & SMS automation',
      'QR code generator',
      'Advanced analytics',
      'Competitor tracking',
      'Custom alerts',
    ],
    limitations: [],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    id: 'enterprise' as PlanTier,
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'For businesses with multiple locations',
    icon: Building2,
    features: [
      'Unlimited locations',
      'Everything in Pro',
      'Auto-reply automation',
      'White-label reports',
      'API access',
      'Team management',
      'Priority support',
      'Custom integrations',
      'Dedicated account manager',
    ],
    limitations: [],
    cta: 'Contact Sales',
    popular: false,
  },
]

export default function PlanSelectionPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('pro')
  const [loading, setLoading] = useState(false)

  const handleSelectPlan = async (planId: PlanTier) => {
    setSelectedPlan(planId)
  }

  const handleContinue = async () => {
    setLoading(true)

    try {
      if (selectedPlan === 'enterprise') {
        // Redirect to contact sales
        router.push('/contact-sales')
        return
      }

      if (selectedPlan === 'pro') {
        // Redirect to payment page with plan info
        router.push(`/onboarding/payment?plan=${selectedPlan}`)
        return
      }

      // Free plan - redirect to business setup with plan info
      router.push(`/onboarding/business-setup?plan=${selectedPlan}`)
    } catch (error) {
      console.error('Error selecting plan:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-light mb-4 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
              Choose your plan
            </h1>
            <p className="text-xl text-gray-600 font-light">
              Start with a 14-day free trial of Pro. No credit card required.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => {
              const Icon = plan.icon
              const isSelected = selectedPlan === plan.id

              return (
                <div
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`relative cursor-pointer border-2 rounded-2xl p-8 transition-all ${
                    isSelected
                      ? 'border-black shadow-xl scale-105'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  } ${plan.popular ? 'ring-4 ring-blue-100' : ''}`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-black text-white text-sm font-medium rounded-full">
                      Most Popular
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-black" />
                    </div>
                    <h3 className="text-2xl font-semibold text-black mb-2">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-light text-black">{plan.price}</span>
                      <span className="text-gray-600 text-sm">/ {plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <button
              onClick={handleContinue}
              disabled={loading}
              className="px-12 py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Processing...' : `Continue with ${plans.find(p => p.id === selectedPlan)?.name}`}
            </button>
            <p className="mt-4 text-sm text-gray-600">
              {selectedPlan === 'pro' ? '14-day free trial • Cancel anytime • No credit card required' : ''}
              {selectedPlan === 'free' ? 'Start using Sentra immediately' : ''}
              {selectedPlan === 'enterprise' ? 'Our team will contact you within 24 hours' : ''}
            </p>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-light text-center mb-8 text-black">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-black mb-2">
                  Can I switch plans later?
                </h3>
                <p className="text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-black mb-2">
                  What happens after the free trial?
                </h3>
                <p className="text-gray-600">
                  After your 14-day Pro trial, you'll be asked to enter payment details to continue with Pro, or you can downgrade to the Free plan.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-black mb-2">
                  What's the difference between Free and Pro?
                </h3>
                <p className="text-gray-600">
                  Free gives you 5 AI responses per month and basic features. Pro unlocks unlimited AI responses, review generation campaigns (email/SMS/QR codes), and advanced analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
