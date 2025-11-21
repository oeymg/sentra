import { Metadata } from 'next'

export const siteConfig = {
  name: 'Sentra',
  title: 'Sentra - AI-Powered Review Management Platform',
  description: 'Centralise, analyse, and respond to reviews from Google, Yelp, Trustpilot, and more. AI-powered insights and automated responses for SMEs.',
  url: 'https://sentra.com',
  ogImage: 'https://sentra.com/og-image.png',
  links: {
    twitter: 'https://twitter.com/sentra',
    linkedin: 'https://linkedin.com/company/sentra',
  },
}

export function generateSEO({
  title,
  description,
  image,
  path = '',
  noIndex = false,
}: {
  title?: string
  description?: string
  image?: string
  path?: string
  noIndex?: boolean
}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title
  const pageDescription = description || siteConfig.description
  const pageImage = image || siteConfig.ogImage
  const pageUrl = `${siteConfig.url}${path}`

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      'review management',
      'AI reviews',
      'customer feedback',
      'Google reviews',
      'Yelp reviews',
      'Trustpilot',
      'review analytics',
      'sentiment analysis',
      'review response',
      'SME reviews',
      'business reviews',
      'review aggregation',
    ],
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
      creator: '@sentra',
    },
    alternates: {
      canonical: pageUrl,
    },
  }
}

export const blogSEO = {
  title: 'Blog',
  description: 'Insights, tips, and best practises for managing your online reputation and customer reviews.',
}

export const dashboardSEO = {
  title: 'Dashboard',
  description: 'Manage your reviews, track analytics, and respond to customer feedback.',
  noIndex: true, // Private pages should not be indexed
}

export const reviewHubSEO = (businessName: string) => ({
  title: `${businessName} Reviews`,
  description: `Read reviews and leave feedback for ${businessName}. Share your experience and help others make informed decisions.`,
})
