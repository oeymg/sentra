import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/onboarding/',
          '/auth/',
          '/api/',
          '/unsubscribe/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
