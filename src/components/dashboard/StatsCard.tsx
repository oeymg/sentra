import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  gradient?: string
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, icon: Icon, gradient, subtitle, trend }: StatsCardProps) {
  return (
    <div className={`rounded-2xl p-6 shadow-sm h-full flex flex-col ${gradient || 'bg-white border border-gray-200'}`}>
      <div className="flex items-start justify-between flex-1">
        <div className="flex-1">
          <p className={`text-base font-medium mb-3 ${gradient ? 'text-white/80' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-5xl font-light mb-2 ${gradient ? 'text-white' : 'text-black'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-sm ${gradient ? 'text-white/70' : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${gradient ? 'bg-white/20' : 'bg-gray-100'}`}>
          <Icon className={`w-7 h-7 ${gradient ? 'text-white' : 'text-gray-600'}`} />
        </div>
      </div>
    </div>
  )
}
