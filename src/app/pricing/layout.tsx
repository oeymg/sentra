import { Metadata } from 'next'
import { generateSEO, pricingSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: pricingSEO.title,
  description: pricingSEO.description,
  path: '/pricing',
  keywords: pricingSEO.keywords,
})

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
