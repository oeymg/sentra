import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import ScrollProgress from '@/components/ScrollProgress'
import { generateSEO, siteConfig } from '@/lib/seo'

export const metadata: Metadata = generateSEO({})

// Static schema — no user input, safe to inline as JSON-LD
const schemaOrg = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Sentra',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: siteConfig.url,
  description: siteConfig.description,
  offers: {
    '@type': 'Offer',
    price: '29.99',
    priceCurrency: 'AUD',
    priceValidUntil: '2027-01-01',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '150',
    bestRating: '5',
    worstRating: '1',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Sentra',
    url: siteConfig.url,
  },
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-AU">
      <body>
        <ScrollProgress />
        {children}
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {schemaOrg}
        </Script>
      </body>
    </html>
  )
}
