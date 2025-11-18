'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

type Business = {
  id: string
  name: string
  slug: string
  suburb: string | null
  googlePlaceId: string | null
}

type BusinessContextType = {
  businesses: Business[]
  selectedBusiness: Business | null
  setSelectedBusinessId: (id: string) => void
  loading: boolean
  refreshBusinesses: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  const extractSuburb = (address: string | null): string | null => {
    if (!address) return null
    const parts = address.split(',').map((p) => p.trim())
    return parts.length >= 2 ? parts[parts.length - 2] : null
  }

  const loadBusinesses = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setBusinesses([])
        setSelectedBusiness(null)
        return
      }

      const { data } = await supabase
        .from('businesses')
        .select('id,name,slug,address,google_place_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      const bizList =
        data?.map((biz) => ({
          id: biz.id,
          name: biz.name,
          slug: biz.slug || biz.id, // Fallback to ID if slug doesn't exist
          suburb: extractSuburb(biz.address),
          googlePlaceId: biz.google_place_id ?? null,
        })) ?? []

      setBusinesses(bizList)

      // Set first business as selected if none is selected
      if (bizList.length > 0 && !selectedBusiness) {
        setSelectedBusiness(bizList[0])
      }
    } catch (error) {
      console.error('Failed to load businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBusinesses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setSelectedBusinessId = (id: string) => {
    const business = businesses.find((b) => b.id === id)
    if (business) {
      console.log('[BusinessContext] Switching to business:', id, business.name)

      // Create a new object reference to ensure React detects the change
      setSelectedBusiness({ ...business })

      // Clear all caches when switching businesses
      try {
        localStorage.removeItem('sentra_insights_cache')
        localStorage.removeItem('sentra_sidebar_insights_cache')
        console.log('[BusinessContext] Cleared caches for business switch')
      } catch (e) {
        console.error('Error clearing caches:', e)
      }
    }
  }

  const refreshBusinesses = async () => {
    await loadBusinesses()
  }

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        selectedBusiness,
        setSelectedBusinessId,
        loading,
        refreshBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusinessContext() {
  const context = useContext(BusinessContext)
  if (context === undefined) {
    throw new Error('useBusinessContext must be used within a BusinessProvider')
  }
  return context
}
