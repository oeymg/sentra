import { BusinessProvider } from '@/contexts/BusinessContext'

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
