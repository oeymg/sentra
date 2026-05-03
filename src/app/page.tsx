import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'
import HomeClient from '@/components/HomeClient'

export const metadata: Metadata = generateSEO({
  title: 'Get More Google Reviews for Australian Tradies — $29.99/mo',
  description: 'Sentra helps Australian tradies get 10x more Google reviews with a QR code system. Customers answer 3 questions, AI writes the review, they post it in one tap. $29.99/mo. No credit card needed.',
  path: '/',
  keywords: [
    'get more Google reviews tradies',
    'Google reviews for tradies',
    'review management software Australia',
    'QR code for reviews Australia',
    'automated Google review requests',
    'tradie review system',
    'review generation for plumbers electricians builders',
    'how to get more Google reviews',
    'review QR code business card tradie',
    'Google review generator Australia',
  ],
})

export default function Home() {
  return <HomeClient />
}
