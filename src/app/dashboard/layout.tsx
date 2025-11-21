import { BusinessProvider } from '@/contexts/BusinessContext'
import { generateSEO, dashboardSEO } from '@/lib/seo'
import { Metadata } from 'next'

export const metadata: Metadata = generateSEO({
  title: dashboardSEO.title,
  description: dashboardSEO.description,
  noIndex: dashboardSEO.noIndex,
})

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BusinessProvider>
      {children}
    </BusinessProvider>
  )
}
