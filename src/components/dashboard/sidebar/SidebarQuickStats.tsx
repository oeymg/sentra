interface SidebarQuickStatsProps {
  stats: {
    totalReviews: number
    avgRating: number
    pendingReviews: number
  }
  loading: boolean
}

export function SidebarQuickStats({ stats, loading }: SidebarQuickStatsProps) {
  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg">
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Quick Stats</p>
      <div className="space-y-2">
        <QuickStat label="Total Reviews" value={loading ? '—' : stats.totalReviews} />
        <QuickStat
          label="Avg Rating"
          value={loading ? '—' : stats.avgRating.toFixed(1)}
        />
        <QuickStat
          label="Pending"
          value={loading ? '—' : stats.pendingReviews}
          valueClass="text-orange-600"
        />
      </div>
    </div>
  )
}

function QuickStat({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string | number
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600">{label}</span>
      <span className={`text-sm font-semibold text-black ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}
