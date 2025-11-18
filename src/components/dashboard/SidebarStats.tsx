'use client'

interface SidebarStatsProps {
  totalReviews: number
  avgRating: number
  pendingReviews: number
  loading: boolean
}

export function SidebarStats({ totalReviews, avgRating, pendingReviews, loading }: SidebarStatsProps) {
  if (loading) {
    return (
      <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-200 rounded w-8" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-200 rounded w-8" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-200 rounded w-8" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg">
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Quick Stats</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Total Reviews</span>
          <span className="text-sm font-semibold text-black">{totalReviews}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Avg Rating</span>
          <span className="text-sm font-semibold text-black">{avgRating.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Pending</span>
          <span className="text-sm font-semibold text-orange-600">{pendingReviews}</span>
        </div>
      </div>
    </div>
  )
}
