import { Metadata } from 'next'

export const siteConfig = {
  name: 'Sentra',
  title: 'Get More Google Reviews for $29/mo | Sentra — Built for Australian Tradies',
  description: 'Sentra helps Australian tradies get 10x more Google reviews with QR codes, AI-written review drafts, and negative feedback filtering. $29.99/mo. 14-day free trial.',
  url: 'https://usesentra.com',
  ogImage: 'https://usesentra.com/og-image.png',
  links: {
    twitter: 'https://twitter.com/sentraapp',
    linkedin: 'https://linkedin.com/company/sentra',
  },
}

export function generateSEO({
  title,
  description,
  image,
  path = '',
  noIndex = false,
  keywords,
}: {
  title?: string
  description?: string
  image?: string
  path?: string
  noIndex?: boolean
  keywords?: string[]
}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title
  const pageDescription = description || siteConfig.description
  const pageImage = image || siteConfig.ogImage
  const pageUrl = `${siteConfig.url}${path}`

  const defaultKeywords = [
    'Google reviews for tradies',
    'how to get more Google reviews tradies',
    'review management software Australia',
    'QR code for reviews',
    'get more Google reviews',
    'Google review generator',
    'automated review requests',
    'tradie review management',
    'review system for plumbers',
    'electrician Google reviews',
    'review management Australia',
    'AI review responses',
    'negative review filtering',
    'local SEO tradies',
    'review QR code Australia',
  ]

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: keywords ?? defaultKeywords,
    authors: [{ name: 'Sentra' }],
    creator: 'Sentra',
    publisher: 'Sentra',
    robots: noIndex ? 'noindex,nofollow' : 'index,follow',
    openGraph: {
      type: 'website',
      locale: 'en_AU',
      url: pageUrl,
      title: pageTitle,
      description: pageDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
      creator: '@sentraapp',
    },
    alternates: {
      canonical: pageUrl,
    },
  }
}

export const pricingSEO = {
  title: 'Pricing — $29.99/mo for Australian Tradies',
  description: 'One simple plan for Australian tradies. $29.99/month for unlimited QR codes, AI-written review drafts, negative feedback filtering, and live analytics. 14-day free trial, no credit card required.',
  keywords: [
    'review management software pricing Australia',
    'cheap review management software',
    'affordable Podium alternative',
    '$29 review software tradies',
    'review tool for tradies pricing',
    'Podium alternative Australia',
    'NiceJob alternative',
    'review software $30 month',
  ],
}

export const howItWorksSEO = {
  title: 'How It Works — QR Code to Google Review in 60 Seconds',
  description: 'See how Sentra turns a QR code scan into a live Google review in under a minute. Customers answer 3 quick questions, AI writes the review, they post it with one tap.',
  keywords: [
    'how to get Google reviews consistently',
    'QR code Google reviews tradies',
    'automated review requests Australia',
    'review generation system tradies',
    'how to ask for Google reviews tradie',
    'Google review QR code business card',
  ],
}

export const blogSEO = {
  title: 'Blog — Google Reviews Tips for Australian Tradies',
  description: 'Practical guides on getting more Google reviews, managing your online reputation, and growing your tradie business with social proof.',
  keywords: [
    'Google reviews tips tradies',
    'tradie reputation management',
    'get more reviews Australia',
    'review management blog',
  ],
}

export const dashboardSEO = {
  title: 'Dashboard',
  description: 'Manage your reviews, track analytics, and respond to customer feedback.',
  noIndex: true,
}

export const reviewHubSEO = (businessName: string) => ({
  title: `Leave a Review for ${businessName}`,
  description: `Share your experience with ${businessName}. Your feedback takes under 60 seconds and helps other Australians find great local tradies.`,
})
