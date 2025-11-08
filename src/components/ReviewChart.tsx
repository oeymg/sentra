'use client'

interface DataPoint {
  label: string
  value: number
}

interface ReviewChartProps {
  data: DataPoint[]
  title: string
  color?: string
}

export default function ReviewChart({ data, title, color = 'black' }: ReviewChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="border border-black p-6">
      <h3 className="text-lg font-light mb-6 text-black">{title}</h3>
      <div className="space-y-3">
        {data.map((point, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-black font-light">{point.label}</span>
              <span className="text-gray-600">{point.value}</span>
            </div>
            <div className="h-2 bg-gray-100 relative overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${(point.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
