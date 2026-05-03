import { Metadata } from 'next'
import { generateSEO, howItWorksSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: howItWorksSEO.title,
  description: howItWorksSEO.description,
  path: '/how-it-works',
  keywords: howItWorksSEO.keywords,
})

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
