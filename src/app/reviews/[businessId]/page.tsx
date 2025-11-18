'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * Redirect component for legacy /reviews/ URLs
 * Redirects to the new /review/ route
 */
export default function ReviewsRedirect() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  useEffect(() => {
    // Redirect to the new /review/ route
    router.replace(`/review/${businessId}`)
  }, [businessId, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
