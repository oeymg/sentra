import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BusinessSetupForm from '@/components/onboarding/BusinessSetupForm'

interface PageProps {
  searchParams: {
    plan?: string
  }
}

export default async function BusinessSetupPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user already has businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  // If they have businesses, redirect to dashboard
  if (businesses && businesses.length > 0) {
    redirect('/dashboard')
  }

  const plan = searchParams.plan || 'free'

  return <BusinessSetupForm user={user} planTier={plan as 'free' | 'pro' | 'enterprise'} />
}
